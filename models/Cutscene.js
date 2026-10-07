const mongoose = require('mongoose');

const cutsceneSchema = new mongoose.Schema({
  cutscene_id: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  trigger: {
    type: String,
    enum: ['intro', 'boss_encounter', 'victory', 'defeat', 'milestone', 'story'],
    required: true
  },
  related_boss: String,
  related_map: String,
  
  scenes: [
    {
      scene_index: Number,
      type: {
        type: String,
        enum: ['dialogue', 'narration', 'cinematic'],
        required: true
      },
      character: String, // "Narrator", "Boss Name", etc
      character_emoji: String,
      text: String,
      duration_seconds: { type: Number, default: 4 },
      background_image: String,
      animation: String // fade, slide, zoom, etc
    }
  ],
  
  is_skippable: { type: Boolean, default: true },
  rewards: {
    exp: { type: Number, default: 0 },
    gold: { type: Number, default: 0 }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cutscene', cutsceneSchema);
