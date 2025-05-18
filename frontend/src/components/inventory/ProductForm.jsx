import { useState, useEffect } from "react";
import { useSnackbar } from "notistack";

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const { enqueueSnackbar } = useSnackbar();

  // Define the form's initial state with default values
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    currentStock: "",
    minStock: "",
    unit: "item",
    barcode: "",
    image: "https://via.placeholder.com/150", // Default placeholder image
    expiryDate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false); // State to prevent multiple submissions
  const [errors, setErrors] = useState({}); // Store validation errors

  // List of available categories for selection
  const categories = [
    "Fruits",
    "Vegetables",
    "Dairy",
    "Bakery",
    "Meat",
    "Frozen Foods",
    "Beverages",
    "Snacks",
    "Canned Goods",
    "Cleaning Supplies",
    "Personal Care",
    "Other",
    "Gas", // Added new Gas category
  ];

  // List of units for product measurement
  const units = ["item", "kg", "g", "l", "ml", "pack"];

  // Effect to populate form fields when editing an existing product
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        description: product.description || "",
        price: product.price || "",
        currentStock: product.currentStock || "",
        minStock: product.minStock || "",
        unit: product.unit || "item",
        barcode: product.barcode || "",
        image: product.image || "https://via.placeholder.com/150",
        expiryDate: product.expiryDate
          ? new Date(product.expiryDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [product]); // Runs only when `product` changes

  // Function to handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Product name is required.";
    if (!formData.category) newErrors.category = "Category is required.";
    if (!formData.price || isNaN(formData.price) || formData.price <= 0)
      newErrors.price = "Price must be a positive number.";
    if (
      formData.currentStock === "" ||
      isNaN(formData.currentStock) ||
      formData.currentStock < 0
    )
      newErrors.currentStock =
        "Current stock must be a valid number greater than or equal to 0.";
    if (formData.image && !/^https?:\/\/[^\s]+$/.test(formData.image))
      newErrors.image = "Image URL is not valid.";
    if (formData.expiryDate && new Date(formData.expiryDate) < new Date())
      newErrors.expiryDate = "Expiry date cannot be in the past.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      enqueueSnackbar("Please fix the errors before submitting.", {
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true); // Disable submit button while processing
    try {
      await onSubmit(formData); // Call the parent submit handler
      setIsSubmitting(false);

      // Reset form if not editing
      if (!product) {
        setFormData({
          name: "",
          category: "",
          description: "",
          price: "",
          currentStock: "",
          minStock: "",
          unit: "item",
          barcode: "",
          image: "https://via.placeholder.com/150",
          expiryDate: "",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {product ? "Edit Product" : "Add New Product"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              required
            />
            {errors.name && (
              <div className="text-red-500 text-sm">{errors.name}</div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <div className="text-red-500 text-sm">{errors.category}</div>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Price ($) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              required
            />
            {errors.price && (
              <div className="text-red-500 text-sm">{errors.price}</div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Current Stock {!product && "*"}
            </label>
            <input
              type="number"
              name="currentStock"
              value={formData.currentStock}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              required={!product}
              disabled={product} // Cannot directly edit stock for existing products
            />
            {errors.currentStock && (
              <div className="text-red-500 text-sm">{errors.currentStock}</div>
            )}
            {product && (
              <p className="text-xs text-gray-500 mt-1">
                Use stock adjustment to update quantities
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Minimum Stock Level
            </label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Unit
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
            {errors.expiryDate && (
              <div className="text-red-500 text-sm">{errors.expiryDate}</div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Image URL
            </label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
            {errors.image && (
              <div className="text-red-500 text-sm">{errors.image}</div>
            )}
          </div>

          <div className="col-span-2">
            {formData.image && (
              <div className="mt-2">
                <p className="text-sm text-gray-700 mb-1">Image Preview:</p>
                <img
                  src={formData.image}
                  alt="Product preview"
                  className="w-32 h-32 object-cover border rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/150?text=Image+Error";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : product
              ? "Update Product"
              : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
