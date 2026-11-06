/**
 * 👗 6. 屋內換裝小屋系統 (Dressing Room System)
 * 左側 (30%)：3D/2.5D 主角與小貓 360° 旋轉展示舞台，試穿時會轉圈歡呼
 * 右側 (70%)：分頁 (👑頭飾 / 👗衣服 / 👞鞋子 / 🕊️翅膀 / 🐱寵物飾品)
 *             大圖示卡片格 (4x2)，附帶右側直式注音說明
 *             底部彩色調色盤 (🔴 🟠 🟡 🟢 🔵 🟣 🩷) 自由變換衣服顏色
 */

const WARDROBE_CATALOG = {
  hat: [
    { id: 'default_witch', name: '星光魔法帽', icon: '🧙‍♀️', free: true },
    { id: 'flower_helmet', name: '粉紅花朵安全帽', icon: '🌸', cost: 0, questHint: '1-1 獎勵或免費試穿', free: true },
    { id: 'pearl_crown', name: '珍珠小皇冠', icon: '👑', cost: 60 },
    { id: 'cat_ears', name: '夢幻貓耳髮箍', icon: '🐱', cost: 50 },
    { id: 'straw_hat', name: '陽光蝴蝶結草帽', icon: '👒', cost: 40 },
    { id: 'star_beret', name: '彩虹畫家貝雷帽', icon: '🎨', cost: 55 },
    { id: 'ribbon_bow', name: '甜心大蝴蝶結', icon: '🎀', cost: 35 },
    { id: 'unicorn_horn', name: '獨角獸星光角', icon: '🦄', cost: 80 }
  ],
  dress: [
    { id: 'default_dress', name: '蝴蝶結蓬蓬裙', icon: '👗', hue: 0, free: true },
    { id: 'strawberry_apron', name: '草莓甜點圍裙', icon: '🍓', hue: 330, cost: 50 },
    { id: 'ocean_sailor', name: '海洋水手洋裝', icon: '⚓', hue: 200, cost: 60 },
    { id: 'starlight_gown', name: '星光公主禮服', icon: '✨', hue: 270, cost: 90 },
    { id: 'forest_fairy', name: '森林精靈綠裙', icon: '🍀', hue: 110, cost: 55 },
    { id: 'sunshine_dress', name: '向日葵鵝黃裙', icon: '🌻', hue: 55, cost: 50 },
    { id: 'rainbow_tutu', name: '彩虹芭蕾紗裙', icon: '🌈', hue: 300, cost: 75 },
    { id: 'plush_cape', name: '暖暖絨毛斗篷', icon: '🧸', hue: 25, cost: 65 }
  ],
  shoes: [
    { id: 'default_boots', name: '魔法紫短靴', icon: '👢', free: true },
    { id: 'pink_ballet', name: '粉紅芭蕾舞鞋', icon: '🩰', cost: 40 },
    { id: 'crystal_heels', name: '閃亮水晶玻璃鞋', icon: '👠', cost: 70 },
    { id: 'winged_sneakers', name: '飛天小翅膀球鞋', icon: '👟', cost: 55 },
    { id: 'strawberry_shoes', name: '草莓紅圓頭鞋', icon: '🍓', cost: 45 },
    { id: 'bear_slippers', name: '熊熊毛絨拖鞋', icon: '🐻', cost: 35 },
    { id: 'sailor_boots', name: '水手藍長靴', icon: '⚓', cost: 50 },
    { id: 'gold_sandals', name: '星光金涼鞋', icon: '🌟', cost: 60 }
  ],
  wings: [
    { id: 'none', name: '不戴翅膀', icon: '🚫', free: true },
    { id: 'fairy_wings', name: '仙女薄紗翅膀', icon: '🦋', cost: 65 },
    { id: 'angel_wings', name: '純白天使羽翼', icon: '🕊️', cost: 75 },
    { id: 'rainbow_wings', name: '彩虹星光羽翼', icon: '🌈', cost: 95 },
    { id: 'ribbon_wings', name: '粉紅蝴蝶結翼', icon: '🎀', cost: 60 },
    { id: 'star_cape', name: '流星披風翼', icon: '🌠', cost: 80 },
    { id: 'leaf_wings', name: '森林晨露精靈翼', icon: '🍃', cost: 55 },
    { id: 'crystal_wings', name: '夢幻水晶羽翼', icon: '💎', cost: 110 }
  ],
  petItem: [
    { id: 'pink_helmet', name: '迷你粉紅安全帽', icon: '⛑️', free: true },
    { id: 'chef_hat', name: '代理店長高帽', icon: '🎩', free: true },
    { id: 'angel_halo', name: '天使發光光環', icon: '😇', cost: 50 },
    { id: 'rainbow_collar', name: '彩虹鈴鐺項圈', icon: '🔔', cost: 40 },
    { id: 'duck_float', name: '小黃鴨游泳圈', icon: '🐤', cost: 45 },
    { id: 'star_glasses', name: '酷炫星星墨鏡', icon: '🕶️', cost: 55 },
    { id: 'royal_cape', name: '小貓國王披風', icon: '👑', cost: 70 },
    { id: 'strawberry_hat', name: '草莓毛線帽', icon: '🍓', cost: 45 }
  ]
};

const COLOR_PALETTE = [
  { id: 'red', label: '🔴', color: '#ff4d6d', hue: 335, name: '草莓紅' },
  { id: 'orange', label: '🟠', color: '#ff9f1c', hue: 35, name: '陽光橘' },
  { id: 'yellow', label: '🟡', color: '#ffbe0b', hue: 58, name: '奶油黃' },
  { id: 'green', label: '🟢', color: '#52b788', hue: 125, name: '薄荷綠' },
  { id: 'blue', label: '🔵', color: '#4cc9f0', hue: 195, name: '海洋藍' },
  { id: 'purple', label: '🟣', color: '#9f67ff', hue: 0, name: '魔幻紫' },
  { id: 'pink', label: '🩷', color: '#ff85b3', hue: 310, name: '蜜桃粉' }
];

class DressingRoomSystem {
  constructor(gameState, world) {
    this.state = gameState;
    this.world = world;
    this.currentCategory = 'hat';
    this.stageCanvas = document.getElementById('dress-stage-canvas');
    this.ctx = this.stageCanvas ? this.stageCanvas.getContext('2d') : null;

    // 360° 旋轉舞台角度與歡呼轉圈動畫
    this.rotationY = 0;
    this.spinVelocity = 0;
    this.cheerTimer = 0;
    this.sparkles = [];

    this.initUI();
    this.startStageAnimation();
  }

  initUI() {
    this.renderCategoryTabs();
    this.renderGrid();
    this.renderColorPalette();
  }

  selectCategory(cat) {
    this.currentCategory = cat;
    window.Sound.playChime(580, 0.08);
    this.renderCategoryTabs();
    this.renderGrid();
  }

  renderCategoryTabs() {
    const container = document.getElementById('dress-tabs-bar');
    if (!container) return;

    const tabs = [
      { key: 'hat', icon: '👑', label: '頭飾' },
      { key: 'dress', icon: '👗', label: '衣服' },
      { key: 'shoes', icon: '👞', label: '鞋子' },
      { key: 'wings', icon: '🕊️', label: '翅膀' },
      { key: 'petItem', icon: '🐱', label: '寵物飾品' }
    ];

    container.innerHTML = tabs
      .map(
        t => `
        <button class="dress-tab ${this.currentCategory === t.key ? 'active' : ''}"
                onclick="window.DressingRoom.selectCategory('${t.key}')">
          <span>${t.icon}</span> ${window.Bopomofo.toHTML(t.label)}
        </button>
      `
      )
      .join('');
  }

  renderGrid() {
    const grid = document.getElementById('dress-items-grid');
    if (!grid) return;

    const items = WARDROBE_CATALOG[this.currentCategory] || [];
    grid.innerHTML = items
      .map(item => {
        const unlocked = item.free || this.state.unlockedItems.includes(item.id);
        const equipped = this.state.equipped[this.currentCategory] === item.id;
        const statusBadge = equipped
          ? `<span style="color:#e04580; font-size:13px; font-weight:900;">✨ ${window.Bopomofo.toHTML('已穿戴')}</span>`
          : unlocked
          ? `<span style="color:#2a9d8f; font-size:13px;">${window.Bopomofo.toHTML('點擊試穿')}</span>`
          : `<span style="color:#d97706; font-size:13px;">💰 ${item.cost} ${window.Bopomofo.toHTML('金幣')}</span>`;

        return `
          <div class="dress-card ${equipped ? 'equipped' : ''}"
               onclick="window.DressingRoom.equipOrBuy('${this.currentCategory}', '${item.id}')">
            <div class="dress-card-icon">${item.icon}</div>
            <div style="font-size:15px; text-align:center;">${window.Bopomofo.toHTML(item.name)}</div>
            <div>${statusBadge}</div>
          </div>
        `;
      })
      .join('');
  }

  renderColorPalette() {
    const bar = document.getElementById('dress-color-swatches');
    if (!bar) return;

    bar.innerHTML = COLOR_PALETTE.map(
      sw => `
        <div class="color-swatch ${this.state.equipped.colorHue === sw.hue ? 'active' : ''}"
             style="background:${sw.color};"
             title="${sw.name}"
             onclick="window.DressingRoom.selectColorHue(${sw.hue}, '${sw.name}')">
        </div>
      `
    ).join('');
  }

  equipOrBuy(category, itemId) {
    const items = WARDROBE_CATALOG[category] || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const unlocked = item.free || this.state.unlockedItems.includes(item.id);
    if (!unlocked) {
      if (this.state.coins >= (item.cost || 50)) {
        this.state.coins -= item.cost;
        this.state.unlockItem(item.id);
      } else {
        // 即使金幣暫時不夠，也允許小朋友在換裝室免費試穿體驗！
        this.state.unlockItem(item.id);
      }
    }

    this.state.equipped[category] = item.id;
    if (category === 'dress' && item.hue !== undefined) {
      this.state.equipped.colorHue = item.hue;
    }

    // 觸發 360° 轉圈歡呼特效！
    this.triggerSpinCheer(item.name);
    this.renderGrid();
    this.renderColorPalette();
    this.state.updateHUD();
  }

  selectColorHue(hue, colorName) {
    this.state.equipped.colorHue = hue;
    this.triggerSpinCheer(`換上${colorName}`);
    this.renderColorPalette();
  }

  rotateStageManual(deltaDeg) {
    this.rotationY += (deltaDeg * Math.PI) / 180;
    window.Sound.playChime(520, 0.06);
  }

  triggerSpinCheer(itemName) {
    this.spinVelocity = 0.34;
    this.cheerTimer = 70;
    window.Sound.playFanfare();

    // 產生舞台星光彩帶粒子
    for (let i = 0; i < 18; i++) {
      this.sparkles.push({
        x: 130 + (Math.random() - 0.5) * 140,
        y: 170 + (Math.random() - 0.5) * 140,
        vx: (Math.random() - 0.5) * 4,
        vy: -1.5 - Math.random() * 3,
        color: ['#ff6fa5', '#ffbe0b', '#72efdd', '#9f67ff'][i % 4],
        size: 5 + Math.random() * 5,
        life: 45
      });
    }

    const cheerLabel = document.getElementById('dress-stage-cheer');
    if (cheerLabel) {
      cheerLabel.innerHTML = window.Bopomofo.toHTML(`好美呀！穿上了「${itemName}」～✨`);
    }
  }

  startStageAnimation() {
    const loop = () => {
      this.updateStage();
      this.renderStage();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateStage() {
    if (this.spinVelocity > 0.005) {
      this.rotationY += this.spinVelocity;
      this.spinVelocity *= 0.92;
    }
    if (this.cheerTimer > 0) this.cheerTimer--;

    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life--;
      if (s.life <= 0) this.sparkles.splice(i, 1);
    }
  }

  renderStage() {
    if (!this.ctx || !this.stageCanvas) return;
    const ctx = this.ctx;
    const w = this.stageCanvas.width;
    const h = this.stageCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const baseY = h - 48;

    // 繪製閃亮魔法旋轉展示台底座
    ctx.save();
    ctx.fillStyle = '#ff9ebb';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(cx, baseY, 96, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 6, 82, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 計算 360° 旋轉水平縮放模擬 3D 轉身與歡呼跳躍
    const scaleX = Math.cos(this.rotationY);
    const jumpOffset = this.cheerTimer > 0 ? Math.abs(Math.sin(this.cheerTimer * 0.25)) * 18 : 0;

    // 繪製主角（夢幻小魔女公主）
    ctx.save();
    ctx.translate(cx - 22, baseY - 12 - jumpOffset);
    ctx.scale(Math.abs(scaleX) < 0.15 ? 0.15 : scaleX, 1);

    // 翅膀
    if (this.state.equipped.wings && this.state.equipped.wings !== 'none') {
      const wingObj = WARDROBE_CATALOG.wings.find(x => x.id === this.state.equipped.wings);
      ctx.font = '56px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(wingObj ? wingObj.icon : '🦋', -38, -110);
    }

    const hue = this.state.equipped.colorHue || 0;
    if (hue !== 0) ctx.filter = `hue-rotate(${hue}deg)`;

    const walkImg = this.world ? this.world.images.witch_walk : null;
    if (walkImg && walkImg.complete) {
      ctx.drawImage(walkImg, -68, -215, 136, 215);
    }

    ctx.filter = 'none';

    // 頭飾
    if (this.state.equipped.hat && this.state.equipped.hat !== 'default_witch') {
      const hatObj = WARDROBE_CATALOG.hat.find(x => x.id === this.state.equipped.hat);
      if (hatObj) {
        ctx.font = '38px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hatObj.icon, 0, -205);
      }
    }
    ctx.restore();

    // 繪製飛天星光小貓在舞台右側一起轉圈歡呼
    ctx.save();
    ctx.translate(cx + 62, baseY - 28 - jumpOffset * 1.2);
    const catImg = this.world ? this.world.images.cat_flying : null;
    if (catImg && catImg.complete) {
      ctx.drawImage(catImg, -42, -84, 84, 86);
    }
    if (this.state.equipped.petItem) {
      const petObj = WARDROBE_CATALOG.petItem.find(x => x.id === this.state.equipped.petItem);
      if (petObj && petObj.id !== 'pink_helmet') {
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(petObj.icon, -6, -78);
      }
    }
    ctx.restore();

    // 繪製試穿歡呼愛心與星星粒子
    for (const s of this.sparkles) {
      ctx.save();
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.DressingRoomSystem = DressingRoomSystem;
