import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "./Admin.css";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const admin = localStorage.getItem("adminData");

    if (!token || !admin) {
      navigate("/admin/login");
      return;
    }

    setAdminData(JSON.parse(admin));
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/admin/dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setStats(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        navigate("/admin/login");
      } else {
        toast.error("Failed to load dashboard stats");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">♜ Checkmate</span>
          <span className="sidebar-role">{adminData?.role}</span>
        </div>

        <div className="sidebar-menu">
          <Link to="/admin/dashboard" className="menu-item active">
            📊 Dashboard
          </Link>
          <Link to="/admin/users" className="menu-item">
            👥 Users
          </Link>
          <Link to="/admin/games" className="menu-item">
            🎮 Games
          </Link>
          <Link to="/admin/tournaments" className="menu-item">
            🏆 Tournaments
          </Link>
          <Link to="/admin/reports" className="menu-item">
            🚨 Reports
          </Link>
          <Link to="/admin/settings" className="menu-item">
            ⚙️ Settings
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="admin-info">
            <span className="admin-name">{adminData?.username}</span>
            <span className="admin-role">{adminData?.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="admin-main">
        <div className="main-header">
          <h1>Dashboard Overview</h1>
          <p>
            Welcome back, {adminData?.username}! Here's what's happening today.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card users">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{stats?.users.total}</span>
              <span className="stat-change">
                +{stats?.users.newToday} today
              </span>
            </div>
          </div>

          <div className="stat-card online">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <span className="stat-label">Online Now</span>
              <span className="stat-value">{stats?.users.online}</span>
            </div>
          </div>

          <div className="stat-card games">
            <div className="stat-icon">🎮</div>
            <div className="stat-content">
              <span className="stat-label">Live Games</span>
              <span className="stat-value">{stats?.games.ongoing}</span>
            </div>
          </div>

          <div className="stat-card tournaments">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <span className="stat-label">Tournaments</span>
              <span className="stat-value">{stats?.tournaments.total}</span>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <h3>User Statistics</h3>
            <div className="chart-placeholder">
              <div className="stat-row">
                <span>Verified Users:</span>
                <strong>{stats?.users.verified}</strong>
              </div>
              <div className="stat-row">
                <span>Unverified:</span>
                <strong>{stats?.users.unverified}</strong>
              </div>
              <div className="stat-row">
                <span>New This Week:</span>
                <strong>{stats?.users.newThisWeek}</strong>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Game Statistics</h3>
            <div className="chart-placeholder">
              <div className="stat-row">
                <span>Total Games:</span>
                <strong>{stats?.games.total}</strong>
              </div>
              <div className="stat-row">
                <span>Completed:</span>
                <strong>{stats?.games.completed}</strong>
              </div>
              <div className="stat-row">
                <span>Today's Games:</span>
                <strong>{stats?.games.today}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <Link to="/admin/users" className="action-btn">
              👥 Manage Users
            </Link>
            <Link to="/admin/games" className="action-btn">
              🎮 View Games
            </Link>
            <Link to="/admin/tournaments" className="action-btn">
              🏆 Tournaments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
