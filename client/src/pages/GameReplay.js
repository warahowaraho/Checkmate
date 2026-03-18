import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import toast from "react-hot-toast";
import "./GameReplay.css";

function GameReplay() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game] = useState(new Chess());
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [fen, setFen] = useState("start");
  const [moves, setMoves] = useState([]);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1000);

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    let timer;
    if (autoPlay && currentMoveIndex < moves.length - 1) {
      timer = setTimeout(() => {
        goToMove(currentMoveIndex + 1);
      }, autoPlaySpeed);
    } else if (autoPlay && currentMoveIndex === moves.length - 1) {
      setAutoPlay(false);
    }
    return () => clearTimeout(timer);
  }, [autoPlay, currentMoveIndex, moves.length, autoPlaySpeed]);

  const fetchGame = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/game/${gameId}`,
      );
      setGameData(response.data);

      const gameMoves = response.data.moves || [];
      setMoves(gameMoves);

      if (gameMoves.length > 0) {
        game.load(gameMoves[0].fen || "start");
        setFen(game.fen());
      }
    } catch (error) {
      toast.error("Failed to load game");
      navigate("/profile");
    } finally {
      setLoading(false);
    }
  };

  const goToMove = (index) => {
    if (index < 0 || index >= moves.length) return;

    const move = moves[index];
    game.load(move.fen);
    setFen(game.fen());
    setCurrentMoveIndex(index);
  };

  const goToStart = () => {
    game.reset();
    setFen("start");
    setCurrentMoveIndex(-1);
  };

  const goToEnd = () => {
    if (moves.length === 0) return;
    const lastMove = moves[moves.length - 1];
    game.load(lastMove.fen);
    setFen(game.fen());
    setCurrentMoveIndex(moves.length - 1);
  };

  const downloadPGN = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/game/${gameId}/pgn`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${gameId}.pgn`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("PGN downloaded!");
    } catch (error) {
      toast.error("Failed to download PGN");
    }
  };

  const getResultText = (result) => {
    if (result === "white") return "1-0 (White wins)";
    if (result === "black") return "0-1 (Black wins)";
    if (result === "draw") return "½-½ (Draw)";
    return "?";
  };

  if (loading) {
    return (
      <div className="replay-container">
        <div className="loading-spinner"></div>
        <p>Loading game replay...</p>
      </div>
    );
  }

  return (
    <div className="replay-container">
      <div className="replay-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="replay-title">Game Replay</h1>
        <button className="download-btn" onClick={downloadPGN}>
          📥 Download PGN
        </button>
      </div>

      <div className="replay-content">
        <div className="board-section">
          <div className="game-info-bar">
            <div className="player-info white">
              <span className="player-name">{gameData?.whiteUsername}</span>
              <span className="player-rating">
                ({gameData?.whitePlayer?.rating || "?"})
              </span>
            </div>
            <div className="game-result">{getResultText(gameData?.result)}</div>
            <div className="player-info black">
              <span className="player-name">{gameData?.blackUsername}</span>
              <span className="player-rating">
                ({gameData?.blackPlayer?.rating || "?"})
              </span>
            </div>
          </div>

          <div className="board-wrapper">
            <Chessboard
              position={fen}
              boardOrientation="white"
              boardWidth={500}
              arePiecesDraggable={false}
              customBoardStyle={{
                borderRadius: "8px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            />
          </div>

          <div className="replay-controls">
            <button
              onClick={goToStart}
              className="control-btn"
              title="Go to start"
            >
              ⏮️
            </button>
            <button
              onClick={() => goToMove(currentMoveIndex - 1)}
              className="control-btn"
              disabled={currentMoveIndex < 0}
              title="Previous move"
            >
              ⏪
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`control-btn play-btn ${autoPlay ? "active" : ""}`}
              title={autoPlay ? "Pause" : "Play"}
            >
              {autoPlay ? "⏸️" : "▶️"}
            </button>
            <button
              onClick={() => goToMove(currentMoveIndex + 1)}
              className="control-btn"
              disabled={currentMoveIndex >= moves.length - 1}
              title="Next move"
            >
              ⏩
            </button>
            <button onClick={goToEnd} className="control-btn" title="Go to end">
              ⏭️
            </button>
            <select
              className="speed-select"
              value={autoPlaySpeed}
              onChange={(e) => setAutoPlaySpeed(parseInt(e.target.value))}
            >
              <option value={500}>0.5x</option>
              <option value={1000}>1x</option>
              <option value={1500}>1.5x</option>
              <option value={2000}>2x</option>
            </select>
          </div>

          <div className="move-info">
            <span className="move-counter">
              Move {currentMoveIndex + 1} of {moves.length}
            </span>
          </div>
        </div>

        <div className="moves-section">
          <h3>Move History</h3>
          <div className="moves-grid">
            {moves.map((move, index) => (
              <div
                key={index}
                className={`move-card ${currentMoveIndex === index ? "active" : ""}`}
                onClick={() => goToMove(index)}
              >
                <span className="move-number">{Math.floor(index / 2) + 1}</span>
                <span className="move-san">{move.san}</span>
              </div>
            ))}
          </div>

          <div className="game-metadata">
            <h4>Game Details</h4>
            <div className="metadata-item">
              <span className="label">Date:</span>
              <span className="value">
                {new Date(gameData?.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="metadata-item">
              <span className="label">Time Control:</span>
              <span className="value">
                {gameData?.timeControl?.untimed
                  ? "Untimed"
                  : `${gameData?.timeControl?.initial / 60}+${gameData?.timeControl?.increment}`}
              </span>
            </div>
            <div className="metadata-item">
              <span className="label">Views:</span>
              <span className="value">{gameData?.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameReplay;
