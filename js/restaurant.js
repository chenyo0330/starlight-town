/**
 * 🏪 4. 模擬城市雙重經營系統 (Restaurant & Tycoon)
 * 包含：
 * 1. 🌟 魔法親自經營（主動劃圈擠冰淇淋、堆疊水果 -> 1.5倍金幣 + 雙倍星星）
 * 2. 🐾 寵物代理經營（小貓店長戴高帽自動賣餐給 NPC，右上角定時彈出提示 + 回家領金幣寶箱）
 * 3. 🏙️ 餐廳擴建升級（聘請麵包兔、水手鴨、擴建露天彩虹陽傘桌椅）
 */

class RestaurantSystem {
  constructor(gameState) {
    this.state = gameState;
    this.canvas = document.getElementById('cooking-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // 親自下廚小遊戲階段：0=尚未開始, 1=劃圈擠冰淇淋, 2=點擊堆疊草莓水果, 3=灑上星光糖粉, 4=完成
    this.cookStep = 0;
    this.swirlProgress = 0;
    this.fruitCount = 0;
    this.sprinkleCount = 0;
    this.isPointerDown = false;
    this.lastAngle = null;

    this.initEvents();
    this.startAutoTycoonLoop();
  }

  initEvents() {
    if (!this.canvas) return;

    const getPos = e => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
        y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
      };
    };

    this.canvas.addEventListener('pointerdown', e => {
      this.isPointerDown = true;
      const pos = getPos(e);
      this.handleCookInteraction(pos, true);
    });

    this.canvas.addEventListener('pointermove', e => {
      if (!this.isPointerDown) return;
      const pos = getPos(e);
      this.handleCookInteraction(pos, false);
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
      this.lastAngle = null;
    });
  }

  startCooking() {
    if (
      this.state.ingredients.strawberry < 1 ||
      this.state.ingredients.milk < 1 ||
      this.state.ingredients.flour < 1
    ) {
      // 若食材不足，貼心給予新手魔法補充或提示採集
      window.Sound.playChime(320, 0.2, 'sawtooth');
      const statusEl = document.getElementById('cook-step-hint');
      if (statusEl) {
        statusEl.innerHTML = window.Bopomofo.toHTML('食材不夠喔！請出門採集草莓，或點擊下方一鍵領取魔法食材補給！');
      }
      return;
    }

    this.state.ingredients.strawberry -= 1;
    this.state.ingredients.milk -= 1;
    this.state.ingredients.flour -= 1;
    this.cookStep = 1;
    this.swirlProgress = 0;
    this.fruitCount = 0;
    this.sprinkleCount = 0;
    window.Sound.playChime(587.33, 0.15);
    this.updateUI();
    this.renderCookingCanvas();
  }

  giveStarterIngredients() {
    this.state.ingredients.strawberry += 3;
    this.state.ingredients.milk += 3;
    this.state.ingredients.flour += 3;
    window.Sound.playCoin();
    this.updateUI();
    this.state.updateHUD();
  }

  handleCookInteraction(pos, isTap) {
    if (this.cookStep === 0) {
      this.startCooking();
      return;
    }

    if (this.cookStep === 1) {
      // 步驟 1：劃圈擠冰淇淋
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2 + 10;
      const angle = Math.atan2(pos.y - cy, pos.x - cx);
      if (this.lastAngle !== null) {
        let diff = Math.abs(angle - this.lastAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        this.swirlProgress = Math.min(100, this.swirlProgress + diff * 28);
        if (Math.random() < 0.25) window.Sound.playChime(440 + this.swirlProgress * 3, 0.05);
      }
      this.lastAngle = angle;

      if (this.swirlProgress >= 100) {
        this.cookStep = 2;
        window.Sound.playStar();
        this.updateUI();
      }
      this.renderCookingCanvas();
    } else if (this.cookStep === 2 && isTap) {
      // 步驟 2：點擊堆疊 4 顆彩虹草莓
      this.fruitCount++;
      window.Sound.playNote(this.fruitCount + 2);
      if (this.fruitCount >= 4) {
        this.cookStep = 3;
        this.updateUI();
      }
      this.renderCookingCanvas();
    } else if (this.cookStep === 3 && isTap) {
      // 步驟 3：點擊灑上星光彩虹糖粉 (3 次)
      this.sprinkleCount++;
      window.Sound.playNote(this.sprinkleCount + 5);
      if (this.sprinkleCount >= 3) {
        this.finishCooking();
      }
      this.renderCookingCanvas();
    }
  }

  finishCooking() {
    this.cookStep = 4;
    // 親自下廚獎勵：1.5 倍金幣 (75 金幣) + 雙倍星星獎勵 (40 EXP) + 玻璃櫥窗增加 2 份帕菲供小貓代理販售！
    const bonusCoin = this.state.upgrades.umbrellaTables ? 95 : 75;
    this.state.addCoins(bonusCoin);
    this.state.addExp(40);
    this.state.showcaseCount += 2;
    window.Sound.playFanfare();
    this.updateUI();
    this.renderCookingCanvas();

    setTimeout(() => {
      if (this.cookStep === 4) {
        this.cookStep = 0;
        this.updateUI();
        this.renderCookingCanvas();
      }
    }, 2400);
  }

  renderCookingCanvas() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 柔和夢幻甜點背景
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fff5f8');
    grad.addColorStop(1, '#f3e8ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cupBottomY = h - 22;

    // 繪製玻璃帕菲高腳杯
    ctx.save();
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3.5;
    ctx.fillStyle = 'rgba(207, 239, 255, 0.55)';
    // 杯底與杯柱
    ctx.beginPath();
    ctx.ellipse(cx, cupBottomY, 44, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillRect(cx - 8, cupBottomY - 36, 16, 36);
    ctx.strokeRect(cx - 8, cupBottomY - 36, 16, 36);

    // 杯身
    ctx.beginPath();
    ctx.moveTo(cx - 64, cupBottomY - 125);
    ctx.lineTo(cx - 28, cupBottomY - 34);
    ctx.lineTo(cx + 28, cupBottomY - 34);
    ctx.lineTo(cx + 64, cupBottomY - 125);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 繪製冰淇淋螺旋層
    const swirlLayers = this.cookStep === 0 ? 3 : Math.ceil((this.swirlProgress / 100) * 4);
    const layerColors = ['#ff9ebb', '#ffb3c6', '#e0aaff', '#cdb4db'];
    for (let i = 0; i < swirlLayers; i++) {
      const ly = cupBottomY - 62 - i * 22;
      const lw = 56 - i * 9;
      ctx.save();
      ctx.fillStyle = layerColors[i % layerColors.length];
      ctx.strokeStyle = '#5e3a24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, ly, lw, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 繪製堆疊的草莓水果
    const fruitsToShow = this.cookStep === 0 ? 4 : this.fruitCount;
    const fruitOffsets = [
      { x: -34, y: -95, icon: '🍓' },
      { x: 34, y: -95, icon: '🍓' },
      { x: -16, y: -122, icon: '🫐' },
      { x: 18, y: -122, icon: '🍓' }
    ];
    for (let i = 0; i < fruitsToShow && i < fruitOffsets.length; i++) {
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fruitOffsets[i].icon, cx + fruitOffsets[i].x, cupBottomY + fruitOffsets[i].y);
    }

    // 繪製星光糖粉與星星裝飾
    if (this.cookStep === 0 || this.sprinkleCount > 0) {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌟', cx, cupBottomY - 146);
      ctx.font = '18px sans-serif';
      ctx.fillText('✨', cx - 45, cupBottomY - 135);
      ctx.fillText('✨', cx + 45, cupBottomY - 135);
    }

    // 繪製操作引導覆蓋層
    ctx.save();
    ctx.font = 'bold 17px "Microsoft JhengHei"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5e3a24';
    if (this.cookStep === 1) {
      ctx.fillText(`🌀 請在畫面上劃圈擠冰淇淋 (${Math.round(this.swirlProgress)}%)`, cx, 28);
      // 畫出旋轉箭頭提示
      ctx.strokeStyle = '#ff5d8f';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, h / 2, 58, 0, Math.PI * 1.65);
      ctx.stroke();
    } else if (this.cookStep === 2) {
      ctx.fillText(`🍓 請點擊畫面堆疊彩虹草莓 (${this.fruitCount}/4)`, cx, 28);
    } else if (this.cookStep === 3) {
      ctx.fillText(`✨ 請點擊灑上魔法星光糖粉 (${this.sprinkleCount}/3)`, cx, 28);
    } else if (this.cookStep === 4) {
      ctx.fillStyle = '#e04580';
      ctx.fillText('🎉 完成「彩虹星光草莓帕菲」！金幣1.5倍 + 櫥窗+2份！', cx, 28);
    } else {
      ctx.fillText('👩‍🍳 點擊此處或下方按鈕開始「魔法親自下廚」！', cx, 28);
    }
    ctx.restore();
  }

  startAutoTycoonLoop() {
    // 每 6 秒執行一次自動掛機循環：
    // 1. 若已聘請麵包兔/水手鴨，定時補充小麥粉與鮮奶
    // 2. 若玻璃櫥窗有帕菲庫存，小貓代理店長自動賣出並彈出右上角通知！
    setInterval(() => {
      let updated = false;

      if (this.state.upgrades.breadBunny && this.state.ingredients.flour < 20) {
        this.state.ingredients.flour += 1;
        updated = true;
      }
      if (this.state.upgrades.sailorDuck && this.state.ingredients.milk < 20) {
        this.state.ingredients.milk += 1;
        updated = true;
      }

      if (this.state.showcaseCount > 0) {
        this.state.showcaseCount -= 1;
        const unitPrice = this.state.upgrades.umbrellaTables ? 65 : 50;
        this.state.chestCoins += unitPrice;
        this.state.addCoins(unitPrice);
        this.showCatSaleToast(unitPrice);
        updated = true;
      }

      if (updated) {
        this.updateUI();
        this.state.updateHUD();
      }
    }, 6500);
  }

  showCatSaleToast(coinAmount) {
    const container = document.getElementById('cat-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'cat-toast';
    toast.innerHTML = `
      <span style="font-size:28px;">🐱🎩</span>
      <div>
        ${window.Bopomofo.toHTML(`小貓店長賣出了 1 份冰淇淋帕菲！`)}
        <strong style="color:#e04580; margin-left:6px;">💰 +${coinAmount} ${window.Bopomofo.toHTML('金幣')}</strong>
      </div>
    `;
    container.appendChild(toast);
    window.Sound.playCoin();

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4100);
  }

  collectChestCoins() {
    if (this.state.chestCoins <= 0) {
      window.Sound.playChime(400, 0.15);
      return;
    }
    const bonus = Math.round(this.state.chestCoins * 0.5);
    this.state.chestCoins = 0;
    this.state.addCoins(bonus);
    this.state.addExp(25);
    window.Sound.playFanfare();
    this.updateUI();
  }

  buyUpgrade(key, cost) {
    if (this.state.upgrades[key]) return;
    if (this.state.coins < cost) {
      window.Sound.playChime(300, 0.2, 'sawtooth');
      return;
    }
    this.state.coins -= cost;
    this.state.upgrades[key] = true;
    this.state.addExp(35);
    window.Sound.playFanfare();
    this.updateUI();
    this.state.updateHUD();
  }

  updateUI() {
    const sbEl = document.getElementById('ing-strawberry');
    const mkEl = document.getElementById('ing-milk');
    const flEl = document.getElementById('ing-flour');
    const scEl = document.getElementById('showcase-count');
    const ccEl = document.getElementById('chest-coins-val');
    const stepHint = document.getElementById('cook-step-hint');

    if (sbEl) sbEl.textContent = this.state.ingredients.strawberry;
    if (mkEl) mkEl.textContent = this.state.ingredients.milk;
    if (flEl) flEl.textContent = this.state.ingredients.flour;
    if (scEl) scEl.textContent = this.state.showcaseCount;
    if (ccEl) ccEl.textContent = this.state.chestCoins;

    if (stepHint) {
      const hints = {
        0: '點擊「開始親自下廚」製作彩虹星光草莓冰淇淋帕菲（享 1.5 倍金幣 + 雙倍星星）！',
        1: '第 1 步：在左側畫布上劃圈圈擠出香甜冰淇淋！',
        2: '第 2 步：點擊畫布把新鮮彩虹草莓堆疊上去！',
        3: '第 3 步：點擊畫布灑上閃亮亮的星光糖粉！',
        4: '太棒了！料理完成並已擺入玻璃櫥窗，小貓店長開始自動賣餐囉！'
      };
      stepHint.innerHTML = window.Bopomofo.toHTML(hints[this.cookStep] || hints[0]);
    }

    // 更新擴建升級按鈕狀態
    const upgDefs = [
      { key: 'breadBunny', btnId: 'btn-upg-bunny', cost: 100 },
      { key: 'sailorDuck', btnId: 'btn-upg-duck', cost: 120 },
      { key: 'umbrellaTables', btnId: 'btn-upg-table', cost: 150 }
    ];
    for (const u of upgDefs) {
      const btn = document.getElementById(u.btnId);
      if (btn) {
        if (this.state.upgrades[u.key]) {
          btn.disabled = true;
          btn.innerHTML = window.Bopomofo.toHTML('✅ 已聘請 / 已擴建');
          btn.style.opacity = '0.7';
        } else {
          btn.disabled = false;
          btn.innerHTML = `💰 ${u.cost} ` + window.Bopomofo.toHTML('金幣解鎖');
        }
      }
    }

    this.renderCookingCanvas();
  }
}

window.RestaurantSystem = RestaurantSystem;
