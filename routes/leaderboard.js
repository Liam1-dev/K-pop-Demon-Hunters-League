const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/Leaderboard');
const Player = require('../models/Player');
const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.playerId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get global leaderboard
router.get('/global', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const leaderboard = await Leaderboard.find()
      .sort({ rank_points: -1, seasonal_wins: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await Leaderboard.countDocuments();

    res.json({
      leaderboard: leaderboard.map((entry, idx) => ({
        rank: skip + idx + 1,
        username: entry.username,
        rank_points: entry.rank_points,
        rank_tier: entry.rank_tier,
        seasonal_wins: entry.seasonal_wins,
        seasonal_losses: entry.seasonal_losses,
        win_rate: entry.seasonal_losses > 0
          ? ((entry.seasonal_wins / (entry.seasonal_wins + entry.seasonal_losses)) * 100).toFixed(1) + '%'
          : '0%'
      })),
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get player rank position
router.get('/rank/:username', async (req, res) => {
  try {
    const entry = await Leaderboard.findOne({ username: req.params.username });
    if (!entry) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const rank = await Leaderboard.countDocuments({
      rank_points: { $gt: entry.rank_points }
    }) + 1;

    res.json({
      username: entry.username,
      rank,
      rank_points: entry.rank_points,
      rank_tier: entry.rank_tier,
      seasonal_wins: entry.seasonal_wins,
      seasonal_losses: entry.seasonal_losses
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

// Get player stats
router.get('/player-stats', verifyToken, async (req, res) => {
  try {
    const leaderboard = await Leaderboard.findOne({ player_id: req.playerId });
    if (!leaderboard) {
      return res.status(404).json({ error: 'Player stats not found' });
    }

    const rank = await Leaderboard.countDocuments({
      rank_points: { $gt: leaderboard.rank_points }
    }) + 1;

    res.json({
      rank,
      rank_points: leaderboard.rank_points,
      rank_tier: leaderboard.rank_tier,
      seasonal_wins: leaderboard.seasonal_wins,
      seasonal_losses: leaderboard.seasonal_losses,
      seasonal_peak_rating: leaderboard.seasonal_peak_rating,
      all_time_wins: leaderboard.all_time_wins,
      all_time_losses: leaderboard.all_time_losses,
      win_streak: leaderboard.win_streak,
      best_win_streak: leaderboard.best_win_streak
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Update stats after battle
router.post('/update-after-battle', verifyToken, async (req, res) => {
  try {
    const { winner, rating_change, opponent_username } = req.body;
    const player = await Player.findById(req.playerId);
    let leaderboard = await Leaderboard.findOne({ player_id: req.playerId });

    if (!leaderboard) {
      leaderboard = new Leaderboard({
        player_id: req.playerId,
        username: player.username,
        rank_points: 0
      });
    }

    if (winner === 'player') {
      leaderboard.seasonal_wins += 1;
      leaderboard.all_time_wins += 1;
      leaderboard.rank_points += rating_change || 20;
      leaderboard.win_streak += 1;
      if (leaderboard.win_streak > leaderboard.best_win_streak) {
        leaderboard.best_win_streak = leaderboard.win_streak;
      }
    } else {
      leaderboard.seasonal_losses += 1;
      leaderboard.all_time_losses += 1;
      leaderboard.rank_points = Math.max(0, leaderboard.rank_points + (rating_change || -10));
      leaderboard.win_streak = 0;
    }

    leaderboard.seasonal_peak_rating = Math.max(
      leaderboard.seasonal_peak_rating,
      leaderboard.rank_points
    );
    leaderboard.last_match_timestamp = new Date();

    // Assign tier based on rank points
    if (leaderboard.rank_points >= 2000) leaderboard.rank_tier = 'Diamond';
    else if (leaderboard.rank_points >= 1500) leaderboard.rank_tier = 'Platinum';
    else if (leaderboard.rank_points >= 1000) leaderboard.rank_tier = 'Gold';
    else if (leaderboard.rank_points >= 500) leaderboard.rank_tier = 'Silver';
    else leaderboard.rank_tier = 'Bronze';

    await leaderboard.save();

    res.json({ message: 'Stats updated', leaderboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

module.exports = router;
