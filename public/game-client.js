const API_URL = 'http://localhost:5000/api';

class GameClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.player = JSON.parse(localStorage.getItem('player_data') || 'null');
    this.selectedCharacter = null;
    this.battleState = null;
    this.currentBattle = null;
    this.isBattleActive = false;

    this.handleEvents();
    this.renderCharacterOptions();
    this.initializeScreens();
  }

  initializeScreens() {
    this.hideAllScreens();
    if (this.token && this.player) {
      this.showScreen('gameScreen');
      this.renderHub();
    } else {
      this.showScreen('authScreen');
    }
  }

  handleEvents() {
    document.getElementById('registerBtn').addEventListener('click', () => this.showRegister());
    document.getElementById('toggleAuthBtn').addEventListener('click', () => this.showLogin());
    document.getElementById('loginSubmitBtn').addEventListener('click', () => this.login());
    document.getElementById('registerSubmitBtn').addEventListener('click', () => this.register());
    document.getElementById('confirmCharacterBtn').addEventListener('click', () => this.confirmCharacter());
    document.getElementById('enterGameBtn').addEventListener('click', () => this.logout());
    document.getElementById('startBattleBtn').addEventListener('click', () => this.startBattle());
    document.getElementById('playCutsceneBtn').addEventListener('click', () => this.showCutscene());
    document.getElementById('closeCutsceneBtn').addEventListener('click', () => this.hideCutscene());
    document.getElementById('attackBtn').addEventListener('click', () => this.performAction('attack'));
    document.getElementById('skillBtn').addEventListener('click', () => this.performAction('skill'));
    document.getElementById('defendBtn').addEventListener('click', () => this.performAction('defend'));
    document.getElementById('retreatBtn').addEventListener('click', () => this.performAction('retreat'));
    document.getElementById('viewStatsBtn').addEventListener('click', () => this.showProfileStats());
    document.getElementById('backToTitle').addEventListener('click', () => this.logout());
  }

  hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('cutsceneModal').classList.remove('active');
  }

  showScreen(screenId) {
    this.hideAllScreens();
    document.getElementById(screenId).classList.add('active');
  }

  showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
  }

  showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
  }

  async login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
      this.notify('Please fill in all fields', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      this.token = data.token;
      this.player = data.player;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('player_data', JSON.stringify(this.player));

      this.notify('Login successful!', 'success');
      this.showCharacterSelect();
    } catch (err) {
      this.notify(err.message, 'error');
    }
  }

  async register() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;

    if (!username || !email || !password || !confirm) {
      this.notify('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirm) {
      this.notify('Passwords do not match', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      this.token = data.token;
      this.player = data.player;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('player_data', JSON.stringify(this.player));

      this.notify('Account created! Welcome to the League.', 'success');
      this.showCharacterSelect();
    } catch (err) {
      this.notify(err.message, 'error');
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('player_data');
    this.token = null;
    this.player = null;
    this.selectedCharacter = null;
    this.battleState = null;
    this.currentBattle = null;
    this.showScreen('authScreen');
    this.showLogin();
  }

  showCharacterSelect() {
    this.renderCharacterOptions();
    this.showScreen('characterSelectScreen');
  }

  renderCharacterOptions() {
    const characters = [
      { id: '1', name: 'Nova Bloom', attack: 18, defense: 5, hp: 100, emoji: '🌸' },
      { id: '2', name: 'Riot Mirage', attack: 15, defense: 7, hp: 110, emoji: '🌈' },
      { id: '3', name: 'Velvet Viper', attack: 20, defense: 4, hp: 95, emoji: '🐍' },
      { id: '4', name: 'Moonlight Mantis', attack: 17, defense: 6, hp: 105, emoji: '🌙' }
    ];

    const container = document.getElementById('characterGrid');
    container.innerHTML = characters.map((char) => `
      <div class="character-card" data-char-id="${char.id}" data-name="${char.name}" data-attack="${char.attack}" data-defense="${char.defense}" data-hp="${char.hp}">
        <div class="character-emoji">${char.emoji}</div>
        <div class="character-name">${char.name}</div>
        <div class="character-stats">
          <div>ATK: ${char.attack}</div>
          <div>DEF: ${char.defense}</div>
          <div>HP: ${char.hp}</div>
          <div>TYPE: DPS</div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.character-card').forEach((card) => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.character-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedCharacter = {
          id: card.dataset.charId,
          name: card.dataset.name,
          attack: Number(card.dataset.attack),
          defense: Number(card.dataset.defense),
          hp: Number(card.dataset.hp)
        };
        document.getElementById('selectedCharacterName').textContent = card.dataset.name;
      });
    });
  }

  async confirmCharacter() {
    if (!this.selectedCharacter) {
      this.notify('Please select a character', 'error');
      return;
    }

    if (!this.player) {
      this.notify('Please log in first', 'error');
      return;
    }

    this.player.character = {
      ...this.player.character,
      name: `${this.player.username}'s ${this.selectedCharacter.name}`,
      archetype: this.selectedCharacter.name,
      attack: this.selectedCharacter.attack,
      defense: this.selectedCharacter.defense,
      hp: this.selectedCharacter.hp,
      max_hp: this.selectedCharacter.hp,
      level: 1,
      wins: 0,
      losses: 0,
      gold: 100,
      rank: 1,
      bosses_defeated: []
    };

    localStorage.setItem('player_data', JSON.stringify(this.player));
    await this.saveProgress();
    this.renderHub();
    this.showScreen('gameScreen');
  }

  renderHub() {
    const player = this.player || { character: { name: 'Hunter', archetype: 'Unknown', level: 1, hp: 100, max_hp: 100, attack: 16, defense: 5, gold: 100, rank: 1, wins: 0, losses: 0 } };
    const char = player.character;

    document.getElementById('hunterNameDisplay').textContent = char.name || 'Hunter';
    document.getElementById('characterArchetype').textContent = char.archetype || 'Unknown';
    document.getElementById('levelDisplay').textContent = char.level || 1;
    document.getElementById('hpDisplay').textContent = `${char.hp || 100}/${char.max_hp || 100}`;
    document.getElementById('attackDisplay').textContent = char.attack || 16;
    document.getElementById('defenseDisplay').textContent = char.defense || 5;
    document.getElementById('goldDisplay').textContent = char.gold || 100;
    document.getElementById('rankDisplay').textContent = char.rank || 1;
    document.getElementById('recordDisplay').textContent = `${char.wins || 0}W - ${char.losses || 0}L`;
  }

  showCutscene() {
    document.getElementById('cutsceneModal').classList.add('active');
  }

  hideCutscene() {
    document.getElementById('cutsceneModal').classList.remove('active');
  }

  async startBattle() {
    const bosses = [
      { name: 'Whisper Wraith', archetype: 'Spirit Guardian', map: 'Whisperwood Forest', hp: 150, attack: 20, emoji: '👻' },
      { name: 'Inferno Overlord', archetype: 'Fire Demon', map: 'Scorched Volcano', hp: 250, attack: 30, emoji: '🔥' },
      { name: 'Void Leviathan', archetype: 'Ancient Horror', map: 'The Abyss', hp: 400, attack: 40, emoji: '🌌' },
      { name: 'Eternal Sovereign', archetype: 'Celestial Demon King', map: 'Celestial Realm', hp: 600, attack: 50, emoji: '👑' }
    ];

    const boss = bosses[Math.floor(Math.random() * bosses.length)];
    const char = this.player.character;

    this.battleState = {
      playerName: char.name,
      playerHp: char.hp,
      playerMaxHp: char.max_hp,
      playerAttack: char.attack,
      playerDefense: char.defense,
      bossName: boss.name,
      bossHp: boss.hp,
      bossMaxHp: boss.hp,
      bossAttack: boss.attack,
      bossPhase: 1,
      isPlayerTurn: true,
      bossEmoji: boss.emoji
    };

    this.currentBattle = { battle_id: `battle-${Date.now()}` };
    this.isBattleActive = true;

    document.getElementById('playerNameLabel').textContent = this.battleState.playerName;
    document.getElementById('bossNameLabel').textContent = this.battleState.bossName;
    document.getElementById('bossPortrait').textContent = this.battleState.bossEmoji;

    this.updateBattleUi();
    this.showScreen('battleScreen');
    this.showPhaseIndicator(1);
  }

  updateBattleUi() {
    if (!this.battleState) return;

    const playerHpPercent = Math.max(0, (this.battleState.playerHp / this.battleState.playerMaxHp) * 100);
    const bossHpPercent = Math.max(0, (this.battleState.bossHp / this.battleState.bossMaxHp) * 100);

    document.getElementById('playerHpFill').style.width = `${playerHpPercent}%`;
    document.getElementById('playerHpText').textContent = `${Math.max(0, this.battleState.playerHp)} / ${this.battleState.playerMaxHp} HP`;
    document.getElementById('bossHpFill').style.width = `${bossHpPercent}%`;
    document.getElementById('bossHpText').textContent = `${Math.max(0, this.battleState.bossHp)} / ${this.battleState.bossMaxHp} HP`;
  }

  showPhaseIndicator(phase) {
    const phaseBox = document.getElementById('phaseIndicator');
    const phaseNumber = document.getElementById('phaseNumber');
    phaseNumber.textContent = phase;
    phaseBox.style.display = 'block';
  }

  performAction(action) {
    if (!this.battleState || !this.isBattleActive) return;

    if (!this.battleState.isPlayerTurn) {
      this.notify('Enemy is acting...', 'info');
      return;
    }

    switch (action) {
      case 'attack':
        this.applyPlayerDamage(this.battleState.playerAttack + Math.floor(Math.random() * 7));
        break;
      case 'skill':
        this.applyPlayerDamage(Math.floor(this.battleState.playerAttack * 1.7));
        break;
      case 'defend':
        this.battleState.playerDefense += 6;
        this.battleState.isPlayerTurn = false;
        this.notify('You brace for impact.', 'success');
        setTimeout(() => this.enemyTurn(), 900);
        break;
      case 'retreat':
        this.endBattle('boss');
        break;
    }
  }

  applyPlayerDamage(amount) {
    const damage = Math.max(1, amount - 4);
    this.battleState.bossHp = Math.max(0, this.battleState.bossHp - damage);
    this.createFloatingDamage(damage, 'enemy');
    this.battleState.isPlayerTurn = false;
    this.checkBossPhase();
    this.updateBattleUi();

    if (this.battleState.bossHp <= 0) {
      this.endBattle('player');
      return;
    }

    setTimeout(() => this.enemyTurn(), 900);
  }

  enemyTurn() {
    if (!this.battleState) return;

    const actionRoll = Math.random();
    let damage = 0;

    if (actionRoll > 0.55) {
      damage = Math.max(1, this.battleState.bossAttack + Math.floor(Math.random() * 10));
      this.battleState.playerHp = Math.max(0, this.battleState.playerHp - (damage - this.battleState.playerDefense));
      this.createFloatingDamage(damage - this.battleState.playerDefense, 'player');
      this.notify(`${this.battleState.bossName} hits for ${damage - this.battleState.playerDefense}!`, 'error');
    } else {
      damage = Math.max(1, Math.floor(this.battleState.bossAttack * 1.4));
      this.battleState.playerHp = Math.max(0, this.battleState.playerHp - damage);
      this.createFloatingDamage(damage, 'player');
      this.notify(`${this.battleState.bossName} unleashes a special attack!`, 'error');
    }

    this.battleState.playerDefense = this.player.character.defense;
    this.updateBattleUi();

    if (this.battleState.playerHp <= 0) {
      this.endBattle('boss');
      return;
    }

    this.battleState.isPlayerTurn = true;
  }

  checkBossPhase() {
    if (!this.battleState) return;

    let nextPhase = 1;
    const ratio = this.battleState.bossHp / this.battleState.bossMaxHp;

    if (ratio <= 0.75) nextPhase = 2;
    if (ratio <= 0.5) nextPhase = 3;
    if (ratio <= 0.25) nextPhase = 4;

    if (nextPhase > this.battleState.bossPhase) {
      this.battleState.bossPhase = nextPhase;
      this.battleState.bossAttack = Math.floor(this.battleState.bossAttack * 1.18);
      this.showPhaseIndicator(nextPhase);
      this.notify(`Boss enters Phase ${nextPhase}!`, 'success');
    }
  }

  createFloatingDamage(amount, target) {
    const container = target === 'enemy'
      ? document.getElementById('bossHpText').parentElement
      : document.getElementById('playerHpText').parentElement;

    const damageEl = document.createElement('div');
    damageEl.textContent = `-${amount}`;
    damageEl.style.position = 'absolute';
    damageEl.style.left = '50%';
    damageEl.style.top = '50%';
    damageEl.style.transform = 'translate(-50%, -50%)';
    damageEl.style.fontSize = '2rem';
    damageEl.style.fontWeight = '900';
    damageEl.style.color = target === 'enemy' ? '#fbbf24' : '#fb7185';
    damageEl.style.textShadow = `0 0 12px ${target === 'enemy' ? '#fbbf24' : '#fb7185'}`;
    damageEl.style.animation = 'floatUp 1.5s ease-out forwards';

    container.appendChild(damageEl);
    setTimeout(() => damageEl.remove(), 1500);
  }

  async endBattle(winner) {
    this.isBattleActive = false;
    const rewards = winner === 'player'
      ? { gold: 120 + this.battleState.bossPhase * 40, exp: 200 + this.battleState.bossPhase * 75 }
      : { gold: 0, exp: 0 };

    const hi = this.player.character;
    if (winner === 'player') {
      hi.gold = (hi.gold || 0) + rewards.gold;
      hi.wins = (hi.wins || 0) + 1;
      hi.rank = (hi.rank || 1) + 1;
    } else {
      hi.losses = (hi.losses || 0) + 1;
    }

    this.player.character = hi;
    localStorage.setItem('player_data', JSON.stringify(this.player));
    await this.saveProgress();

    this.notify(winner === 'player' ? `Victory! +${rewards.gold} gold` : 'Defeat! Get back in the fight.', winner === 'player' ? 'success' : 'error');
    this.showScreen('gameScreen');
    this.renderHub();
    this.battleState = null;
    this.currentBattle = null;
  }

  async saveProgress() {
    if (!this.token || !this.player) return;

    try {
      await fetch(`${API_URL}/player/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          character: this.player.character,
          progression: this.player.progression || {}
        })
      });
    } catch (error) {
      console.warn('Cloud save failed:', error);
    }
  }

  showProfileStats() {
    const char = this.player.character;
    this.notify(`Level ${char.level} • Gold ${char.gold} • Rank ${char.rank} • Wins ${char.wins || 0}`, 'info');
  }

  notify(message, type = 'info') {
    const existing = document.getElementById('app-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-notification';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.padding = '14px 18px';
    toast.style.borderRadius = '10px';
    toast.style.fontWeight = '900';
    toast.style.color = '#0b1020';
    toast.style.background = type === 'error' ? '#fb7185' : type === 'success' ? '#34d399' : '#67e8f9';
    toast.style.boxShadow = '0 10px 24px rgba(0,0,0,0.25)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
}

window.gameClient = new GameClient();
