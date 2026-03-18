import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
      const interval = setInterval(fetchFriendRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/friends/requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setFriendRequestCount(response.data.length);
    } catch (error) {
      console.error("Failed to fetch friend requests");
    }
  };

  const handleNewGame = () => {
    localStorage.removeItem("chessGame");
    navigate("/");
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = !mobileMenuOpen ? "hidden" : "auto";
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <span className="logo-icon">♜</span>
          <span className="logo-text">Checkmate</span>
        </Link>

        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? "active" : ""}`}
          onClick={toggleMobileMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-menu ${mobileMenuOpen ? "active" : ""}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Home</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link
              to="/live-games"
              className="nav-link"
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">👁️</span>
              <span className="nav-text">Live Games</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link
              to="/tournaments"
              className="nav-link"
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">🏆</span>
              <span className="nav-text">Tournaments</span>
            </Link>
          </li>

          {user && (
            <>
              <li className="nav-item">
                <Link
                  to="/friends"
                  className="nav-link"
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">👥</span>
                  <span className="nav-text">Friends</span>
                  {friendRequestCount > 0 && (
                    <span className="notification-badge">
                      {friendRequestCount}
                    </span>
                  )}
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  to="/leaderboards"
                  className="nav-link"
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">📊</span>
                  <span className="nav-text">Leaderboards</span>
                </Link>
              </li>
            </>
          )}

          <li className="nav-item">
            <Link to="/play-bot" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-icon">🤖</span>
              <span className="nav-text">Play Bot</span>
            </Link>
          </li>

          <li className="nav-item">
            <button onClick={handleNewGame} className="nav-link nav-button">
              <span className="nav-icon">🎮</span>
              <span className="nav-text">New Game</span>
            </button>
          </li>

          {user ? (
            <>
              <li className="nav-item profile-item">
                <Link
                  to="/profile"
                  className="nav-link profile-link"
                  onClick={closeMobileMenu}
                >
                  <div className="profile-avatar-mini">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="nav-text">{user.username}</span>
                  <span className="rating-badge">
                    {Math.round(user.rating)}
                  </span>
                </Link>
              </li>

              <li className="nav-item">
                <button
                  onClick={handleLogout}
                  className="nav-link nav-button logout-btn"
                >
                  <span className="nav-icon">🚪</span>
                  <span className="nav-text">Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link
                  to="/login"
                  className="nav-link"
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">🔐</span>
                  <span className="nav-text">Login</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/register"
                  className="nav-link nav-button register-btn"
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">📝</span>
                  <span className="nav-text">Register</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? "active" : ""}`}
        onClick={closeMobileMenu}
      ></div>
    </nav>
  );
}

export default Navbar;
