import React, { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./ChessBot.css";

function ChessBot() {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [playerColor, setPlayerColor] = useState("w");
  const [difficulty, setDifficulty] = useState(2);
  const [status, setStatus] = useState("Your turn");
  const [thinking, setThinking] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);

  const getBotMove = () => {
    if (game.game_over() || thinking) return;

    setThinking(true);
    setStatus("Bot thinking...");

    setTimeout(() => {
      const moves = game.moves({ verbose: true });

      if (moves.length === 0) {
        setThinking(false);
        return;
      }

      let selectedMove;

      if (difficulty === 1) {
        selectedMove = moves[Math.floor(Math.random() * moves.length)];
      } else if (difficulty === 2) {
        const captures = moves.filter((m) => m.flags.includes("c"));
        if (captures.length > 0 && Math.random() > 0.3) {
          selectedMove = captures[Math.floor(Math.random() * captures.length)];
        } else {
          selectedMove = moves[Math.floor(Math.random() * moves.length)];
        }
      } else {
        const captures = moves.filter((m) => m.flags.includes("c"));
        const checks = moves.filter((m) => {
          const testGame = new Chess(game.fen());
          testGame.move(m);
          return testGame.in_check();
        });

        const goodMoves = [...captures, ...checks];
        if (goodMoves.length > 0) {
          selectedMove =
            goodMoves[Math.floor(Math.random() * goodMoves.length)];
        } else {
          selectedMove = moves[Math.floor(Math.random() * moves.length)];
        }
      }

      if (selectedMove) {
        const move = game.move({
          from: selectedMove.from,
          to: selectedMove.to,
          promotion: "q",
        });

        if (move) {
          setFen(game.fen());
          setMoveHistory((prev) => [...prev, move.san]);
          setStatus("Your turn");
          checkGameOver();
        }
      }

      setThinking(false);
      setSelectedSquare(null);
      setValidMoves([]);
    }, difficulty * 300);
  };

  const onSquareClick = (square) => {
    if (thinking || gameOver || game.turn() !== playerColor) return;

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
          setMoveHistory((prev) => [...prev, move.san]);
          setSelectedSquare(null);
          setValidMoves([]);

          checkGameOver();

          if (!game.game_over() && !gameOver) {
            setTimeout(() => getBotMove(), 200);
          }
        } else {
          if (piece && piece.color === playerColor) {
            setSelectedSquare(square);
            const moves = game.moves({ square, verbose: true });
            setValidMoves(moves.map((m) => m.to));
          }
        }
      } catch (error) {
        console.error("Move error:", error);
      }
    } else if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map((m) => m.to));
    }
  };

  const checkGameOver = () => {
    if (game.game_over()) {
      setGameOver(true);

      if (game.in_checkmate()) {
        const winner = game.turn() === "w" ? "Black" : "White";
        setResult(winner);
        setStatus(`${winner} wins by checkmate!`);
      } else if (game.in_stalemate()) {
        setResult("draw");
        setStatus("Stalemate!");
      } else {
        setResult("draw");
        setStatus("Game over!");
      }
    }
  };

  const newGame = (color = "w") => {
    game.reset();
    setFen("start");
    setPlayerColor(color);
    setMoveHistory([]);
    setGameOver(false);
    setResult(null);
    setSelectedSquare(null);
    setValidMoves([]);
    setThinking(false);
    setStatus(color === "w" ? "Your turn" : "Bot thinking...");

    if (color === "b") {
      setTimeout(() => getBotMove(), 500);
    }
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

  return (
    <div className="bot-game-container">
      <div className="bot-header">
        <h1 className="bot-title">🤖 Play vs Computer</h1>
        <div className="bot-controls">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="difficulty-select"
          >
            <option value={1}>Beginner</option>
            <option value={2}>Casual</option>
            <option value={3}>Intermediate</option>
            <option value={4}>Advanced</option>
            <option value={5}>Expert</option>
          </select>
        </div>
      </div>

      <div className="bot-game-area">
        <div className="game-status-bar">
          <div className="player-indicator">
            <span
              className={`color-dot ${playerColor === "w" ? "white" : "black"}`}
            ></span>
            <span>You ({playerColor === "w" ? "White" : "Black"})</span>
          </div>
          <div className="status-text">
            {thinking && <span className="thinking-dot"></span>}
            {status}
          </div>
          <div className="bot-indicator">
            <span>🤖 Bot</span>
          </div>
        </div>

        <div className="bot-board-wrapper">
          <Chessboard
            position={fen}
            onSquareClick={onSquareClick}
            boardOrientation={playerColor === "w" ? "white" : "black"}
            boardWidth={Math.min(500, window.innerWidth - 40)}
            arePiecesDraggable={false}
            customSquareStyles={customSquareStyles}
          />
        </div>

        <div className="bot-side-panel">
          <div className="move-history">
            <h3>Move History</h3>
            <div className="moves-list">
              {moveHistory.length === 0 ? (
                <div className="no-moves">No moves yet</div>
              ) : (
                moveHistory.map((move, index) => (
                  <div key={index} className="move-item">
                    <span className="move-number">
                      {Math.floor(index / 2) + 1}.
                    </span>
                    <span className="move-text">{move}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bot-actions">
            <button className="new-game-btn" onClick={() => newGame("w")}>
              New Game (White)
            </button>
            <button className="new-game-btn black" onClick={() => newGame("b")}>
              New Game (Black)
            </button>
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="bot-game-over">
          <div className="bot-game-over-content">
            <h2>Game Over</h2>
            <p className="result">
              {result === "White" && "White wins! 🏆"}
              {result === "Black" && "Black wins! 🏆"}
              {result === "draw" && "Draw! 🤝"}
            </p>
            <button
              className="play-again-modal-btn"
              onClick={() => newGame(playerColor)}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChessBot;
