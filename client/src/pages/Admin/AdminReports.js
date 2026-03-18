import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "./Admin.css";

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    // Mock data for now
    setTimeout(() => {
      setReports([
        {
          id: 1,
          type: "user",
          reporter: "player1",
          reported: "badplayer",
          reason: "Harassment in chat",
          status: "pending",
          date: new Date(),
        },
        {
          id: 2,
          type: "game",
          reporter: "chessmaster",
          reported: "Game #12345",
          reason: "Suspicious move patterns - possible cheating",
          status: "pending",
          date: new Date(),
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const resolveReport = (reportId) => {
    toast.success("Report resolved");
    setReports(reports.filter((r) => r.id !== reportId));
    setShowReportModal(false);
  };

  const dismissReport = (reportId) => {
    toast.success("Report dismissed");
    setReports(reports.filter((r) => r.id !== reportId));
    setShowReportModal(false);
  };

  const getReportIcon = (type) => {
    switch (type) {
      case "user":
        return "👤";
      case "game":
        return "🎮";
      default:
        return "🚨";
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">♜ Checkmate</span>
        </div>
        <div className="sidebar-menu">
          <Link to="/admin/dashboard" className="menu-item">
            📊 Dashboard
          </Link>
          <Link to="/admin/users" className="menu-item">
            👥 Users
          </Link>
          <Link to="/admin/games" className="menu-item">
            🎮 Games
          </Link>
          <Link to="/admin/tournaments" className="menu-item">
            🏆 Tournaments
          </Link>
          <Link to="/admin/reports" className="menu-item active">
            🚨 Reports
          </Link>
          <Link to="/admin/settings" className="menu-item">
            ⚙️ Settings
          </Link>
        </div>
      </div>

      <div className="admin-main">
        <div className="main-header">
          <h1>Reports & Moderation</h1>
          <div className="report-summary">
            <span className="pending-badge">{reports.length} Pending</span>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading reports...</div>
        ) : (
          <div className="reports-list">
            {reports.length === 0 ? (
              <div className="no-reports">
                <span className="no-reports-icon">✅</span>
                <h3>All Clear!</h3>
                <p>No pending reports at this time.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-icon">
                    {getReportIcon(report.type)}
                  </div>
                  <div className="report-content">
                    <div className="report-header">
                      <span className="report-type">{report.type}</span>
                      <span className="report-date">
                        {new Date(report.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="report-details">
                      <p>
                        <strong>Reporter:</strong> {report.reporter}
                      </p>
                      <p>
                        <strong>Reported:</strong> {report.reported}
                      </p>
                      <p>
                        <strong>Reason:</strong> {report.reason}
                      </p>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button
                      className="view-btn"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Report Review Modal */}
      {showReportModal && selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content report-modal">
            <div className="modal-header">
              <h2>Review Report</h2>
              <button onClick={() => setShowReportModal(false)}>✕</button>
            </div>

            <div className="report-details-full">
              <div className="detail-row">
                <label>Report Type:</label>
                <span className="report-type-badge">{selectedReport.type}</span>
              </div>
              <div className="detail-row">
                <label>Reporter:</label>
                <span>{selectedReport.reporter}</span>
              </div>
              <div className="detail-row">
                <label>Reported:</label>
                <span>{selectedReport.reported}</span>
              </div>
              <div className="detail-row">
                <label>Date:</label>
                <span>{new Date(selectedReport.date).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <label>Reason:</label>
                <div className="reason-box">{selectedReport.reason}</div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="action-btn approve"
                onClick={() => resolveReport(selectedReport.id)}
              >
                ✓ Take Action
              </button>
              <button
                className="action-btn dismiss"
                onClick={() => dismissReport(selectedReport.id)}
              >
                ✕ Dismiss Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;
