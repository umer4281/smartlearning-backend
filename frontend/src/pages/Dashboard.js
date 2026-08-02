import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, isTeacher, isAdmin } = useAuth();

  const subjects = [
    { name: 'Hadith', image: '/images/hadith.jpg', color: '#1e8449' },
    { name: 'Fiqh', image: '/images/fiqh.jpg', color: '#b7950b' },
    { name: 'Sirah', image: '/images/sirah.jpg', color: '#922b21' },
  ];

  const features = [
    {
      icon: '🎥',
      title: 'Video Classroom',
      desc: 'Join live video/audio calls with your teacher and classmates',
      link: '/classroom',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      icon: '📁',
      title: 'Resources',
      desc: 'Upload and download learning materials',
      link: '/resources',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
    {
      icon: '📝',
      title: 'Online Tests',
      desc: 'Take quizzes and track your progress',
      link: '/tests',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      icon: '🎮',
      title: 'Educational Games',
      desc: 'Learn while having fun with interactive games',
      link: '/games',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
  ];

  return (
    <div className="container mt-4">
      {/* Welcome Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="dashboard-welcome">
            <h2>Welcome back, {user?.name}! 👋</h2>
            <p>
              You are logged in as <strong>{isAdmin ? 'Admin' : isTeacher ? 'Teacher' : 'Student'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="row mb-4">
        {features.map((feature, index) => (
          <div className="col-md-6 col-lg-3 mb-4 fade-in-up" key={index}>
            <Link to={feature.link} style={{ textDecoration: 'none' }}>
              <div className="dashboard-card" style={{ '--card-gradient': feature.gradient }}>
                <div className="icon">{feature.icon}</div>
                <h5>{feature.title}</h5>
                <p>{feature.desc}</p>
                <span className="btn" style={{ background: feature.gradient, color: 'white', border: 'none' }}>
                  Open {feature.title.split(' ').slice(0, 1)}
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Subjects Overview */}
      <div className="row mb-4">
        <div className="col-12">
          <h5 className="mb-3" style={{ color: '#1a1a2e', fontWeight: 600 }}>📖 Your Subjects</h5>
        </div>
        {subjects.map((subject, index) => (
          <div className="col-md-3 col-6 mb-3 fade-in-up" key={index}>
            <div className="subject-card" style={{ height: '200px' }}>
              <img src={subject.image} alt={subject.name} />
              <div className="subject-card-overlay">
                <h4>{subject.name}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Teacher/Admin Controls */}
      {(isTeacher || isAdmin) && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card" style={{ borderLeft: '4px solid #667eea' }}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <h5 className="mb-1" style={{ color: '#1a1a2e' }}>👨‍🏫 {isAdmin ? 'Admin' : 'Teacher'} Controls</h5>
                    <p className="text-muted mb-0 small">
                      Manage resources, tests, and view student results
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <Link to="/resources" className="btn btn-success btn-sm">📁 Resources</Link>
                    <Link to="/tests" className="btn btn-warning btn-sm">📝 Tests</Link>
                    {isAdmin && (
                      <Link to="/admin" className="btn btn-dark btn-sm">⚙️ Admin Panel</Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;