import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Navigate when user state is confirmed updated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      // Navigation happens via useEffect when user state updates
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="text-center mb-4">
            <img src="/images/smartlogo.jpg" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #667eea' }} />
            <h4 className="mt-2" style={{ color: '#1a1a2e', fontWeight: 700 }}>Welcome Back!</h4>
            {error && error.includes('Network error') && (
              <div className="alert alert-warning small py-2" style={{ fontSize: '0.85rem' }}>
                <strong>⚠️ Connection Issue:</strong> Cannot reach the server. The backend may be starting up on Render (takes ~30-60s cold start).
              </div>
            )}
          </div>
          <div className="card shadow" style={{ borderRadius: '20px' }}>
            <div className="card-body p-4">
              <h5 className="text-center mb-4" style={{ color: '#6c757d', fontWeight: 500 }}>Sign in to continue</h5>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={submitting} style={{ padding: '0.7rem', borderRadius: '12px' }}>
                  {submitting ? 'Logging in...' : 'Sign In'}
                </button>
              </form>
              <p className="text-center mt-3 mb-0">
                Don't have an account? <Link to="/register" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>Create Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;