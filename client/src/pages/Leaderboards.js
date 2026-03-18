import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Leaderboards.css";

function Leaderboards() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all");
  const [category, setCategory] = useState("rating");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboards();
  }, [timeframe, category]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would come from your API
      const mockPlayers = [
        {
          username: "Grandmaster123",
          rating: 2450,
          wins: 450,
          losses: 120,
          draws: 30,
          gamesPlayed: 600,
          winRate: 75,
          country: "🇺🇸",
          rank: 1,
        },
        {
          username: "ChessWizard",
          rating: 2380,
          wins: 380,
          losses: 110,
          draws: 25,
          gamesPlayed: 515,
          winRate: 73.8,
          country: "🇷🇺",
          rank: 2,
        },
        {
          username: "KingHunter",
          rating: 2320,
          wins: 420,
          losses: 150,
          draws: 40,
          gamesPlayed: 610,
          winRate: 68.9,
          country: "🇩🇪",
          rank: 3,
        },
        {
          username: "BishopMaster",
          rating: 2280,
          wins: 350,
          losses: 120,
          draws: 35,
          gamesPlayed: 505,
          winRate: 69.3,
          country: "🇫🇷",
          rank: 4,
        },
        {
          username: "KnightRider",
          rating: 2250,
          wins: 380,
          losses: 140,
          draws: 30,
          gamesPlayed: 550,
          winRate: 69.1,
          country: "🇬🇧",
          rank: 5,
        },
        {
          username: "PawnStar",
          rating: 2210,
          wins: 290,
          losses: 110,
          draws: 25,
          gamesPlayed: 425,
          winRate: 68.2,
          country: "🇪🇸",
          rank: 6,
        },
        {
          username: "QueenGambit",
          rating: 2180,
          wins: 310,
          losses: 130,
          draws: 28,
          gamesPlayed: 468,
          winRate: 66.2,
          country: "🇮🇳",
          rank: 7,
        },
        {
          username: "RookAndRoll",
          rating: 2150,
          wins: 280,
          losses: 120,
          draws: 22,
          gamesPlayed: 422,
          winRate: 66.4,
          country: "🇨🇦",
          rank: 8,
        },
        {
          username: "CheckmateKing",
          rating: 2120,
          wins: 260,
          losses: 110,
          draws: 20,
          gamesPlayed: 390,
          winRate: 66.7,
          country: "🇦🇺",
          rank: 9,
        },
        {
          username: "EndgameExpert",
          rating: 2100,
          wins: 240,
          losses: 100,
          draws: 18,
          gamesPlayed: 358,
          winRate: 67.0,
          country: "🇧🇷",
          rank: 10,
        },
      ];

      setTimeout(() => {
        setPlayers(mockPlayers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to load leaderboards");
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}.`;
  };

  const getWinRateColor = (rate) => {
    if (rate >= 70) return "#4CAF50";
    if (rate >= 60) return "#8BC34A";
    if (rate >= 50) return "#FFC107";
    if (rate >= 40) return "#FF9800";
    return "#F44336";
  };

  const filteredPlayers = players.filter((player) =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (category === "rating") return b.rating - a.rating;
    if (category === "wins") return b.wins - a.wins;
    if (category === "winRate") return b.winRate - a.winRate;
    return 0;
  });

  return (
    <div className="leaderboards-container">
      <div className="leaderboards-header">
        <h1 className="leaderboards-title">🏆 Leaderboards</h1>
        <p className="leaderboards-subtitle">
          Top players ranked by performance
        </p>
      </div>

      <div className="leaderboards-controls">
        <div className="timeframe-selector">
          <button
            className={`time-btn ${timeframe === "daily" ? "active" : ""}`}
            onClick={() => setTimeframe("daily")}
          >
            Daily
          </button>
          <button
            className={`time-btn ${timeframe === "weekly" ? "active" : ""}`}
            onClick={() => setTimeframe("weekly")}
          >
            Weekly
          </button>
          <button
            className={`time-btn ${timeframe === "monthly" ? "active" : ""}`}
            onClick={() => setTimeframe("monthly")}
          >
            Monthly
          </button>
          <button
            className={`time-btn ${timeframe === "all" ? "active" : ""}`}
            onClick={() => setTimeframe("all")}
          >
            All Time
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="category-selector">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="rating">Rating</option>
            <option value="wins">Most Wins</option>
            <option value="winRate">Win Rate</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="leaderboards-loading">
          <div className="loading-spinner"></div>
          <p>Loading leaderboards...</p>
        </div>
      ) : (
        <div className="leaderboards-table-container">
          <div className="leaderboards-table">
            <div className="table-header">
              <div className="rank-col">Rank</div>
              <div className="player-col">Player</div>
              <div className="rating-col">Rating</div>
              <div className="stats-col">W/L/D</div>
              <div className="winrate-col">Win Rate</div>
              <div className="games-col">Games</div>
            </div>

            <div className="table-body">
              {sortedPlayers.map((player) => (
                <div
                  key={player.username}
                  className="table-row"
                  onClick={() => navigate(`/profile/${player.username}`)}
                >
                  <div className="rank-col">
                    <span className="rank-icon">
                      {getRankIcon(player.rank)}
                    </span>
                  </div>
                  <div className="player-col">
                    <span className="player-country">{player.country}</span>
                    <span className="player-name">{player.username}</span>
                  </div>
                  <div className="rating-col">
                    <span className="rating-value">{player.rating}</span>
                  </div>
                  <div className="stats-col">
                    <span className="wins">{player.wins}</span>/
                    <span className="losses">{player.losses}</span>/
                    <span className="draws">{player.draws}</span>
                  </div>
                  <div className="winrate-col">
                    <span
                      className="winrate-value"
                      style={{ color: getWinRateColor(player.winRate) }}
                    >
                      {player.winRate}%
                    </span>
                    <div className="winrate-bar">
                      <div
                        className="winrate-fill"
                        style={{
                          width: `${player.winRate}%`,
                          backgroundColor: getWinRateColor(player.winRate),
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="games-col">
                    <span className="games-value">{player.gamesPlayed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboards;
