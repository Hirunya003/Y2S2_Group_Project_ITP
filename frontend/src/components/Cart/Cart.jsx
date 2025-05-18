import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "../../context/CartContext";
import { FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useSnackbar } from "notistack";
import "./Cart.css";

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } =
    useContext(CartContext);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cart && cart.items !== undefined) {
      setLoading(false);
    }
  }, [cart]);

  const getTotalPrice = () => {
    return cart.items
      .reduce((total, item) => total + item.product.price * item.quantity, 0)
      .toFixed(2);
  };

  const handleQuantityChange = async (productId, delta) => {
    const item = cart.items.find((i) => i.product._id === productId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity > 0) {
        try {
          await updateQuantity(productId, newQuantity);
        } catch (error) {
          enqueueSnackbar(error.message, { variant: "error" });
        }
      }
    }
  };

  const handleRemoveItem = async (productId, productName) => {
    try {
      await removeFromCart(productId);
      enqueueSnackbar(`${productName} removed from cart`, {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(error.message, { variant: "error" });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      enqueueSnackbar("Cart cleared", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error.message, { variant: "error" });
    }
  };

  if (loading) {
    return <div className="cart-container">Loading cart...</div>;
  }

  return (
    <div className="cart-container">
      <h2>Your Shopping Cart</h2>

      {cart.items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/products" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.product._id}>
                  <td>
                    <div className="cart-item">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="cart-image"
                      />
                      <span>{item.product.name}</span>
                    </div>
                  </td>
                  <td>Rs.{item.product.price.toFixed(2)}</td>
                  <td>
                    <div className="quantity-controls">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.product._id, -1)
                        }
                        className="quantity-btn"
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.product._id, 1)
                        }
                        className="quantity-btn"
                        disabled={item.quantity >= item.product.currentStock}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </td>
                  <td>Rs.{(item.product.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() =>
                        handleRemoveItem(item.product._id, item.product.name)
                      }
                      className="remove-btn"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-summary">
            <span>Total Price: Rs.{getTotalPrice()}</span>
            <div className="cart-actions">
              <button onClick={handleClearCart} className="clear-cart">
                Clear Cart
              </button>
              <Link to="/products" className="continue-shopping">
                Continue Shopping
              </Link>
              <Link to="/checkout" className="checkout-btn">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
