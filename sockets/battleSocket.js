const battleNamespace = (io) => {
  const battleRooms = new Map();

  io.on('connection', (socket) => {
    console.log('✓ Player connected:', socket.id);

    // Join battle room
    socket.on('join-battle', (data) => {
      const { battle_id, player_id, username } = data;
      socket.join(battle_id);
      battleRooms.set(socket.id, { battle_id, player_id, username });

      io.to(battle_id).emit('player-joined', {
        player_id,
        username,
        socket_id: socket.id
      });
    });

    // Send battle action (attack, defend, etc)
    socket.on('battle-action', (data) => {
      const { battle_id, action, target, damage } = data;
      io.to(battle_id).emit('battle-update', {
        actor: socket.id,
        action,
        target,
        damage,
        timestamp: new Date().toISOString()
      });
    });

    // Send damage with animation data
    socket.on('send-damage', (data) => {
      const { battle_id, damage, target, animation } = data;
      io.to(battle_id).emit('receive-damage', {
        damage,
        target,
        animation,
        from: socket.id
      });
    });

    // Sync HP updates
    socket.on('sync-hp', (data) => {
      const { battle_id, player_hp, boss_hp } = data;
      io.to(battle_id).emit('hp-sync', {
        player_hp,
        boss_hp
      });
    });

    // Battle ended
    socket.on('battle-end', (data) => {
      const { battle_id, winner, rewards } = data;
      io.to(battle_id).emit('battle-complete', {
        winner,
        rewards
      });
      socket.leave(battle_id);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const battleInfo = battleRooms.get(socket.id);
      if (battleInfo) {
        io.to(battleInfo.battle_id).emit('player-disconnected', {
          player_id: battleInfo.player_id,
          socket_id: socket.id
        });
        battleRooms.delete(socket.id);
      }
      console.log('✗ Player disconnected:', socket.id);
    });
  });
};

module.exports = { battleNamespace };
