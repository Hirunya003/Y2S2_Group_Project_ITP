import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSnackbar } from "notistack";
import axios from "axios";
import Header from "../components/home/Header";
import Spinner from "../components/Spinner";
import "./Profile.css";

const Profile = () => {
  const { user, updateProfile, fetchUserProfile } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("edit-profile");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });


  // Fetch user profile when the component mounts
  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      console.log("Fetching user profile data...");
      const result = await fetchUserProfile();
      console.log("Fetch result:", result);

      if (!result.success) {
        enqueueSnackbar(result.message, { variant: "error" });
      }
      setIsLoading(false);
    };

    loadUserProfile();
  }, [enqueueSnackbar]);

  // Update the form when user data changes
  useEffect(() => {
    console.log("User data received in Profile:", user);

    if (user) {
      const address = user.address || {};

      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        confirmPassword: "",
        address: {
          street: address.street || "",
          city: address.city || "",
          state: address.state || "",
          zipCode: address.zipCode || "",
        },
      });
    }
  }, [user]);

  // Fetch orders when the "Order History" section is selected
  useEffect(() => {
    if (activeSection === "order-history") {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${
                JSON.parse(localStorage.getItem("userInfo")).token
              }`,
            },
          };
          const { data } = await axios.get(
            `${API_BASE_URL}/api/orders`,
            config
          );
          setOrders(data);
        } catch (error) {
          console.error("Error fetching orders:", error);
          enqueueSnackbar("Failed to load order history", { variant: "error" });
        } finally {
          setOrdersLoading(false);
        }
      };

      fetchOrders();
    }
  }, [activeSection, enqueueSnackbar]);

  const handleChange = (e) => {
    if (e.target.name.includes(".")) {
      const [parent, child] = e.target.name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: e.target.value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      enqueueSnackbar("Passwords do not match", { variant: "error" });
      return;
    }

    const updateData = { ...formData };
    if (!updateData.password) delete updateData.password;
    if (updateData.confirmPassword) delete updateData.confirmPassword;

    setIsSubmitting(true);
    const result = await updateProfile(updateData);
    setIsSubmitting(false);

    if (result.success) {
      enqueueSnackbar("Profile updated successfully", { variant: "success" });
      setFormData({
        ...formData,
        password: "",
        confirmPassword: "",
      });
    } else {
      enqueueSnackbar(result.message, { variant: "error" });
    }
  };

  const getUserInitials = () => {
    if (!user || !user.name) return "?";
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Render content based on the active section
  const renderSection = () => {
    switch (activeSection) {
      case "edit-profile":
        return (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="avatar-section">
              <div className="avatar-circle">{getUserInitials()}</div>
              <div className="avatar-info">
                <div className="avatar-name">{user?.name}</div>
                <div className="avatar-email">{user?.email}</div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.street" className="form-label">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  id="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.city" className="form-label">
                  City
                </label>
                <input
                  type="text"
                  name="address.city"
                  id="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.state" className="form-label">
                  State
                </label>
                <input
                  type="text"
                  name="address.state"
                  id="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.zipCode" className="form-label">
                  Zip Code
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                  id="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="password-section">
                <h3>Change Password</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={isSubmitting}
                className="update-button"
              >
                {isSubmitting ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        );
      case "order-history":
        return (
          <div className="order-history-section">
            <h3>Order History</h3>
            {ordersLoading ? (
              <div className="loading-container">
                <Spinner />
              </div>
            ) : orders.length === 0 ? (
              <p className="no-orders">No orders found.</p>
            ) : (
              <table className="order-history-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order._id}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>${order.totalPrice.toFixed(2)}</td>
                      <td>{order.status}</td>
                      <td>
                        <button
                          className="view-details-btn"
                          onClick={() =>
                            navigate(`/order-details/${order._id}`)
                          }
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      case "payments":
        return (
          <div className="section-placeholder">Payments - Coming Soon</div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      <Header searchTerm="" setSearchTerm={() => {}} cartCount={0} />

      <div className="profile-wrapper">
        <div className="profile-sidebar">
          <h3 className="sidebar-title">Profile Options</h3>
          <ul className="sidebar-menu">
            <li
              className={`sidebar-item ${
                activeSection === "edit-profile" ? "active" : ""
              }`}
              onClick={() => setActiveSection("edit-profile")}
            >
              Edit Profile
            </li>
            <li
              className={`sidebar-item ${
                activeSection === "order-history" ? "active" : ""
              }`}
              onClick={() => setActiveSection("order-history")}
            >
              Order History
            </li>
            <li
              className={`sidebar-item ${
                activeSection === "payments" ? "active" : ""
              }`}
              onClick={() => setActiveSection("payments")}
            >
              Payments
            </li>
          </ul>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-header">
              <h2 className="profile-title">My Profile</h2>
              <Link to="/" className="back-button">
                <i className="fas fa-arrow-left"></i>
                Back to Home
              </Link>
            </div>

            {isLoading ? (
              <div className="loading-container">
                <Spinner />
              </div>
            ) : (
              renderSection()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
