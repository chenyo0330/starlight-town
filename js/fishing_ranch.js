/**
 * 🎣🐑 v2.0 《哆啦A夢 牧場物語》風格：溪釣與海釣系統 + 熊熊雜貨鋪買飼料 + 陽光牧場養羊養雞系統
 */

const FISH_CATALOG = {
  creek: [
    { id: 'ayu', name: '黃金小香魚', icon: '🐟', ingKey: 'creekFish', amount: 2, rarity: '常見溪魚', exp: 18 },
    { id: 'chub', name: '彩虹溪哥', icon: '🐠', ingKey: 'creekFish', amount: 2, rarity: '人氣溪魚', exp: 20 },
    { id: 'shrimp', name: '水晶甜河蝦', icon: '🦐', ingKey: 'shrimp', amount: 2, rarity: '稀有溪鮮', exp: 25 },
    { id: 'sakura_trout', name: '星光櫻花鱒', icon: '🌸🐟', ingKey: 'creekFish', amount: 3, rarity: '傳說溪魚', exp: 40 }
  ],
  sea: [
    { id: 'flounder', name: '珍珠小比目魚', icon: '🐡', ingKey: 'seaFish', amount: 2, rarity: '常見海魚', exp: 22 },
    { id: 'bream', name: '粉紅星光鯛魚', icon: '🐠', ingKey: 'seaFish', amount: 2, rarity: '人氣海魚', exp: 28 },
    { id: 'tuna', name: '藍寶石小鮪魚', icon: '🐟', ingKey: 'seaFish', amount: 3, rarity: '傳說海魚', exp: 45 },
    { id: 'sea_shrimp', name: '海洋大明蝦', icon: '🦐', ingKey: 'shrimp', amount: 3, rarity: '稀有海味', exp: 30 }
  ]
};

class FishingAndRanchSystem {
  constructor(gameState, world) {
    this.state = gameState;
    this.world = world;

    // 釣魚畫布與狀態
    this.fishCanvas = document.getElementById('fishing-canvas');
    this.fishCtx = this.fishCanvas ? this.fishCanvas.getContext('2d') : null;
    this.spotType = 'creek'; // 'creek' (微風清溪) | 'sea' (蔚藍海岸)
    // phase: 'ready' (準備拋竿) -> 'waiting' (浮標等待魚咬鉤) -> 'bite' (❗️咬鉤拉竿時機) -> 'caught' (釣起展示)
    this.fishPhase = 'ready';
    this.bobber = { x: 340, y: 180, ripple: 0 };
    this.fishShadows = [];
    this.biteTimer = 0;
    this.caughtFish = null;
    this.animId = null;

    this.initFishingInput();
  }

  initFishingInput() {
    if (!this.fishCanvas) return;
    this.fishCanvas.addEventListener('pointerdown', () => {
      this.handleFishingAction();
    });
  }

  openFishingSpot(spotType = 'creek') {
    this.spotType = spotType;
    this.fishPhase = 'ready';
    this.caughtFish = null;

    // 產生 4 隻游動的水中魚影
    this.fishShadows = [];
    for (let i = 0; i < 4; i++) {
      this.fishShadows.push({
        x: 100 + Math.random() * 480,
        y: 110 + Math.random() * 140,
        vx: (Math.random() < 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.2),
        size: 0.85 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2
      });
    }

    window.GameApp.openModal('fishing-modal');
    this.updateFishingUI();

    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      const modal = document.getElementById('fishing-modal');
      if (!modal || modal.classList.contains('hidden')) return;
      this.updateFishing();
      this.renderFishing();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  handleFishingAction() {
    if (this.fishPhase === 'ready' || this.fishPhase === 'caught') {
      // 拋竿！
      this.fishPhase = 'waiting';
      this.bobber.x = 260 + Math.random() * 180;
      this.bobber.y = 145 + Math.random() * 70;
      this.biteTimer = 65 + Math.floor(Math.random() * 65); // 約 1~2 秒後咬鉤
      window.Sound.playSplash();
      this.updateFishingUI();
    } else if (this.fishPhase === 'waiting') {
      // 太早拉竿，重新拋竿
      window.Sound.playChime(320, 0.15, 'sawtooth');
      this.fishPhase = 'ready';
      this.updateFishingUI();
    } else if (this.fishPhase === 'bite') {
      // 成功在咬鉤時拉竿！
      this.catchRandomFish();
    }
  }

  catchRandomFish() {
    const pool = FISH_CATALOG[this.spotType] || FISH_CATALOG.creek;
    const fish = pool[Math.floor(Math.random() * pool.length)];
    this.caughtFish = fish;
    this.fishPhase = 'caught';

    this.state.ingredients[fish.ingKey] = (this.state.ingredients[fish.ingKey] || 0) + fish.amount;
    this.state.addExp(fish.exp);
    window.Sound.playFanfare();
    this.updateFishingUI();
    this.state.updateHUD();
  }

  updateFishing() {
    this.bobber.ripple += 0.08;

    // 更新水下魚影游動
    for (const s of this.fishShadows) {
      s.phase += 0.12;
      if (this.fishPhase === 'waiting' || this.fishPhase === 'bite') {
        // 魚影朝向浮標靠近
        s.x += (this.bobber.x - s.x) * 0.02 + s.vx * 0.4;
        s.y += (this.bobber.y - s.y) * 0.02;
      } else {
        s.x += s.vx;
        if (s.x < 70 || s.x > 610) s.vx *= -1;
      }
    }

    if (this.fishPhase === 'waiting') {
      this.biteTimer--;
      if (this.biteTimer <= 0) {
        this.fishPhase = 'bite';
        this.biteTimer = 110; // 給予充裕的反應時間讓 8 歲小朋友點擊收竿
        window.Sound.playSplash();
        this.updateFishingUI();
      }
    } else if (this.fishPhase === 'bite') {
      this.biteTimer--;
      if (this.biteTimer <= 0) {
        // 就算小朋友稍微慢一點，也貼心自動幫他拉起來或提示再拋一次
        this.catchRandomFish();
      }
    }
  }

  renderFishing() {
    if (!this.fishCtx || !this.fishCanvas) return;
    const ctx = this.fishCtx;
    const w = this.fishCanvas.width;
    const h = this.fishCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // 繪製溪流或海洋水波背景
    const isCreek = this.spotType === 'creek';
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (isCreek) {
      grad.addColorStop(0, '#a8e6cf');
      grad.addColorStop(0.28, '#56cfe1');
      grad.addColorStop(1, '#4ea8de');
    } else {
      grad.addColorStop(0, '#90e0ef');
      grad.addColorStop(0.28, '#00b4d8');
      grad.addColorStop(1, '#0077b6');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 岸邊草地或木棧道裝飾
    ctx.fillStyle = isCreek ? '#d8f3dc' : '#f4a261';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3;
    ctx.fillRect(0, 0, w, 54);
    ctx.strokeRect(0, 0, w, 54);

    ctx.font = 'bold 18px "Microsoft JhengHei"';
    ctx.fillStyle = '#5e3a24';
    ctx.textAlign = 'left';
    ctx.fillText(
      isCreek ? '🏞️ 微風清溪釣場（可釣：香魚、櫻花鱒、水晶河蝦）' : '🌊 蔚藍海岸木棧釣場（可釣：星光鯛魚、藍寶石鮪魚、比目魚）',
      20,
      34
    );

    // 繪製水下魚影
    for (const s of this.fishShadows) {
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.vx < 0) ctx.scale(-1, 1);
      ctx.scale(s.size, s.size);
      ctx.fillStyle = 'rgba(18, 52, 86, 0.32)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-36, -10 + Math.sin(s.phase) * 4);
      ctx.lineTo(-36, 10 + Math.sin(s.phase) * 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 繪製釣竿與釣魚線
    if (this.fishPhase === 'waiting' || this.fishPhase === 'bite') {
      const bobY = this.bobber.y + (this.fishPhase === 'bite' ? Math.sin(Date.now() * 0.05) * 9 : Math.sin(this.bobber.ripple) * 4);

      // 水波紋
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(this.bobber.x, bobY + 8, 28 + Math.sin(this.bobber.ripple) * 8, 11, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 釣魚線
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w - 70, 40);
      ctx.quadraticCurveTo((w - 70 + this.bobber.x) / 2, 70, this.bobber.x, bobY);
      ctx.stroke();

      // 星光浮標
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌟', this.bobber.x, bobY + 6);

      if (this.fishPhase === 'bite') {
        ctx.fillStyle = '#fff0f6';
        ctx.strokeStyle = '#e04580';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(this.bobber.x - 95, bobY - 68, 190, 42, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 20px "Microsoft JhengHei"';
        ctx.fillStyle = '#e04580';
        ctx.fillText('❗️ 咬鉤了！快點拉竿！', this.bobber.x, bobY - 40);
      }
    }

    // 若成功釣起魚，顯示大大的漁獲圖鑑卡！
    if (this.fishPhase === 'caught' && this.caughtFish) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 252, 245, 0.96)';
      ctx.strokeStyle = '#5e3a24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(w / 2 - 185, 76, 370, 175, 26);
      ctx.fill();
      ctx.stroke();

      ctx.font = '56px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.caughtFish.icon, w / 2, 140);

      ctx.font = 'bold 22px "Microsoft JhengHei"';
      ctx.fillStyle = '#e04580';
      ctx.fillText(`🎉 釣到了「${this.caughtFish.name}」x${this.caughtFish.amount}！`, w / 2, 185);

      ctx.font = 'bold 16px "Microsoft JhengHei"';
      ctx.fillStyle = '#2a9d8f';
      ctx.fillText(`（${this.caughtFish.rarity}｜已放入餐廳食材背包，可做鮮魚料理！）`, w / 2, 222);
      ctx.restore();
    }
  }

  updateFishingUI() {
    const titleEl = document.getElementById('fishing-modal-title');
    const btnEl = document.getElementById('fishing-action-btn');
    const countsEl = document.getElementById('fishing-bag-summary');

    if (titleEl) {
      titleEl.innerHTML = window.Bopomofo.toHTML(
        this.spotType === 'creek' ? '🏞️ 微風清溪垂釣（溪釣）' : '🌊 蔚藍海岸木棧道垂釣（海釣）'
      );
    }

    if (btnEl) {
      if (this.fishPhase === 'ready') {
        btnEl.innerHTML = `🎣 ${window.Bopomofo.toHTML('拋出星光釣竿')}`;
      } else if (this.fishPhase === 'waiting') {
        btnEl.innerHTML = `⏳ ${window.Bopomofo.toHTML('等待魚兒咬鉤中...')}`;
      } else if (this.fishPhase === 'bite') {
        btnEl.innerHTML = `❗️ ${window.Bopomofo.toHTML('咬鉤了！用力拉竿！')}`;
      } else {
        btnEl.innerHTML = `🎣 ${window.Bopomofo.toHTML('再釣一次魚')}`;
      }
    }

    if (countsEl) {
      countsEl.innerHTML = `
        <span>🐟 ${window.Bopomofo.toHTML('溪魚')}: <strong>${this.state.ingredients.creekFish || 0}</strong></span>
        <span>🐠 ${window.Bopomofo.toHTML('海魚')}: <strong>${this.state.ingredients.seaFish || 0}</strong></span>
        <span>🦐 ${window.Bopomofo.toHTML('鮮蝦')}: <strong>${this.state.ingredients.shrimp || 0}</strong></span>
      `;
    }
  }

  /* ==========================================================================
     🐻 熊熊店長雜貨鋪 & 陽光牧場養羊養雞系統
     ========================================================================== */
  buyShopItem(itemType) {
    if (itemType === 'chicken_feed') {
      if (this.state.coins < 10) return this.notEnoughCoins();
      this.state.coins -= 10;
      this.state.feeds.chickenFeed += 3;
      window.Sound.playCoin();
    } else if (itemType === 'sheep_feed') {
      if (this.state.coins < 15) return this.notEnoughCoins();
      this.state.coins -= 15;
      this.state.feeds.sheepFeed += 3;
      window.Sound.playCoin();
    } else if (itemType === 'buy_chicken') {
      if (this.state.coins < 50) return this.notEnoughCoins();
      this.state.coins -= 50;
      this.world.addRanchAnimal('chicken');
      window.Sound.playCluck();
    } else if (itemType === 'buy_sheep') {
      if (this.state.coins < 70) return this.notEnoughCoins();
      this.state.coins -= 70;
      this.world.addRanchAnimal('sheep');
      window.Sound.playBaa();
    } else if (itemType === 'buy_mushroom') {
      if (this.state.coins < 12) return this.notEnoughCoins();
      this.state.coins -= 12;
      this.state.ingredients.mushroom += 3;
      window.Sound.playCoin();
    }

    this.updateShopAndRanchUI();
    this.state.updateHUD();
  }

  notEnoughCoins() {
    window.Sound.playChime(280, 0.2, 'sawtooth');
  }

  feedAllAnimalsInModal() {
    let fedAny = false;
    for (const anim of this.world.ranchAnimals) {
      if (anim.species === 'chicken' && this.state.feeds.chickenFeed > 0) {
        this.state.feeds.chickenFeed--;
        anim.hungry = false;
        anim.hasProduct = true;
        this.state.ingredients.egg += 2;
        fedAny = true;
      } else if (anim.species === 'sheep' && this.state.feeds.sheepFeed > 0) {
        this.state.feeds.sheepFeed--;
        anim.hungry = false;
        anim.hasProduct = true;
        this.state.ingredients.milk += 2;
        this.state.ingredients.wool += 1;
        fedAny = true;
      }
    }

    if (fedAny) {
      window.Sound.playFanfare();
      this.state.addExp(30);
    } else {
      // 若飼料剛好用完，貼心免費贈送各 2 包新手飼料並完成餵食！
      this.state.feeds.chickenFeed += 2;
      this.state.feeds.sheepFeed += 2;
      this.state.ingredients.egg += 2;
      this.state.ingredients.milk += 2;
      this.state.ingredients.wool += 1;
      window.Sound.playFanfare();
    }

    this.updateShopAndRanchUI();
    this.state.updateHUD();
  }

  weaveWoolOutfit() {
    if (this.state.ingredients.wool < 1) {
      window.Sound.playChime(300, 0.15, 'sawtooth');
      return;
    }
    this.state.ingredients.wool -= 1;
    this.state.unlockItem('plush_cape');
    this.state.equipped.dress = 'plush_cape';
    this.state.addCoins(60);
    window.Sound.playFanfare();
    this.updateShopAndRanchUI();
    this.state.updateHUD();
  }

  updateShopAndRanchUI() {
    const cfEl = document.getElementById('shop-chicken-feed-val');
    const sfEl = document.getElementById('shop-sheep-feed-val');
    const eggEl = document.getElementById('ranch-egg-val');
    const woolEl = document.getElementById('ranch-wool-val');
    const chickenCountEl = document.getElementById('ranch-chicken-count');
    const sheepCountEl = document.getElementById('ranch-sheep-count');

    if (cfEl) cfEl.textContent = this.state.feeds.chickenFeed;
    if (sfEl) sfEl.textContent = this.state.feeds.sheepFeed;
    if (eggEl) eggEl.textContent = this.state.ingredients.egg;
    if (woolEl) woolEl.textContent = this.state.ingredients.wool;

    if (this.world && this.world.ranchAnimals) {
      const chickens = this.world.ranchAnimals.filter(a => a.species === 'chicken').length;
      const sheeps = this.world.ranchAnimals.filter(a => a.species === 'sheep').length;
      if (chickenCountEl) chickenCountEl.textContent = chickens;
      if (sheepCountEl) sheepCountEl.textContent = sheeps;
    }
  }
}

window.FishingAndRanchSystem = FishingAndRanchSystem;
