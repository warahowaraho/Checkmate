import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import "./Profile.css";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
  });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchGameHistory();
  }, [user]);

  const fetchGameHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/user/games/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setGames(response.data.games);

      const total = response.data.games.length;
      const wins = response.data.games.filter(
        (g) =>
          (g.whiteUsername === user.username && g.result === "white") ||
          (g.blackUsername === user.username && g.result === "black"),
      ).length;
      const draws = response.data.games.filter(
        (g) => g.result === "draw",
      ).length;
      const losses = total - wins - draws;

      setStats({
        totalGames: total,
        wins,
        losses,
        draws,
        winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : 0,
      });
    } catch (error) {
      toast.error("Failed to load game history");
    } finally {
      setLoading(false);
    }
  };

  const getResultClass = (game) => {
    if (game.result === "draw") return "result-draw";
    if (game.whiteUsername === user.username) {
      return game.result === "white" ? "result-win" : "result-loss";
    } else {
      return game.result === "black" ? "result-win" : "result-loss";
    }
  };

  const getResultText = (game) => {
    if (game.result === "draw") return "½-½";
    if (game.whiteUsername === user.username) {
      return game.result === "white" ? "1-0" : "0-1";
    } else {
      return game.result === "black" ? "1-0" : "0-1";
    }
  };

  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{user.username}</h1>
          <div className="profile-rating">
            Rating: {Math.round(user.rating)}
          </div>
          <button onClick={logout} className="profile-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Games Played</span>
          <span className="stat-value">{stats.totalGames}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Wins</span>
          <span className="stat-value wins">{stats.wins}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Losses</span>
          <span className="stat-value losses">{stats.losses}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Draws</span>
          <span className="stat-value draws">{stats.draws}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Win Rate</span>
          <span className="stat-value">{stats.winRate}%</span>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "games" ? "active" : ""}`}
          onClick={() => setActiveTab("games")}
        >
          Game History ({games.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="recent-games">
              <h3>Recent Games</h3>
              {loading ? (
                <div className="loading">Loading games...</div>
              ) : games.length === 0 ? (
                <div className="no-games">No games played yet</div>
              ) : (
                <div className="games-list">
                  {games.slice(0, 5).map((game) => (
                    <div
                      key={game.gameId}
                      className={`game-item ${getResultClass(game)}`}
                      onClick={() => navigate(`/replay/${game.gameId}`)}
                    >
                      <div className="game-players">
                        <span className="white">{game.whiteUsername}</span>
                        <span className="vs">vs</span>
                        <span className="black">{game.blackUsername}</span>
                      </div>
                      <div className="game-result">{getResultText(game)}</div>
                      <div className="game-date">
                        {new Date(game.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "games" && (
          <div className="games-tab">
            <h3>All Games</h3>
            {loading ? (
              <div className="loading">Loading games...</div>
            ) : games.length === 0 ? (
              <div className="no-games">No games played yet</div>
            ) : (
              <div className="all-games-list">
                {games.map((game) => (
                  <div
                    key={game.gameId}
                    className={`game-card ${getResultClass(game)}`}
                    onClick={() => navigate(`/replay/${game.gameId}`)}
                  >
                    <div className="game-players">
                      <span className="player white">{game.whiteUsername}</span>
                      <span className="vs">VS</span>
                      <span className="player black">{game.blackUsername}</span>
                    </div>
                    <div className="game-footer">
                      <span className="game-result">{getResultText(game)}</span>
                      <span className="game-date">
                        {new Date(game.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
