const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const playerSchema = new mongoose.Schema({
  // Account
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,

  // Current Character
  character: {
    name: String,
    archetype: String,
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    exp_to_level: { type: Number, default: 100 },
    hp: { type: Number, default: 100 },
    max_hp: { type: Number, default: 100 },
    attack: { type: Number, default: 16 },
    defense: { type: Number, default: 5 },
    gold: { type: Number, default: 100 },
    rank: { type: Number, default: 1 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    equipment: [
      {
        name: String,
        type: String,
        attack_bonus: Number,
        defense_bonus: Number,
        hp_bonus: Number,
        rarity: String
      }
    ],
    bosses_defeated: [String],
    current_map: { type: String, default: 'Whisperwood Forest' },
    playtime_seconds: { type: Number, default: 0 }
  },

  // Game Progress
  progression: {
    maps_completed: [String],
    bosses_defeated: {
      'Whisperwood Forest': { type: Boolean, default: false },
      'Scorched Volcano': { type: Boolean, default: false },
      'The Abyss': { type: Boolean, default: false },
      'Celestial Realm': { type: Boolean, default: false }
    },
    cutscenes_watched: [String],
    total_damage_dealt: { type: Number, default: 0 },
    total_damage_taken: { type: Number, default: 0 },
    battles_played: { type: Number, default: 0 }
  },

  // Leaderboard
  ranking: {
    rank_points: { type: Number, default: 0 },
    season: { type: Number, default: 1 },
    seasonal_wins: { type: Number, default: 0 },
    seasonal_losses: { type: Number, default: 0 },
    is_banned: { type: Boolean, default: false }
  },

  // Settings
  settings: {
    notifications_enabled: { type: Boolean, default: true },
    sound_enabled: { type: Boolean, default: true },
    volume: { type: Number, default: 80 }
  }
}, { timestamps: true });

// Hash password before saving
playerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
playerSchema.methods.comparePassword = async function(passwordAttempt) {
  return await bcrypt.compare(passwordAttempt, this.password);
};

// Method to add experience
playerSchema.methods.addExp = function(amount) {
  this.character.exp += amount;
  while (this.character.exp >= this.character.exp_to_level) {
    this.levelUp();
  }
};

// Method to level up
playerSchema.methods.levelUp = function() {
  this.character.exp -= this.character.exp_to_level;
  this.character.level += 1;
  this.character.exp_to_level = Math.floor(this.character.exp_to_level * 1.1);
  this.character.max_hp += 15;
  this.character.hp = this.character.max_hp;
  this.character.attack += 3;
  this.character.defense += 1;
};

// Method to equip item
playerSchema.methods.equipItem = function(equipment) {
  this.character.equipment.push(equipment);
  this.character.attack += equipment.attack_bonus || 0;
  this.character.defense += equipment.defense_bonus || 0;
  this.character.max_hp += equipment.hp_bonus || 0;
  this.character.hp = this.character.max_hp;
};

// Method to take damage
playerSchema.methods.takeDamage = function(damage) {
  const actualDamage = Math.max(0, damage - this.character.defense);
  this.character.hp = Math.max(0, this.character.hp - actualDamage);
  this.progression.total_damage_taken += actualDamage;
};

// Method to heal
playerSchema.methods.heal = function(amount) {
  this.character.hp = Math.min(this.character.max_hp, this.character.hp + amount);
};

module.exports = mongoose.model('Player', playerSchema);
