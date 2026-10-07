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

const sanitizePlayer = (player) => ({
  id: player._id,
  username: player.username,
  email: player.email,
  character: player.character,
  ranking: player.ranking,
  progression: player.progression,
  settings: player.settings,
  lastLogin: player.lastLogin,
  createdAt: player.createdAt,
  updatedAt: player.updatedAt
});

// Register / Signup
router.post(['/signup', '/register'], [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 chars'),
  body('email').isEmail().withMessage('Email is invalid'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password, character } = req.body;

    const existingPlayer = await Player.findOne({ $or: [{ username }, { email }] });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const player = new Player({
      username,
      email,
      password,
      character: {
        ...(character || {}),
        name: character?.name || `${username}'s Hunter`,
        archetype: character?.archetype || 'Beginner',
        level: character?.level || 1,
        hp: character?.hp || 100,
        max_hp: character?.max_hp || 100,
        attack: character?.attack || 16,
        defense: character?.defense || 5,
        gold: character?.gold || 100,
        wins: character?.wins || 0,
        losses: character?.losses || 0
      }
    });

    await player.save();
    const token = generateToken(player._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      player: sanitizePlayer(player)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const loginValue = username || req.body.email;

    const player = await Player.findOne({
      $or: [{ username: loginValue }, { email: loginValue }]
    });

    if (!player) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await player.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    player.lastLogin = new Date();
    await player.save();

    const token = generateToken(player._id);

    res.json({
      message: 'Login successful',
      token,
      player: sanitizePlayer(player)
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