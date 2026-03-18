import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "./Admin.css";

function AdminSettings() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
    permissions: [],
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const navigate = useNavigate();

  const availablePermissions = [
    { id: "manage_users", label: "Manage Users" },
    { id: "manage_games", label: "Manage Games" },
    { id: "manage_tournaments", label: "Manage Tournaments" },
    { id: "manage_reports", label: "Manage Reports" },
    { id: "manage_settings", label: "Manage Settings" },
    { id: "view_analytics", label: "View Analytics" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/admin/admins",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAdmins(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      } else {
        toast.error("Failed to load admins");
      }
      setLoading(false);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post("http://localhost:5000/api/admin/admins", newAdmin, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Admin created successfully");
      setShowCreateAdmin(false);
      fetchAdmins();
      setNewAdmin({
        username: "",
        email: "",
        password: "",
        role: "admin",
        permissions: [],
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create admin");
    }
  };

  const togglePermission = (permissionId) => {
    setNewAdmin((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    toast.success("Password changed successfully");
    setShowPasswordChange(false);
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  const getRoleBadge = (role) => {
    const badges = {
      superadmin: { text: "Super Admin", class: "badge super" },
      admin: { text: "Admin", class: "badge admin" },
      moderator: { text: "Moderator", class: "badge mod" },
    };
    const badge = badges[role] || badges.admin;
    return <span className={badge.class}>{badge.text}</span>;
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">♜ Checkmate</span>
        </div>
        <div className="sidebar-menu">
          <Link to="/admin/dashboard" className="menu-item">
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
          <Link to="/admin/settings" className="menu-item active">
            ⚙️ Settings
          </Link>
        </div>
      </div>

      <div className="admin-main">
        <div className="main-header">
          <h1>Admin Settings</h1>
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <h2>Admin Management</h2>
            <button
              className="create-admin-btn"
              onClick={() => setShowCreateAdmin(!showCreateAdmin)}
            >
              {showCreateAdmin ? "Cancel" : "+ Create New Admin"}
            </button>

            {showCreateAdmin && (
              <form onSubmit={createAdmin} className="create-admin-form">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={newAdmin.username}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, role: e.target.value })
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-grid">
                    {availablePermissions.map((perm) => (
                      <label key={perm.id} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={newAdmin.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="submit-btn">
                  Create Admin
                </button>
              </form>
            )}

            <div className="admins-list">
              <h3>Current Admins</h3>
              {loading ? (
                <p>Loading...</p>
              ) : (
                admins.map((admin) => (
                  <div key={admin._id} className="admin-item">
                    <div className="admin-info">
                      <span className="admin-name">{admin.username}</span>
                      <span className="admin-email">{admin.email}</span>
                    </div>
                    <div className="admin-role">{getRoleBadge(admin.role)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="settings-card">
            <h2>Security Settings</h2>
            <button
              className="security-btn"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              Change Password
            </button>

            {showPasswordChange && (
              <form onSubmit={changePassword} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <button type="submit" className="submit-btn">
                  Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
