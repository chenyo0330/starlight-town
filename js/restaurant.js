/**
 * 🏪 4. 模擬城市雙重經營系統 (Restaurant & Tycoon v2.0)
 * 新增：結合【野外採集 + 陽光牧場雞蛋/羊奶 + 微風清溪/蔚藍海岸釣魚】的 5 大招牌料理食譜！
 */

const RECIPES = [
  {
    id: 'parfait',
    name: '彩虹星光草莓帕菲',
    icon: '🍧',
    basePrice: 50,
    activePrice: 75,
    cost: { strawberry: 1, milk: 1, flour: 1 },
    costText: '🍓草莓x1 + 🥛鮮奶x1 + 🌾小麥粉x1'
  },
  {
    id: 'souffle',
    name: '黃金雞蛋布丁舒芙蕾',
    icon: '🍮',
    basePrice: 70,
    activePrice: 105,
    cost: { egg: 1, milk: 1, flour: 1 },
    costText: '🥚雞蛋x1 + 🥛鮮奶x1 + 🌾小麥粉x1'
  },
  {
    id: 'ayu_steak',
    name: '奶油香煎黃金香魚',
    icon: '🐟🍳',
    basePrice: 90,
    activePrice: 135,
    cost: { creekFish: 1, milk: 1, flour: 1 },
    costText: '🐟溪魚x1 + 🥛鮮奶x1 + 🌾小麥粉x1'
  },
  {
    id: 'chowder',
    name: '松露蘑菇鮮蝦巧達湯',
    icon: '🍲',
    basePrice: 120,
    activePrice: 180,
    cost: { shrimp: 1, mushroom: 1, milk: 1 },
    costText: '🦐鮮蝦x1 + 🍄蘑菇x1 + 🥛鮮奶x1'
  },
  {
    id: 'sea_platter',
    name: '星光鯛魚海陸拼盤',
    icon: '🐠🍱',
    basePrice: 160,
    activePrice: 240,
    cost: { seaFish: 1, egg: 1, strawberry: 1 },
    costText: '🐠海魚x1 + 🥚雞蛋x1 + 🍓草莓x1'
  }
];

class RestaurantSystem {
  constructor(gameState) {
    this.state = gameState;
    this.canvas = document.getElementById('cooking-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.selectedRecipeId = 'parfait';
    this.cookStep = 0;
    this.swirlProgress = 0;
    this.fruitCount = 0;
    this.sprinkleCount = 0;
    this.isPointerDown = false;
    this.lastAngle = null;

    this.initEvents();
    this.startAutoTycoonLoop();
  }

  getSelectedRecipe() {
    return RECIPES.find(r => r.id === this.selectedRecipeId) || RECIPES[0];
  }

  selectRecipe(recipeId) {
    this.selectedRecipeId = recipeId;
    this.cookStep = 0;
    window.Sound.playChime(600, 0.08);
    this.updateUI();
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

  hasIngredientsFor(recipe) {
    for (const [k, req] of Object.entries(recipe.cost)) {
      if ((this.state.ingredients[k] || 0) < req) return false;
    }
    return true;
  }

  startCooking() {
    const recipe = this.getSelectedRecipe();
    if (!this.hasIngredientsFor(recipe)) {
      window.Sound.playChime(320, 0.2, 'sawtooth');
      const statusEl = document.getElementById('cook-step-hint');
      if (statusEl) {
        statusEl.innerHTML = window.Bopomofo.toHTML(
          `食材還差一點喔！需要：${recipe.costText}（可去釣魚、牧場餵雞羊，或點擊下方補充食材！）`
        );
      }
      return;
    }

    for (const [k, req] of Object.entries(recipe.cost)) {
      this.state.ingredients[k] -= req;
    }

    this.cookStep = 1;
    this.swirlProgress = 0;
    this.fruitCount = 0;
    this.sprinkleCount = 0;
    window.Sound.playChime(587.33, 0.15);
    this.updateUI();
    this.renderCookingCanvas();
  }

  giveStarterIngredients() {
    this.state.ingredients.strawberry += 2;
    this.state.ingredients.milk += 2;
    this.state.ingredients.flour += 2;
    this.state.ingredients.egg += 2;
    this.state.ingredients.mushroom += 2;
    this.state.ingredients.creekFish += 1;
    this.state.ingredients.seaFish += 1;
    this.state.ingredients.shrimp += 1;
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
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2 + 10;
      const angle = Math.atan2(pos.y - cy, pos.x - cx);
      if (this.lastAngle !== null) {
        let diff = Math.abs(angle - this.lastAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        this.swirlProgress = Math.min(100, this.swirlProgress + diff * 30);
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
      this.fruitCount++;
      window.Sound.playNote(this.fruitCount + 2);
      if (this.fruitCount >= 4) {
        this.cookStep = 3;
        this.updateUI();
      }
      this.renderCookingCanvas();
    } else if (this.cookStep === 3 && isTap) {
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
    const recipe = this.getSelectedRecipe();
    const tableMultiplier = this.state.upgrades.umbrellaTables ? 1.2 : 1.0;
    const earned = Math.round(recipe.activePrice * tableMultiplier);

    this.state.addCoins(earned);
    this.state.addExp(45);
    this.state.showcaseCount += 2;
    this.state.lastCookedRecipe = recipe;

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

    const recipe = this.getSelectedRecipe();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fff5f8');
    grad.addColorStop(1, '#f3e8ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cupBottomY = h - 20;

    // 繪製精緻料理擺盤底座
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(cx, cupBottomY - 30, 88, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ff9ebb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cupBottomY - 30, 74, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 步驟 1：料理基底螺旋
    const swirlLayers = this.cookStep === 0 ? 3 : Math.ceil((this.swirlProgress / 100) * 4);
    const layerColors = ['#ff9ebb', '#ffd166', '#e0aaff', '#a8e6cf'];
    for (let i = 0; i < swirlLayers; i++) {
      const ly = cupBottomY - 42 - i * 18;
      const lw = 56 - i * 8;
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

    // 步驟 2：主角食材圖示（草莓 / 黃金雞蛋 / 溪魚 / 河蝦蘑菇 / 星光海魚）
    const itemsToShow = this.cookStep === 0 ? 4 : this.fruitCount;
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    const offsets = [
      { x: -34, y: -68 },
      { x: 34, y: -68 },
      { x: -16, y: -96 },
      { x: 18, y: -96 }
    ];
    for (let i = 0; i < itemsToShow && i < offsets.length; i++) {
      ctx.fillText(recipe.icon, cx + offsets[i].x, cupBottomY + offsets[i].y);
    }

    // 步驟 3：星光魔法點綴
    if (this.cookStep === 0 || this.sprinkleCount > 0) {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌟', cx, cupBottomY - 122);
      ctx.font = '18px sans-serif';
      ctx.fillText('✨', cx - 50, cupBottomY - 110);
      ctx.fillText('✨', cx + 50, cupBottomY - 110);
    }

    // 頂部操作引導
    ctx.save();
    ctx.font = 'bold 16px "Microsoft JhengHei"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5e3a24';
    if (this.cookStep === 1) {
      ctx.fillText(`🌀 第1步：在畫布上劃圈調製「${recipe.name}」基底 (${Math.round(this.swirlProgress)}%)`, cx, 26);
    } else if (this.cookStep === 2) {
      ctx.fillText(`🍓 第2步：點擊畫布擺上新鮮食材 (${this.fruitCount}/4)`, cx, 26);
    } else if (this.cookStep === 3) {
      ctx.fillText(`✨ 第3步：點擊灑上星光魔法調味 (${this.sprinkleCount}/3)`, cx, 26);
    } else if (this.cookStep === 4) {
      ctx.fillStyle = '#e04580';
      ctx.fillText(`🎉 完成「${recipe.name}」！獲得 1.5 倍金幣並上架櫥窗 +2 份！`, cx, 26);
    } else {
      ctx.fillText(`👩‍🍳 準備製作：${recipe.icon}${recipe.name}（點擊畫布或下方按鈕開始）`, cx, 26);
    }
    ctx.restore();
  }

  startAutoTycoonLoop() {
    setInterval(() => {
      let updated = false;

      if (this.state.upgrades.breadBunny && this.state.ingredients.flour < 25) {
        this.state.ingredients.flour += 1;
        updated = true;
      }
      if (this.state.upgrades.sailorDuck && this.state.ingredients.milk < 25) {
        this.state.ingredients.milk += 1;
        updated = true;
      }

      if (this.state.showcaseCount > 0) {
        this.state.showcaseCount -= 1;
        const recipe = this.state.lastCookedRecipe || RECIPES[0];
        const tableBonus = this.state.upgrades.umbrellaTables ? 20 : 0;
        const unitPrice = recipe.basePrice + tableBonus;
        this.state.chestCoins += unitPrice;
        this.state.addCoins(unitPrice);
        this.showCatSaleToast(recipe, unitPrice);
        updated = true;
      }

      if (updated) {
        this.updateUI();
        this.state.updateHUD();
      }
    }, 6500);
  }

  showCatSaleToast(recipe, coinAmount) {
    const container = document.getElementById('cat-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'cat-toast';
    toast.innerHTML = `
      <span style="font-size:28px;">🐱🎩</span>
      <div>
        ${window.Bopomofo.toHTML(`小貓店長賣出了 1 份${recipe.name}！`)}
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
    const ingMap = {
      'ing-strawberry': this.state.ingredients.strawberry,
      'ing-milk': this.state.ingredients.milk,
      'ing-flour': this.state.ingredients.flour,
      'ing-egg': this.state.ingredients.egg,
      'ing-mushroom': this.state.ingredients.mushroom,
      'ing-creek-fish': this.state.ingredients.creekFish,
      'ing-sea-fish': this.state.ingredients.seaFish,
      'ing-shrimp': this.state.ingredients.shrimp
    };
    for (const [id, val] of Object.entries(ingMap)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val || 0;
    }

    const scEl = document.getElementById('showcase-count');
    const ccEl = document.getElementById('chest-coins-val');
    if (scEl) scEl.textContent = this.state.showcaseCount;
    if (ccEl) ccEl.textContent = this.state.chestCoins;

    // 渲染 5 道料理食譜選擇按鈕
    const recipeBar = document.getElementById('recipe-selector-bar');
    if (recipeBar) {
      recipeBar.innerHTML = RECIPES.map(r => {
        const active = r.id === this.selectedRecipeId;
        const canCook = this.hasIngredientsFor(r);
        return `
          <button class="hud-btn"
                  style="flex:1; min-width:140px; flex-direction:column; padding:6px 10px; background:${active ? '#ffe0f0' : '#fff'}; border-color:${active ? '#e04580' : '#5e3a24'};"
                  onclick="window.Restaurant.selectRecipe('${r.id}')">
            <div style="font-size:16px;">${r.icon} ${window.Bopomofo.toHTML(r.name)}</div>
            <div style="font-size:12px; color:${canCook ? '#2a9d8f' : '#d97706'};">
              ${r.costText}｜💰${r.activePrice}
            </div>
          </button>
        `;
      }).join('');
    }

    const recipe = this.getSelectedRecipe();
    const stepHint = document.getElementById('cook-step-hint');
    if (stepHint) {
      const hints = {
        0: `已選食譜：【${recipe.name}】（需 ${recipe.costText}，親自下廚得 ${recipe.activePrice} 金幣）`,
        1: '第 1 步：在下方畫布上劃圈圈調製料理基底！',
        2: '第 2 步：點擊畫布擺上新鮮採集與釣到的食材！',
        3: '第 3 步：點擊畫布灑上星光魔法粉！',
        4: `太棒了！完成「${recipe.name}」並已擺入玻璃櫥窗！`
      };
      stepHint.innerHTML = window.Bopomofo.toHTML(hints[this.cookStep] || hints[0]);
    }

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
