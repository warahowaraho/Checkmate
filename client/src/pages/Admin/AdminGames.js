import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "./Admin.css";

function AdminGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchGames();
  }, [page, status]);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `http://localhost:5000/api/admin/games?page=${page}&status=${status}&search=${search}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setGames(response.data.games || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      } else {
        toast.error("Failed to load games");
      }
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGames();
  };

  const viewGameDetails = (game) => {
    setSelectedGame(game);
    setShowGameModal(true);
  };

  const deleteGame = async (gameId) => {
    if (!window.confirm("Are you sure you want to delete this game?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`http://localhost:5000/api/admin/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Game deleted successfully");
      fetchGames();
      setShowGameModal(false);
    } catch (error) {
      toast.error("Failed to delete game");
    }
  };

  const formatTimeControl = (tc) => {
    if (!tc) return "Standard";
    if (tc.untimed) return "Untimed";
    return `${tc.initial / 60}+${tc.increment}`;
  };

  const getResultBadge = (result) => {
    if (result === "white")
      return <span className="badge win">White Wins</span>;
    if (result === "black")
      return <span className="badge win">Black Wins</span>;
    if (result === "draw") return <span className="badge draw">Draw</span>;
    return <span className="badge ongoing">Ongoing</span>;
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
          <Link to="/admin/games" className="menu-item active">
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
          <h1>Game Management</h1>
          <div className="header-actions">
            <form onSubmit={handleSearch} className="search-box">
              <input
                type="text"
                placeholder="Search by player..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit">🔍</button>
            </form>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All Games</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading games...</div>
        ) : (
          <>
            <div className="games-table">
              <div className="table-header">
                <div>Game ID</div>
                <div>White</div>
                <div>Black</div>
                <div>Result</div>
                <div>Time Control</div>
                <div>Date</div>
                <div>Actions</div>
              </div>

              {games.map((game) => (
                <div key={game._id} className="table-row">
                  <div className="game-id">{game.gameId?.slice(-8)}</div>
                  <div>{game.whiteUsername}</div>
                  <div>{game.blackUsername}</div>
                  <div>{getResultBadge(game.result)}</div>
                  <div>{formatTimeControl(game.timeControl)}</div>
                  <div>{new Date(game.createdAt).toLocaleDateString()}</div>
                  <div className="action-buttons">
                    <button onClick={() => viewGameDetails(game)}>👁️</button>
                    <button onClick={() => deleteGame(game.gameId)}>🗑️</button>
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

export default AdminGames;
