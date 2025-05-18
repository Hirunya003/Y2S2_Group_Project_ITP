import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { CartContext } from '../../context/CartContext';
import Spinner from '../Spinner';
import './OrderDetails.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { addToCart } = useContext(CartContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` },
        };
        const { data } = await axios.get(`${API_BASE_URL}/api/orders`, config);
        const foundOrder = data.find((o) => o._id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          enqueueSnackbar('Order not found', { variant: 'error' });
          navigate('/profile');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order:', error);
        enqueueSnackbar('Failed to load order details', { variant: 'error' });
        setLoading(false);
        navigate('/profile');
      }
    };

    fetchOrder();
  }, [orderId, navigate, enqueueSnackbar]);

  const handleOrderAgain = async () => {
    try {
      if (!order.items || order.items.length === 0) {
        enqueueSnackbar('No items to add to cart', { variant: 'info' });
        navigate('/cart');
        return;
      }
      let failedItems = [];
      for (const item of order.items) {
        if (!item.product?._id) {
          console.warn(`Skipping item with missing product: ${JSON.stringify(item)}`);
          failedItems.push(item.product?.name || 'Unknown Product');
          continue;
        }
        try {
          console.log('Adding to cart:', item.product._id, item.quantity);
          await addToCart({ _id: item.product._id, quantity: item.quantity });
        } catch (error) {
          console.warn(`Failed to add item ${item.product.name}:`, error.message);
          failedItems.push(item.product.name);
        }
      }
      if (failedItems.length > 0) {
        enqueueSnackbar(`Some items could not be added: ${failedItems.join(', ')}`, {
          variant: 'warning',
        });
      } else {
        enqueueSnackbar('Items added to cart successfully', { variant: 'success' });
      }
      navigate('/cart');
    } catch (error) {
      console.error('Unexpected error:', error.message, error.response?.data);
      enqueueSnackbar('Failed to process order: ' + error.message, { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="order-details-container">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return <div className="order-details-container">Order not found</div>;
  }

  return (
    <div className="order-details-container">
      <h2>Order Details</h2>
      <div className="order-details">
        <p>
          <strong>Order ID:</strong> {order._id}
        </p>
        <p>
          <strong>Status:</strong> {order.status}
        </p>
        <p>
          <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
        </p>
        <p>
          <strong>Total:</strong> ${order.totalPrice.toFixed(2)}
        </p>
        <p>
          <strong>Billing Name:</strong> {order.billingInfo.fullName}
        </p>
        <p>
          <strong>Email:</strong> {order.billingInfo.email}
        </p>
        <p>
          <strong>Shipping Address:</strong> {order.shippingAddress}
        </p>
        <h3>Order Items</h3>
        <table className="order-items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{item.product?.name || 'Unknown Product'}</td>
                <td>{item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="order-actions">
        <button
          onClick={() => navigate('/products')}
          className="continue-shopping-btn"
        >
          Continue Shopping
        </button>
        <button
          onClick={handleOrderAgain}
          className="order-again-btn"
        >
          Order Again
        </button>
      </div>
    </div>
  );
};

export default OrderDetails;