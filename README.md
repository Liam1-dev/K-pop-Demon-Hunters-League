# K-pop Demon Hunters League - Online RPG

A full-stack browser-based multiplayer RPG featuring character selection, boss battles, PvP matchmaking, cutscene storytelling, and a global leaderboard.

## 🎮 Features

- **Account System**: Secure JWT-based authentication
- **Character Selection**: 4 unique hunters with different stats
- **Boss Encounters**: 4 powerful bosses with multi-phase battles
- **Damage Animations**: Floating numbers, screen shake, visual feedback
- **Boss AI**: Adaptive difficulty based on health phases
- **PvP Matchmaking**: Real-time queue-based player matching
- **Cutscene System**: Story-driven narrative sequences
- **Cloud Save/Load**: Automatic progression synchronization
- **Global Leaderboard**: Ranked ladder with tier system
- **Player Profiles**: Public profiles with battle history

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- Docker & Docker Compose (optional)

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start MongoDB**
   ```bash
   # Using Docker
   docker-compose up -d mongodb
   
   # Or with local MongoDB
   mongod
   ```

4. **Seed database with cutscenes**
   ```bash
   node seeds/cutscenes.js
   ```

5. **Start server**
   ```bash
   npm start
   # Or with auto-reload
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## 📁 Project Structure

```
.
├── server.js                 # Main Express server
├── models/                   # MongoDB schemas
│   ├── Player.js
│   ├── Battle.js
│   ├── Cutscene.js
│   ├── Leaderboard.js
│   └── ...
├── routes/                   # API endpoints
│   ├── auth.js              # Login/Register
│   ├── player.js            # Character & stats
│   ├── battle.js            # Battle creation
│   ├── leaderboard.js       # Rankings
│   ├── cutscenes.js         # Story sequences
│   └── profile.js           # Player profiles
├── sockets/                 # WebSocket handlers
│   ├── battleSocket.js      # Boss battle sync
│   ├── matchmakingSocket.js # PvP queue
│   └── pvpBattleSocket.js   # Player vs Player
├── AI/                      # Boss AI
│   └── bossAI.js
├── public/                  # Frontend
│   └── game-client.js
├── seeds/                   # Database seeding
│   └── cutscenes.js
├── index.html               # Main game page
└── docker-compose.yml       # Containerization
```

## 🎮 Game Flow

1. **Auth Screen** → Register or Login
2. **Character Select** → Choose hunter archetype
3. **Game Hub** → View stats, access features
4. **Battle Modes**:
   - PvE: Fight bosses with AI
   - PvP: Queue for multiplayer matches
5. **Progression** → Level up, earn rank points
6. **Leaderboard** → Climb global rankings

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/verify` - Check token

### Player
- `GET /api/player/profile` - Get player data
- `POST /api/player/save` - Save progress
- `GET /api/player/stats` - View statistics

### Battle
- `POST /api/battle/create-boss-battle` - Start boss encounter
- `POST /api/battle/end-battle` - Finish and save results
- `GET /api/battle/history` - Battle log

### Leaderboard
- `GET /api/leaderboard/global` - Top players
- `GET /api/leaderboard/player-stats` - Personal ranking
- `GET /api/leaderboard/rank/:username` - Player rank

### Cutscenes
- `GET /api/cutscenes` - All cutscenes
- `GET /api/cutscenes/by-trigger/:trigger` - By event type

### Profile
- `GET /api/profile` - My full profile
- `GET /api/profile/public/:username` - Public profile
- `PUT /api/profile` - Update profile

## 🎯 WebSocket Events

### Matchmaking
- `join-queue` - Enter PvP queue
- `match-found` - Match ready
- `accept-match` - Confirm matchup
- `decline-match` - Reject match

### PvP Battle
- `enter-battle-room` - Join battle
- `send-action` - Execute move
- `battle-end` - Match complete

## 🌐 Deployment

### Heroku
```bash
heroku create your-app-name
heroku addons:create mongolab:sandbox
git push heroku online-game-v2:main
```

### Railway
```bash
railway link
railway up
```

### Render
1. Connect GitHub repo
2. Add environment variables
3. Deploy from main branch

## 📊 Database Models

### Player
- Account info (username, email, password)
- Character stats (HP, ATK, DEF, level)
- Progression (bosses defeated, maps completed)
- Equipment and inventory

### Battle
- Type (PvE, PvP)
- Participants and results
- Turn log with actions and damage
- Rewards earned

### Leaderboard
- Rank points and tier
- Seasonal/all-time records
- Win streaks
- Last updated timestamp

## 🎨 Features Breakdown

### Damage Animations
- Floating damage numbers
- Screen shake on hit
- Color-coded (normal/skill/critical)
- Smooth fade-out effect

### Boss Phases
- 4 difficulty phases based on health %
- Stat scaling per phase
- Unique ability at each phase
- Visual phase indicator

### Cutscenes
- Scene-based narrative
- Character dialogue
- Automatic or manual progression
- Skippable option
- Reward system

### PvP Matchmaking
- Rank-based queue
- 30-second accept timeout
- Real-time status updates
- Auto-rematch option

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# Or start with Docker
docker-compose up -d mongodb
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

### Cutscenes Not Loading
```bash
# Reseed database
node seeds/cutscenes.js
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Fork the repository and submit pull requests for improvements!

## 📧 Support

For issues and features, open a GitHub issue on the repository.

---

**K-pop Demon Hunters League** - Where heroes are forged in battle! ⚔️🎮
