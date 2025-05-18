import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import axios from "axios";
import Header from "../components/home/Header";
import Spinner from "../components/Spinner";
import ProductForm from "../components/inventory/ProductForm";
import StockAdjustment from "../components/inventory/StockAdjustment";
import StockHistory from "../components/inventory/StockHistory";
import AllOrders from "../components/AllOrders/AllOrders";
import OrderReport from "../components/OrderReport";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiClock,
  FiAlertCircle,
  FiSearch,
  FiGrid,
  FiList,
  FiPackage,
  FiBarChart2,
  FiCalendar,
  FiFileText,
  FiShoppingCart,
} from "react-icons/fi";
import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";
// API base URL - default to localhost if not specified
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const StorekeeperDashboard = () => {
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [showProductHistory, setShowProductHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [viewType, setViewType] = useState("grid");
  const [chartData, setChartData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalItems: 0,
    categories: 0,
  });
  const [data, setData] = useState({
    expiringTomorrow: [],
    alreadyExpired: [],
  });

  const navigate = useNavigate();
  const features = [
    { label: "Add Supplier", icon: "", path: "/add-supplier" },
    { label: "Supplier List", icon: "", path: "/supplier-list" },
    {
      label: "Performance Report",
      icon: "",
      path: "/performance-report",
    },
    {
      label: "Purchase Order",
      icon: "",
      path: "/purchase-order",
    },
  ];


  // Only allow storekeeper@example.com to access this page
  if (!user || user.email !== "storekeeper@example.com") {
    return <Navigate to="/" />;
  }

  // Fetch products and low stock products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
        };

        // Fetch all products
        const productsResponse = await axios.get(
          `${API_BASE_URL}/api/inventory/products`,
          config
        );
        setProducts(productsResponse.data);

        // Fetch low stock products
        const lowStockResponse = await axios.get(
          `${API_BASE_URL}/api/inventory/low-stock`,
          config
        );
        setLowStockProducts(lowStockResponse.data);

        // Calculate summary statistics
        const totalProducts = productsResponse.data.length;
        const lowStockCount = lowStockResponse.data.length;
        const totalItems = productsResponse.data.reduce(
          (sum, product) => sum + product.currentStock,
          0
        );
        const uniqueCategories = new Set(
          productsResponse.data.map((product) => product.category)
        ).size;

        setSummaryStats({
          totalProducts,
          lowStockCount,
          totalItems,
          categories: uniqueCategories,
        });
      } catch (error) {
        console.error("Error fetching inventory data:", error);
        enqueueSnackbar("Failed to load inventory data", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.token, enqueueSnackbar]);

  useEffect(() => {
    const checkExpiryAlerts = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/inventory/expiring-alerts`
        );

        setData({
          expiringTomorrow: data.expiringTomorrow,
          alreadyExpired: data.alreadyExpired,
        });

        if (data.expiringTomorrow.length > 0) {
          const names = data.expiringTomorrow.map((p) => p.name).join(", ");
          enqueueSnackbar(
            `⚠️ ${data.expiringTomorrow.length} product(s) will expire tomorrow: ${names}`,
            { variant: "warning", autoHideDuration: 8000 }
          );
        }

        if (data.alreadyExpired.length > 0) {
          const names = data.alreadyExpired.map((p) => p.name).join(", ");
          enqueueSnackbar(
            `❌ ${data.alreadyExpired.length} product(s) have expired: ${names}`,
            { variant: "error", autoHideDuration: 8000 }
          );
        }
      } catch (err) {
        console.error("Failed to fetch expiry alerts:", err);
      }
    };

    checkExpiryAlerts();
  }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/inventory/sales/trends`
      );
      const formatted = data.map((item) => ({
        name: `${item._id.month}/${item._id.year}`,
        Sold: item.totalSold,
      }));
      console.log("Sales Trends Data:", formatted);
      setChartData(formatted);
    };

    fetchTrends();
  }, []);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/inventory/sales/trends/products`
        );
        setSalesData(data);
      } catch (error) {
        console.error("Error fetching sales trends:", error);
      }
    };

    fetchSalesData();
  }, []);

  // Filter products based on search term
  const filteredProducts = searchTerm
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  // Handler to add a new product
  const handleAddProduct = async (productData) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/api/inventory/products`,
        productData,
        config
      );

      setProducts([...products, data]);
      if (data.isLowStock) {
        setLowStockProducts([...lowStockProducts, data]);
      }

      // Update summary stats
      setSummaryStats({
        ...summaryStats,
        totalProducts: summaryStats.totalProducts + 1,
        totalItems: summaryStats.totalItems + Number(data.currentStock || 0),
        lowStockCount: data.isLowStock
          ? summaryStats.lowStockCount + 1
          : summaryStats.lowStockCount,
        categories: new Set([...products.map((p) => p.category), data.category])
          .size,
      });

      enqueueSnackbar("Product added successfully", { variant: "success" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding product:", error);
      enqueueSnackbar(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to add product",
        { variant: "error" }
      );
    }
  };

  // Handler to update a product
  const handleUpdateProduct = async (productData) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `${API_BASE_URL}/api/inventory/products/${selectedProduct._id}`,
        productData,
        config
      );

      // Update products list
      const updatedProducts = products.map((p) =>
        p._id === data._id ? data : p
      );
      setProducts(updatedProducts);

      // Update low stock products
      const updatedLowStockProducts = lowStockProducts.filter(
        (p) => p._id !== data._id
      );
      if (data.isLowStock) {
        updatedLowStockProducts.push(data);
      }
      setLowStockProducts(updatedLowStockProducts);

      // Update summary stats (categories might have changed)
      const uniqueCategories = new Set(
        updatedProducts.map((product) => product.category)
      ).size;
      setSummaryStats({
        ...summaryStats,
        lowStockCount: updatedLowStockProducts.length,
        categories: uniqueCategories,
      });

      enqueueSnackbar("Product updated successfully", { variant: "success" });
      setShowUpdateForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      enqueueSnackbar(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to update product",
        { variant: "error" }
      );
    }
  };

  // Handler to delete a product
  const handleDeleteProduct = async (id) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      await axios.delete(
        `${API_BASE_URL}/api/inventory/products/${id}`,
        config
      );

      // Find product to remove before updating state
      const productToRemove = products.find((p) => p._id === id);

      // Update products list
      const updatedProducts = products.filter((p) => p._id !== id);
      setProducts(updatedProducts);

      // Update low stock products
      setLowStockProducts(lowStockProducts.filter((p) => p._id !== id));

      // Update summary stats
      const uniqueCategories = new Set(
        updatedProducts.map((product) => product.category)
      ).size;
      setSummaryStats({
        totalProducts: summaryStats.totalProducts - 1,
        lowStockCount: productToRemove?.isLowStock
          ? summaryStats.lowStockCount - 1
          : summaryStats.lowStockCount,
        totalItems:
          summaryStats.totalItems - Number(productToRemove?.currentStock || 0),
        categories: uniqueCategories,
      });

      enqueueSnackbar("Product deleted successfully", { variant: "success" });
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      enqueueSnackbar(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to delete product",
        { variant: "error" }
      );
    }
  };


  // Handler for stock adjustment
  const handleStockAdjustment = async (adjustmentData) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `${API_BASE_URL}/api/inventory/products/${selectedProduct._id}/stock`,
        adjustmentData,
        config
      );

      // Calculate stock change for stats update
      const stockDifference =
        data.stockChange.newStock - data.stockChange.previousStock;

      // Update products list
      const updatedProducts = products.map((p) =>
        p._id === data.product._id ? data.product : p
      );
      setProducts(updatedProducts);

      // Update low stock products
      const updatedLowStockProducts = lowStockProducts.filter(
        (p) => p._id !== data.product._id
      );
      if (data.product.isLowStock) {
        updatedLowStockProducts.push(data.product);
      }
      setLowStockProducts(updatedLowStockProducts);

      // Update summary stats
      setSummaryStats({
        ...summaryStats,
        totalItems: summaryStats.totalItems + stockDifference,
        lowStockCount: updatedLowStockProducts.length,
      });

      enqueueSnackbar(
        `Stock updated: ${Math.abs(stockDifference)} units ${
          stockDifference >= 0 ? "added" : "removed"
        }`,
        { variant: "success" }
      );

      setShowStockAdjustment(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error adjusting stock:", error);
      enqueueSnackbar(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to adjust stock",
        { variant: "error" }
      );
    }
  };

  // Export report as CSV
  const exportCSV = () => {
    const headers = [
      "Name",
      "Category",
      "Price",
      "Current Stock",
      "Min Stock",
      "Unit",
    ];
    const rows = products.map((product) => [
      product.name,
      product.category,
      product.price,
      product.currentStock,
      product.minStock,
      product.unit,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export report as PDF using jsPDF and autoTable
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventory Report", 14, 16);
    const tableColumn = [
      "Name",
      "Category",
      "Price",
      "Current Stock",
      "Min Stock",
      "Unit",
    ];
    const tableRows = [];
    products.forEach((product) => {
      const productData = [
        product.name,
        product.category,
        `$${product.price.toFixed(2)}`,
        product.currentStock,
        product.minStock,
        product.unit,
      ];
      tableRows.push(productData);
    });
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("inventory_report.pdf");
  };

  // Render dashboard content based on active tab
  const renderDashboardContent = () => {
    if (showAddForm) {
      return (
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setShowAddForm(false)}
        />
      );
    }

    if (showUpdateForm && selectedProduct) {
      return (
        <ProductForm
          product={selectedProduct}
          onSubmit={handleUpdateProduct}
          onCancel={() => {
            setShowUpdateForm(false);
            setSelectedProduct(null);
          }}
        />
      );
    }

    if (showStockAdjustment && selectedProduct) {
      return (
        <StockAdjustment
          product={selectedProduct}
          onAdjustStock={handleStockAdjustment}
          onCancel={() => {
            setShowStockAdjustment(false);
            setSelectedProduct(null);
          }}
        />
      );
    }

    if (showProductHistory && selectedProduct) {
      return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Stock History: {selectedProduct.name}
            </h2>
            <button
              onClick={() => {
                setShowProductHistory(false);
                setSelectedProduct(null);
              }}
              className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-700"
            >
              Back to Products
            </button>
          </div>
          <StockHistory productId={selectedProduct._id} token={user.token} />
        </div>
      );
    }

    if (activeTab === "inventory") {
      return (
        <>
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Products Inventory</h3>

            <div className="flex items-center space-x-3 mt-2 md:mt-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex border rounded-lg overflow-hidden">
                <button
                  className={`p-2 ${
                    viewType === "grid"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setViewType("grid")}
                >
                  <FiGrid />
                </button>
                <button
                  className={`p-2 ${
                    viewType === "list"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setViewType("list")}
                >
                  <FiList />
                </button>
              </div>

              <button
                onClick={() => setShowAddForm(true)}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center"
              >
                <FiPlus className="mr-1" /> Add Product
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              {searchTerm ? (
                <>
                  <p className="text-gray-500 mb-2">
                    No products found matching "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-2">
                    No products in inventory yet
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    Add your first product
                  </button>
                </>
              )}
            </div>
          ) : viewType === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden border ${
                    product.isLowStock ? "border-red-400" : "border-transparent"
                  }`}
                >
                  <div className="h-40 overflow-hidden bg-gray-100 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                    {product.isLowStock && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Low Stock
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {product.category}
                    </p>

                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="text-sm text-gray-500">Stock:</span>
                        <span
                          className={`ml-1 font-medium ${
                            product.isLowStock
                              ? "text-red-600"
                              : "text-gray-900"
                          }`}
                        >
                          {product.currentStock} {product.unit}(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Price:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          Rs.{product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {product.expiryDate && (
                      <div className="text-xs text-gray-500 mb-3">
                        Expires:{" "}
                        {new Date(product.expiryDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowUpdateForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Product"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowStockAdjustment(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Adjust Stock"
                      >
                        <FiRefreshCw />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductHistory(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="View History"
                      >
                        <FiClock />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation(product)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Product"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Current Stock
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Min Stock
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product._id}
                        className={product.isLowStock ? "bg-red-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              {product.barcode && (
                                <div className="text-xs text-gray-500">
                                  SKU: {product.barcode}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Rs.{product.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.currentStock} {product.unit}(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.minStock} {product.unit}(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.isLowStock ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowUpdateForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mx-1"
                            title="Edit Product"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowStockAdjustment(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900 mx-1"
                            title="Adjust Stock"
                          >
                            <FiRefreshCw />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductHistory(true);
                            }}
                            className="text-green-600 hover:text-green-900 mx-1"
                            title="View History"
                          >
                            <FiClock />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation(product)}
                            className="text-red-600 hover:text-red-900 mx-1"
                            title="Delete Product"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      );
    } else if (activeTab === "low-stock") {
      return (
        <>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Low Stock Alerts</h3>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">
                No products are low on stock. Everything looks good!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Current Stock
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Min Stock
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockProducts.map((product) => (
                      <tr key={product._id} className="bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              {product.barcode && (
                                <div className="text-xs text-gray-500">
                                  SKU: {product.barcode}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600">
                            {product.currentStock} {product.unit}(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.minStock} {product.unit}(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.currentStock === 0 ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500 text-white">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Low Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowStockAdjustment(true);
                            }}
                            className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      );
    } else if (activeTab === "history") {
      return <StockHistory token={user.token} />;
    } else if (activeTab === "reports") {
      return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Inventory Report</h3>
          <div className="mb-4">
            <p className="text-gray-700">
              Total Products: {summaryStats.totalProducts}
            </p>
            <p className="text-gray-700">
              Total Items: {summaryStats.totalItems}
            </p>
            <p className="text-gray-700">
              Low Stock Items: {summaryStats.lowStockCount}
            </p>
            <p className="text-gray-700">
              Categories: {summaryStats.categories}
            </p>
          </div>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                    Stock
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                    Min Stock
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {product.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {product.category}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      Rs.{product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {product.currentStock} {product.unit}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {product.minStock} {product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={exportCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Export PDF
            </button>
          </div>
        </div>
      );
    } else if (activeTab === "expires") {
      return (
        <div className="flex flex-col gap-6">
          {/* About to Expire */}
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4">About To Expire</h3>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Expiry Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.expiringTomorrow.map((product) => (
                    <tr key={product._id}>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {product.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {product.category}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {new Date(product.expiryDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Already Expired */}
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Expired Products</h3>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Expiry Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.alreadyExpired.map((product) => (
                    <tr key={product._id}>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {product.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {product.category}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {new Date(product.expiryDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === "salestrends") {
      return (
        <div className="flex flex-col gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">📈 Sales Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Sold"
                  stroke="#4ade80"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="sales-trends-table p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Sales Trends (Most Sold Products in the Last 7 Days)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Quantity Sold</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {salesData.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-gray-100`}
                    >
                      <td className="px-6 py-4">{item.productName}</td>
                      <td className="px-6 py-4">
                        Rs.{item.productPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">{item.date}</td>
                      <td className="px-6 py-4">{item.totalSold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === "all-orders") {
      return <AllOrders />;
    } else if (activeTab === "order-report") {
      return (
        <div>
          <OrderReport />
        </div>
      );
    } else if (activeTab === "supplier") {
      return (
        <div className="min-h-screen bg-gray-100 p-10">
          <h1 className="text-4xl font-bold text-center text-green-500 mb-12">
            Supplier Management Dashboard
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => navigate(feature.path)}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition duration-300 flex flex-col items-center text-center"
              >
                <div className="text-3xl text-green-300 mb-3">
                  {feature.icon}
                </div>
                <h2 className="text-lg font-semibold text-gray-700">
                  {feature.label}
                </h2>
              </button>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Header searchTerm="" setSearchTerm={() => {}} cartCount={0} />

      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Storekeeper Dashboard</h2>

          {/* Dashboard summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <FiPackage size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Products</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.totalProducts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                  <FiBarChart2 size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Items</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.totalItems}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                  <FiAlertCircle size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Low Stock Items</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.lowStockCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                  <FiCalendar size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Categories</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.categories}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs navigation */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "inventory"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiPackage className="inline mr-1" /> Products Inventory
            </button>
            <button
              onClick={() => setActiveTab("low-stock")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "low-stock"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiAlertCircle className="inline mr-1" /> Low Stock Alerts
              {lowStockProducts.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {lowStockProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "history"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiClock className="inline mr-1" /> Stock History
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "reports"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiFileText className="inline mr-1" /> Reports
            </button>
            <button
              onClick={() => setActiveTab("expires")}
              className={`relative flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                activeTab === "expires"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiFileText className="inline" />
              Expires
              <span className="inline-flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full w-5 h-5 shadow-sm">
                {data.alreadyExpired.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("salestrends")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "salestrends"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiFileText className="inline mr-1" /> Sales Trends
            </button>
            <button
              onClick={() => setActiveTab("all-orders")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "all-orders"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiShoppingCart className="inline mr-1" /> All Orders
            </button>
            <button
              onClick={() => setActiveTab("supplier")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "supplier"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiShoppingCart className="inline mr-1" /> Supplier
            </button>
          </div>

          {/* Main dashboard content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            renderDashboardContent()
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <strong>{deleteConfirmation.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmation._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorekeeperDashboard;
