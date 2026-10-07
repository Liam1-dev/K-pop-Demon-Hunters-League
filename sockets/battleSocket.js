const { verifySocketToken } = require('../middleware/auth');
const Player = require('../models/Player');
const Battle = require('../models/Battle');

const battleNamespace = (io) => {
  const battleRooms = new Map();
  const gameIO = io.of('/game');

  gameIO.use((socket, next) => {
    const token = socket.handshake.query.token;
    const playerId = verifySocketToken(token);

    if (!playerId) {
      return next(new Error('Authentication failed'));
    }

    socket.playerId = playerId;
    next();
  });

  gameIO.on('connection', (socket) => {
    console.log('✓ Player connected to battle socket:', socket.playerId);

    // Join multiplayer battle room
    socket.on('join-battle', async (data) => {
      try {
        const { battle_id, username } = data;
        const existingRoom = battleRooms.get(battle_id) || { players: [] };

        const player = await Player.findById(socket.playerId);
        if (!player) {
          socket.emit('error', { message: 'Player not found' });
          return;
        }

        const hasPlayer = existingRoom.players.some((p) => p.id === socket.playerId);
        if (!hasPlayer) {
          existingRoom.players.push({ id: socket.playerId, username: username || player.username });
        }

        battleRooms.set(battle_id, existingRoom);
        socket.join(battle_id);

        gameIO.to(battle_id).emit('player-joined', {
          player_id: socket.playerId,
          username: username || player.username,
          socket_id: socket.id,
          players: existingRoom.players
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle battle actions
    socket.on('battle-action', (data) => {
      const { battle_id, action, target, damage, source } = data;
      gameIO.to(battle_id).emit('battle-update', {
        actor: source || socket.playerId,
        action,
        target,
        damage,
        timestamp: new Date().toISOString()
      });
    });

    // Send damage notification
    socket.on('send-damage', (data) => {
      const { battle_id, damage, target, animation } = data;
      gameIO.to(battle_id).emit('receive-damage', {
        damage,
        target,
        animation,
        from: socket.playerId
      });
    });

    // Sync HP updates
    socket.on('sync-hp', (data) => {
      const { battle_id, player_hp, boss_hp } = data;
      gameIO.to(battle_id).emit('hp-sync', {
        player_hp,
        boss_hp
      });
    });

    // End battle
    socket.on('battle-end', async (data) => {
      try {
        const { battle_id, winner, rewards } = data;

        const battle = await Battle.findOne({ battle_id });
        if (battle) {
          battle.status = 'completed';
          battle.winner = winner;
          battle.rewards = rewards || {};
          battle.ended_at = new Date();
          battle.duration_seconds = Math.floor((battle.ended_at - battle.started_at) / 1000);
          await battle.save();
        }

        gameIO.to(battle_id).emit('battle-complete', {
          winner,
          rewards
        });

        socket.leave(battle_id);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      for (const [battleId, room] of battleRooms.entries()) {
        const updatedPlayers = room.players.filter((p) => p.id !== socket.playerId);
        if (updatedPlayers.length !== room.players.length) {
          room.players = updatedPlayers;
          battleRooms.set(battleId, room);
          gameIO.to(battleId).emit('player-disconnected', { player_id: socket.playerId });
        }
      }
      console.log('✗ Player disconnected from battle socket:', socket.playerId);
    });
  });
};

module.exports = { battleNamespace };