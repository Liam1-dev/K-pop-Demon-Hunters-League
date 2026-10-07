# K-pop Demon Hunters League - Backend Setup

## Overview

This is the multiplayer backend for **K-pop Demon Hunters League**. It's built with:

- **Node.js + Express** - REST API server
- **MongoDB** - Player data, battles, leaderboard
- **Socket.IO** - Real-time multiplayer battle rooms
- **JWT** - Secure authentication

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start MongoDB Locally

**Option A: With MongoDB locally installed**
```bash
mongod
```

**Option B: With Docker**
```bash
docker run -d -p 27017:27017 --name kpop-mongo mongo:latest
```

### 3. Create `.env` file

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kpop-hunters
JWT_SECRET=your-super-secret-key
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 4. Start Backend Server

**Development (with auto-reload)**
```bash
npm run dev
```

**Production**
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Create a new player account
```json
{
  "username": "hunterName",
  "email": "email@example.com",
  "password": "password123",
  "character": {
    "name": "Nova Bloom"
  }
}
```

#### POST `/api/auth/login`
Login and get JWT token
```json
{
  "username": "hunterName",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "player": { ...player data... }
}
```

#### GET `/api/auth/verify`
Verify JWT token
```
Headers: Authorization: Bearer <token>
```

### Player Profile

#### GET `/api/player/profile`
Get current player's profile
```
Headers: Authorization: Bearer <token>
```

#### POST `/api/player/save`
Save player progress
```
Headers: Authorization: Bearer <token>
```
```json
{
  "character": { "gold": 500, "level": 3 },
  "progression": { "battles_played": 5 }
}
```

#### GET `/api/player/leaderboard`
Get top 20 players
```
?limit=20
```

#### GET `/api/player/stats`
Get player statistics
```
Headers: Authorization: Bearer <token>
```

#### PUT `/api/player/character/name`
Update character name
```
Headers: Authorization: Bearer <token>
```
```json
{
  "name": "New Hunter Name"
}
```

### Battles

#### POST `/api/battle/create-boss-battle`
Create a boss battle
```
Headers: Authorization: Bearer <token>
```
```json
{
  "boss_name": "Demon Sovereign",
  "boss_archetype": "Final Boss",
  "map_name": "Celestial Realm",
  "boss_hp": 1500,
  "boss_attack": 50
}
```

#### POST `/api/battle/end-battle`
End battle and save results
```
Headers: Authorization: Bearer <token>
```
```json
{
  "battle_id": "uuid-here",
  "winner": "player",
  "rewards": {
    "gold": 500,
    "exp": 250,
    "loot": []
  },
  "final_player_hp": 45,
  "final_boss_hp": 0
}
```

#### GET `/api/battle/history`
Get player's battle history
```
Headers: Authorization: Bearer <token>
?limit=20
```

### Cutscenes

#### GET `/api/cutscene/by-trigger/:trigger`
Get cutscenes by trigger type (intro, boss_encounter, victory, defeat, story)

#### GET `/api/cutscene/:cutsceneId`
Get specific cutscene

#### GET `/api/cutscene/boss/:bossName`
Get boss encounter cutscene

## Real-Time Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:5000/game', {
  query: { token: jwtToken }
});
```

### Events

**join-battle** - Join a multiplayer battle room
```javascript
socket.emit('join-battle', { battle_id: 'uuid', username: 'Hunter' });
```

**battle-action** - Send attack/skill/defend action
```javascript
socket.emit('battle-action', { 
  battle_id: 'uuid', 
  action: 'attack', 
  damage: 35,
  target: 'opponent' 
});
```

**send-damage** - Broadcast damage with animation
```javascript
socket.emit('send-damage', { 
  battle_id: 'uuid', 
  damage: 35,
  animation: 'slash'
});
```

**sync-hp** - Sync HP between players
```javascript
socket.emit('sync-hp', { 
  battle_id: 'uuid', 
  player_hp: 85,
  boss_hp: 450 
});
```

**battle-end** - End the battle
```javascript
socket.emit('battle-end', { 
  battle_id: 'uuid', 
  winner: 'player',
  rewards: { gold: 500, exp: 250 }
});
```

## Database Models

### Player
- Username, Email, Password (hashed)
- Character stats (HP, Attack, Defense, Gold, Level)
- Ranking & progression
- Equipment & boss defeats
- Settings

### Battle
- Battle ID & Type (boss, pvp, pve)
- Player 1 & Player 2 / Boss data
- Turns log & rewards
- Duration & timestamps

### Cutscene
- Trigger type (intro, boss_encounter, victory, etc.)
- Related boss & map
- Scenes (dialogue, narration, cinematic)
- Rewards (exp, gold)

## Deployment

### Deploy to Render

1. **Create Render account** at https://render.com
2. **Connect GitHub repo**
3. **Create new Web Service**
   - Runtime: Node
   - Build: `npm install`
   - Start: `npm start`
4. **Add environment variables**
   - MONGODB_URI (use MongoDB Atlas)
   - JWT_SECRET
   - NODE_ENV=production
   - CLIENT_URL (your frontend URL)

### Deploy to Railway

1. **Create Railway account** at https://railway.app
2. **Connect GitHub**
3. **Add MongoDB Atlas plugin**
4. **Deploy**
   - Environment auto-detected as Node.js
   - Add PORT & other env vars

### MongoDB Atlas (Cloud Database)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/kpop-hunters`
4. Add to `.env` as `MONGODB_URI`

## Testing

### Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Test Health
```bash
curl http://localhost:5000/api/health
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| MONGODB_URI | localhost:27017 | MongoDB connection string |
| JWT_SECRET | your-secret-key | Secret key for JWT signing |
| JWT_EXPIRE | 7d | JWT expiration time |
| NODE_ENV | development | Environment (development/production) |
| CLIENT_URL | http://localhost:3000 | Frontend URL for CORS |
| MAX_PLAYERS_PER_ROOM | 2 | Max players in battle room |
| BATTLE_TIMEOUT | 300 | Battle timeout in seconds |

## Architecture

```
Frontend (index.html) ←→ Backend (Node/Express)
                    ↓
              Socket.IO
                    ↓
              Battle Rooms
                    ↓
                MongoDB
```

1. **Frontend** sends requests to backend API
2. **Backend** processes auth, game logic, and database operations
3. **Socket.IO** handles real-time battles & player interactions
4. **MongoDB** stores all player data, battles, and progression

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or Docker container active
- Check MONGODB_URI in .env

### JWT Token Invalid
- Ensure JWT_SECRET matches between signup and login
- Check token format: `Bearer <token>`

### Socket.IO Connection Failed
- Verify socket token is valid JWT
- Check CLIENT_URL CORS setting
- Ensure server is running on correct port

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

## Next Steps

1. ✅ Backend setup complete
2. 🔗 Connect frontend `index.html` to backend API
3. 🎮 Implement Socket.IO battle handler in frontend
4. 🚀 Deploy backend to Render/Railway
5. 📱 Deploy frontend to Vercel/GitHub Pages
6. 🎯 Launch multiplayer game!

---

**Need help?** Check the issues or open a new one on GitHub.
