const Queue = require('queue');

const matchmakingQueue = new Map(); // rank -> [players waiting]
const activeRooms = new Map(); // roomId -> room data

const matchmakingNamespace = (io) => {
  io.on('connection', (socket) => {
    console.log('🎮 Player connected for matchmaking:', socket.id);

    // Join matchmaking queue
    socket.on('join-queue', (data) => {
      const { player_id, username, rank = 1, character_stats } = data;
      
      if (!matchmakingQueue.has(rank)) {
        matchmakingQueue.set(rank, []);
      }

      matchmakingQueue.get(rank).push({
        socket_id: socket.id,
        player_id,
        username,
        character_stats,
        joined_at: Date.now()
      });

      console.log(`📊 Queue size for rank ${rank}: ${matchmakingQueue.get(rank).length}`);
      socket.emit('queue-status', {
        position: matchmakingQueue.get(rank).length,
        rank
      });

      // Try to match if 2 or more players
      tryMatchmaking(io, rank);
    });

    // Leave queue
    socket.on('leave-queue', (data) => {
      const { rank = 1 } = data;
      const queue = matchmakingQueue.get(rank) || [];
      const index = queue.findIndex(p => p.socket_id === socket.id);
      if (index > -1) {
        queue.splice(index, 1);
        console.log(`❌ Player left queue for rank ${rank}`);
      }
    });

    // Accept match
    socket.on('accept-match', (data) => {
      const { room_id } = data;
      const room = activeRooms.get(room_id);
      if (room) {
        const player = room.players.find(p => p.socket_id === socket.id);
        if (player) player.accepted = true;

        const allAccepted = room.players.every(p => p.accepted);
        if (allAccepted) {
          io.to(room_id).emit('match-confirmed', { room_id });
          room.status = 'active';
        }
      }
    });

    // Decline match
    socket.on('decline-match', (data) => {
      const { room_id } = data;
      const room = activeRooms.get(room_id);
      if (room) {
        // Remove all players from this room
        room.players.forEach(p => {
          io.to(p.socket_id).emit('match-declined');
        });
        activeRooms.delete(room_id);
        
        // Put players back in queue
        socket.emit('match-declined');
      }
    });

    socket.on('disconnect', () => {
      matchmakingQueue.forEach((queue) => {
        const index = queue.findIndex(p => p.socket_id === socket.id);
        if (index > -1) queue.splice(index, 1);
      });
      console.log('🔌 Player disconnected from matchmaking:', socket.id);
    });
  });
};

const tryMatchmaking = (io, rank) => {
  const queue = matchmakingQueue.get(rank);
  if (!queue || queue.length < 2) return;

  const player1 = queue.shift();
  const player2 = queue.shift();

  const roomId = `pvp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const room = {
    room_id: roomId,
    players: [
      { ...player1, accepted: false },
      { ...player2, accepted: false }
    ],
    status: 'pending',
    created_at: Date.now()
  };

  activeRooms.set(roomId, room);

  // Notify both players
  io.to(player1.socket_id).emit('match-found', {
    room_id: roomId,
    opponent: {
      username: player2.username,
      stats: player2.character_stats
    },
    timeout: 30 // seconds to accept
  });

  io.to(player2.socket_id).emit('match-found', {
    room_id: roomId,
    opponent: {
      username: player1.username,
      stats: player1.character_stats
    },
    timeout: 30
  });

  console.log(`✅ Match found! Room: ${roomId}`);
};

module.exports = { matchmakingNamespace, activeRooms };
