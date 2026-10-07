# K-pop Demon Hunters League - Deployment Guide

## Architecture Overview

```
┌─────────────────┐
│  Frontend (SPA) │  (Vercel / GitHub Pages)
│  index.html     │
└────────┬────────┘
         │ HTTP/REST
         │ Socket.IO
         ↓
┌─────────────────┐
│  Backend API    │  (Render / Railway)
│  Node + Express │
└────────┬────────┘
         │ MongoDB Driver
         ↓
┌─────────────────┐
│  MongoDB Atlas  │  (Cloud Database)
│  Cloud DB       │
└─────────────────┘
```

## Step 1: Deploy Backend to Render

### 1.1 Prepare Repository

Ensure your GitHub repo has:
- `server.js` (entry point)
- `package.json` with `"start": "node server.js"`
- `.env.example` (for reference)
- `routes/`, `models/`, `middleware/`, `sockets/` directories

### 1.2 Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your GitHub repos

### 1.3 Deploy Web Service

1. Click **New +** → **Web Service**
2. Select your **K-pop-Demon-Hunters-League** repo
3. Configure:
   - **Name**: `kpop-hunters-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 1.4 Add Environment Variables

In Render dashboard, go to **Environment**:

```
MONGODB_URI = mongodb+srv://user:password@cluster.mongodb.net/kpop-hunters
JWT_SECRET = your-super-secret-jwt-key-here
NODE_ENV = production
CLIENT_URL = https://kpop-hunters.vercel.app (or your frontend URL)
PORT = leave empty (Render auto-assigns)
```

### 1.5 Deploy

Click **Deploy** and wait for green checkmark. Your backend URL will be:
```
https://kpop-hunters-api.onrender.com
```

**Note:** Free tier services sleep after 15 min inactivity. Upgrade for always-on.

---

## Step 2: Set Up MongoDB Atlas

### 2.1 Create MongoDB Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create organization & project

### 2.2 Create Cluster

1. **Build a Database** → Choose **Free** tier
2. Select provider (AWS/Google Cloud/Azure)
3. Choose region closest to Render
4. **Create Cluster**

### 2.3 Create Database User

1. Go to **Database Access**
2. **Add New Database User**
   - Username: `kpopadmin`
   - Password: Generate strong password
   - Role: `Atlas admin`
3. **Add User**

### 2.4 Set Network Access

1. Go to **Network Access**
2. **Add IP Address**
   - Add `0.0.0.0/0` (allow all IPs)
   - Or restrict to Render IP if available

### 2.5 Get Connection String

1. Go to **Databases**
2. Click **Connect** on your cluster
3. Choose **Drivers** → Node.js
4. Copy connection string:
```
mongodb+srv://kpopadmin:PASSWORD@cluster.mongodb.net/kpop-hunters?retryWrites=true&w=majority
```
5. Replace `PASSWORD` with your user password

### 2.6 Update Render

1. In Render dashboard, add to Environment:
```
MONGODB_URI = mongodb+srv://kpopadmin:PASSWORD@cluster.mongodb.net/kpop-hunters
```
2. Click **Save** - Backend auto-redeploys

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Frontend

1. Create `public/` folder in repo root (if not exists)
2. Move `index.html` to `public/`
3. Create `public/client.js` to initialize Socket.IO connection:

```javascript
// public/client.js
const BACKEND_URL = 'https://kpop-hunters-api.onrender.com';

let jwtToken = localStorage.getItem('token');

// Initialize Socket.IO
const socket = io(BACKEND_URL + '/game', {
  query: { token: jwtToken }
});

// Signup handler
async function signup() {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    console.log('Signup successful!');
    location.reload();
  }
}

// Login handler
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    console.log('Login successful!');
    location.reload();
  }
}

// Fetch leaderboard
async function loadLeaderboard() {
  const res = await fetch(`${BACKEND_URL}/api/player/leaderboard`);
  const players = await res.json();
  console.log('Leaderboard:', players);
  // Update UI with leaderboard data
}

// Start boss battle
async function startBossBattle() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BACKEND_URL}/api/battle/create-boss-battle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      boss_name: 'Demon Sovereign',
      boss_archetype: 'Final Boss',
      map_name: 'Celestial Realm',
      boss_hp: 1500,
      boss_attack: 50
    })
  });

  const data = await res.json();
  console.log('Battle created:', data.battle_id);
  // Join Socket.IO room
  socket.emit('join-battle', { battle_id: data.battle_id });
}

// Socket.IO event listeners
socket.on('player-joined', (data) => {
  console.log('Player joined:', data.username);
});

socket.on('battle-update', (data) => {
  console.log('Battle update:', data);
  // Update battle UI
});

socket.on('battle-complete', (data) => {
  console.log('Battle complete:', data);
  // Show results
});
```

4. Update `index.html` to include the client script:
```html
<script src="/client.js"></script>
```

### 3.2 Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

### 3.3 Deploy Frontend

1. Click **Add New** → **Project**
2. Select **K-pop-Demon-Hunters-League** repo
3. Configure:
   - **Framework**: None (static)
   - **Root Directory**: `.`
   - **Build Command**: Leave empty
   - **Output Directory**: `public`

4. Click **Deploy**

Your frontend URL:
```
https://kpop-hunters.vercel.app
```

### 3.4 Update Backend CORS

1. In Render dashboard, update:
```
CLIENT_URL = https://kpop-hunters.vercel.app
```
2. Backend auto-redeploys with new CORS settings

---

## Step 4: Alternative Deploy to Railway

### 4.1 Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Link your GitHub repo

### 4.2 Deploy Backend

1. Click **New Project** → **Deploy from GitHub**
2. Select your repo
3. Choose **Backend** service
4. Add environment variables (same as Render)
5. Deploy

### 4.3 Add MongoDB

1. In Railway dashboard, **Add Service** → **Database**
2. Choose **MongoDB**
3. Railway auto-connects and provides `MONGODB_URL`

---

## Step 5: Connect Everything

### 5.1 Update Frontend Config

In `public/client.js`, update:
```javascript
const BACKEND_URL = 'https://kpop-hunters-api.onrender.com';
// or
const BACKEND_URL = 'https://kpop-hunters-api.up.railway.app';
```

### 5.2 Test Connections

```bash
# Test backend health
curl https://kpop-hunters-api.onrender.com/api/health

# Test auth
curl -X POST https://kpop-hunters-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Test leaderboard
curl https://kpop-hunters-api.onrender.com/api/player/leaderboard
```

### 5.3 Test Socket.IO

Open browser console on your Vercel frontend:
```javascript
// Should see connection logs
socket.on('connect', () => console.log('Connected to battle server!'));
```

---

## Monitoring & Troubleshooting

### Check Logs

**Render:**
- Dashboard → Web Service → **Logs**

**Vercel:**
- Dashboard → Project → **Deployments** → **Runtime Logs**

### Common Issues

**CORS Error**
- Update `CLIENT_URL` in Render environment variables
- Restart backend

**MongoDB Connection Failed**
- Verify connection string in environment variables
- Check MongoDB Atlas network access settings
- Ensure IP whitelist includes Render/Railway

**Socket.IO not connecting**
- Check JWT token is valid
- Verify backend is running: `/api/health`
- Check browser console for errors

**Cold start delays**
- Free tier services sleep after inactivity
- Upgrade to paid tier for always-on

---

## Final Checklist

- ✅ Backend deployed to Render
- ✅ MongoDB Atlas set up with connection string
- ✅ Environment variables configured
- ✅ Frontend deployed to Vercel
- ✅ CORS settings updated
- ✅ Socket.IO connection tested
- ✅ Auth flow working (signup/login)
- ✅ Leaderboard API working
- ✅ Battle creation and Socket.IO rooms working
- ✅ Database persisting data

---

## URLs

```
Frontend:   https://kpop-hunters.vercel.app
Backend:    https://kpop-hunters-api.onrender.com
Database:   MongoDB Atlas (cloud)
```

## Next Steps

1. Celebrate! 🎉
2. Test multiplayer battles with friends
3. Monitor logs for issues
4. Iterate on features
5. Gather feedback and improve

---

**Your multiplayer K-pop RPG is now LIVE!** 🎮👹
