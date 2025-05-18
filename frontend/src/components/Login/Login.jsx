import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import '../../styles/forms.css';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await login(email, password);
    
    setIsSubmitting(false);
    
    if (result.success) {
      enqueueSnackbar('Login successful!', { variant: 'success' });
      navigate('/');
    } else {
      enqueueSnackbar(result.message, { variant: 'error' });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container login-form-container">
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue to SuperMart</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <span className="login-icon">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <span className="login-icon">
                <i className="fas fa-lock"></i>
              </span>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            <div className="forgot-password">
              <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
            </div>
          </div>
          
          <button
            type="submit"
            className="form-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          
          <div className="social-login">
            <div className="social-login-title">
              <span>Or continue with</span>
            </div>
            <div className="social-buttons">
              <button type="button" className="social-button">
                <i className="fab fa-google"></i>
              </button>
              <button type="button" className="social-button">
                <i className="fab fa-facebook-f"></i>
              </button>
              <button type="button" className="social-button">
                <i className="fab fa-twitter"></i>
              </button>
            </div>
          </div>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
