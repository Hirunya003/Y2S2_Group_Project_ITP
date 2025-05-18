import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../components/Spinner';
import { useSnackbar } from 'notistack';
import { FiShoppingCart } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555';

const UpdateOrderStatus = () => {
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [updatedStatuses, setUpdatedStatuses] = useState({}); // Track status changes

  // Only allow cashier to access this page
  if (!user || user.email !== 'cashier@example.com') {
    return <Navigate to="/cashier" />;
  }

  // Fetch all orders on component mount
  useEffect(() => {
    const fetchAllOrders = async () => {
      setLoading(true);
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
        };
        const response = await axios.get(`${API_BASE_URL}/api/orders/all`, config);
        setOrders(response.data);
        setFilteredOrders(response.data);
      } catch (error) {
        console.error('Error fetching all orders:', error);
        enqueueSnackbar('Failed to load orders', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, [user.token, enqueueSnackbar]);

  // Apply filters
  useEffect(() => {
    let filtered = [...orders];

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
  }, [statusFilter, startDate, endDate, orders]);

  // Handle status change for an order
  const handleStatusChange = (orderId, newStatus) => {
    setUpdatedStatuses((prev) => ({
      ...prev,
      [orderId]: newStatus,
    }));
  };

  // Save the updated status
  const handleSaveStatus = async (orderId) => {
    const newStatus = updatedStatuses[orderId];
    if (!newStatus) {
      enqueueSnackbar('No status change to save', { variant: 'warning' });
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      await axios.put(
        `${API_BASE_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        config
      );

      // Update local orders state to reflect the change
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      enqueueSnackbar('Order status updated successfully', { variant: 'success' });

      // Navigate back to All Orders section
      navigate('/cashier');
    } catch (error) {
      console.error('Error updating order status:', error);
      enqueueSnackbar('Failed to update order status', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Update Order Status</h2>
            <button
              onClick={() => navigate('/cashier')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
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
              <label htmlFor="start-date" className="mr-2 text-sm font-medium text-gray-700">
                Start Date:
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
                  style={{ paddingRight: '2rem' }}
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📅
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <label htmlFor="end-date" className="mr-2 text-sm font-medium text-gray-700">
                End Date:
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
                  style={{ paddingRight: '2rem' }}
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📅
                </span>
              </div>
            </div>
          </div>

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
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
                        ${order.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={updatedStatuses[order._id] || order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="border border-gray-300 rounded-md p-1 text-sm focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.items.map((item, index) => (
                          <div key={index}>
                            {index + 1}. {item.product?.name || 'Unknown'} ({item.quantity}x ${item.price.toFixed(2)})
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSaveStatus(order._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                          disabled={!updatedStatuses[order._id]} // Disable if no change
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateOrderStatus;