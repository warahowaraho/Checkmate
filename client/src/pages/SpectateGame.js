import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./SpectateGame.css";

function SpectateGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [turn, setTurn] = useState("w");
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteUsername, setWhiteUsername] = useState("White");
  const [blackUsername, setBlackUsername] = useState("Black");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Connecting to game...");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current.emit("spectate-game", { gameId });
    });

    socketRef.current.on("game-state", (data) => {
      game.load(data.fen);
      setFen(data.fen);
      setTurn(data.turn);
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
      setMoveHistory(data.moves || []);
      setWhiteUsername(data.whiteUsername || "White");
      setBlackUsername(data.blackUsername || "Black");
      setStatus(`Spectating: ${data.whiteUsername} vs ${data.blackUsername}`);
    });

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
        setMoveHistory((prev) => [...prev, move]);
      },
    );

    socketRef.current.on("new-message", (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on("game-over", ({ result }) => {
      let message = "";
      if (result === "white") message = "White wins!";
      else if (result === "black") message = "Black wins!";
      else if (result === "draw") message = "Draw!";
      setStatus(`Game Over - ${message}`);
    });

    socketRef.current.on("opponent-left", () => {
      setStatus("Game ended - player disconnected");
    });

    socketRef.current.on("error", (msg) => {
      setStatus("Error: " + msg);
    });

    socketRef.current.on("disconnect", () => {
      setConnected(false);
      setStatus("Disconnected from server");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [gameId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    socketRef.current.emit("send-message", {
      gameId,
      message: inputMessage.trim(),
    });

    setInputMessage("");
  };

  const formatTime = (seconds) => {
    if (seconds === Infinity) return "∞";
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="spectate-container">
      <div className="spectate-header">
        <button className="back-btn" onClick={() => navigate("/live-games")}>
          ← Back to Live Games
        </button>
        <div className="spectate-badge">👁️ SPECTATOR MODE</div>
      </div>

      <div className="spectate-content">
        <div className="game-section">
          <div className="player-info-bar">
            <div className="player-info white">
              <span className="player-name">{whiteUsername}</span>
              <span className="player-time">{formatTime(whiteTime)}</span>
            </div>
            <div className="game-status">
              <span
                className={`connection-dot ${connected ? "connected" : "disconnected"}`}
              ></span>
              <span>{status}</span>
            </div>
            <div className="player-info black">
              <span className="player-name">{blackUsername}</span>
              <span className="player-time">{formatTime(blackTime)}</span>
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

          <div className="move-history">
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

        <div className="chat-section">
          <div className="chat-header">
            <h3>Spectator Chat</h3>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.isSpectator ? "spectator" : ""}`}
              >
                <div className="message-header">
                  <span
                    className="message-sender"
                    style={{
                      color:
                        msg.color === "w"
                          ? "#000"
                          : msg.color === "b"
                            ? "#fff"
                            : "#667eea",
                      backgroundColor:
                        msg.color === "w"
                          ? "#f0d9b5"
                          : msg.color === "b"
                            ? "#b58863"
                            : "#e0e0e0",
                    }}
                  >
                    {msg.from} {msg.isSpectator && "👁️"}
                  </span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="message-body">{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="chat-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Chat as spectator..."
              className="chat-input"
              maxLength={200}
            />
            <button type="submit" className="chat-send-btn">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SpectateGame;
