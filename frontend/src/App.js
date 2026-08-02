import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import Resources from './pages/Resources';
import Tests from './pages/Tests';
import Games from './pages/Games';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Home Page
const Home = () => {
  const { user } = useAuth();

  const subjects = [
    { name: 'Hadith', desc: 'Prophetic Traditions & Sunnah', icon: '📜', image: '/images/hadith.jpg' },
    { name: 'Fiqh', desc: 'Islamic Jurisprudence & Rulings', icon: '⚖️', image: '/images/fiqh.jpg' },
    { name: 'Sirah', desc: 'Life & Biography of Prophet Muhammad', icon: '🌙', image: '/images/sirah.jpg' },
  ];

  const features = [
    { icon: '🎥', title: 'Video/Audio Calls', desc: 'Real-time classroom sessions with teachers', color: '#6366f1' },
    { icon: '📁', title: 'Resource Sharing', desc: 'Upload and download learning materials', color: '#10b981' },
    { icon: '📝', title: 'Online Tests', desc: 'Quizzes with instant grading & feedback', color: '#f59e0b' },
    { icon: '🎮', title: 'Educational Games', desc: 'Learn through interactive play', color: '#ef4444' },
  ];

  const stats = [
    { number: '4+', label: 'Islamic Subjects', icon: '📚' },
    { number: '100+', label: 'Learning Resources', icon: '📄' },
    { number: '50+', label: 'Interactive Tests', icon: '📝' },
    { number: '24/7', label: 'Learning Access', icon: '🕋' },
  ];

  const steps = [
    { number: '01', title: 'Create Account', desc: 'Sign up for free in minutes', icon: '✨' },
    { number: '02', title: 'Choose Subject', desc: 'Pick from Hadith, Fiqh, Sirah & more', icon: '📖' },
    { number: '03', title: 'Start Learning', desc: 'Join live classes & access resources', icon: '🚀' },
    { number: '04', title: 'Track Progress', desc: 'Take tests & play educational games', icon: '📈' },
  ];

  return (
    <div>
      {/* === HERO SECTION === */}
      <section className="hero-section">
        {/* Background Pattern */}
        <div className="hero-bg-grid"></div>
        <div className="hero-bg-glow"></div>

        <div className="container">
          <div className="row align-items-center min-vh-100">
            {/* Left Content */}
            <div className="col-lg-6">
              <div className="hero-content-left">
                <div className="hero-badge">🌟 Islamic Education Platform</div>
                <h1 className="hero-title">
                  <span className="hero-title-line"></span>
                  <span className="hero-title-line hero-title-accent"> in The Smart Way</span>
                </h1>
                <p className="hero-desc">
                  An interactive Islamic education platform for students. Master Hadith, Fiqh, and Sirah through live classes, resources, tests, and games — all in one place.
                </p>
                <div className="hero-actions">
                  {!user ? (
                    <>
                      <Link to="/register" className="btn hero-btn-primary">
                        <span>Start Learning Free</span>
                        <svg className="btn-arrow-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </Link>
                      <Link to="/login" className="btn hero-btn-secondary">
                        Sign In
                      </Link>
                    </>
                  ) : (
                    <Link to="/dashboard" className="btn hero-btn-primary">
                      <span>Go to Dashboard</span>
                      <svg className="btn-arrow-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </Link>
                  )}
                </div>

                {/* Trust markers */}
                <div className="hero-trust">
                  <div className="trust-item">
                    <span className="trust-icon">✅</span>
                    <span>Free Access</span>
                  </div>
                  <div className="trust-item">
                    <span className="trust-icon">📚</span>
                    <span>4 Subjects</span>
                  </div>
                  <div className="trust-item">
                    <span className="trust-icon">🎓</span>
                    <span>Expert Teachers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="col-lg-6">
              <div className="hero-visual">
                <div className="hero-card-main">
                  <div className="hero-card-glow"></div>
                  <div className="hero-card-content">
                    <div className="hero-card-icon">📚</div>
                    <div className="hero-card-title">Islamic Knowledge</div>
                    <div className="hero-card-items">
                      <div className="hero-card-item">
                        <span className="hci-icon">📜</span>
                        <span>Hadith Studies</span>
                      </div>
                      <div className="hero-card-item">
                        <span className="hci-icon">⚖️</span>
                        <span>Fiqh & Rulings</span>
                      </div>
                      <div className="hero-card-item">
                        <span className="hci-icon">🌙</span>
                        <span>Prophet's Sirah</span>
                      </div>
                    </div>
                    <div className="hero-card-badge">3 Subjects</div>
                  </div>
                </div>

                {/* Floating mini cards */}
                <div className="hero-float-card float-card-1">
                  <span className="float-icon">🎥</span>
                  <div>
                    <div className="float-label">Live Classes</div>
                    <div className="float-value">24/7</div>
                  </div>
                </div>
                <div className="hero-float-card float-card-2">
                  <span className="float-icon">📝</span>
                  <div>
                    <div className="float-label">Practice Tests</div>
                    <div className="float-value">50+</div>
                  </div>
                </div>
                <div className="hero-float-card float-card-3">
                  <span className="float-icon">🎮</span>
                  <div>
                    <div className="float-label">Fun Games</div>
                    <div className="float-value">Learn</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === STATS BANNER === */}
      <section className="stats-banner">
        <div className="container">
          <div className="row">
            {stats.map((stat, index) => (
              <div className="col-md-3 col-6 mb-3 mb-md-0" key={index}>
                <div className="stat-item fade-in-up">
                  <span className="stat-item-icon">{stat.icon}</span>
                  <div className="stat-item-number">{stat.number}</div>
                  <div className="stat-item-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === SUBJECTS SECTION === */}
      <section className="section-block subjects-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">📖 Our Curriculum</span>
            <h2>Explore Islamic Subjects</h2>
            <p className="section-desc">
              Discover a wide range of Islamic subjects designed to enhance your understanding and spiritual growth
            </p>
          </div>
          <div className="row">
            {subjects.map((subject, index) => (
              <div className="col-md-3 col-6 mb-4 fade-in-up" key={index}>
                <div className="subject-card">
                  <div className="subject-card-image">
                    <img src={subject.image} alt={subject.name} />
                    <div className="subject-card-overlay">
                      <span className="subject-icon">{subject.icon}</span>
                      <h4>{subject.name}</h4>
                      <p>{subject.desc}</p>
                      <span className="subject-link">Learn More →</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="section-block steps-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">🚀 How It Works</span>
            <h2>Start Your Learning Journey</h2>
            <p className="section-desc">
              Four simple steps to begin your Islamic education experience
            </p>
          </div>
          <div className="row steps-row">
            {steps.map((step, index) => (
              <div className="col-md-3 col-6 mb-4 fade-in-up" key={index}>
                <div className="step-card">
                  <div className="step-number">{step.number}</div>
                  <div className="step-icon-wrapper">
                    <span className="step-icon">{step.icon}</span>
                  </div>
                  <h5>{step.title}</h5>
                  <p>{step.desc}</p>
                  <div className="step-line"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section className="section-block features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">✨ Platform Features</span>
            <h2>Everything You Need</h2>
            <p className="section-desc">
              Powerful tools designed to make Islamic learning engaging, interactive, and effective
            </p>
          </div>
          <div className="row">
            {features.map((feature, index) => (
              <div className="col-md-3 col-6 mb-4 fade-in-up" key={index}>
                <div className="feature-card" style={{ '--card-accent': feature.color }}>
                  <div className="feature-icon-wrapper" style={{ background: `${feature.color}15` }}>
                    <span className="feature-icon">{feature.icon}</span>
                  </div>
                  <h5>{feature.title}</h5>
                  <p>{feature.desc}</p>
                  <div className="feature-accent" style={{ background: feature.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section className="cta-section">
        <div className="cta-particles">
          <div className="particle p1"></div>
          <div className="particle p2"></div>
          <div className="particle p3"></div>
          <div className="particle p4"></div>
        </div>
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Begin Your Journey?</h2>
            <p>Join hundreds of students learning Hadith, Fiqh, and Sirah online</p>
            {!user ? (
              <Link to="/register" className="btn btn-cta">
                <span>Create Free Account</span>
                <span className="btn-arrow">→</span>
              </Link>
            ) : (
              <Link to="/dashboard" className="btn btn-cta">
                <span>Go to Dashboard</span>
                <span className="btn-arrow">→</span>
              </Link>
            )}
            <div className="cta-stat">
              <span className="cta-stat-number">100%</span>
              <span className="cta-stat-label">Free Access — No Hidden Fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="home-footer">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="footer-brand">
                <span className="footer-icon">📚</span>
                <span className="footer-name">SmartLearning</span>
              </div>
              <p className="footer-text">Empowering Islamic education through technology</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="footer-copyright">© 2026 SmartLearning. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Inner component that can use hooks
function AppContent() {
  const location = useLocation();
  const hideNavbarRoutes = ['/'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  useEffect(() => {
    if (showNavbar) {
      document.body.classList.add('has-navbar');
    } else {
      document.body.classList.remove('has-navbar');
    }
  }, [showNavbar]);

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classroom"
          element={
            <ProtectedRoute>
              <Classroom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <Resources />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests"
          element={
            <ProtectedRoute>
              <Tests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <Games />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;