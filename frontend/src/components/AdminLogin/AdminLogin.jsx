import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import '../../styles/forms.css';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Check for special role emails
      if (user.email === 'cashier@example.com') {
        navigate('/cashier');
      } else if (user.email === 'storekeeper@example.com') {
        navigate('/storekeeper');
      } else if (user.email === 'useradmin@example.com') {
        navigate('/admin');
      } else if (user.role === 'admin') {
        navigate('/');
      } else {
        // If a non-admin user tries to login through admin form
        enqueueSnackbar('Access denied: Admin privileges required', { variant: 'error' });
        navigate('/');
      }
    }
  }, [user, navigate, enqueueSnackbar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await login(email, password);
    
    setIsSubmitting(false);
    
    if (result.success) {
      // Special role handling
      if (result.data.email === 'cashier@example.com') {
        enqueueSnackbar('Cashier login successful!', { variant: 'success' });
        navigate('/cashier');
      } else if (result.data.email === 'storekeeper@example.com') {
        enqueueSnackbar('Storekeeper login successful!', { variant: 'success' });
        navigate('/storekeeper');
      } else if (result.data.role === 'admin') {
        enqueueSnackbar('Admin login successful!', { variant: 'success' });
        navigate('/admin');
      } else {
        enqueueSnackbar('Access denied: Admin privileges required', { variant: 'error' });
      }
    } else {
      enqueueSnackbar(result.message, { variant: 'error' });
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-login-container">
        <div className="admin-logo">
          <i className="fas fa-shield-alt"></i>
        </div>
        
        <div className="auth-header">
          <h2 className="admin-auth-title">Admin Portal</h2>
          <p className="auth-subtitle">Sign in to access admin dashboard</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Admin Email</label>
            <div className="admin-input-container">
              <input
                id="email"
                type="email"
                className="admin-form-input"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="admin-input-icon">
                <i className="fas fa-user-shield"></i>
              </span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="admin-input-container">
              <input
                id="password"
                type="password"
                className="admin-form-input"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="admin-input-icon">
                <i className="fas fa-lock"></i>
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            className="admin-form-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="fas fa-circle-notch fa-spin"></i> Authenticating...
              </span>
            ) : (
              <span>Access Admin Dashboard</span>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            <Link to="/login" className="admin-auth-link">
              <i className="fas fa-arrow-left"></i> Back to customer login
            </Link>
          </p>
          <p className="admin-security-note">
            <i className="fas fa-info-circle"></i> This area is restricted to authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
