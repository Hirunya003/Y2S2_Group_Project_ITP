import express from "express";
import Transaction from "../models/transactionModel.js";
import { sendMail } from "../utils/mailer.js";
import Order from "../models/orderModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find({}).populate("orderId");
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { orderId, amount, cardLast4, status } = req.body;

    const transaction = new Transaction({
      orderId,
      amount,
      cardLast4,
      status,
    });

    await transaction.save();

    const order = await Order.findById(orderId);

    
    await sendMail({
      to: order.billingInfo.email,
      subject: "🎉 Your Order Confirmation - SuperMart",
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2e86de;">Thank you for your order, ${
                order.billingInfo.fullName
              }!</h2>
              <p>We’ve received your order and are preparing it for shipment.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr style="background-color: #f6f6f6;">
                  <td style="padding: 10px;">Order ID:</td>
                  <td style="padding: 10px;"><strong>${order._id}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 10px;">Total Amount:</td>
                  <td style="padding: 10px;"><strong>$${
                    order.totalPrice
                  }</strong></td>
                </tr>
                <tr style="background-color: #f6f6f6;">
                  <td style="padding: 10px;">Payment Method:</td>
                  <td style="padding: 10px;">${order.paymentMethod.replace(
                    "-",
                    " "
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 10px;">Shipping Address:</td>
                  <td style="padding: 10px;">${order.shippingAddress}</td>
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
                  <td style="padding: 10px;"><strong>${
                    order.billingInfo.fullName
                  }</strong> (${order.billingInfo.email})</td>
                </tr>
                <tr>
                  <td style="padding: 10px;">Order ID:</td>
                  <td style="padding: 10px;">${order._id}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px;">Payment Method:</td>
                  <td style="padding: 10px;">${order.paymentMethod.replace(
                    "-",
                    " "
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 10px;">Total Amount:</td>
                  <td style="padding: 10px;"><strong>$${
                    order.totalPrice
                  }</strong></td>
                </tr>
              </table>
              <p style="margin-top: 20px;">Check the dashboard for more order details.</p>
              <p style="color: #aaa; font-size: 12px; margin-top: 40px;">SuperMart Order Notification</p>
            </div>
          `,
    });

    res.status(201).json({ message: "Transaction recorded", transaction });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Express Route
router.post("/transactions", async (req, res) => {
  const { orderId, transactionStatus, amount } = req.body;
  const transaction = await Transaction.create({
    orderId,
    transactionStatus,
    amount,
  });
  res.status(201).json(transaction);
});

router.patch("/:id/refund", async (req, res) => {
  try {
    const transactionId = req.params.id;

    // Example: update the status in your DB (Mongo, SQL, etc.)
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { status: "Refunded" },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Example transaction report route
router.get('/reports', async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {};
  if (startDate) {
    filter.createdAt = { $gte: new Date(startDate) };
  }
  if (endDate) {
    filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
  }

  try {
    const transactions = await Transaction.find(filter);
    res.json({
      title: "Transactions Report",
      filteredCount: transactions.length,
      totalCount: 200,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error });
  }
});


export default router;
