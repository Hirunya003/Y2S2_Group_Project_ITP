import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import StockHistory from '../models/stockHistoryModel.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { sendMail } from "../utils/mailer.js";

// Initialize ChartJSNodeCanvas for rendering charts
const width = 500; // Chart width
const height = 300; // Chart height
let chartJSNodeCanvas;
try {
  chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
  console.log('ChartJSNodeCanvas initialized successfully');
} catch (error) {
  console.error('Failed to initialize ChartJSNodeCanvas:', error.message);
  throw new Error('Chart rendering setup failed');
}

// Chart colors
const chartColors = {
  pending: '#FF6B6B', // Coral
  processing: '#4ECDC4', // Teal
  shipped: '#45B7D1', // Sky blue
  delivered: '#96CEB4', // Mint green
  cancelled: '#FFEEAD', // Light yellow
};

// @desc    Checkout and place an order
// @access  Private
export const checkout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate('items.product').session(session);

    if (!cart || !cart.items || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const { fullName, email, shippingAddress, paymentMethod } = req.body;

    if (!fullName || !email || !shippingAddress || !paymentMethod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Missing required checkout information' });
    }

    if (!['online-payment', 'in-store-payment'].includes(paymentMethod)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Product not found: ${item.product._id}` });
      }
      if (product.currentStock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
      }

      product.currentStock -= item.quantity;
      await product.save({ session });

      await StockHistory.create(
        [{
          product: product._id,
          changeType: 'remove',
          quantity: item.quantity,
          previousStock: product.currentStock + item.quantity,
          newStock: product.currentStock,
          notes: `Stock removed for order`,
          performedBy: userId,
        }],
        { session }
      );

      orderItems.push({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      });
    }

    const totalPrice = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);

    const order = new Order({
      user: userId,
      items: orderItems,
      totalPrice,
      billingInfo: { fullName, email },
      shippingAddress,
      paymentMethod,
      status: 'pending',
    });

    await order.save({ session });

     if (order.paymentMethod === "in-store-payment") {
       await sendMail({
         to: email,
         subject: "🎉 Your Order Confirmation - SuperMart",
         html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2e86de;">Thank you for your order, ${fullName}!</h2>
          <p>We’ve received your order and are preparing it for shipment.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f6f6f6;">
              <td style="padding: 10px;">Order ID:</td>
              <td style="padding: 10px;"><strong>${order._id}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px;">Total Amount:</td>
              <td style="padding: 10px;"><strong>$${totalPrice}</strong></td>
            </tr>
            <tr style="background-color: #f6f6f6;">
              <td style="padding: 10px;">Payment Method:</td>
              <td style="padding: 10px;">${paymentMethod.replace("-", " ")}</td>
            </tr>
            <tr>
              <td style="padding: 10px;">Shipping Address:</td>
              <td style="padding: 10px;">${shippingAddress}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">We'll notify you once it’s shipped. If you have questions, just reply to this email.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">SuperMart Team</p>
        </div>
      `,
       });

       await sendMail({
         to: process.env.ADMIN_EMAIL,
         subject: "🛒 New Order Received - SuperMart",
         html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #e67e22;">📦 New Order Placed</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px;">Customer:</td>
              <td style="padding: 10px;"><strong>${fullName}</strong> (${email})</td>
            </tr>
            <tr>
              <td style="padding: 10px;">Order ID:</td>
              <td style="padding: 10px;">${order._id}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px;">Payment Method:</td>
              <td style="padding: 10px;">${paymentMethod.replace("-", " ")}</td>
            </tr>
            <tr>
              <td style="padding: 10px;">Total Amount:</td>
              <td style="padding: 10px;"><strong>$${totalPrice}</strong></td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Check the dashboard for more order details.</p>
          <p style="color: #aaa; font-size: 12px; margin-top: 40px;">SuperMart Order Notification</p>
        </div>
      `,
       });
     }

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error during checkout:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user's orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId }).populate('items.product');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single order by ID
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    console.log(`getOrderById called with id: ${req.params.id}`);

    if (req.params.id === 'report') {
      console.log('getOrderById incorrectly called for /api/orders/report');
      return res.status(400).json({ message: 'Invalid route: use /api/orders/report to generate reports' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this order' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel an order
// @access  Private
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;
    const userId = req.user._id;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order cannot be cancelled as it is already being processed' });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      product.currentStock += item.quantity;
      await product.save({ session });

      await StockHistory.create(
        [{
          product: item.product,
          changeType: 'add',
          quantity: item.quantity,
          previousStock: product.currentStock - item.quantity,
          newStock: product.currentStock,
          notes: `Stock restored due to order cancellation`,
          performedBy: userId,
        }],
        { session }
      );
    }

    await Order.deleteOne({ _id: orderId }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Order cancelled and removed successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Update order status (for cashier)
// @access  Private
export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is cashier
    if (req.user.email !== 'cashier@example.com') {
      return res.status(403).json({ message: 'Not authorized to update order status' });
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Generate order report by status with date and status filters
// @route   GET /api/orders/report
// @access  Private
export const generateOrderReport = async (req, res) => {
  try {
    // Extract query parameters
    const { startDate, endDate, status } = req.query;

    // Build the query
    let query = {};

    // Apply date filters if provided
    if (startDate) {
      const start = new Date(startDate);
      query.createdAt = { $gte: start };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end day
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = end;
    }

    // Apply status filter if provided (excluding "all" or empty string)
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch orders based on the query
    const orders = await Order.find(query)
      .populate('items.product')
      .sort({ createdAt: -1 });

    // Group orders by status if no specific status filter is applied
    const statusGroups = {};
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    statuses.forEach((s) => {
      statusGroups[s] = orders.filter((order) => order.status === s);
    });

    // Prepare data for the chart
    const chartData = {
      labels: statuses.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
      datasets: [
        {
          label: 'Number of Orders',
          data: statuses.map((s) => statusGroups[s].length),
          backgroundColor: [
            'rgba(255, 206, 86, 0.6)',  // Yellow for pending
            'rgba(54, 162, 235, 0.6)',  // Blue for processing
            'rgba(153, 102, 255, 0.6)', // Purple for shipped
            'rgba(75, 192, 192, 0.6)',  // Green for delivered
            'rgba(255, 99, 132, 0.6)',  // Red for cancelled
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Generate the chart image
    const configuration = {
      type: 'bar',
      data: chartData,
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Orders',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Order Status',
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Order Status Distribution',
          },
        },
      },
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = imageBuffer.toString('base64');
    const chartUrl = `data:image/png;base64,${base64Image}`;

    // Prepare the response
    res.json({
      chartUrl,
      statusGroups,
      orders, // Include the filtered orders for detailed display
    });
  } catch (error) {
    console.error('Error generating order report:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all orders (for storekeeper and cashier)
// @access  Private
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('items.product');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


