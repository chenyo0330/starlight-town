/**
 * 🌟 星光鎮 v2.0：自然牧場與溪海垂釣篇 (Main Application Controller)
 * 整合：四大相連地圖、溪釣與海釣、熊熊雜貨鋪買飼料、陽光牧場養羊養雞、餐廳 5 大食譜、小遊戲與換裝
 */

class GameState {
  constructor() {
    this.hp = 100;
    this.maxHp = 100;
    this.level = 1;
    this.exp = 20;
    this.maxExp = 100;
    this.coins = 150;
    this.shards = 1;

    // 餐廳與牧場漁獲食材背包
    this.ingredients = {
      strawberry: 3,
      milk: 3,
      flour: 3,
      egg: 2,
      wool: 1,
      mushroom: 2,
      creekFish: 1,
      seaFish: 1,
      shrimp: 1
    };

    // 牧場飼料袋庫存
    this.feeds = {
      chickenFeed: 3,
      sheepFeed: 3
    };

    this.showcaseCount = 2;
    this.chestCoins = 50;
    this.lastCookedRecipe = null;

    this.upgrades = {
      breadBunny: false,
      sailorDuck: false,
      umbrellaTables: false
    };

    this.unlockedItems = ['default_witch', 'flower_helmet', 'default_dress', 'default_boots', 'none', 'pink_helmet', 'chef_hat'];
    this.unlockedVehicles = ['walk', 'bike', 'scooter', 'car_pink', 'unicorn'];
    this.unlockedPets = ['starlight_cat'];
    this.completedGames = {};

    this.equipped = {
      hat: 'default_witch',
      dress: 'default_dress',
      shoes: 'default_boots',
      wings: 'none',
      petItem: 'pink_helmet',
      colorHue: 0
    };
  }

  addCoins(amount) {
    this.coins += amount;
    this.updateHUD();
  }

  addShards(amount) {
    this.shards = Math.min(99, this.shards + amount);
    this.updateHUD();
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.level++;
      this.maxExp = Math.round(this.maxExp * 1.25);
      window.Sound.playFanfare();
    }
    this.updateHUD();
  }

  unlockItem(itemId) {
    if (!this.unlockedItems.includes(itemId)) {
      this.unlockedItems.push(itemId);
    }
  }

  updateHUD() {
    const hpFill = document.getElementById('hud-hp-fill');
    const expFill = document.getElementById('hud-exp-fill');
    const lvVal = document.getElementById('hud-lv-val');
    const coinVal = document.getElementById('hud-coin-val');
    const shardVal = document.getElementById('hud-shard-val');

    if (hpFill) hpFill.style.width = `${(this.hp / this.maxHp) * 100}%`;
    if (expFill) expFill.style.width = `${(this.exp / this.maxExp) * 100}%`;
    if (lvVal) lvVal.textContent = `Lv.${this.level}`;
    if (coinVal) coinVal.textContent = this.coins;
    if (shardVal) shardVal.textContent = `${this.shards} / 5`;
  }
}

class GameApp {
  constructor() {
    this.state = new GameState();
    this.currentDialogueText = '';
    this.dialogueCallback = null;

    this.renderStaticBopomofo();

    this.world = new window.StarlightWorld('world-canvas', this.state);
    this.restaurant = new window.RestaurantSystem(this.state);
    this.miniGames = new window.MiniGameManager(this.state, this.world);
    this.dressingRoom = new window.DressingRoomSystem(this.state, this.world);
    this.fishingRanch = new window.FishingAndRanchSystem(this.state, this.world);

    window.MiniGames = this.miniGames;
    window.DressingRoom = this.dressingRoom;
    window.Restaurant = this.restaurant;
    window.FishingRanch = this.fishingRanch;

    this.initJoystick();
    this.state.updateHUD();
    this.startMainLoop();

    setTimeout(() => {
      this.showDialogue(
        '熊熊店長',
        'assets/sprites/prop_bear_shop.png',
        '小魔女歡迎回來！現在可以去「陽光牧場」餵小羊跟小雞收雞蛋，還能過木橋去「微風清溪」溪釣，或去「蔚藍海岸」海釣做料理喔！'
      );
    }, 500);
  }

  renderStaticBopomofo() {
    const nodes = document.querySelectorAll('[data-zhuyin]');
    nodes.forEach(el => {
      const raw = el.getAttribute('data-zhuyin');
      el.innerHTML = window.Bopomofo.toHTML(raw);
    });
  }

  initJoystick() {
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    if (!zone || !knob) return;

    let active = false;
    const maxRadius = 46;

    const updateStick = (clientX, clientY) => {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.world.joystickVector.x = dx / maxRadius;
      this.world.joystickVector.y = dy / maxRadius;
    };

    const resetStick = () => {
      active = false;
      knob.style.transform = 'translate(0px, 0px)';
      this.world.joystickVector.x = 0;
      this.world.joystickVector.y = 0;
    };

    zone.addEventListener('pointerdown', e => {
      active = true;
      zone.setPointerCapture(e.pointerId);
      updateStick(e.clientX, e.clientY);
    });

    zone.addEventListener('pointermove', e => {
      if (!active) return;
      updateStick(e.clientX, e.clientY);
    });

    zone.addEventListener('pointerup', resetStick);
    zone.addEventListener('pointercancel', resetStick);
  }

  showDialogue(speakerName, avatarSrc, text, onCloseCallback = null) {
    const box = document.getElementById('dialogue-box');
    const speakerEl = document.getElementById('dialogue-speaker');
    const textEl = document.getElementById('dialogue-text');
    const avatarImg = document.getElementById('dialogue-avatar-img');

    if (!box) return;
    this.currentDialogueText = `${speakerName}說：${text}`;
    this.dialogueCallback = onCloseCallback;

    if (speakerEl) speakerEl.innerHTML = window.Bopomofo.toHTML(speakerName);
    if (textEl) textEl.innerHTML = window.Bopomofo.toHTML(`「${text}」`);
    if (avatarImg && avatarSrc) avatarImg.src = avatarSrc;

    box.classList.remove('hidden');
    window.Sound.playChime(660, 0.12);
  }

  speakCurrentDialogue() {
    if (this.currentDialogueText) {
      window.Sound.speak(this.currentDialogueText);
    }
  }

  closeDialogue() {
    const box = document.getElementById('dialogue-box');
    if (box) box.classList.add('hidden');
    if (this.dialogueCallback) {
      const cb = this.dialogueCallback;
      this.dialogueCallback = null;
      cb();
    }
  }

  openModal(modalId) {
    this.closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      window.Sound.playChime(620, 0.1);
      if (modalId === 'restaurant-modal') {
        this.restaurant.updateUI();
      } else if (modalId === 'dressing-modal') {
        this.dressingRoom.initUI();
      } else if (modalId === 'minigame-modal') {
        this.miniGames.backToLobby();
      } else if (modalId === 'shop-ranch-modal') {
        this.fishingRanch.updateShopAndRanchUI();
      }
    }
  }

  openMiniGame(gameId) {
    this.openModal('minigame-modal');
    this.miniGames.startGame(gameId);
  }

  closeAllModals() {
    this.miniGames.stopGame();
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  }

  travelToMap(mapKey, x = 1380, y = 920) {
    this.closeAllModals();
    this.world.switchMap(mapKey, x, y);
  }

  toggleBGMButton() {
    const playing = window.Sound.toggleBGM();
    const btn = document.getElementById('bgm-toggle-btn');
    if (btn) {
      btn.innerHTML = playing
        ? `🎵 ${window.Bopomofo.toHTML('音樂開')}`
        : `🔇 ${window.Bopomofo.toHTML('音樂關')}`;
    }
  }

  startMainLoop() {
    const loop = () => {
      this.world.update();
      this.world.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.GameApp = new GameApp();
});
