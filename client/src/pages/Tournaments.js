import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import "./Tournaments.css";

function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    format: "league",
    maxPlayers: 8,
    minPlayers: 4,
    isPrivate: false,
    timeControl: {
      initial: 600,
      increment: 2,
      untimed: false,
    },
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tournaments");
      setTournaments(response.data);
    } catch (error) {
      toast.error("Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to create a tournament");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/tournaments",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Tournament created!");
      setShowCreate(false);
      fetchTournaments();
      navigate(`/tournament/${response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create tournament");
    }
  };

  const handleJoin = async (tournamentId, e) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to join");
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/tournaments/${tournamentId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Joined tournament!");
      fetchTournaments();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to join");
    }
  };

  const formatTimeControl = (tc) => {
    if (!tc) return "Standard";
    if (tc.untimed) return "Untimed";
    return `${tc.initial / 60} + ${tc.increment}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      registering: { text: "Registering", class: "status-registering" },
      "in-progress": { text: "In Progress", class: "status-in-progress" },
      completed: { text: "Completed", class: "status-completed" },
    };
    return badges[status] || badges.registering;
  };

  return (
    <div className="tournaments-container">
      <div className="tournaments-header">
        <h1 className="tournaments-title">🏆 Tournaments</h1>
        <div className="header-buttons">
          {user && (
            <button
              className="create-tournament-btn"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? "Cancel" : "+ Create Tournament"}
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="create-tournament-form">
          <h2>Create New Tournament</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Tournament Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Enter tournament name"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="3"
                placeholder="Describe your tournament..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Format</label>
                <select
                  value={formData.format}
                  onChange={(e) =>
                    setFormData({ ...formData, format: e.target.value })
                  }
                >
                  <option value="league">League (Round Robin)</option>
                  <option value="knockout">
                    Knockout (Single Elimination)
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Max Players</label>
                <select
                  value={formData.maxPlayers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxPlayers: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={4}>4 Players</option>
                  <option value={8}>8 Players</option>
                  <option value={16}>16 Players</option>
                  <option value={32}>32 Players</option>
                </select>
              </div>

              <div className="form-group">
                <label>Min to Start</label>
                <select
                  value={formData.minPlayers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPlayers: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={2}>2 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={6}>6 Players</option>
                  <option value={8}>8 Players</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Tournament Privacy</h3>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) =>
                      setFormData({ ...formData, isPrivate: e.target.checked })
                    }
                  />
                  <span>Private Tournament (Requires join code)</span>
                </label>
                {formData.isPrivate && (
                  <p className="help-text">
                    Players will need a 6-character code to join.
                  </p>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Time Control</h3>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.timeControl.untimed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        timeControl: {
                          ...formData.timeControl,
                          untimed: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>Untimed (No Clock)</span>
                </label>
              </div>

              {!formData.timeControl.untimed && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Time (minutes)</label>
                    <select
                      value={formData.timeControl.initial / 60}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timeControl: {
                            ...formData.timeControl,
                            initial: parseInt(e.target.value) * 60,
                          },
                        })
                      }
                    >
                      <option value={1}>1 min</option>
                      <option value={3}>3 min</option>
                      <option value={5}>5 min</option>
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Increment (seconds)</label>
                    <select
                      value={formData.timeControl.increment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timeControl: {
                            ...formData.timeControl,
                            increment: parseInt(e.target.value),
                          },
                        })
                      }
                    >
                      <option value={0}>0 sec</option>
                      <option value={2}>2 sec</option>
                      <option value={5}>5 sec</option>
                      <option value={10}>10 sec</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="submit-btn">
              Create Tournament
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading tournaments...</div>
      ) : (
        <div className="tournaments-list">
          {tournaments.length === 0 ? (
            <div className="no-tournaments">
              <p>No tournaments yet</p>
              {user && (
                <button onClick={() => setShowCreate(true)}>Create one!</button>
              )}
            </div>
          ) : (
            tournaments.map((t) => {
              const status = getStatusBadge(t.status);
              return (
                <div
                  key={t._id}
                  className="tournament-card"
                  onClick={() => navigate(`/tournament/${t._id}`)}
                >
                  <div className="tournament-info">
                    <div className="tournament-header-row">
                      <h3 className="tournament-name">{t.name}</h3>
                      <span className={`status-badge ${status.class}`}>
                        {status.text}
                      </span>
                    </div>

                    {t.isPrivate && (
                      <div className="private-badge">🔒 Private</div>
                    )}

                    <p className="tournament-description">
                      {t.description || "No description provided"}
                    </p>

                    <div className="tournament-details">
                      <div className="detail-item">
                        <span className="detail-label">Format</span>
                        <span className="detail-value">
                          {t.format === "league" ? "League" : "Knockout"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Players</span>
                        <span className="detail-value">
                          {t.players?.length || 0}/{t.maxPlayers}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Time Control</span>
                        <span className="detail-value">
                          {formatTimeControl(t.timeControl)}
                        </span>
                      </div>
                    </div>

                    <div className="tournament-footer">
                      <div className="creator-info">
                        <span className="creator-label">Created by:</span>
                        <span className="creator-name">
                          {t.createdBy?.username}
                        </span>
                      </div>
                      <div className="tournament-date">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="tournament-actions">
                    {t.status === "registering" && user && (
                      <button
                        className={`join-btn ${
                          t.players?.some((p) => p.user === user?._id)
                            ? "joined"
                            : ""
                        }`}
                        onClick={(e) => handleJoin(t._id, e)}
                        disabled={t.players?.some((p) => p.user === user?._id)}
                      >
                        {t.players?.some((p) => p.user === user?._id)
                          ? "✓ Joined"
                          : "Join Tournament"}
                      </button>
                    )}

                    {t.status === "in-progress" && (
                      <button className="view-btn">View Bracket</button>
                    )}

                    {t.status === "completed" && (
                      <button className="results-btn">View Results</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Tournaments;
