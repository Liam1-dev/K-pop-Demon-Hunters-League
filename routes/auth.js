const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Player = require('../models/Player');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 20 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;

    // Check if user exists
    let player = await Player.findOne({ $or: [{ username }, { email }] });
    if (player) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new player
    player = new Player({
      username,
      email,
      password,
      character: {
        name: `${username}'s Hunter`,
        archetype: 'Beginner',
        level: 1,
        hp: 100,
        max_hp: 100,
        attack: 16,
        defense: 5,
        gold: 100
      }
    });

    await player.save();

    const token = generateToken(player._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      player: {
        id: player._id,
        username: player.username,
        character: player.character
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('username').trim(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const { username, password } = req.body;

    const player = await Player.findOne({ username });
    if (!player) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await player.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    player.lastLogin = new Date();
    await player.save();

    const token = generateToken(player._id);

    res.json({
      message: 'Login successful',
      token,
      player: {
        id: player._id,
        username: player.username,
        character: player.character,
        ranking: player.ranking,
        progression: player.progression
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ valid: true, playerId: decoded.id });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
