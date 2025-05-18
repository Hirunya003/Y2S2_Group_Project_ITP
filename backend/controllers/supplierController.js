import { body, validationResult } from "express-validator";
import Supplier from "../models/SupplierModel.js";
import Inventory from "../models/InventoryModel.js";
import nodemailer from "nodemailer";
import { sendMail } from "../utils/mailer.js";
// Add a supplier
export async function addSupplier(req, res) {
  const {
    supplierId,
    supplierName,
    contact,
    productName,
    costPrice,
    sellingPrice,
    performance,
  } = req.body;

  // ✅ Supplier ID validation: only letters and numbers allowed
  const supplierIdPattern = /^[A-Za-z0-9]+$/;

  // ✅ Phone validation: exactly 10 digits
  const phonePattern = /^\d{10}$/;

  // ✋ Validate Supplier ID (no symbols)
  if (!supplierIdPattern.test(supplierId)) {
    return res.status(400).json({
      message: "Invalid Supplier ID. Only letters and numbers are allowed.",
    });
  }

  // ✋ Validate phone number
  if (!phonePattern.test(contact.phone)) {
    return res.status(400).json({
      message:
        "Invalid phone number. Must be exactly 10 digits and contain no letters.",
    });
  }

  try {
    const supplier = new Supplier({
      supplierId,
      supplierName,
      contact,
      productName,
      costPrice,
      sellingPrice,
      performance,
    });

    await supplier.save();
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: "Error adding supplier", error });
  }
}

// Get all suppliers
export async function getSuppliers(req, res) {
  try {
    const suppliers = await Supplier.find();
    console.log("Suppliers:", suppliers);
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching suppliers", error });
  }
}

// Check restock alerts (Automated Restocking Alerts)
export async function checkRestockAlerts(req, res) {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$stockLevel", "$threshold"] },
    }).populate("supplierId");
    if (lowStockItems.length > 0) {
      // Trigger alert (e.g., log or notify manager)
      console.log("Low stock alert:", lowStockItems);
      res.json({ message: "Low stock detected", items: lowStockItems });
    } else {
      res.json({ message: "No low stock items" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error checking restock", error });
  }
}

export async function getSupplierById(req, res) {
  try {
    const supplier = await Supplier.findOne({ supplierId: req.params.id });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: "Error fetching supplier", error });
  }
}

// Generate purchase order (Purchase Order Generation)
export async function generatePurchaseOrder(req, res) {
  const { supplierId, items } = req.body;
  try {
    const supplier = await Supplier.findOne({ supplierId });
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });

    const orderId = `PO-${Date.now()}`;

    // Validate that all items match supplier products
    const invalidItems = items.filter(
      (item) =>
        item.name.trim().toLowerCase() !==
        supplier.productName.trim().toLowerCase()
    );
    if (invalidItems.length > 0) {
      return res.status(400).json({
        message: "Invalid product names in order",
        invalidItems,
      });
    }

    // Calculate total cost (sum of all matching items)
    let totalCost = 0;
    items.forEach((item) => {
      if (item.name === supplier.productName) {
        totalCost += item.quantity * supplier.costPrice;
      }
    });

    // Push order to purchase history
    supplier.purchaseHistory.push({
      orderId,
      items,
      totalCost,
      date: new Date(),
    });
    await supplier.save();

    await sendMail({
      from: process.env.EMAIL_USER,
      to: supplier.contact.email,
      subject: `Purchase Order ${orderId}`,
      html: `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            font-size: 24px;
            color: #333333;
            text-align: center;
          }
          .order-details {
            font-size: 16px;
            line-height: 1.5;
            color: #555555;
            margin-top: 20px;
          }
          .order-details span {
            font-weight: bold;
            color: #333333;
          }
          .total-cost {
            font-size: 18px;
            color: #e74c3c;
            font-weight: bold;
            margin-top: 20px;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888888;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h1>Purchase Order #${orderId}</h1>
          <div class="order-details">
            <p><span>Order Details:</span> ${JSON.stringify(items)}</p>
          </div>
          <div class="total-cost">
            <p><span>Total Cost:</span> Rs.${totalCost}</p>
          </div>
          <div class="footer">
            <p>Thank you for your business!<br> We look forward to serving you again.</p>
          </div>
        </div>
      </body>
    </html>
  `,
    });

    res
      .status(200)
      .json({ message: "Purchase order generated successfully", orderId });
  } catch (error) {
    console.error("Order generation error:", error);
    res
      .status(500)
      .json({ message: "Error generating order", error: error.message });
  }
}

// Supplier performance monitoring
export async function getSupplierPerformance(req, res) {
  try {
    const supplier = await Supplier.findOne({ supplierId: req.params.id });
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier.performance);
  } catch (error) {
    res.status(500).json({ message: "Error fetching performance", error });
  }
}

// Get supplier orders
export async function getSupplierOrders(req, res) {
  try {
    const supplier = await Supplier.findOne({ supplierId: req.params.id });
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });

    res.json(supplier.purchaseHistory);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
}

// Update supplier performance based on a new order
export async function updateSupplierPerformance(req, res) {
  try {
    const { supplierId, orderId, deliveryTime, qualityRating, isAccurate } =
      req.body;

    if (!supplierId || !orderId) {
      return res
        .status(400)
        .json({ message: "Supplier ID and Order ID are required" });
    }

    const supplier = await Supplier.findOne({ supplierId });
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });

    // Verify the order exists
    const orderExists = supplier.purchaseHistory.some(
      (order) => order.orderId === orderId
    );
    if (!orderExists) {
      return res
        .status(404)
        .json({ message: "Order not found for this supplier" });
    }

    // Update performance metrics
    const performance = supplier.performance || {
      deliveryTime: 0,
      qualityRating: 0,
      accuracy: 0,
      totalOrders: 0,
    };

    // Calculate new values
    if (deliveryTime !== undefined) {
      // Calculate new average delivery time
      const totalDeliveryTime =
        performance.deliveryTime * performance.totalOrders +
        parseFloat(deliveryTime);
      const newTotalOrders = performance.totalOrders + 1;
      performance.deliveryTime = totalDeliveryTime / newTotalOrders;
    }

    if (qualityRating !== undefined) {
      // Calculate new average quality rating
      const totalQualityRating =
        performance.qualityRating * performance.totalOrders +
        parseFloat(qualityRating);
      const newTotalOrders = performance.totalOrders + 1;
      performance.qualityRating = totalQualityRating / newTotalOrders;
    }

    if (isAccurate !== undefined) {
      // Update accuracy percentage
      const accurateOrders =
        (performance.accuracy * performance.totalOrders) / 100;
      const newAccurateOrders = isAccurate
        ? accurateOrders + 1
        : accurateOrders;
      const newTotalOrders = performance.totalOrders + 1;
      performance.accuracy = (newAccurateOrders / newTotalOrders) * 100;
    }

    // Increment total orders only once per update, regardless of which metrics were updated
    const metricsUpdated =
      deliveryTime !== undefined ||
      qualityRating !== undefined ||
      isAccurate !== undefined;
    if (metricsUpdated) {
      performance.totalOrders += 1;
    }

    // Update supplier performance
    supplier.performance = performance;
    await supplier.save();

    res.json({
      message: "Performance updated successfully",
      performance: supplier.performance,
    });
  } catch (error) {
    console.error("Performance update error:", error);
    res
      .status(500)
      .json({ message: "Error updating performance", error: error.message });
  }
}
