import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './components/home/Home';
import Login from './components/Login/Login';
import Register from './components/SignUp/Register';
import AdminLogin from './components/AdminLogin/AdminLogin';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import CashierDashboard from './pages/CashierDashboard';
import StorekeeperDashboard from './pages/StorekeeperDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Cart from "./components/Cart/Cart";
import CheckoutPage from "./pages/CheckoutPage";
import Orders from "./components/Order/Orders";
import OrderConfirmation from "./components/Order/OrderConfirmation";
import { CartProvider } from './context/CartContext';
import Products from './pages/Products';
import UserTransactions from "./pages/UserTransactions";
import PrivateRoute from './components/PrivateRoute';
import PaymentPage from './pages/PaymentPage';
import OrderDetails from './components/Order/OrderDetails';
import ProductPreview from "./components/Order/ProductPreview";
import UpdateOrderStatus from "./pages/UpdateOrderStatus";
import AddSupplier from "./components/AddSupplier";
import SupplierList from "./components/SupplierList";
import PerformanceReport from "./components/PerformanceReport";
import PurchaseOrder from "./components/PurchaseOrder";
import RestockAlerts from "./components/RestockAlerts";

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/orders"
            element={<PrivateRoute element={<Orders />} />}
          />
          <Route
            path="/payment/:orderId"
            element={<PrivateRoute element={<PaymentPage />} />}
          />
          <Route
            path="/order-confirmation/:orderId"
            element={<PrivateRoute element={<OrderConfirmation />} />}
          />
          <Route
            path="/order-details/:orderId"
            element={<PrivateRoute element={<OrderDetails />} />}
          />
          <Route
            path="/product-preview/:id"
            element={<ProductPreview />}
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-transactions" element={<UserTransactions />} />
          </Route>

          {/* Admin Routes */}

          <Route path="/admin" element={<AdminDashboard />} />

          {/* Special Roles Routes */}
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/storekeeper" element={<StorekeeperDashboard />} />
          <Route path="/add-supplier" element={<AddSupplier />} />
          <Route path="/supplier-list" element={<SupplierList />} />
          <Route path="/performance-report" element={<PerformanceReport />} />
          <Route path="/purchase-order" element={<PurchaseOrder />} />
          <Route
            path="/cashier/update-order-status"
            element={<PrivateRoute element={<UpdateOrderStatus />} />}
          />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
