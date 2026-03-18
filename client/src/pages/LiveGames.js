import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./LiveGames.css";

function LiveGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("get-active-games");
    });

    newSocket.on("active-games-list", (gamesList) => {
      setGames(gamesList);
      setLoading(false);
    });

    const interval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit("get-active-games");
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      newSocket.close();
    };
  }, []);

  const spectateGame = (gameId) => {
    navigate(`/spectate/${gameId}`);
  };

  const formatTimeControl = (tc) => {
    if (!tc) return "Standard";
    if (tc.untimed) return "Untimed";
    return `${tc.initial / 60} + ${tc.increment}`;
  };

  return (
    <div className="live-games-container">
      <div className="live-games-header">
        <h1 className="live-games-title">👁️ Live Games</h1>
        <p className="live-games-subtitle">
          Watch ongoing chess matches in real-time
        </p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading active games...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="no-games">
          <div className="no-games-icon">🎮</div>
          <h2>No Active Games</h2>
          <p>There are no games currently in progress.</p>
        </div>
      ) : (
        <>
          <div className="games-stats">
            <span className="stat">
              {games.length} active game{games.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="games-grid">
            {games.map((game) => (
              <div
                key={game.gameId}
                className="game-card"
                onClick={() => spectateGame(game.gameId)}
              >
                <div className="game-card-header">
                  <span className="game-status">⚡ LIVE</span>
                </div>

                <div className="players-container">
                  <div className="player white-player">
                    <span className="player-color-indicator white"></span>
                    <span className="player-name">{game.whiteUsername}</span>
                  </div>

                  <div className="vs-divider">
                    <span>VS</span>
                  </div>

                  <div className="player black-player">
                    <span className="player-color-indicator black"></span>
                    <span className="player-name">{game.blackUsername}</span>
                  </div>
                </div>

                <div className="game-info">
                  <div className="info-item">
                    <span className="info-label">Time Control</span>
                    <span className="info-value">
                      {formatTimeControl(game.timeControl)}
                    </span>
                  </div>
                </div>

                <button className="spectate-btn">👁️ Watch Game</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LiveGames;
