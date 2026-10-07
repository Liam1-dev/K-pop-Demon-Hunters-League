const pvpBattleNamespace = (io) => {
  io.on('connection', (socket) => {
    socket.on('enter-battle-room', (data) => {
      const { room_id, player_id, username } = data;
      socket.join(room_id);
      console.log(`⚔️ Player ${username} entered battle room ${room_id}`);

      io.to(room_id).emit('player-entered', {
        player_id,
        username,
        socket_id: socket.id
      });
    });

    socket.on('send-action', (data) => {
      const { room_id, action, damage, target_hp } = data;
      io.to(room_id).emit('opponent-action', {
        action,
        damage,
        target_hp,
        from: socket.id,
        timestamp: Date.now()
      });
    });

    socket.on('battle-end', (data) => {
      const { room_id, winner, loser, rewards } = data;
      io.to(room_id).emit('battle-result', {
        winner,
        loser,
        rewards
      });
    });

    socket.on('leave-battle', (data) => {
      const { room_id } = data;
      socket.leave(room_id);
      io.to(room_id).emit('opponent-disconnected');
    });
  });
};

module.exports = { pvpBattleNamespace };
