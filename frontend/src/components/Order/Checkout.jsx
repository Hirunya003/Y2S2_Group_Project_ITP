import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { useSnackbar } from "notistack";
import "./Checkout.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    shippingAddress: "",
    paymentMethod: "online-payment",
  });

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || "",
        email: user.email || "",
        shippingAddress: user.address
          ? `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}`.trim()
          : "",
        paymentMethod: "online-payment",
      });
    }
    if (cart) {
      setLoading(false);
    }
  }, [user, cart]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      enqueueSnackbar("Please log in to proceed with checkout", {
        variant: "warning",
      });
      navigate("/login");
    }
  }, [user, navigate, enqueueSnackbar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }));
  };

  const isFormComplete = () => {
    return (
      formData.fullName.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.shippingAddress.trim() !== "" &&
      formData.paymentMethod !== ""
    );
  };

  const getTotalPrice = () => {
    if (!cart || !cart.items) return 0;
    return cart.items
      .reduce((total, item) => {
        if (item.product && typeof item.product.price === "number") {
          return total + item.product.price * item.quantity;
        }
        return total;
      }, 0)
      .toFixed(2);
  };

  const handleCheckout = async () => {
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod,
      };

      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/orders/checkout`,
        payload,
        config
      );

      if (response.data.orderId) {
        clearCart();
        enqueueSnackbar("Order placed successfully!", { variant: "success" });
        navigate(`/order-confirmation/${response.data.orderId}`);
      } else {
        throw new Error("Order ID not received");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      const message =
        error.response?.data?.message ||
        "Failed to place order. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  if (loading) {
    return <div className="checkout-container">Loading checkout...</div>;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-container">
        <h2>Checkout</h2>
        <p>Your cart is empty</p>
        <button
          onClick={() => navigate("/products")}
          className="place-order-btn"
          style={{ background: "#007bff" }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <div className="checkout-content">
        {/* Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          <table className="order-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.product?._id || item._id}>
                  <td>{item.product?.name || "Unknown Product"}</td>
                  <td>Rs.{item.product?.price?.toFixed(2) || "0.00"}</td>
                  <td>{item.quantity}</td>
                  <td>
                    Rs.{((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-price">Total: Rs.{getTotalPrice()}</div>
        </div>

        {/* Checkout Form */}
        <div className="checkout-form">
          <h3>Billing & Shipping Information</h3>
          <div className="form-group">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="shippingAddress"
              placeholder="Shipping Address"
              value={formData.shippingAddress}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="payment-methods">
            <div className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                id="online-payment"
                value="online-payment"
                checked={formData.paymentMethod === "online-payment"}
                onChange={handlePaymentChange}
              />
              <span>Online Payment</span>
            </div>
            <div className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                id="in-store-payment"
                value="in-store-payment"
                checked={formData.paymentMethod === "in-store-payment"}
                onChange={handlePaymentChange}
              />
              <span>In-Store Payment</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="place-order-btn"
            disabled={!isFormComplete()}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
