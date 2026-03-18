import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "./Admin.css";

function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/admin/tournaments",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTournaments(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      } else {
        toast.error("Failed to load tournaments");
      }
      setLoading(false);
    }
  };

  const cancelTournament = async (tournamentId) => {
    if (!window.confirm("Are you sure you want to cancel this tournament?"))
      return;

    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `http://localhost:5000/api/admin/tournaments/${tournamentId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Tournament cancelled");
      fetchTournaments();
      setShowTournamentModal(false);
    } catch (error) {
      toast.error("Failed to cancel tournament");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      registering: { text: "Registering", class: "badge registering" },
      "in-progress": { text: "In Progress", class: "badge progress" },
      completed: { text: "Completed", class: "badge completed" },
      cancelled: { text: "Cancelled", class: "badge cancelled" },
    };
    const badge = badges[status] || badges.registering;
    return <span className={badge.class}>{badge.text}</span>;
  };

  const viewTournamentDetails = (tournament) => {
    setSelectedTournament(tournament);
    setShowTournamentModal(true);
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
          <Link to="/admin/tournaments" className="menu-item active">
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
          <h1>Tournament Management</h1>
        </div>

        {loading ? (
          <div className="admin-loading">Loading tournaments...</div>
        ) : (
          <div className="tournaments-grid">
            {tournaments.map((tournament) => (
              <div key={tournament._id} className="tournament-card">
                <div className="tournament-card-header">
                  <h3>{tournament.name}</h3>
                  {getStatusBadge(tournament.status)}
                </div>

                <div className="tournament-card-body">
                  <p className="description">
                    {tournament.description || "No description"}
                  </p>

                  <div className="tournament-stats">
                    <div className="stat">
                      <span className="label">Format</span>
                      <span className="value">
                        {tournament.format === "league" ? "League" : "Knockout"}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="label">Players</span>
                      <span className="value">
                        {tournament.players?.length || 0}/
                        {tournament.maxPlayers}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="label">Created</span>
                      <span className="value">
                        {new Date(tournament.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="tournament-creator">
                    <span className="label">Created by:</span>
                    <span className="value">
                      {tournament.createdBy?.username}
                    </span>
                  </div>

                  {tournament.isPrivate && (
                    <div className="private-code">
                      <span className="label">Join Code:</span>
                      <span className="code">{tournament.joinCode}</span>
                    </div>
                  )}
                </div>

                <div className="tournament-card-footer">
                  <button
                    className="view-btn"
                    onClick={() => viewTournamentDetails(tournament)}
                  >
                    View Details
                  </button>
                  {tournament.status !== "completed" &&
                    tournament.status !== "cancelled" && (
                      <button
                        className="cancel-btn"
                        onClick={() => cancelTournament(tournament._id)}
                      >
                        Cancel Tournament
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tournament Details Modal */}
      {showTournamentModal && selectedTournament && (
        <div className="modal-overlay">
          <div className="modal-content tournament-modal">
            <div className="modal-header">
              <h2>{selectedTournament.name}</h2>
              <button onClick={() => setShowTournamentModal(false)}>✕</button>
            </div>

            <div className="tournament-details">
              <div className="detail-section">
                <h3>Tournament Info</h3>
                <div className="detail-row">
                  <label>Description:</label>
                  <span>
                    {selectedTournament.description || "No description"}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Format:</label>
                  <span>
                    {selectedTournament.format === "league"
                      ? "League"
                      : "Knockout"}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span>{getStatusBadge(selectedTournament.status)}</span>
                </div>
                <div className="detail-row">
                  <label>Players:</label>
                  <span>
                    {selectedTournament.players?.length || 0} /{" "}
                    {selectedTournament.maxPlayers}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Min Players:</label>
                  <span>{selectedTournament.minPlayers}</span>
                </div>
                <div className="detail-row">
                  <label>Time Control:</label>
                  <span>
                    {selectedTournament.timeControl?.untimed
                      ? "Untimed"
                      : `${selectedTournament.timeControl?.initial / 60}+${selectedTournament.timeControl?.increment}`}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Created:</label>
                  <span>
                    {new Date(selectedTournament.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Players</h3>
                <div className="players-list">
                  {selectedTournament.players?.map((player, index) => (
                    <div key={index} className="player-item">
                      <span>{player.username}</span>
                      {player.user === selectedTournament.createdBy?._id && (
                        <span className="creator-badge">Creator</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedTournament.winner && (
                <div className="detail-section">
                  <h3>Winner</h3>
                  <div className="winner-display">
                    <span className="winner-name">
                      {selectedTournament.winnerUsername}
                    </span>
                    <span className="winner-trophy">🏆</span>
                  </div>
                </div>
              )}

              {selectedTournament.isPrivate && (
                <div className="detail-section">
                  <h3>Private Tournament Code</h3>
                  <div className="code-display">
                    <span className="code">{selectedTournament.joinCode}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="action-btn view"
                onClick={() =>
                  window.open(
                    `http://localhost:3000/tournament/${selectedTournament._id}`,
                    "_blank",
                  )
                }
              >
                👁️ View Public Page
              </button>
              {selectedTournament.status !== "completed" &&
                selectedTournament.status !== "cancelled" && (
                  <button
                    className="action-btn delete"
                    onClick={() => cancelTournament(selectedTournament._id)}
                  >
                    🚫 Cancel Tournament
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTournaments;
