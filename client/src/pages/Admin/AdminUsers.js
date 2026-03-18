import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "./Admin.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userGames, setUserGames] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchUsers();
  }, [page, filter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `http://localhost:5000/api/admin/users?page=${page}&filter=${filter}&search=${search}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      } else {
        toast.error("Failed to load users");
      }
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleUserAction = async (userId, action, value) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}`,
        { action, value },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`User ${action} successful`);
      fetchUsers();
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, [action]: value });
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `http://localhost:5000/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedUser(response.data.user || response.data);
      setUserGames(response.data.recentGames || []);
      setShowUserModal(true);
    } catch (error) {
      toast.error("Failed to load user details");
    }
  };

  const getStatusBadge = (user) => {
    if (user.banned) return <span className="badge banned">Banned</span>;
    if (user.online) return <span className="badge online">Online</span>;
    return <span className="badge offline">Offline</span>;
  };

  const getVerificationBadge = (verified) => {
    return verified ? (
      <span className="badge verified">✓ Verified</span>
    ) : (
      <span className="badge unverified">✗ Unverified</span>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">♜ Checkmate</span>
          <span className="sidebar-role">Admin</span>
        </div>
        <div className="sidebar-menu">
          <Link to="/admin/dashboard" className="menu-item">
            📊 Dashboard
          </Link>
          <Link to="/admin/users" className="menu-item active">
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
      </div>

      <div className="admin-main">
        <div className="main-header">
          <h1>User Management</h1>
          <div className="header-actions">
            <form onSubmit={handleSearch} className="search-box">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit">🔍</button>
            </form>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Users</option>
              <option value="online">Online</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <>
            <div className="users-table">
              <div className="table-header">
                <div>User</div>
                <div>Email</div>
                <div>Rating</div>
                <div>Status</div>
                <div>Verified</div>
                <div>Joined</div>
                <div>Actions</div>
              </div>
              {users.map((user) => (
                <div key={user._id} className="table-row">
                  <div>{user.username}</div>
                  <div>{user.email}</div>
                  <div>{user.rating}</div>
                  <div>{getStatusBadge(user)}</div>
                  <div>{getVerificationBadge(user.verified)}</div>
                  <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                  <div>
                    <button onClick={() => viewUserDetails(user._id)}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
