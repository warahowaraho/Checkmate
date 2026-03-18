import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Tournaments from "./pages/Tournaments";
import TournamentDetails from "./pages/TournamentDetails";
import LiveGames from "./pages/LiveGames";
import SpectateGame from "./pages/SpectateGame";
import GameReplay from "./pages/GameReplay";
import Friends from "./pages/Friends";
import Leaderboards from "./pages/Leaderboards";
import ChessBot from "./components/ChessBot";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminGames from "./pages/Admin/AdminGames";
import AdminTournaments from "./pages/Admin/AdminTournaments";
import AdminReports from "./pages/Admin/AdminReports";
import AdminSettings from "./pages/Admin/AdminSettings";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <div className="page-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/live-games" element={<LiveGames />} />
              <Route path="/spectate/:gameId" element={<SpectateGame />} />
              <Route path="/leaderboards" element={<Leaderboards />} />
              <Route path="/play-bot" element={<ChessBot />} />

              {/* Protected Routes (require authentication) */}
              <Route path="/game/:gameId" element={<Game />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/tournament/:id" element={<TournamentDetails />} />
              <Route path="/replay/:gameId" element={<GameReplay />} />
              <Route path="/friends" element={<Friends />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/games" element={<AdminGames />} />
              <Route path="/admin/tournaments" element={<AdminTournaments />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
              },
              success: {
                duration: 3000,
                icon: "✅",
                style: {
                  background: "#4CAF50",
                },
              },
              error: {
                duration: 4000,
                icon: "❌",
                style: {
                  background: "#f44336",
                },
              },
              loading: {
                duration: 5000,
                icon: "⏳",
              },
            }}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
