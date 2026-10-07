const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const { authMiddleware } = require('../middleware/auth');

// Get player profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const player = await Player.findById(req.playerId).select('-password');
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Save game progress
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { character, progression, settings } = req.body;
    const player = await Player.findById(req.playerId);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (character) player.character = { ...player.character, ...character };
    if (progression) player.progression = { ...player.progression, ...progression };
    if (settings) player.settings = { ...player.settings, ...settings };

    await player.save();
    res.json({ message: 'Progress saved successfully', player });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Get leaderboard (top players by rank/wins/gold)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const players = await Player.find({ 'ranking.is_banned': false })
      .select('username character.name character.level character.wins character.losses character.gold ranking.rank_points -password')
      .sort({ 'ranking.rank_points': -1, 'character.wins': -1, 'character.gold': -1 })
      .limit(limit);

    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get player statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const player = await Player.findById(req.playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const stats = {
      level: player.character.level,
      wins: player.character.wins,
      losses: player.character.losses,
      win_rate: player.character.losses > 0
        ? ((player.character.wins / (player.character.wins + player.character.losses)) * 100).toFixed(2) + '%'
        : '0%',
      rank_points: player.ranking.rank_points,
      bosses_defeated: (player.character.bosses_defeated || []).length,
      total_damage_dealt: player.progression.total_damage_dealt,
      total_damage_taken: player.progression.total_damage_taken,
      playtime_hours: ((player.character.playtime_seconds || 0) / 3600).toFixed(2)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Update character name
router.put('/character/name', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid character name' });
    }

    const player = await Player.findById(req.playerId);
    player.character.name = name.trim();
    await player.save();

    res.json({ message: 'Character name updated', character: player.character });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update character name' });
  }
});

module.exports = router;