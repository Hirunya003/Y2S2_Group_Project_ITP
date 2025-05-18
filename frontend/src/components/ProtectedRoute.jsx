import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Handle special role emails first
  if (user.email === 'cashier@example.com') {
    return adminOnly ? <Navigate to="/cashier" /> : <Outlet />;
  }
  
  if (user.email === 'storekeeper@example.com') {
    return adminOnly ? <Navigate to="/storekeeper" /> : <Outlet />;
  }

  if (user.email === 'useradmin@example.com') {
    return adminOnly ? <Navigate to="/admin" /> : <Outlet />;
  }


  // Then handle normal admin check
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
