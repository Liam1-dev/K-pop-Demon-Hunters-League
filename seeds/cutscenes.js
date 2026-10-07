const mongoose = require('mongoose');
const Cutscene = require('../models/Cutscene');

const cutsceneData = [
  {
    cutscene_id: 'intro_001',
    title: 'Welcome to the League',
    trigger: 'intro',
    scenes: [
      {
        scene_index: 1,
        type: 'narration',
        character: 'Narrator',
        character_emoji: '🌙',
        text: 'A new hunter emerges from the shadows. The world is plagued by demons, and only the strongest can hope to survive.',
        duration_seconds: 5,
        animation: 'fade'
      },
      {
        scene_index: 2,
        type: 'dialogue',
        character: 'Elder Guide',
        character_emoji: '🧙',
        text: 'You have been chosen. Your destiny awaits in the K-pop Demon Hunters League.',
        duration_seconds: 4,
        animation: 'slide'
      }
    ],
    is_skippable: true,
    rewards: { exp: 100, gold: 50 }
  },
  {
    cutscene_id: 'boss_whisper_001',
    title: 'The Whisper Wraith Emerges',
    trigger: 'boss_encounter',
    related_boss: 'Whisper Wraith',
    related_map: 'Whisperwood Forest',
    scenes: [
      {
        scene_index: 1,
        type: 'narration',
        character: 'Narrator',
        character_emoji: '👻',
        text: 'The forest trembles as an ancient spirit awakens. The Whisper Wraith, guardian of the Whisperwood, emerges from the mist.',
        duration_seconds: 5,
        animation: 'fade'
      },
      {
        scene_index: 2,
        type: 'dialogue',
        character: 'Whisper Wraith',
        character_emoji: '👻',
        text: 'Another hunter dares enter my domain? Your essence shall fuel my power!',
        duration_seconds: 4,
        animation: 'zoom'
      }
    ],
    is_skippable: true
  },
  {
    cutscene_id: 'pvp_start_001',
    title: 'Rival Approaches',
    trigger: 'pvp_start',
    scenes: [
      {
        scene_index: 1,
        type: 'narration',
        character: 'Narrator',
        character_emoji: '⚡',
        text: 'Two hunters meet in the arena. Only one will emerge victorious.',
        duration_seconds: 3,
        animation: 'fade'
      },
      {
        scene_index: 2,
        type: 'dialogue',
        character: 'Unknown Rival',
        character_emoji: '🗡️',
        text: 'Let us settle this in combat!',
        duration_seconds: 2,
        animation: 'slide'
      }
    ],
    is_skippable: true
  },
  {
    cutscene_id: 'victory_001',
    title: 'Victory!',
    trigger: 'victory',
    scenes: [
      {
        scene_index: 1,
        type: 'narration',
        character: 'Narrator',
        character_emoji: '🎉',
        text: 'You have proven yourself victorious! Your strength grows with each battle won.',
        duration_seconds: 4,
        animation: 'fade'
      }
    ],
    is_skippable: true,
    rewards: { exp: 200, gold: 150 }
  }
];

const seedCutscenes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kpop-hunters');
    
    // Clear existing
    await Cutscene.deleteMany({});
    
    // Insert new
    await Cutscene.insertMany(cutsceneData);
    
    console.log('✅ Cutscenes seeded successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error seeding cutscenes:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedCutscenes();
}

module.exports = seedCutscenes;
