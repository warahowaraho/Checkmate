const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  whitePlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blackPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  whiteUsername: String,
  blackUsername: String,
  moves: [{
    from: String,
    to: String,
    san: String,
    fen: String,
    time: Date
  }],
  result: {
    type: String,
    enum: ['white', 'black', 'draw', 'ongoing'],
    default: 'ongoing'
  },
  endTime: Date,
  timeControl: {
    initial: Number,
    increment: Number,
    untimed: Boolean
  },
  whiteTimeRemaining: Number,
  blackTimeRemaining: Number,
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

gameSchema.methods.generatePGN = function() {
  let pgn = '';
  pgn += `[Event "Checkmate Game"]\n`;
  pgn += `[Site "Online"]\n`;
  pgn += `[Date "${new Date(this.createdAt).toISOString().split('T')[0]}"]\n`;
  pgn += `[White "${this.whiteUsername}"]\n`;
  pgn += `[Black "${this.blackUsername}"]\n`;
  pgn += `[Result "${this.result === 'white' ? '1-0' : this.result === 'black' ? '0-1' : '1/2-1/2'}"]\n`;
  
  let moveText = '';
  this.moves.forEach((move, index) => {
    if (index % 2 === 0) moveText += `${Math.floor(index/2) + 1}. `;
    moveText += `${move.san} `;
  });
  moveText += this.result === 'white' ? '1-0' : this.result === 'black' ? '0-1' : '1/2-1/2';
  
  return pgn + moveText;
};

module.exports = mongoose.model('Game', gameSchema);
