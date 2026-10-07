const express = require('express');
const router = express.Router();
const Cutscene = require('../models/Cutscene');

// Get cutscene by trigger
router.get('/by-trigger/:trigger', async (req, res) => {
  try {
    const cutscenes = await Cutscene.find({ trigger: req.params.trigger });
    res.json(cutscenes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cutscene' });
  }
});

// Get specific cutscene
router.get('/:cutscene_id', async (req, res) => {
  try {
    const cutscene = await Cutscene.findOne({ cutscene_id: req.params.cutscene_id });
    if (!cutscene) {
      return res.status(404).json({ error: 'Cutscene not found' });
    }
    res.json(cutscene);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cutscene' });
  }
});

// Get all cutscenes
router.get('/', async (req, res) => {
  try {
    const cutscenes = await Cutscene.find({}).sort({ createdAt: -1 });
    res.json(cutscenes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cutscenes' });
  }
});

// Create cutscene (admin only)
router.post('/', async (req, res) => {
  try {
    const { cutscene_id, title, trigger, scenes, is_skippable, rewards } = req.body;
    const cutscene = new Cutscene({
      cutscene_id,
      title,
      trigger,
      scenes,
      is_skippable: is_skippable !== false,
      rewards
    });
    await cutscene.save();
    res.status(201).json({ message: 'Cutscene created', cutscene });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
