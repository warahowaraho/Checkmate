import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState("Ready to play?");

  const handlePlayClick = () => {
    if (user) {
      navigate("/play-bot");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">♜ Checkmate</h1>
        <p className="home-subtitle">Play Chess Online</p>

        <div className="cta-buttons">
          <button onClick={handlePlayClick} className="btn btn-primary">
            Play vs Computer
          </button>
          <button
            onClick={() => navigate("/live-games")}
            className="btn btn-secondary"
          >
            Watch Live Games
          </button>
        </div>

        {!user && (
          <div className="auth-buttons">
            <button
              onClick={() => navigate("/login")}
              className="btn btn-outline"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="btn btn-outline"
            >
              Register
            </button>
          </div>
        )}

        <p className="game-status">{status}</p>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">♜</span>
            <h3>Real-time</h3>
            <p>Play against real opponents</p>
          </div>
          <div className="feature">
            <span className="feature-icon">♞</span>
            <h3>Tournaments</h3>
            <p>Compete in leagues and knockouts</p>
          </div>
          <div className="feature">
            <span className="feature-icon">♝</span>
            <h3>Free to Play</h3>
            <p>No account needed to watch</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
