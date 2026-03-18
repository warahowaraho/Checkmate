import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useAuth } from "../context/AuthContext";
import "./Game.css";

function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [myColor, setMyColor] = useState(null);
  const [turn, setTurn] = useState("w");
  const [status, setStatus] = useState("Connecting...");
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [connected, setConnected] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [drawOffered, setDrawOffered] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);

  const socketRef = useRef(null);
  const username = user?.username || "Guest";

  useEffect(() => {
    const gameData = JSON.parse(localStorage.getItem("chessGame"));

    if (!gameData || gameData.gameId !== gameId) {
      navigate("/");
      return;
    }

    setMyColor(gameData.color);
    setStatus(`Playing as ${gameData.color === "w" ? "White" : "Black"}`);

    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      setConnected(true);

      const token = localStorage.getItem("token");
      if (token) {
        socketRef.current.emit("authenticate", token);
      }

      const oldSocketId = gameData.socketId;
      if (oldSocketId && oldSocketId !== socketRef.current.id) {
        socketRef.current.emit("rejoin-game", {
          gameId,
          playerId: oldSocketId,
        });
      }
    });

    socketRef.current.on(
      "game-state",
      ({
        fen: newFen,
        turn: newTurn,
        whiteTime: wTime,
        blackTime: bTime,
        moves,
      }) => {
        game.load(newFen);
        setFen(newFen);
        setTurn(newTurn);
        setWhiteTime(wTime || 600);
        setBlackTime(bTime || 600);
        setMoveHistory(moves || []);
        setStatus(newTurn === gameData.color ? "Your turn" : "Opponent's turn");
      },
    );

    socketRef.current.on(
      "move-made",
      ({
        fen: newFen,
        turn: newTurn,
        move,
        whiteTime: wTime,
        blackTime: bTime,
      }) => {
        game.load(newFen);
        setFen(newFen);
        setTurn(newTurn);
        setWhiteTime(wTime);
        setBlackTime(bTime);

        if (move) {
          setMoveHistory((prev) => [...prev, move]);
        }

        setSelectedSquare(null);
        setValidMoves([]);
        setStatus(newTurn === gameData.color ? "Your turn" : "Opponent's turn");
      },
    );

    socketRef.current.on(
      "time-update",
      ({ whiteTime: wTime, blackTime: bTime }) => {
        setWhiteTime(wTime);
        setBlackTime(bTime);
      },
    );

    socketRef.current.on("draw-offered", ({ from }) => {
      setDrawOffered(true);
    });

    socketRef.current.on("game-over", ({ result }) => {
      setGameOver(true);
      setResult(result);

      let message = "";
      if (result === "white") message = "White wins! 🏆";
      else if (result === "black") message = "Black wins! 🏆";
      else if (result === "draw") message = "Draw! 🤝";

      setStatus(message);
    });

    socketRef.current.on("opponent-left", () => {
      setStatus("Opponent disconnected");
      setGameOver(true);
    });

    socketRef.current.on("error", (msg) => {
      setStatus("Error: " + msg);
    });

    socketRef.current.on("disconnect", () => {
      setConnected(false);
      setStatus("Disconnected - trying to reconnect...");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [gameId, navigate, game]);

  const onSquareClick = (square) => {
    if (gameOver || !connected || turn !== myColor) return;

    const piece = game.get(square);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: "q",
        });

        if (move) {
          setFen(game.fen());
          setTurn(game.turn());
          setSelectedSquare(null);
          setValidMoves([]);

          setMoveHistory((prev) => [...prev, move.san]);

          socketRef.current.emit("move", {
            gameId,
            from: selectedSquare,
            to: square,
          });

          setStatus(`Move: ${move.san}`);
        } else {
          if (piece && piece.color === myColor) {
            setSelectedSquare(square);
            const moves = game.moves({ square, verbose: true });
            setValidMoves(moves.map((m) => m.to));
            setStatus(`Selected ${square}`);
          } else {
            setStatus("Invalid move!");
            setTimeout(() => {
              setStatus(turn === myColor ? "Your turn" : "Opponent's turn");
            }, 1500);
          }
        }
      } catch (error) {
        setStatus("Invalid move!");
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else if (piece && piece.color === myColor) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map((m) => m.to));
      setStatus(`Selected ${square}`);
    }
  };

  const offerDraw = () => {
    socketRef.current.emit("offer-draw", gameId);
    setDrawOffered(true);
    setStatus("Draw offered");
  };

  const acceptDraw = () => {
    socketRef.current.emit("accept-draw", gameId);
    setDrawOffered(false);
  };

  const declineDraw = () => {
    socketRef.current.emit("decline-draw", gameId);
    setDrawOffered(false);
    setStatus("Draw declined");
  };

  const resign = () => {
    if (window.confirm("Are you sure you want to resign?")) {
      socketRef.current.emit("resign", gameId);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === Infinity) return "∞";
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const customSquareStyles = {};

  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: "rgba(255, 255, 0, 0.4)",
      boxShadow: "inset 0 0 0 3px gold",
    };
  }

  validMoves.forEach((square) => {
    customSquareStyles[square] = {
      ...customSquareStyles[square],
      backgroundColor: "rgba(0, 255, 0, 0.2)",
      boxShadow: "inset 0 0 0 2px green",
    };
  });

  if (!myColor) {
    return <div className="game-container">Loading...</div>;
  }

  return (
    <div className="game-container">
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h2>Game Over</h2>
            <p className="game-over-result">
              {result === "white" && "White wins! 🏆"}
              {result === "black" && "Black wins! 🏆"}
              {result === "draw" && "Draw! 🤝"}
            </p>
            <div className="game-over-buttons">
              <button
                onClick={() => {
                  localStorage.removeItem("chessGame");
                  navigate("/");
                }}
                className="game-over-btn home-btn"
              >
                🏠 Home
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("chessGame");
                  window.location.reload();
                }}
                className="game-over-btn new-game-btn"
              >
                ♜ New Game
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-header">
        <div className="game-info-bar">
          <div className="player-time white">
            <span className="player-name">White</span>
            <span className="time">{formatTime(whiteTime)}</span>
            {myColor === "w" && <span className="you-indicator">(You)</span>}
          </div>

          <div className="game-status-indicator">
            <span
              className={`connection-dot ${connected ? "connected" : "disconnected"}`}
            ></span>
            <span className="status-text">{status}</span>
          </div>

          <div className="player-time black">
            <span className="player-name">Black</span>
            <span className="time">{formatTime(blackTime)}</span>
            {myColor === "b" && <span className="you-indicator">(You)</span>}
          </div>
        </div>

        <div className="game-controls">
          {!gameOver && turn === myColor && (
            <>
              <button
                className="draw-button"
                onClick={offerDraw}
                disabled={drawOffered}
              >
                Offer Draw
              </button>
              <button className="resign-button" onClick={resign}>
                Resign
              </button>
            </>
          )}

          {drawOffered && (
            <div className="draw-offer">
              <span>Draw offered</span>
              <button onClick={acceptDraw} className="accept-draw">
                ✓
              </button>
              <button onClick={declineDraw} className="decline-draw">
                ✗
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="board-container">
        <div className="board-wrapper">
          <Chessboard
            position={fen}
            onSquareClick={gameOver ? null : onSquareClick}
            boardOrientation={myColor === "w" ? "white" : "black"}
            boardWidth={500}
            arePiecesDraggable={false}
            customSquareStyles={customSquareStyles}
          />
        </div>

        <div className="move-history-panel">
          <h3>Move History</h3>
          <div className="moves-list">
            {moveHistory.length === 0 ? (
              <div className="no-moves">No moves yet</div>
            ) : (
              moveHistory.map((move, index) => (
                <div key={index} className="move-item">
                  <span className="move-number">
                    {Math.floor(index / 2) + 1}.{index % 2 === 0 ? " " : " "}
                  </span>
                  <span className="move-text">{move}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!gameOver && (
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to leave?")) {
              localStorage.removeItem("chessGame");
              navigate("/");
            }
          }}
          className="leave-button"
        >
          Leave Game
        </button>
      )}
    </div>
  );
}

export default Game;
