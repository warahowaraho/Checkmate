const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  joinCode: {
    type: String,
    unique: true,
    sparse: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  format: {
    type: String,
    enum: ['league', 'knockout'],
    default: 'league'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxPlayers: {
    type: Number,
    default: 16
  },
  minPlayers: {
    type: Number,
    default: 4
  },
  status: {
    type: String,
    enum: ['registering', 'in-progress', 'completed'],
    default: 'registering'
  },
  timeControl: {
    initial: Number,
    increment: Number,
    untimed: Boolean
  },
  rounds: [{
    roundNumber: Number,
    matches: [{
      white: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      black: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      whiteUsername: String,
      blackUsername: String,
      gameId: String,
      result: {
        type: String,
        enum: ['white', 'black', 'draw', 'pending'],
        default: 'pending'
      },
      completedAt: Date
    }]
  }],
  standings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 }
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winnerUsername: String,
  startedAt: Date,
  endedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

tournamentSchema.statics.generateJoinCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

module.exports = mongoose.model('Tournament', tournamentSchema);
