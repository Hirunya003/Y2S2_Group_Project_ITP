import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";
import { useSnackbar } from "notistack";
import { FiShoppingCart } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const AllOrders = () => {
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchAllOrders = async () => {
      setLoading(true);
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
        };
        const response = await axios.get(`${API_BASE_URL}/api/orders/`, config);
        setOrders(response.data);
        setFilteredOrders(response.data);
      } catch (error) {
        enqueueSnackbar("Failed to load orders", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, [user.token, enqueueSnackbar]);

  useEffect(() => {
    let filtered = [...orders];

    // Validate date range and apply filters
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setErrors({
        ...errors,
        dateRange: "Start date cannot be later than end date.",
      });
      return; // Skip further filtering if dates are invalid
    }

    // Reset date range error if everything is valid
    setErrors((prevErrors) => ({ ...prevErrors, dateRange: "" }));

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((order) => new Date(order.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => new Date(order.createdAt) <= end);
    }

    setFilteredOrders(filtered);
  }, [statusFilter, startDate, endDate, orders, errors]);

  const handleNavigateToUpdateStatus = () => {
    navigate("/cashier/update-order-status");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">All Customer Orders</h3>
        {user.email === "cashier@example.com" && (
          <button
            onClick={handleNavigateToUpdateStatus}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            Manage Status
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <label
            htmlFor="status-filter"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center">
          <label
            htmlFor="start-date"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Start Date:
          </label>
          <div className="relative">
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
              style={{ paddingRight: "2rem" }}
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              📅
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <label
            htmlFor="end-date"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            End Date:
          </label>
          <div className="relative">
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
              style={{ paddingRight: "2rem" }}
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              📅
            </span>
          </div>
        </div>
      </div>

      {errors.dateRange && (
        <div className="text-red-500 text-sm mb-4">{errors.dateRange}</div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order._id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.billingInfo.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rs.{order.totalPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "shipped"
                          ? "bg-purple-100 text-purple-800"
                          : order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.items.map((item, index) => (
                      <div key={index}>
                        {index + 1}. {item.product?.name || "Unknown"} (
                        {item.quantity}x ${item.price.toFixed(2)})
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllOrders;
