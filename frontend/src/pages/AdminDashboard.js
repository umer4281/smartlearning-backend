import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      setError('Failed to load stats');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users');
    }
  }, []);

  const fetchTestResults = useCallback(async () => {
    try {
      const res = await adminAPI.getAllTestResults();
      setTestResults(res.data);
    } catch (err) {
      setError('Failed to load test results');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'overview') await fetchStats();
        else if (activeTab === 'users') await fetchUsers();
        else if (activeTab === 'results') await fetchTestResults();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab, fetchStats, fetchUsers, fetchTestResults]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This will also remove their resources and test results.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await adminAPI.deleteResource(resourceId);
      setTestResults(testResults.filter(r => r._id !== resourceId));
      alert('Resource deleted');
    } catch (err) {
      alert('Failed to delete resource');
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Delete this test? All related results will also be removed.')) return;
    try {
      await adminAPI.deleteTest(testId);
      alert('Test deleted');
    } catch (err) {
      alert('Failed to delete test');
    }
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: 'bi-speedometer2' },
    { id: 'users', label: '👥 Users', icon: 'bi-people' },
    { id: 'results', label: '📝 Test Results', icon: 'bi-clipboard-data' },
  ];

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-dark text-white">
            <div className="card-body">
              <h2>⚙️ Admin Dashboard</h2>
              <p className="mb-0">Welcome, {user?.name}. Manage the platform from here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="card text-white bg-primary h-100">
                    <div className="card-body text-center">
                      <h1 className="display-4">{stats.totalUsers}</h1>
                      <h6>Total Users</h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card text-white bg-success h-100">
                    <div className="card-body text-center">
                      <h1 className="display-4">{stats.totalStudents}</h1>
                      <h6>Students</h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card text-white bg-warning h-100">
                    <div className="card-body text-center">
                      <h1 className="display-4">{stats.totalTeachers}</h1>
                      <h6>Teachers</h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card text-white bg-info h-100">
                    <div className="card-body text-center">
                      <h1 className="display-4">{stats.totalAdmins}</h1>
                      <h6>Admins</h6>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="card border-primary h-100">
                    <div className="card-body text-center">
                      <h1 className="display-4 text-primary">{stats.totalResources}</h1>
                      <h6>Resources Uploaded</h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card border-success h-100">
                    <div className="card-body text-center">
                      <h1 className="display-4 text-success">{stats.totalTests}</h1>
                      <h6>Tests Created</h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card border-info h-100">
                    <div className="card-body text-center">
                      <h1 className="display-4 text-info">{stats.totalTestSubmissions}</h1>
                      <h6>Test Submissions</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">All Users</h5>
                <span className="badge bg-primary">{users.length} total</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">No users found</td>
                        </tr>
                      ) : (
                        users.map(u => (
                          <tr key={u._id}>
                            <td>
                              <strong>{u.name}</strong>
                              {u._id === user?._id && <span className="badge bg-info ms-2">You</span>}
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <select
                                className={`form-select form-select-sm ${
                                  u.role === 'admin' ? 'border-danger text-danger' :
                                  u.role === 'teacher' ? 'border-warning text-warning' :
                                  'border-success text-success'
                                }`}
                                value={u.role}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                disabled={u._id === user?._id}
                                style={{ fontWeight: 500, width: 'auto' }}
                              >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="text-muted small">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                disabled={u._id === user?._id}
                                title={u._id === user?._id ? 'Cannot delete yourself' : 'Delete user'}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Test Results Tab */}
          {activeTab === 'results' && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">All Test Results</h5>
                <span className="badge bg-primary">{testResults.length} submissions</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Test</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">No test submissions yet</td>
                        </tr>
                      ) : (
                        testResults.map(r => (
                          <tr key={r._id}>
                            <td>{r.user?.name || 'Unknown'} <span className="text-muted small">({r.user?.email})</span></td>
                            <td>{r.test?.title || 'Unknown Test'}</td>
                            <td>{r.score} / {r.total}</td>
                            <td>
                              <span className={`badge ${
                                (r.score / r.total) >= 0.8 ? 'bg-success' :
                                (r.score / r.total) >= 0.6 ? 'bg-warning text-dark' : 'bg-danger'
                              }`}>
                                {Math.round((r.score / r.total) * 100)}%
                              </span>
                            </td>
                            <td className="text-muted small">{new Date(r.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;