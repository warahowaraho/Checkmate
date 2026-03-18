import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import "./TournamentDetails.css";

function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/tournaments/${id}`,
      );
      setTournament(response.data);
    } catch (error) {
      toast.error("Failed to load tournament");
      navigate("/tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      toast.error("Please login to join");
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/tournaments/${id}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Joined tournament!");
      fetchTournament();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to join");
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave?")) return;

    try {
      await axios.post(
        `http://localhost:5000/api/tournaments/${id}/leave`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Left tournament");
      fetchTournament();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to leave");
    }
  };

  const handleStart = async () => {
    if (!window.confirm("Start the tournament? This cannot be undone.")) return;

    try {
      await axios.post(
        `http://localhost:5000/api/tournaments/${id}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Tournament started!");
      fetchTournament();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to start");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      registering: { text: "Registering", class: "badge-registering" },
      "in-progress": { text: "In Progress", class: "badge-progress" },
      completed: { text: "Completed", class: "badge-completed" },
    };
    const badge = badges[status] || badges.registering;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatTimeControl = (tc) => {
    if (tc?.untimed) return "Untimed";
    return `${tc?.initial / 60} + ${tc?.increment}`;
  };

  const isPlayerJoined = () => {
    return tournament?.players?.some(
      (p) => p.user?._id === user?._id || p.user === user?._id,
    );
  };

  const canStart = () => {
    return (
      tournament?.createdBy?._id === user?._id &&
      tournament?.status === "registering" &&
      tournament?.players?.length >= (tournament?.minPlayers || 4)
    );
  };

  if (loading) {
    return (
      <div className="tournament-details-container">
        <div className="loading-spinner"></div>
        <p>Loading tournament...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tournament-details-container">
        <h2>Tournament not found</h2>
        <button onClick={() => navigate("/tournaments")} className="back-btn">
          Back to Tournaments
        </button>
      </div>
    );
  }

  return (
    <div className="tournament-details-container">
      <div className="tournament-header">
        <button onClick={() => navigate("/tournaments")} className="back-btn">
          ← Back
        </button>
        <div className="tournament-title-section">
          <h1 className="tournament-name">{tournament.name}</h1>
          {getStatusBadge(tournament.status)}
        </div>

        <div className="tournament-actions">
          {tournament.status === "registering" && !isPlayerJoined() && (
            <button onClick={handleJoin} className="btn btn-primary">
              Join Tournament
            </button>
          )}
          {tournament.status === "registering" && isPlayerJoined() && (
            <button onClick={handleLeave} className="btn btn-secondary">
              Leave Tournament
            </button>
          )}
          {canStart() && (
            <button onClick={handleStart} className="btn btn-success">
              Start Tournament
            </button>
          )}
        </div>
      </div>

      <div className="tournament-info-grid">
        <div className="info-card">
          <h3>Tournament Info</h3>
          <div className="info-row">
            <span className="info-label">Format:</span>
            <span className="info-value">
              {tournament.format === "league"
                ? "League (Round Robin)"
                : "Knockout"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Players:</span>
            <span className="info-value">
              {tournament.players?.length || 0} / {tournament.maxPlayers}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Min Players:</span>
            <span className="info-value">{tournament.minPlayers}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Time Control:</span>
            <span className="info-value">
              {formatTimeControl(tournament.timeControl)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Created by:</span>
            <span className="info-value">{tournament.createdBy?.username}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Started:</span>
            <span className="info-value">
              {tournament.startedAt
                ? new Date(tournament.startedAt).toLocaleDateString()
                : "Not started"}
            </span>
          </div>
        </div>

        <div className="info-card">
          <h3>Players ({tournament.players?.length || 0})</h3>
          <div className="players-list">
            {tournament.players?.map((player, index) => (
              <div key={index} className="player-item">
                <span className="player-name">{player.username}</span>
                {player.user?._id === tournament.createdBy?._id && (
                  <span className="creator-badge">Creator</span>
                )}
              </div>
            ))}
            {tournament.players?.length === 0 && (
              <p className="no-players">No players yet</p>
            )}
          </div>
        </div>

        {/* Join Code Section - Only show if private and user is creator */}
        {tournament.isPrivate && tournament.createdBy?._id === user?._id && (
          <div className="info-card join-code-card">
            <h3>🔑 Tournament Join Code</h3>
            <p>Share this code with players to join:</p>
            <div className="join-code-display">
              <span className="code">{tournament.joinCode}</span>
              <button
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(tournament.joinCode);
                  toast.success("Code copied to clipboard!");
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tournament-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        {tournament.format === "knockout" && (
          <button
            className={`tab-btn ${activeTab === "bracket" ? "active" : ""}`}
            onClick={() => setActiveTab("bracket")}
          >
            Bracket
          </button>
        )}
        {tournament.format === "league" && (
          <button
            className={`tab-btn ${activeTab === "standings" ? "active" : ""}`}
            onClick={() => setActiveTab("standings")}
          >
            Standings
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="info-card">
              <h3>Description</h3>
              <p>{tournament.description || "No description provided."}</p>
            </div>

            {tournament.status === "in-progress" &&
              tournament.rounds?.length > 0 && (
                <div className="info-card">
                  <h3>Current Round {tournament.rounds.length}</h3>
                  <div className="matches-list">
                    {tournament.rounds[
                      tournament.rounds.length - 1
                    ].matches.map((match, idx) => (
                      <div key={idx} className="match-card">
                        <div className="match-players">
                          <span
                            className={match.result === "white" ? "winner" : ""}
                          >
                            {match.whiteUsername}
                          </span>
                          <span className="vs">vs</span>
                          <span
                            className={match.result === "black" ? "winner" : ""}
                          >
                            {match.blackUsername || "TBD"}
                          </span>
                        </div>
                        <div className="match-status">
                          {match.result === "pending"
                            ? "⚡ Pending"
                            : match.result === "white"
                              ? "✅ White wins"
                              : match.result === "black"
                                ? "✅ Black wins"
                                : "🤝 Draw"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {activeTab === "standings" && tournament.standings && (
          <div className="standings-tab">
            <div className="standings-table">
              <div className="standings-header">
                <div className="rank">#</div>
                <div className="player">Player</div>
                <div className="stat">Pts</div>
                <div className="stat">W</div>
                <div className="stat">D</div>
                <div className="stat">L</div>
                <div className="stat">GP</div>
              </div>
              {tournament.standings
                .sort((a, b) => b.points - a.points)
                .map((standing, index) => (
                  <div key={index} className="standings-row">
                    <div className="rank">{index + 1}</div>
                    <div className="player">
                      {standing.username}
                      {standing.user === tournament.winner?._id && " 👑"}
                    </div>
                    <div className="stat">{standing.points}</div>
                    <div className="stat">{standing.wins}</div>
                    <div className="stat">{standing.draws}</div>
                    <div className="stat">{standing.losses}</div>
                    <div className="stat">{standing.gamesPlayed}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === "bracket" && tournament.rounds && (
          <div className="bracket-tab">
            {tournament.rounds.map((round, roundIdx) => (
              <div key={roundIdx} className="bracket-round">
                <h3>Round {round.roundNumber}</h3>
                <div className="bracket-matches">
                  {round.matches.map((match, matchIdx) => (
                    <div key={matchIdx} className="bracket-match">
                      <div
                        className={`match-player ${match.result === "white" ? "winner" : ""}`}
                      >
                        {match.whiteUsername}
                      </div>
                      <div className="match-vs">vs</div>
                      <div
                        className={`match-player ${match.result === "black" ? "winner" : ""}`}
                      >
                        {match.blackUsername || "TBD"}
                      </div>
                      <div className="match-result">
                        {match.result !== "pending" &&
                          (match.result === "white"
                            ? "1-0"
                            : match.result === "black"
                              ? "0-1"
                              : "½-½")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentDetails;
