const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Chess } = require("chess.js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const compression = require("compression");
const helmet = require("helmet");
require("dotenv").config();

const auth = require("./middleware/auth");
const User = require("./models/User");
const Game = require("./models/Game");
const Tournament = require("./models/Tournament");
const Admin = require("./models/Admin");
const adminRoutes = require("./routes/admin");

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
app.use(compression());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Handle preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/checkmate";
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

const activeGames = new Map();
const waitingPlayers = [];
const onlineUsers = new Map();
const challenges = new Map();

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Email connection error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const sendVerificationEmail = async (email, token, username) => {
  const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const verificationUrl = `${baseUrl}/api/verify/${token}`;

  const mailOptions = {
    from: `"Checkmate Chess" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Checkmate Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea; font-size: 2.5rem;">♜ Checkmate</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${username}! 🎉</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thanks for signing up! Please verify your email address to start playing chess.
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; text-decoration: none; border-radius: 50px; font-size: 1.1rem; font-weight: bold;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              ✅ Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            Or copy and paste this link in your browser:
          </p>
          
          <div style="background: #f5f5f5; padding: 12px; border-radius: 5px; margin-bottom: 25px;">
            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
          </div>
          
          <p style="color: #999; font-size: 0.9rem; margin-bottom: 5px;">
            ⏰ This link will expire in 24 hours.
          </p>
          
          <p style="color: #999; font-size: 0.9rem;">
            🤝 If you didn't create an account, you can ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8rem;">
          <p>© 2025 Checkmate Chess. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};

// Admin routes
app.use("/api/admin", adminRoutes);

// ========== AUTH ROUTES ==========
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      verified: false,
      verificationToken,
      verificationExpires,
    });

    await user.save();
    await sendVerificationEmail(email, verificationToken, username);

    res.json({
      message:
        "Registration successful! Please check your email to verify your account.",
      requiresVerification: true,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
              h1 { color: #f44336; }
              a { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Verification Failed</h1>
              <p>The verification link is invalid or has expired.</p>
              <p>Please try registering again.</p>
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/register">Register Again</a>
            </div>
          </body>
        </html>
      `);
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.send(`
      <html>
        <head>
          <title>Email Verified!</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            h1 { color: #4CAF50; }
            a { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .checkmark { font-size: 5rem; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✅</div>
            <h1>Email Verified Successfully!</h1>
            <p>Your account has been verified. You can now log in and play chess.</p>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login">Go to Login</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).send("Server error during verification");
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (!user.verified) {
      return res.status(403).json({
        error: "Please verify your email before logging in",
        needsVerification: true,
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    user.online = true;
    await user.save();

    res.json({
      token,
      username: user.username,
      rating: user.rating,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      userId: user._id,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password -verificationToken -verificationExpires")
      .populate("friends", "username rating online lastSeen")
      .populate("friendRequests.from", "username rating online");

    res.json(user);
  } catch (error) {
    console.error("❌ Profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== FRIEND ROUTES ==========
app.post("/api/friends/request/:userId", auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) return res.status(404).json({ error: "User not found" });
    if (targetUser._id.toString() === req.userId)
      return res.status(400).json({ error: "Cannot add yourself" });
    if (targetUser.friends.includes(req.userId))
      return res.status(400).json({ error: "Already friends" });

    const existingRequest = targetUser.friendRequests.find(
      (r) => r.from.toString() === req.userId && r.status === "pending",
    );
    if (existingRequest)
      return res.status(400).json({ error: "Request already sent" });

    targetUser.friendRequests.push({
      from: req.userId,
      username: req.username,
      status: "pending",
    });

    await targetUser.save();

    const targetSocketId = onlineUsers.get(targetUser._id.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit("friend-request-received", {
        _id: targetUser.friendRequests[targetUser.friendRequests.length - 1]
          ._id,
        from: { username: req.username },
      });
    }

    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("❌ Friend request error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/friends/accept/:requestId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const request = user.friendRequests.id(req.params.requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    request.status = "accepted";
    user.friends.push(request.from);
    await user.save();

    const friend = await User.findById(request.from);
    friend.friends.push(req.userId);
    await friend.save();

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("❌ Accept friend error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/friends/decline/:requestId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.friendRequests = user.friendRequests.filter(
      (r) => r._id.toString() !== req.params.requestId,
    );
    await user.save();
    res.json({ message: "Friend request declined" });
  } catch (error) {
    console.error("❌ Decline friend error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/friends/remove/:friendId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friend = await User.findById(req.params.friendId);

    if (!friend) return res.status(404).json({ error: "Friend not found" });

    user.friends = user.friends.filter(
      (f) => f.toString() !== req.params.friendId,
    );
    friend.friends = friend.friends.filter((f) => f.toString() !== req.userId);

    await user.save();
    await friend.save();

    res.json({ message: "Friend removed" });
  } catch (error) {
    console.error("❌ Remove friend error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: req.userId },
    })
      .select("username rating online lastSeen")
      .limit(10);
    res.json(users);
  } catch (error) {
    console.error("❌ Search users error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/friends/requests", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate(
      "friendRequests.from",
      "username rating online",
    );
    const pendingRequests = user.friendRequests.filter(
      (r) => r.status === "pending",
    );
    res.json(pendingRequests);
  } catch (error) {
    console.error("❌ Get requests error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== CHALLENGE ROUTES ==========
app.post("/api/challenge/send", auth, async (req, res) => {
  try {
    const { friendId, timeControl } = req.body;
    const friend = await User.findById(friendId);

    if (!friend) return res.status(404).json({ error: "Friend not found" });
    if (!friend.online)
      return res.status(400).json({ error: "Friend is offline" });

    const challenge = {
      id: new mongoose.Types.ObjectId(),
      from: req.userId,
      fromUsername: req.username,
      timeControl,
      expiresAt: new Date(Date.now() + 60000),
    };

    challenges.set(friendId, challenge);

    const friendSocketId = onlineUsers.get(friendId);
    if (friendSocketId)
      io.to(friendSocketId).emit("challenge-received", challenge);

    res.json({ message: "Challenge sent!" });
  } catch (error) {
    console.error("❌ Challenge error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/challenge/accept/:challengeId", auth, async (req, res) => {
  try {
    const challenge = challenges.get(req.userId);
    if (!challenge || challenge.id.toString() !== req.params.challengeId) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    if (challenge.expiresAt < new Date()) {
      challenges.delete(req.userId);
      return res.status(400).json({ error: "Challenge expired" });
    }

    const gameId = `game-${Date.now()}`;

    const challengerSocketId = onlineUsers.get(challenge.from);
    if (challengerSocketId) {
      io.to(challengerSocketId).emit("challenge-accepted", {
        gameId,
        opponent: req.username,
      });
    }
    io.to(req.userId).emit("challenge-accepted", {
      gameId,
      opponent: challenge.fromUsername,
    });

    challenges.delete(req.userId);
    res.json({ gameId });
  } catch (error) {
    console.error("❌ Accept challenge error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/challenge/decline/:challengeId", auth, async (req, res) => {
  try {
    const challenge = challenges.get(req.userId);
    if (challenge && challenge.id.toString() === req.params.challengeId) {
      challenges.delete(req.userId);
      const challengerSocketId = onlineUsers.get(challenge.from);
      if (challengerSocketId)
        io.to(challengerSocketId).emit("challenge-declined", {
          username: req.username,
        });
    }
    res.json({ message: "Challenge declined" });
  } catch (error) {
    console.error("❌ Decline challenge error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== GAME REPLAY ROUTES ==========
app.get("/api/user/games/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const games = await Game.find({
      $or: [{ whitePlayer: userId }, { blackPlayer: userId }],
      result: { $ne: "ongoing" },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("whitePlayer", "username rating")
      .populate("blackPlayer", "username rating");

    const total = await Game.countDocuments({
      $or: [{ whitePlayer: userId }, { blackPlayer: userId }],
      result: { $ne: "ongoing" },
    });

    res.json({
      games,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Get user games error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/game/:gameId", async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId })
      .populate("whitePlayer", "username rating")
      .populate("blackPlayer", "username rating");

    if (!game) return res.status(404).json({ error: "Game not found" });

    game.views += 1;
    await game.save();

    res.json(game);
  } catch (error) {
    console.error("❌ Get game error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/game/:gameId/pgn", async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    if (!game) return res.status(404).json({ error: "Game not found" });

    const pgn = game.generatePGN();

    res.setHeader("Content-Type", "application/x-chess-pgn");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${game.gameId}.pgn"`,
    );
    res.send(pgn);
  } catch (error) {
    console.error("❌ PGN download error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== TOURNAMENT ROUTES ==========
app.post("/api/tournaments", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      format,
      maxPlayers,
      minPlayers,
      timeControl,
      isPrivate,
    } = req.body;

    let joinCode = null;
    if (isPrivate) {
      let newCode;
      let existing;
      do {
        newCode = Tournament.generateJoinCode();
        existing = await Tournament.findOne({ joinCode: newCode });
      } while (existing);
      joinCode = newCode;
    }

    const tournament = new Tournament({
      name,
      description,
      joinCode,
      createdBy: req.userId,
      format: format || "league",
      isPrivate: isPrivate || false,
      maxPlayers: maxPlayers || 16,
      minPlayers: minPlayers || 4,
      timeControl,
      players: [
        { user: req.userId, username: req.username, joinedAt: new Date() },
      ],
    });

    await tournament.save();
    res.json(tournament);
  } catch (error) {
    console.error("❌ Tournament creation error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(tournaments);
  } catch (error) {
    console.error("❌ Get tournaments error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tournaments/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate("createdBy", "username")
      .populate("players.user", "username rating")
      .populate("winner", "username");
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tournaments/:id/join", auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament)
      return res.status(404).json({ error: "Tournament not found" });
    if (tournament.status !== "registering")
      return res.status(400).json({ error: "Tournament already started" });
    if (tournament.players.length >= tournament.maxPlayers)
      return res.status(400).json({ error: "Tournament is full" });
    if (tournament.players.some((p) => p.user.toString() === req.userId))
      return res.status(400).json({ error: "Already joined" });

    tournament.players.push({
      user: req.userId,
      username: req.username,
      joinedAt: new Date(),
    });
    await tournament.save();
    res.json(tournament);
  } catch (error) {
    console.error("❌ Join tournament error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tournaments/join-with-code", auth, async (req, res) => {
  try {
    const { joinCode } = req.body;
    const tournament = await Tournament.findOne({
      joinCode: joinCode.toUpperCase(),
    });

    if (!tournament)
      return res.status(404).json({ error: "Invalid tournament code" });
    if (tournament.status !== "registering")
      return res.status(400).json({ error: "Tournament already started" });
    if (tournament.players.length >= tournament.maxPlayers)
      return res.status(400).json({ error: "Tournament is full" });
    if (tournament.players.some((p) => p.user.toString() === req.userId))
      return res.status(400).json({ error: "Already joined" });

    tournament.players.push({
      user: req.userId,
      username: req.username,
      joinedAt: new Date(),
    });
    await tournament.save();
    res.json({
      message: "Joined tournament successfully",
      tournamentId: tournament._id,
    });
  } catch (error) {
    console.error("❌ Join with code error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tournaments/:id/start", auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament)
      return res.status(404).json({ error: "Tournament not found" });
    if (tournament.createdBy.toString() !== req.userId)
      return res.status(403).json({ error: "Only creator can start" });
    if (tournament.players.length < tournament.minPlayers)
      return res
        .status(400)
        .json({ error: `Need ${tournament.minPlayers} players` });
    if (tournament.status !== "registering")
      return res.status(400).json({ error: "Tournament already started" });

    const players = tournament.players.map((p) => p.user.toString());

    if (tournament.format === "league") {
      const rounds = [];
      if (players.length % 2 === 1) players.push("BYE");
      const numRounds = players.length - 1;
      const half = players.length / 2;

      for (let round = 0; round < numRounds; round++) {
        const matches = [];
        for (let i = 0; i < half; i++) {
          const white = players[i];
          const black = players[players.length - 1 - i];
          if (white !== "BYE" && black !== "BYE") {
            matches.push({
              white,
              black,
              whiteUsername: tournament.players.find(
                (p) => p.user.toString() === white,
              ).username,
              blackUsername: tournament.players.find(
                (p) => p.user.toString() === black,
              ).username,
              result: "pending",
            });
          }
        }
        rounds.push({ roundNumber: round + 1, matches });
        players.splice(1, 0, players.pop());
      }
      tournament.rounds = rounds;
    } else {
      const rounds = [];
      let currentPlayers = [...tournament.players];
      let roundNum = 1;

      while (currentPlayers.length > 1) {
        const matches = [];
        for (let i = 0; i < currentPlayers.length; i += 2) {
          if (i + 1 < currentPlayers.length) {
            matches.push({
              white: currentPlayers[i].user,
              black: currentPlayers[i + 1].user,
              whiteUsername: currentPlayers[i].username,
              blackUsername: currentPlayers[i + 1].username,
              result: "pending",
            });
          }
        }
        rounds.push({ roundNumber: roundNum++, matches });
        currentPlayers = [];
      }
      tournament.rounds = rounds;
    }

    tournament.status = "in-progress";
    tournament.startedAt = new Date();
    await tournament.save();
    res.json(tournament);
  } catch (error) {
    console.error("❌ Start tournament error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== SOCKET.IO GAME LOGIC ==========
io.on("connection", (socket) => {
  console.log("✅ Player connected:", socket.id);
  let currentUserId = null;

  socket.on("authenticate", async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.userId;
      await User.findByIdAndUpdate(currentUserId, {
        online: true,
        lastSeen: new Date(),
      });
      onlineUsers.set(socket.id, currentUserId);
      socket.emit("authenticated");
    } catch (error) {
      console.error("❌ Socket authentication error:", error);
    }
  });

  socket.on("find-game", async (data) => {
    if (!data || !data.token) {
      socket.emit("error", "Please login first");
      return;
    }

    try {
      const decoded = jwt.verify(data.token, JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.verified) {
        socket.emit("error", "Please verify your email before playing");
        return;
      }

      const timeControl = data.timeControl || {
        initial: 600,
        increment: 2,
        untimed: false,
      };

      if (waitingPlayers.length > 0) {
        const opponent = waitingPlayers.shift();
        const gameId = `game-${Date.now()}`;

        const game = {
          id: gameId,
          players: {
            [opponent.socketId]: {
              color: "w",
              userId: opponent.userId,
              username: opponent.username,
              socketId: opponent.socketId,
            },
            [socket.id]: {
              color: "b",
              userId: decoded.userId,
              username: decoded.username,
              socketId: socket.id,
            },
          },
          whitePlayer: opponent.userId,
          blackPlayer: decoded.userId,
          whiteUsername: opponent.username,
          blackUsername: decoded.username,
          chess: new Chess(),
          currentTurn: "w",
          timeControl,
          lastMoveTime: Date.now(),
          moves: [],
          whiteTime: timeControl.untimed ? Infinity : timeControl.initial,
          blackTime: timeControl.untimed ? Infinity : timeControl.initial,
          spectators: new Set(),
        };

        activeGames.set(gameId, game);

        opponent.socket.join(gameId);
        socket.join(gameId);

        io.to(opponent.socketId).emit("game-found", { gameId, color: "w" });
        io.to(socket.id).emit("game-found", { gameId, color: "b" });
      } else {
        waitingPlayers.push({
          socketId: socket.id,
          userId: decoded.userId,
          username: decoded.username,
          socket: socket,
        });
        socket.emit("waiting");
      }
    } catch (error) {
      socket.emit("error", "Invalid token");
    }
  });

  socket.on("spectate-game", ({ gameId }) => {
    const game = activeGames.get(gameId);
    if (!game) {
      socket.emit("error", "Game not found");
      return;
    }
    socket.join(gameId);
    game.spectators.add(socket.id);
    socket.emit("game-state", {
      fen: game.chess.fen(),
      turn: game.currentTurn,
      whiteTime: game.whiteTime,
      blackTime: game.blackTime,
      moves: game.moves.map((m) => m.san),
      whiteUsername: game.whiteUsername,
      blackUsername: game.blackUsername,
      isSpectator: true,
    });
  });

  socket.on("get-active-games", () => {
    const gamesList = [];
    activeGames.forEach((game, gameId) => {
      gamesList.push({
        gameId,
        whiteUsername: game.whiteUsername,
        blackUsername: game.blackUsername,
        timeControl: game.timeControl,
        startedAt: game.lastMoveTime,
      });
    });
    socket.emit("active-games-list", gamesList);
  });

  socket.on("move", ({ gameId, from, to }) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    const player = game.players[socket.id];
    if (!player || game.currentTurn !== player.color) return;

    try {
      const move = game.chess.move({ from, to, promotion: "q" });

      if (move) {
        game.moves.push({
          from,
          to,
          san: move.san,
          fen: game.chess.fen(),
          time: new Date(),
        });

        if (!game.timeControl.untimed) {
          const now = Date.now();
          const timeSpent = now - game.lastMoveTime;
          if (game.currentTurn === "w") {
            game.whiteTime = Math.max(
              0,
              game.whiteTime - timeSpent + game.timeControl.increment,
            );
          } else {
            game.blackTime = Math.max(
              0,
              game.blackTime - timeSpent + game.timeControl.increment,
            );
          }
        }

        game.currentTurn = game.currentTurn === "w" ? "b" : "w";
        game.lastMoveTime = Date.now();

        io.to(gameId).emit("move-made", {
          fen: game.chess.fen(),
          turn: game.currentTurn,
          move: move.san,
          whiteTime: game.whiteTime,
          blackTime: game.blackTime,
        });

        if (game.chess.isGameOver()) {
          let result = "draw";
          if (game.chess.isCheckmate()) result = player.color;
          io.to(gameId).emit("game-over", { result });

          const dbGame = new Game({
            gameId: game.id,
            whitePlayer: game.whitePlayer,
            blackPlayer: game.blackPlayer,
            whiteUsername: game.whiteUsername,
            blackUsername: game.blackUsername,
            moves: game.moves,
            result,
            timeControl: game.timeControl,
            whiteTimeRemaining: game.whiteTime,
            blackTimeRemaining: game.blackTime,
            endTime: new Date(),
          });
          dbGame.save();

          setTimeout(() => activeGames.delete(game.id), 5000);
        }
      }
    } catch (error) {
      console.log("❌ Move error:", error);
    }
  });

  socket.on("send-message", ({ gameId, message }) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    const player = game.players[socket.id];
    const isSpectator = game.spectators?.has(socket.id);

    io.to(gameId).emit("new-message", {
      id: Date.now(),
      from: player ? player.username : "Spectator",
      color: player ? player.color : "spectator",
      message: message.substring(0, 200),
      timestamp: new Date().toISOString(),
      isSpectator: !!isSpectator,
    });
  });

  socket.on("offer-draw", (gameId) => {
    socket.to(gameId).emit("draw-offered", { from: socket.id });
  });

  socket.on("accept-draw", async (gameId) => {
    const game = activeGames.get(gameId);
    if (game) {
      io.to(gameId).emit("game-over", { result: "draw" });
      setTimeout(() => activeGames.delete(gameId), 5000);
    }
  });

  socket.on("resign", async (gameId) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    const player = game.players[socket.id];
    if (!player) return;
    const winner = player.color === "w" ? "black" : "white";
    io.to(gameId).emit("game-over", { result: winner });
    setTimeout(() => activeGames.delete(gameId), 5000);
  });

  socket.on("disconnect", async () => {
    if (currentUserId) {
      await User.findByIdAndUpdate(currentUserId, {
        online: false,
        lastSeen: new Date(),
      });
      onlineUsers.delete(socket.id);
    }

    const index = waitingPlayers.findIndex((p) => p.socketId === socket.id);
    if (index !== -1) waitingPlayers.splice(index, 1);

    for (const [gameId, game] of activeGames.entries()) {
      if (game.players[socket.id]) {
        io.to(gameId).emit("opponent-left");
        setTimeout(() => activeGames.delete(gameId), 30000);
        break;
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 CHECKMATE SERVER RUNNING");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("✅ MongoDB Connected");
  console.log("✅ Email verification ready");
  console.log("✅ Security middleware enabled");
  console.log("✅ Compression enabled");
  console.log("=".repeat(60) + "\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Closing server...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Closing server...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });
});
