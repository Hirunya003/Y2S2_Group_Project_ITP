import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function PrivateRoute({ element }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // If user is authenticated, render the protected component
  // Otherwise, redirect to login page and pass the current location as state
  return user ? (
    element
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

export default PrivateRoute;