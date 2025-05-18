import { useContext, useEffect, useState } from "react";
import Header from "../components/home/Header";
import axios from "axios";
import { useSnackbar } from "notistack";
import { FiFileText } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const UserTransactions = () => {
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    paymentMethod: "",
    minAmount: "",
  });

  const filteredOrders = orders.filter((order) => {
    const matchesDate = filters.date
      ? new Date(order.createdAt).toISOString().slice(0, 10) === filters.date
      : true;

    const matchesPayment =
      filters.paymentMethod === ""
        ? true
        : order.paymentMethod === filters.paymentMethod;

    const matchesAmount = filters.minAmount
      ? order.totalPrice >= parseFloat(filters.minAmount)
      : true;

    return matchesDate && matchesPayment && matchesAmount;
  });

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.token) return;

      setLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(
          `${API_BASE_URL}/api/orders/${user._id}`,
          config
        );
        console.log("Fetched orders:", data);
        setOrders(data);
      } catch (error) {
        enqueueSnackbar(
          error.response && error.response.data.message
            ? error.response.data.message
            : "Failed to fetch users. Check server connection.",
          { variant: "error" }
        );
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user, enqueueSnackbar]);

  const generateInvoicePDF = (order) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("SuperMart - Order Invoice", 14, 20);

    doc.setFontSize(12);
    doc.text(`Invoice ID: ${order._id}`, 14, 30);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 36);
    doc.text(`Customer: ${order.billingInfo.fullName}`, 14, 42);
    doc.text(`Email: ${order.billingInfo.email}`, 14, 48);
    doc.text(`Payment Method: ${order.paymentMethod}`, 14, 54);
    doc.text(`Shipping Address: ${order.shippingAddress}`, 14, 60);

    // Table
    const tableBody = order.items.map((item) => [
      item.product.name,
      item.quantity,
      `Rs.${item.price.toFixed(2)}`,
      `Rs.${(item.quantity * item.price).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Product", "Quantity", "Unit Price", "Total"]],
      body: tableBody,
    });

    // Total
    const finalY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.text(
      `Total Amount: Rs.${order.totalPrice.toFixed(2)}`,
      14,
      finalY + 10
    );

    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for shopping with SuperMart!", 14, finalY + 20);

    // Save the file
    doc.save(`Invoice_${order._id}.pdf`);
  };

  const handleInvoice = (order) => {
    generateInvoicePDF(order);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!user || !user.token) {
      enqueueSnackbar("You are not authorized. Please log in.", {
        variant: "warning",
      });
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        config // pass config here
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Failed to update status",
        { variant: "error" }
      );
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await handleStatusChange(order._id, "cancelled");
      enqueueSnackbar("Order cancelled successfully", { variant: "info" });
    } catch (err) {
      enqueueSnackbar("Failed to cancel the order", { variant: "error" });
    }
  };

  return (
    <div className="p-[2rem] min-h-[100vh]">
      <Header searchTerm="" setSearchTerm={() => {}} cartCount={0} />
      <h1 className="text-2xl font-bold mb-4">Your Transactions</h1>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Date Filter */}
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="border px-3 py-2 rounded"
          />

          {/* Payment Method Filter */}
          <select
            value={filters.paymentMethod}
            onChange={(e) =>
              setFilters({ ...filters, paymentMethod: e.target.value })
            }
            className="border px-3 py-2 rounded"
          >
            <option value="">All Payment Methods</option>
            <option value="online-payment">Online Payment</option>
            <option value="in-store-payment">In-Store Payment</option>
          </select>

          {/* Amount Filter */}
          <input
            type="number"
            placeholder="Min Amount"
            value={filters.minAmount}
            onChange={(e) =>
              setFilters({ ...filters, minAmount: e.target.value })
            }
            className="border px-3 py-2 rounded w-[130px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Transaction date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="relative group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order._id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {order.billingInfo.fullName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 rounded-full font-bold">
                      Rs.{order.totalPrice}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}
                    >
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <button
                      onClick={() => handleInvoice(order)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FiFileText className="inline mr-1" /> Invoice
                    </button>
                  </td>

                  {/* Hover Box */}
                  <td className="absolute z-10 top-full left-0 mt-2 hidden group-hover:block w-[300px] bg-white shadow-xl border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">
                      Transaction Summary
                    </h4>
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm text-gray-700 mb-1"
                      >
                        <span>
                          {item.product.name} x {item.quantity}
                        </span>
                        <span>Rs.{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="mt-2 border-t pt-2 text-right text-sm font-semibold">
                      Total: Rs.{order.totalPrice.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserTransactions;
