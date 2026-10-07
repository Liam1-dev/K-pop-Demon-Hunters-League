const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  player_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
    unique: true
  },
  username: String,
  rank_points: { type: Number, default: 0 },
  rank_tier: { type: String, default: 'Bronze' },
  season: { type: Number, default: 1 },
  seasonal_wins: { type: Number, default: 0 },
  seasonal_losses: { type: Number, default: 0 },
  seasonal_peak_rating: { type: Number, default: 0 },
  all_time_wins: { type: Number, default: 0 },
  all_time_losses: { type: Number, default: 0 },
  current_rank: { type: Number, default: 0 },
  win_streak: { type: Number, default: 0 },
  best_win_streak: { type: Number, default: 0 },
  last_match_timestamp: Date,
  updated_at: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast leaderboard queries
leaderboardSchema.index({ rank_points: -1, season: 1 });
leaderboardSchema.index({ seasonal_wins: -1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
