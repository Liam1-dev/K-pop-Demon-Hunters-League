const express = require('express');
const router = express.Router();
const Cutscene = require('../models/Cutscene');
const { authMiddleware } = require('../middleware/auth');

// Get cutscenes by trigger type
router.get('/by-trigger/:trigger', async (req, res) => {
  try {
    const { trigger } = req.params;
    const cutscenes = await Cutscene.find({ trigger });
    res.json(cutscenes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cutscenes' });
  }
});

// Get cutscene by ID
router.get('/:cutsceneId', async (req, res) => {
  try {
    const { cutsceneId } = req.params;
    const cutscene = await Cutscene.findOne({ cutscene_id: cutsceneId });
    if (!cutscene) {
      return res.status(404).json({ error: 'Cutscene not found' });
    }
    res.json(cutscene);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cutscene' });
  }
});

// Get boss cutscene
router.get('/boss/:bossName', async (req, res) => {
  try {
    const { bossName } = req.params;
    const cutscene = await Cutscene.findOne({
      related_boss: bossName,
      trigger: 'boss_encounter'
    });
    if (!cutscene) {
      return res.status(404).json({ error: 'Boss cutscene not found' });
    }
    res.json(cutscene);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boss cutscene' });
  }
});

module.exports = router;