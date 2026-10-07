class BossAI {
  constructor(boss) {
    this.boss = boss;
    this.phase = 1;
    this.moveCounter = 0;
    this.lastSpecialMove = 0;
  }

  decidNextMove(playerHp, playerMaxHp, bossHp, bossMaxHp) {
    this.updatePhase(bossHp, bossMaxHp);
    const healthPercent = bossHp / bossMaxHp;
    const playerHealthPercent = playerHp / playerMaxHp;

    // Phase-based strategy
    if (this.phase === 1) {
      return this.phase1Strategy(playerHealthPercent);
    } else if (this.phase === 2) {
      return this.phase2Strategy(playerHealthPercent);
    } else if (this.phase === 3) {
      return this.phase3Strategy(playerHealthPercent);
    } else {
      return this.phase4Strategy(playerHealthPercent);
    }
  }

  updatePhase(currentHp, maxHp) {
    const healthPercent = currentHp / maxHp;
    if (healthPercent <= 0.25) this.phase = 4;
    else if (healthPercent <= 0.5) this.phase = 3;
    else if (healthPercent <= 0.75) this.phase = 2;
    else this.phase = 1;
  }

  phase1Strategy(playerHealthPercent) {
    // Early game: balanced mix of attacks
    const roll = Math.random();
    if (roll < 0.7) {
      return { action: 'attack', damage: this.calculateBaseDamage() };
    } else {
      return { action: 'special', damage: this.calculateSpecialDamage() };
    }
  }

  phase2Strategy(playerHealthPercent) {
    // Mid game: more aggressive
    const roll = Math.random();
    if (playerHealthPercent < 0.4) {
      // Player is low, go for kill
      return { action: 'special', damage: this.calculateSpecialDamage() };
    }
    if (roll < 0.5) {
      return { action: 'attack', damage: this.calculateBaseDamage() };
    } else if (roll < 0.85) {
      return { action: 'special', damage: this.calculateSpecialDamage() };
    } else {
      return { action: 'defend', damage: 0 };
    }
  }

  phase3Strategy(playerHealthPercent) {
    // Crisis mode: very aggressive
    const roll = Math.random();
    if (roll < 0.15) {
      return { action: 'defend', damage: 0 }; // Quick defense
    } else if (roll < 0.6) {
      return { action: 'attack', damage: this.calculateBaseDamage() * 1.2 };
    } else {
      return { action: 'special', damage: this.calculateSpecialDamage() * 1.3 };
    }
  }

  phase4Strategy(playerHealthPercent) {
    // Desperate: all or nothing
    const roll = Math.random();
    if (roll < 0.8) {
      return { action: 'special', damage: this.calculateSpecialDamage() * 1.5 };
    } else {
      return { action: 'ultimate', damage: this.calculateSpecialDamage() * 2 };
    }
  }

  calculateBaseDamage() {
    const base = this.boss.attack || 25;
    const variance = Math.random() * 8 - 4;
    return Math.max(1, Math.floor(base + variance + (this.phase - 1) * 5));
  }

  calculateSpecialDamage() {
    const base = (this.boss.attack || 25) * 1.4;
    const variance = Math.random() * 12 - 6;
    return Math.max(1, Math.floor(base + variance + (this.phase - 1) * 8));
  }
}

module.exports = BossAI;
