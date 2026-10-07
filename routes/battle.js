const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Battle = require('../models/Battle');
const Player = require('../models/Player');

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

// Create PvE/Boss battle
router.post('/create-boss-battle', verifyToken, async (req, res) => {
  try {
    const { boss_name, boss_archetype, map_name, boss_hp, boss_attack } = req.body;
    const player = await Player.findById(req.playerId);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const battle = new Battle({
      battle_id: uuidv4(),
      type: 'boss',
      status: 'active',
      player1: {
        player_id: player._id,
        username: player.username,
        character_name: player.character.name,
        initial_hp: player.character.hp
      },
      boss: {
        name: boss_name,
        archetype: boss_archetype,
        map: map_name,
        initial_hp: boss_hp,
        final_hp: boss_hp
      },
      started_at: new Date()
    });

    await battle.save();

    res.json({
      message: 'Boss battle created',
      battle_id: battle.battle_id,
      battle
    });
  } catch (error) {
    console.error('Battle creation error:', error);
    res.status(500).json({ error: 'Failed to create battle' });
  }
});

// End battle and save results
router.post('/end-battle', verifyToken, async (req, res) => {
  try {
    const { battle_id, winner, rewards, final_player_hp, final_boss_hp } = req.body;
    const battle = await Battle.findOne({ battle_id });

    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    battle.status = 'completed';
    battle.winner = winner;
    battle.loser = winner === 'player' ? 'boss' : 'player';
    battle.rewards = rewards || {};
    battle.player1.final_hp = final_player_hp;
    battle.boss.final_hp = final_boss_hp;
    battle.ended_at = new Date();
    battle.duration_seconds = Math.floor((battle.ended_at - battle.started_at) / 1000);

    await battle.save();

    // Update player stats
    const player = await Player.findById(req.playerId);
    if (winner === 'player') {
      player.character.wins += 1;
      player.character.gold += rewards.gold || 0;
      player.character.add_exp = function(exp) {
        this.character.exp += exp;
        while (this.character.exp >= this.character.exp_to_level) {
          this.levelUp();
        }
      };
      player.addExp(rewards.exp || 0);
      if (rewards.loot) {
        rewards.loot.forEach(item => player.equipItem(item));
      }
    } else {
      player.character.losses += 1;
    }

    await player.save();

    res.json({
      message: 'Battle ended',
      battle,
      player: player.character
    });
  } catch (error) {
    console.error('End battle error:', error);
    res.status(500).json({ error: 'Failed to end battle' });
  }
});

// Get battle history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const battles = await Battle.find({
      $or: [
        { 'player1.player_id': req.playerId },
        { 'player2.player_id': req.playerId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(battles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch battle history' });
  }
});

module.exports = router;
