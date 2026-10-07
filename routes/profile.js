const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const Leaderboard = require('../models/Leaderboard');
const Battle = require('../models/Battle');

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

// Get full player profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const player = await Player.findById(req.playerId).select('-password');
    const leaderboard = await Leaderboard.findOne({ player_id: req.playerId });
    const rank = leaderboard 
      ? await Leaderboard.countDocuments({ rank_points: { $gt: leaderboard.rank_points } }) + 1
      : 0;

    const recentBattles = await Battle.find({
      $or: [
        { 'player1.player_id': req.playerId },
        { 'player2.player_id': req.playerId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      player,
      leaderboard,
      global_rank: rank,
      recent_battles: recentBattles
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get profile by username
router.get('/public/:username', async (req, res) => {
  try {
    const player = await Player.findOne({ username: req.params.username }).select('-password');
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const leaderboard = await Leaderboard.findOne({ player_id: player._id });
    const rank = leaderboard
      ? await Leaderboard.countDocuments({ rank_points: { $gt: leaderboard.rank_points } }) + 1
      : 0;

    const recentBattles = await Battle.find({
      $or: [
        { 'player1.player_id': player._id },
        { 'player2.player_id': player._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      player: {
        username: player.username,
        character: player.character,
        progression: player.progression,
        createdAt: player.createdAt
      },
      leaderboard,
      global_rank: rank,
      recent_battles: recentBattles.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile (avatar, character description, etc)
router.put('/', verifyToken, async (req, res) => {
  try {
    const { character } = req.body;
    const player = await Player.findById(req.playerId);

    if (character) {
      player.character = { ...player.character, ...character };
    }

    await player.save();
    res.json({ message: 'Profile updated', player });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
