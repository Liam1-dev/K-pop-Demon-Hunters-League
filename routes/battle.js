const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Battle = require('../models/Battle');
const Player = require('../models/Player');
const { authMiddleware } = require('../middleware/auth');

// Create boss battle
router.post('/create-boss-battle', authMiddleware, async (req, res) => {
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
        initial_hp: player.character.hp,
        final_hp: player.character.hp
      },
      boss: {
        name: boss_name,
        archetype: boss_archetype,
        map: map_name,
        initial_hp: boss_hp,
        final_hp: boss_hp,
        phases_reached: 1
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
router.post('/end-battle', authMiddleware, async (req, res) => {
  try {
    const { battle_id, winner, rewards, final_player_hp, final_boss_hp } = req.body;
    const battle = await Battle.findOne({ battle_id });

    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    const player = await Player.findById(req.playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    battle.status = 'completed';
    battle.winner = winner;
    battle.loser = winner === 'player' ? 'boss' : 'player';
    battle.rewards = rewards || {};
    battle.player1.final_hp = final_player_hp || player.character.hp;
    battle.boss.final_hp = final_boss_hp;
    battle.ended_at = new Date();
    battle.duration_seconds = Math.floor((battle.ended_at - battle.started_at) / 1000);

    if (winner === 'player') {
      player.character.wins += 1;
      player.character.gold += rewards?.gold || 0;
      player.addExp(rewards?.exp || 0);

      if (rewards?.loot && Array.isArray(rewards.loot)) {
        rewards.loot.forEach((item) => player.equipItem(item));
      }

      if (battle.boss.name) {
        if (!player.character.bosses_defeated) {
          player.character.bosses_defeated = [];
        }
        if (!player.character.bosses_defeated.includes(battle.boss.name)) {
          player.character.bosses_defeated.push(battle.boss.name);
        }
      }
    } else {
      player.character.losses += 1;
    }

    await player.save();
    await battle.save();

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
router.get('/history', authMiddleware, async (req, res) => {
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