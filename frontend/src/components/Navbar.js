import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = React.useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change using Bootstrap Collapse API
  useEffect(() => {
    const navbar = document.getElementById('navbarNav');
    if (navbar && navbar.classList.contains('show')) {
      const bsCollapse = window.bootstrap?.Collapse?.getInstance(navbar);
      if (bsCollapse) {
        bsCollapse.hide();
      } else {
        // Fallback: manually remove show class
        navbar.classList.remove('show');
      }
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeMobile = () => {
    const navbar = document.getElementById('navbarNav');
    if (navbar && navbar.classList.contains('show')) {
      const bsCollapse = window.bootstrap?.Collapse?.getInstance(navbar);
      if (bsCollapse) {
        bsCollapse.hide();
      } else {
        navbar.classList.remove('show');
      }
    }
  };

  const navLinks = user
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/classroom', label: 'Classroom', icon: '🎥' },
        { path: '/resources', label: 'Resources', icon: '📁' },
        { path: '/tests', label: 'Tests', icon: '📝' },
        { path: '/games', label: 'Games', icon: '🎮' },
        ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: '⚙️' }] : []),
      ]
    : [];

  return (
    <nav
      className={`navbar navbar-expand-lg navbar-dark fixed-top ${
        scrolled ? 'navbar-scrolled' : ''
      }`}
    >
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={closeMobile}>
          <span className="brand-icon">📚</span>
          <span className="brand-text">SmartLearning</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Left side - Navigation Links */}
          {user && (
            <ul className="navbar-nav me-auto">
              {navLinks.map((link) => (
                <li className="nav-item" key={link.path}>
                  <Link
                    className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                    to={link.path}
                    onClick={closeMobile}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    <span className="nav-label">{link.label}</span>
                    {isActive(link.path) && <span className="active-indicator"></span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Right side - User Menu / Auth */}
          <ul className="navbar-nav align-items-lg-center">
            {user ? (
              <>
                <li className="nav-item dropdown">
                  <button
                    className="nav-link user-dropdown-btn"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="user-info d-none d-lg-inline">
                      <span className="user-name">{user.name}</span>
                      <span className="user-role">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </span>
                    <span className="dropdown-arrow">▾</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li className="d-lg-none">
                      <span className="dropdown-item-text user-info-mobile">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </span>
                    </li>
                    <li><hr className="dropdown-divider d-lg-none" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <span className="dropdown-icon">🚪</span> Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                    to="/login"
                    onClick={closeMobile}
                  >
                    <span className="nav-icon">🔑</span>
                    <span className="nav-label">Login</span>
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <Link
                    className="btn nav-register-btn"
                    to="/register"
                    onClick={closeMobile}
                  >
                    <span className="nav-icon">✨</span>
                    <span className="nav-label">Register</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;