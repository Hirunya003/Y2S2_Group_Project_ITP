import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555';

const Orders = () => {
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
        };
        const { data } = await axios.get(`${API_BASE_URL}/api/orders`, config);
        setOrders(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error.response?.data?.message || 'Failed to load orders. Please try again.');
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
      setError('Please log in to view your orders.');
      enqueueSnackbar('Please log in to view your orders', { variant: 'warning' });
    }
  }, [user, enqueueSnackbar]);

  if (loading) {
    return <div className="p-4">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order._id} className="border p-4 mb-4 rounded shadow-sm">
              <p className="font-semibold">Order ID: {order._id}</p>
              <p>Status: {order.status}</p>
              <p>Total: ${order.totalPrice.toFixed(2)}</p>
              <p>Billing Name: {order.billingInfo.fullName}</p>
              <p>Shipping Address: {order.shippingAddress}</p>
              <p>Payment Method: {order.paymentMethod === 'online-payment' ? 'Online Payment' : 'In-Store Payment'}</p>
              <ul className="mt-2">
                {order.items.map((item, index) => (
                  <li key={index} className="ml-4">
                    {(item.product && item.product.name) || 'Unknown Product'} - {item.quantity} x ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Orders;