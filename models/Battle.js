const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  battle_id: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['pvp', 'pve', 'boss'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'abandoned'],
    default: 'pending'
  },
  
  // Participants
  player1: {
    player_id: mongoose.Schema.Types.ObjectId,
    username: String,
    character_name: String,
    initial_hp: Number,
    final_hp: Number,
    damage_dealt: { type: Number, default: 0 },
    damage_taken: { type: Number, default: 0 }
  },
  
  player2: {
    player_id: mongoose.Schema.Types.ObjectId,
    username: String,
    character_name: String,
    initial_hp: Number,
    final_hp: Number,
    damage_dealt: { type: Number, default: 0 },
    damage_taken: { type: Number, default: 0 }
  },
  
  // Boss battles
  boss: {
    name: String,
    archetype: String,
    map: String,
    initial_hp: Number,
    final_hp: Number,
    phases_reached: { type: Number, default: 1 }
  },
  
  // Battle Log
  turns: [
    {
      turn_number: Number,
      actor: String,
      action: String,
      damage: Number,
      target_hp_after: Number,
      timestamp: Date
    }
  ],
  
  // Results
  winner: String,
  loser: String,
  rewards: {
    gold: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    loot: [{
      name: String,
      type: String,
      rarity: String
    }]
  },
  
  duration_seconds: Number,
  started_at: { type: Date, default: Date.now },
  ended_at: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for quick lookups
battleSchema.index({ 'player1.player_id': 1, createdAt: -1 });
battleSchema.index({ 'player2.player_id': 1, createdAt: -1 });
battleSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Battle', battleSchema);
