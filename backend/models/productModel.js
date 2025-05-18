import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minStock: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    unit: {
      type: String,
      required: true,
      default: "item", // e.g., item, kg, liter, etc.
    },
    barcode: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Virtual to determine if stock is low
productSchema.virtual("isLowStock").get(function () {
  return this.currentStock <= this.minStock;
});

// Virtual to calculate days until expiry
productSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Include virtuals when converting to JSON
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
