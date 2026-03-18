import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";
import "./Friends.css";

function Friends() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("friends");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.emit("authenticate", token);

    newSocket.on("friend-request-received", () => {
      fetchFriendRequests();
      toast.success("New friend request received!");
    });

    fetchFriends();
    fetchFriendRequests();

    return () => {
      newSocket.close();
    };
  }, [user]);

  const fetchFriends = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(response.data.friends || []);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load friends");
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/friends/requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setFriendRequests(response.data);
    } catch (error) {
      console.error("Failed to load friend requests");
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/users/search?query=${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSearchResults(response.data);
    } catch (error) {
      toast.error("Search failed");
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/friends/request/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Friend request sent!");
      setSearchResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, requestSent: true } : u)),
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send request");
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/friends/accept/${requestId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Friend request accepted!");
      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/friends/decline/${requestId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Request declined");
      fetchFriendRequests();
    } catch (error) {
      toast.error("Failed to decline request");
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    try {
      await axios.post(
        `http://localhost:5000/api/friends/remove/${friendId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Friend removed");
      fetchFriends();
    } catch (error) {
      toast.error("Failed to remove friend");
    }
  };

  const challengeFriend = (friendId) => {
    navigate("/?challenge=" + friendId);
  };

  const getTimeSince = (date) => {
    const now = new Date();
    const lastSeen = new Date(date);
    const diffMinutes = Math.floor((now - lastSeen) / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h1 className="friends-title">👥 Friends</h1>
        <div className="friends-tabs">
          <button
            className={`tab-btn ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            My Friends ({friends.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Requests {friendRequests.length > 0 && `(${friendRequests.length})`}
          </button>
          <button
            className={`tab-btn ${activeTab === "search" ? "active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            Find Players
          </button>
        </div>
      </div>

      <div className="friends-content">
        {activeTab === "friends" && (
          <div className="friends-list">
            {loading ? (
              <div className="loading">Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="no-friends">
                <span className="no-friends-icon">👥</span>
                <h3>No friends yet</h3>
                <p>Go to the search tab to find players and add friends!</p>
                <button
                  onClick={() => setActiveTab("search")}
                  className="find-friends-btn"
                >
                  Find Players
                </button>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend._id} className="friend-card">
                  <div className="friend-avatar">
                    {friend.username.charAt(0).toUpperCase()}
                    <span
                      className={`online-indicator ${friend.online ? "online" : "offline"}`}
                    ></span>
                  </div>
                  <div className="friend-info">
                    <div className="friend-name">{friend.username}</div>
                    <div className="friend-status">
                      {friend.online ? (
                        <span className="online-text">● Online</span>
                      ) : (
                        <span className="offline-text">
                          ○ Last seen {getTimeSince(friend.lastSeen)}
                        </span>
                      )}
                    </div>
                    <div className="friend-rating">
                      Rating: {Math.round(friend.rating || 1200)}
                    </div>
                  </div>
                  <div className="friend-actions">
                    {friend.online && (
                      <button
                        className="challenge-btn"
                        onClick={() => challengeFriend(friend._id)}
                        title="Challenge to a game"
                      >
                        ⚔️
                      </button>
                    )}
                    <button
                      className="remove-btn"
                      onClick={() => removeFriend(friend._id)}
                      title="Remove friend"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="requests-list">
            {friendRequests.length === 0 ? (
              <div className="no-requests">
                <span className="no-requests-icon">📭</span>
                <h3>No pending requests</h3>
                <p>
                  When someone sends you a friend request, it will appear here.
                </p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-avatar">
                    {request.from?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="request-info">
                    <div className="request-name">
                      {request.from?.username || "Unknown"}
                    </div>
                    <div className="request-rating">
                      Rating: {Math.round(request.from?.rating || 1200)}
                    </div>
                  </div>
                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => acceptRequest(request._id)}
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="decline-btn"
                      onClick={() => declineRequest(request._id)}
                    >
                      ✗ Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "search" && (
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search for players by username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="search-results">
              {searchResults.length === 0 ? (
                searchQuery ? (
                  <div className="no-results">
                    <p>No players found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="search-hint">
                    <span className="hint-icon">👆</span>
                    <p>Type a username to find players</p>
                  </div>
                )
              ) : (
                searchResults.map((result) => (
                  <div key={result._id} className="search-result-card">
                    <div className="result-avatar">
                      {result.username.charAt(0).toUpperCase()}
                      <span
                        className={`online-indicator ${result.online ? "online" : "offline"}`}
                      ></span>
                    </div>
                    <div className="result-info">
                      <div className="result-name">{result.username}</div>
                      <div className="result-status">
                        {result.online ? (
                          <span className="online-text">● Online</span>
                        ) : (
                          <span className="offline-text">○ Offline</span>
                        )}
                      </div>
                      <div className="result-rating">
                        Rating: {Math.round(result.rating || 1200)}
                      </div>
                    </div>
                    <div className="result-actions">
                      {result.requestSent ? (
                        <span className="request-sent">Request Sent</span>
                      ) : (
                        <button
                          className="add-friend-btn"
                          onClick={() => sendFriendRequest(result._id)}
                        >
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;
