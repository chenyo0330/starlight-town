/**
 * 2.5D 等角視角世界引擎 (Isometric World Engine)
 * 負責：地圖渲染、主角與載具（畫面高度 1/6 黃金比例）、飛天星光小貓跟隨與尋寶、
 * 野外食材採集（草莓/鮮奶/小麥粉）、NPC 互動與星光碎片色彩恢復特效
 */

class StarlightWorld {
  constructor(canvasId, gameState) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.state = gameState;

    // 載入角色、載具與物件圖資
    this.images = {};
    this.loadAssets();

    // 世界座標設定 (2752 x 1536 高解析度繪本地圖)
    this.worldWidth = 2752;
    this.worldHeight = 1536;
    this.currentMap = 'town'; // 'town' (星光鎮廣場) | 'coast' (繽紛海岸與牧場)

    // 主角狀態
    this.player = {
      x: 1380,
      y: 920,
      vx: 0,
      vy: 0,
      facing: 1, // 1: 右, -1: 左
      vehicleIndex: 0, // 0:walk, 1:bike, 2:scooter, 3:car_pink, 4:unicorn, 5:car_blue
      bobPhase: 0,
      targetX: null,
      targetY: null
    };

    // 飛天星光小貓狀態
    this.cat = {
      x: 1310,
      y: 930,
      facing: 1,
      wingPhase: 0,
      meowCooldown: 0,
      speechText: '',
      speechTimer: 0
    };

    // 第二隻跟隨寵物：三花小貓 (1-3 解鎖)
    this.calicoCat = {
      x: 1260,
      y: 950,
      facing: 1,
      bobPhase: 0
    };

    // 鍵盤與搖桿輸入
    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };

    // 粒子特效（星光尾巴、彩虹軌跡、採集飄字）
    this.particles = [];
    this.floatingTexts = [];

    // 場景互動物件與採集點
    this.initWorldEntities();
    this.bindEvents();
    this.resize();
  }

  loadAssets() {
    const assetList = {
      map_town: 'assets/maps/map_town.jpg',
      map_coast: 'assets/maps/map_coast.jpg',
      witch_walk: 'assets/sprites/witch_walk.png',
      witch_bike: 'assets/sprites/witch_bike.png',
      witch_scooter: 'assets/sprites/witch_scooter.png',
      cat_flying: 'assets/sprites/cat_flying.png',
      car_pink: 'assets/sprites/car_pink.png',
      unicorn: 'assets/sprites/unicorn.png',
      bread_bunny: 'assets/sprites/bread_bunny.png',
      sailor_duck: 'assets/sprites/sailor_duck.png',
      mushroom_house: 'assets/sprites/bakery_large.png',
      bear_shop: 'assets/sprites/prop_bear_shop.png',
      fountain: 'assets/sprites/prop_fountain.png',
      strawberry1: 'assets/sprites/prop_strawberry_bush1.png',
      strawberry2: 'assets/sprites/prop_strawberry_bush2.png',
      cafe_table: 'assets/sprites/prop_cafe_table.png'
    };

    for (const [key, src] of Object.entries(assetList)) {
      const img = new Image();
      img.src = src;
      this.images[key] = img;
    }
  }

  initWorldEntities() {
    // 採集點：草莓叢、鮮奶桶、小麥籃、隱藏寶箱
    this.harvestNodes = [
      // 星光鎮 (town) 採集點
      { id: 'sb1', map: 'town', x: 340, y: 1180, type: 'strawberry', name: '彩虹草莓叢', cooldown: 0, sprite: 'strawberry1' },
      { id: 'sb2', map: 'town', x: 560, y: 260, type: 'strawberry', name: '夢幻森林草莓', cooldown: 0, sprite: 'strawberry2' },
      { id: 'sb3', map: 'town', x: 960, y: 210, type: 'strawberry', name: '星光草莓叢', cooldown: 0, sprite: 'strawberry1' },
      { id: 'fl1', map: 'town', x: 1850, y: 380, type: 'flour', name: '黃金小麥粉袋', cooldown: 0 },
      { id: 'mk1', map: 'town', x: 2150, y: 1150, type: 'milk', name: '香醇鮮奶瓶', cooldown: 0 },
      { id: 'chest1', map: 'town', x: 240, y: 390, type: 'chest', name: '森林隱藏寶箱', opened: false },
      { id: 'chest2', map: 'town', x: 2420, y: 1320, type: 'chest', name: '河畔星光寶箱', opened: false },

      // 繽紛海岸與陽光牧場 (coast) 採集點
      { id: 'c_mk1', map: 'coast', x: 620, y: 450, type: 'milk', name: '牧場新鮮牛奶', cooldown: 0 },
      { id: 'c_fl1', map: 'coast', x: 980, y: 390, type: 'flour', name: '陽光小麥粉', cooldown: 0 },
      { id: 'c_sb1', map: 'coast', x: 320, y: 980, type: 'strawberry', name: '海岸甜草莓', cooldown: 0, sprite: 'strawberry2' },
      { id: 'c_chest1', map: 'coast', x: 2260, y: 680, type: 'chest', name: '木棧道秘密寶箱', opened: false },
      { id: 'c_chest2', map: 'coast', x: 1290, y: 1290, type: 'chest', name: '貝殼沙灘寶箱', opened: false }
    ];

    // 散落的寶石（飛天小貓會自動幫忙拾取）
    this.gems = [];
    this.spawnRandomGems();

    // NPC 與建築互動點
    this.landmarks = [
      {
        id: 'restaurant',
        map: 'town',
        x: 530,
        y: 660,
        radius: 210,
        title: '🏡 星光餐廳 (蘑菇屋)',
        actionLabel: '進入星光餐廳',
        type: 'restaurant'
      },
      {
        id: 'fountain',
        map: 'town',
        x: 1600,
        y: 690,
        radius: 190,
        title: '⛲ 彩虹音樂噴泉',
        actionLabel: '挑戰 1-3 失蹤的小貓',
        type: 'minigame',
        gameId: '1-3'
      },
      {
        id: 'bear_shop',
        map: 'town',
        x: 2380,
        y: 560,
        radius: 180,
        title: '🐻 熊熊店長雜貨鋪',
        actionLabel: '與熊熊店長對話 / 1-1 快遞',
        type: 'npc_bear'
      },
      {
        id: 'bunny_bakery',
        map: 'town',
        x: 1760,
        y: 260,
        radius: 170,
        title: '🐰 麵包兔烘焙坊',
        actionLabel: '與麵包兔對話 / 1-2 幾何地磚',
        type: 'npc_bunny'
      },
      {
        id: 'portal_to_coast',
        map: 'town',
        x: 2560,
        y: 980,
        radius: 160,
        title: '🌉 前往繽紛海岸與牧場',
        actionLabel: '過橋去繽紛海岸',
        type: 'portal',
        targetMap: 'coast',
        targetX: 420,
        targetY: 1120
      },
      {
        id: 'portal_to_town',
        map: 'coast',
        x: 320,
        y: 1160,
        radius: 160,
        title: '🌉 返回星光鎮廣場',
        actionLabel: '過橋回星光鎮',
        type: 'portal',
        targetMap: 'town',
        targetX: 2420,
        targetY: 960
      },
      {
        id: 'sailor_duck_pier',
        map: 'coast',
        x: 2150,
        y: 720,
        radius: 190,
        title: '🦆 水手鴨碼頭',
        actionLabel: '與水手鴨對話 / 2-1 貝殼派對',
        type: 'npc_duck'
      },
      {
        id: 'sunny_barn',
        map: 'coast',
        x: 680,
        y: 360,
        radius: 180,
        title: '🏡 陽光牧場穀倉',
        actionLabel: '領取牧場鮮奶與小麥',
        type: 'barn'
      }
    ];
  }

  spawnRandomGems() {
    this.gems = [];
    const colors = ['#ff6fa5', '#ffbe0b', '#72efdd', '#9f67ff', '#ff9ebb'];
    for (let i = 0; i < 14; i++) {
      this.gems.push({
        map: i < 8 ? 'town' : 'coast',
        x: 280 + Math.random() * 2150,
        y: 260 + Math.random() * 1050,
        color: colors[i % colors.length],
        bob: Math.random() * Math.PI * 2
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        this.triggerNearbyInteraction();
      }
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // 點擊地圖自由移動或觸發建築互動
    this.canvas.addEventListener('pointerdown', e => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cam = this.getCamera();
      const wx = sx / cam.scale + cam.x;
      const wy = sy / cam.scale + cam.y;

      this.player.targetX = Math.max(120, Math.min(this.worldWidth - 120, wx));
      this.player.targetY = Math.max(160, Math.min(this.worldHeight - 100, wy));

      // 點擊地面產生小星星漣漪
      this.addSparkleBurst(wx, wy, '#fff3b0', 6);
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  getVehicleList() {
    const list = [
      { id: 'walk', name: '步行', icon: '🚶‍♀️', speed: 4.2 },
      { id: 'bike', name: '黃色腳踏車', icon: '🚲', speed: 6.0 },
      { id: 'scooter', name: '酷炫粉紅機車', icon: '🛵', speed: 7.4 },
      { id: 'car_pink', name: '粉紅敞篷車', icon: '🚗', speed: 8.6 },
      { id: 'unicorn', name: '魔法獨角獸', icon: '🦄', speed: 9.2 }
    ];
    if (this.state.unlockedVehicles.includes('car_blue')) {
      list.push({ id: 'car_blue', name: '藍色海洋敞篷車', icon: '🚙', speed: 9.5 });
    }
    return list;
  }

  cycleVehicle() {
    const list = this.getVehicleList();
    this.player.vehicleIndex = (this.player.vehicleIndex + 1) % list.length;
    const v = list[this.player.vehicleIndex];
    window.Sound.playChime(680, 0.15, 'triangle');
    this.addFloatingText(this.player.x, this.player.y - 90, `${v.icon} 切換：${v.name}`, '#ff6fa5');
    return v;
  }

  switchMap(targetMap, tx, ty) {
    this.currentMap = targetMap;
    if (tx !== undefined && ty !== undefined) {
      this.player.x = tx;
      this.player.y = ty;
      this.cat.x = tx - 60;
      this.cat.y = ty + 10;
    }
    this.player.targetX = null;
    this.player.targetY = null;
    window.Sound.playStar();
    const mapTitle = targetMap === 'town' ? '🌟 星光鎮中心廣場' : '🏖️ 繽紛海岸與陽光牧場';
    this.addFloatingText(this.player.x, this.player.y - 100, mapTitle, '#9f67ff');
  }

  getCamera() {
    // 確保視野開闊，適合平板與電腦上騎車奔馳
    const scale = Math.max(this.canvas.width / 1920, this.canvas.height / 1080, 0.72);
    const viewW = this.canvas.width / scale;
    const viewH = this.canvas.height / scale;

    let camX = this.player.x - viewW / 2;
    let camY = this.player.y - viewH / 2;

    camX = Math.max(0, Math.min(this.worldWidth - viewW, camX));
    camY = Math.max(0, Math.min(this.worldHeight - viewH, camY));

    return { x: camX, y: camY, scale, viewW, viewH };
  }

  addSparkleBurst(x, y, color = '#ffbe0b', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.2,
        size: 5 + Math.random() * 6,
        color,
        alpha: 1,
        life: 32 + Math.random() * 20
      });
    }
  }

  addFloatingText(x, y, text, color = '#ff5d8f') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 55
    });
  }

  update() {
    const vehicles = this.getVehicleList();
    const currentVehicle = vehicles[this.player.vehicleIndex] || vehicles[0];
    const spd = currentVehicle.speed;

    // 1. 計算輸入向量 (鍵盤 + 左下雙圈搖桿 + 點擊目標移動)
    let dx = this.joystickVector.x;
    let dy = this.joystickVector.y;

    if (this.keys['arrowleft'] || this.keys['a']) dx -= 1;
    if (this.keys['arrowright'] || this.keys['d']) dx += 1;
    if (this.keys['arrowup'] || this.keys['w']) dy -= 1;
    if (this.keys['arrowdown'] || this.keys['s']) dy += 1;

    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      this.player.targetX = null;
      this.player.targetY = null;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
    } else if (this.player.targetX !== null && this.player.targetY !== null) {
      const tdx = this.player.targetX - this.player.x;
      const tdy = this.player.targetY - this.player.y;
      const dist = Math.hypot(tdx, tdy);
      if (dist > 12) {
        dx = tdx / dist;
        dy = tdy / dist;
      } else {
        this.player.targetX = null;
        this.player.targetY = null;
      }
    }

    // 2. 更新主角位置與動畫
    this.player.vx = dx * spd;
    this.player.vy = dy * spd;
    this.player.x = Math.max(110, Math.min(this.worldWidth - 110, this.player.x + this.player.vx));
    this.player.y = Math.max(150, Math.min(this.worldHeight - 90, this.player.y + this.player.vy));

    if (Math.abs(this.player.vx) > 0.2) {
      this.player.facing = this.player.vx > 0 ? 1 : -1;
    }

    const isMoving = Math.hypot(this.player.vx, this.player.vy) > 0.25;
    if (isMoving) {
      this.player.bobPhase += 0.22;
      // 騎車或獨角獸時產生夢幻星光尾跡
      if (Math.random() < 0.45) {
        const trailColors = ['#ff9ebb', '#ffbe0b', '#72efdd', '#c79dff'];
        this.particles.push({
          x: this.player.x - this.player.facing * 35,
          y: this.player.y - 10 + (Math.random() - 0.5) * 20,
          vx: -this.player.vx * 0.2,
          vy: -0.6,
          size: currentVehicle.id === 'unicorn' ? 9 : 6,
          color: trailColors[Math.floor(Math.random() * trailColors.length)],
          alpha: 0.9,
          life: 26
        });
      }
    } else {
      this.player.bobPhase += 0.06;
    }

    // 3. 更新『飛天星光小貓』平滑跟隨、自動拾取寶石與寶箱「喵嗚~」提示
    this.cat.wingPhase += 0.28;
    const targetCatX = this.player.x - this.player.facing * 75;
    const targetCatY = this.player.y - 25 + Math.sin(this.cat.wingPhase * 0.5) * 10;

    // 檢查附近是否有寶石可以自動飛去拾取
    let nearestGem = null;
    let minGemDist = 230;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (g.map !== this.currentMap) continue;
      g.bob += 0.08;
      const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
      if (d < minGemDist) {
        minGemDist = d;
        nearestGem = { gem: g, index: i };
      }
    }

    if (nearestGem) {
      // 小貓飛向寶石自動拾取
      this.cat.x += (nearestGem.gem.x - this.cat.x) * 0.18;
      this.cat.y += (nearestGem.gem.y - this.cat.y) * 0.18;
      if (Math.hypot(nearestGem.gem.x - this.cat.x, nearestGem.gem.y - this.cat.y) < 38) {
        this.gems.splice(nearestGem.index, 1);
        this.state.addCoins(10);
        this.state.addExp(5);
        window.Sound.playCoin();
        this.addSparkleBurst(this.cat.x, this.cat.y, '#72efdd', 8);
        this.addFloatingText(this.cat.x, this.cat.y - 30, '🐾 小貓拾取寶石 +10💰', '#ffbe0b');
        if (this.gems.length < 6) this.spawnRandomGems();
      }
    } else {
      this.cat.x += (targetCatX - this.cat.x) * 0.1;
      this.cat.y += (targetCatY - this.cat.y) * 0.1;
    }
    this.cat.facing = this.player.facing;

    // 檢查附近是否有未開啟的隱藏寶箱 -> 發出「喵嗚~」提示
    if (this.cat.meowCooldown > 0) this.cat.meowCooldown--;
    if (this.cat.speechTimer > 0) this.cat.speechTimer--;

    for (const node of this.harvestNodes) {
      if (node.map === this.currentMap && node.type === 'chest' && !node.opened) {
        const dist = Math.hypot(node.x - this.player.x, node.y - this.player.y);
        if (dist < 340 && this.cat.meowCooldown <= 0) {
          this.cat.speechText = '喵嗚~ 附近有隱藏寶箱！🎁';
          this.cat.speechTimer = 150;
          this.cat.meowCooldown = 360;
          window.Sound.playMeow();
        }
      }
    }

    // 4. 更新『三花小貓』(若已解鎖)
    if (this.state.unlockedPets.includes('calico')) {
      this.calicoCat.bobPhase += 0.2;
      const tcx = this.player.x - this.player.facing * 135;
      const tcy = this.player.y + 15;
      this.calicoCat.x += (tcx - this.calicoCat.x) * 0.08;
      this.calicoCat.y += (tcy - this.calicoCat.y) * 0.08;
      this.calicoCat.facing = this.player.facing;
    }

    // 5. 檢查野外食材自動/靠近採集
    for (const node of this.harvestNodes) {
      if (node.cooldown > 0) node.cooldown--;
      if (node.map !== this.currentMap) continue;

      const dist = Math.hypot(node.x - this.player.x, node.y - this.player.y);
      if (dist < 115) {
        if (node.type === 'chest' && !node.opened) {
          node.opened = true;
          this.state.addShards(1);
          this.state.addCoins(80);
          window.Sound.playFanfare();
          this.addSparkleBurst(node.x, node.y, '#ffbe0b', 18);
          this.addFloatingText(node.x, node.y - 50, '🌟 發現星光碎片 x1 + 80金幣！', '#9f67ff');
        } else if (node.type !== 'chest' && node.cooldown <= 0) {
          node.cooldown = 420; // 約 7 秒後重生
          if (node.type === 'strawberry') {
            this.state.ingredients.strawberry += 2;
            this.addFloatingText(node.x, node.y - 40, '🍓 採集彩虹草莓 +2', '#ff5d8f');
          } else if (node.type === 'flour') {
            this.state.ingredients.flour += 2;
            this.addFloatingText(node.x, node.y - 40, '🌾 獲得小麥粉 +2', '#ffbe0b');
          } else if (node.type === 'milk') {
            this.state.ingredients.milk += 2;
            this.addFloatingText(node.x, node.y - 40, '🥛 獲得香醇鮮奶 +2', '#4cc9f0');
          }
          this.state.addExp(8);
          window.Sound.playCoin();
          this.addSparkleBurst(node.x, node.y, '#ff9ebb', 10);
          this.state.updateHUD();
        }
      }
    }

    // 6. 更新粒子與飄字
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = Math.max(0, p.life / 35);
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.1;
      ft.life--;
      ft.alpha = Math.max(0, ft.life / 40);
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // 更新右下角互動按鈕提示
    const nearest = this.getNearestLandmark();
    const interactBtnLabel = document.getElementById('interact-btn-label');
    if (interactBtnLabel) {
      if (nearest) {
        interactBtnLabel.innerHTML = window.Bopomofo.toHTML(nearest.actionLabel);
      } else {
        interactBtnLabel.innerHTML = window.Bopomofo.toHTML('互動');
      }
    }
  }

  getNearestLandmark() {
    let best = null;
    let bestDist = 230;
    for (const lm of this.landmarks) {
      if (lm.map !== this.currentMap) continue;
      const d = Math.hypot(lm.x - this.player.x, lm.y - this.player.y);
      if (d < (lm.radius || bestDist) && d < bestDist) {
        bestDist = d;
        best = lm;
      }
    }
    return best;
  }

  triggerNearbyInteraction() {
    const lm = this.getNearestLandmark();
    if (!lm) {
      // 若附近沒有建築，小魔女揮動魔杖灑出星光並讓小貓歡呼
      window.Sound.playStar();
      this.addSparkleBurst(this.player.x, this.player.y - 50, '#ff9ebb', 14);
      this.cat.speechText = '喵嗚~ 星光鎮真好玩！✨';
      this.cat.speechTimer = 110;
      return;
    }

    if (lm.type === 'restaurant') {
      window.GameApp.openModal('restaurant-modal');
    } else if (lm.type === 'portal') {
      this.switchMap(lm.targetMap, lm.targetX, lm.targetY);
    } else if (lm.type === 'minigame') {
      window.GameApp.openMiniGame(lm.gameId);
    } else if (lm.type === 'npc_bear') {
      window.GameApp.showDialogue(
        '熊熊店長',
        'assets/sprites/prop_bear_shop.png',
        '小魔女，歡迎來到星光鎮！去採些草莓做冰淇淋，或是幫我完成「冰淇淋快遞」收集星光碎片吧！',
        () => window.GameApp.openMiniGame('1-1')
      );
    } else if (lm.type === 'npc_bunny') {
      window.GameApp.showDialogue(
        '麵包兔',
        'assets/sprites/bread_bunny.png',
        '小魔女你好呀！廣場的彩虹地磚需要通電，快來挑戰「幾何地磚」把紅光和藍光合成紫光吧！',
        () => window.GameApp.openMiniGame('1-2')
      );
    } else if (lm.type === 'npc_duck') {
      window.GameApp.showDialogue(
        '水手鴨',
        'assets/sprites/sailor_duck.png',
        '嘎嘎！海岸邊飄來了好多數字貝殼，快來挑戰「貝殼水果派對」讓魔法天平保持平衡吧！',
        () => window.GameApp.openMiniGame('2-1')
      );
    } else if (lm.type === 'barn') {
      this.state.ingredients.milk += 3;
      this.state.ingredients.flour += 3;
      this.state.updateHUD();
      window.Sound.playFanfare();
      this.addFloatingText(this.player.x, this.player.y - 60, '🥛 牧場補給：鮮奶+3、小麥粉+3！', '#ffbe0b');
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cam = this.getCamera();
    ctx.save();
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.x, -cam.y);

    // 1. 繪製底圖（根據星光碎片收集進度調整城鎮色彩飽和度！）
    const mapImg = this.currentMap === 'town' ? this.images.map_town : this.images.map_coast;
    const shardRatio = Math.min(1, this.state.shards / 5);
    const sat = 65 + Math.round(shardRatio * 45); // 65% -> 110% 鮮豔色彩
    ctx.filter = `saturate(${sat}%) brightness(${98 + Math.round(shardRatio * 5)}%)`;

    if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
      ctx.drawImage(mapImg, 0, 0, this.worldWidth, this.worldHeight);
    } else {
      ctx.fillStyle = '#fdf0d5';
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
    }
    ctx.filter = 'none';

    // 2. 繪製餐廳擴建的「露天彩虹陽傘桌椅」與 NPC 動物顧客
    if (this.currentMap === 'town') {
      this.renderRestaurantExterior(ctx);
      this.renderTownNPCs(ctx);
    } else {
      this.renderCoastNPCs(ctx);
    }

    // 3. 繪製野外採集點與隱藏寶箱
    this.renderHarvestNodes(ctx);

    // 4. 繪製散落寶石
    for (const g of this.gems) {
      if (g.map !== this.currentMap) continue;
      const gy = g.y + Math.sin(g.bob) * 6;
      ctx.save();
      ctx.translate(g.x, gy);
      ctx.fillStyle = g.color;
      ctx.strokeStyle = '#5e3a24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 5. 繪製地標建築提示牌
    this.renderLandmarkSigns(ctx);

    // 6. 繪製跟隨寵物與主角載具（嚴格遵循 GDD 2.1：主角與載具約佔畫面高度 1/6）
    const targetCharScreenH = this.canvas.height / 5.6;
    const charWorldH = targetCharScreenH / cam.scale;

    if (this.state.unlockedPets.includes('calico')) {
      this.renderCalicoCat(ctx, charWorldH * 0.45);
    }

    this.renderPlayerAndVehicle(ctx, charWorldH);
    this.renderFlyingCat(ctx, charWorldH * 0.56);

    // 7. 繪製粒子與飄字
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 24px "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }

  renderRestaurantExterior(ctx) {
    // 繪製擴建後的彩虹陽傘桌椅
    const tableImg = this.images.cafe_table;
    if (this.state.upgrades.umbrellaTables && tableImg && tableImg.complete) {
      ctx.drawImage(tableImg, 640, 620, 140, 155);
      ctx.drawImage(tableImg, 790, 560, 140, 155);
    }

    // 繪製星光餐廳招牌 [營業中 / 小貓店長代理中]
    ctx.save();
    ctx.translate(530, 440);
    ctx.fillStyle = 'rgba(255, 250, 245, 0.95)';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-125, -36, 250, 68, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 20px "Microsoft JhengHei"';
    ctx.fillStyle = '#e04580';
    ctx.textAlign = 'center';
    ctx.fillText('🏡 星光餐廳 (蘑菇屋)', 0, -8);
    ctx.font = 'bold 16px "Microsoft JhengHei"';
    ctx.fillStyle = this.state.showcaseCount > 0 ? '#2a9d8f' : '#e76f51';
    const statusTxt = this.state.showcaseCount > 0
      ? `🐾 營業中 (庫存:${this.state.showcaseCount}份)`
      : '🍓 準備中 (點擊進屋下廚)';
    ctx.fillText(statusTxt, 0, 18);
    ctx.restore();
  }

  renderTownNPCs(ctx) {
    const bob = Math.sin(Date.now() * 0.004) * 5;
    // 麵包兔在烘焙坊前
    if (this.images.bread_bunny && this.images.bread_bunny.complete) {
      ctx.drawImage(this.images.bread_bunny, 1690, 220 + bob, 95, 155);
      this.drawSimpleTag(ctx, 1737, 205 + bob, '🐰 麵包兔');
    }
    // 水手鴨若被聘請也會出現在城鎮小河邊
    if (this.state.upgrades.sailorDuck && this.images.sailor_duck && this.images.sailor_duck.complete) {
      ctx.drawImage(this.images.sailor_duck, 2220, 980 - bob, 95, 145);
      this.drawSimpleTag(ctx, 2267, 965 - bob, '🦆 水手鴨配送員');
    }
  }

  renderCoastNPCs(ctx) {
    const bob = Math.sin(Date.now() * 0.004) * 5;
    if (this.images.sailor_duck && this.images.sailor_duck.complete) {
      ctx.drawImage(this.images.sailor_duck, 2100, 620 + bob, 105, 160);
      this.drawSimpleTag(ctx, 2152, 605 + bob, '🦆 水手鴨船長');
    }
    if (this.images.bread_bunny && this.images.bread_bunny.complete) {
      ctx.drawImage(this.images.bread_bunny, 640, 290 - bob, 95, 155);
      this.drawSimpleTag(ctx, 687, 275 - bob, '🐰 牧場小幫手');
    }
  }

  drawSimpleTag(ctx, x, y, text) {
    ctx.save();
    ctx.font = 'bold 16px "Microsoft JhengHei"';
    const w = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 22, w, 28, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5e3a24';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 3);
    ctx.restore();
  }

  renderHarvestNodes(ctx) {
    const bob = Math.sin(Date.now() * 0.005) * 5;
    for (const node of this.harvestNodes) {
      if (node.map !== this.currentMap) continue;
      if (node.type !== 'chest' && node.cooldown > 0) continue;

      ctx.save();
      ctx.translate(node.x, node.y);

      if (node.type === 'strawberry') {
        const spr = this.images[node.sprite || 'strawberry1'];
        if (spr && spr.complete) {
          ctx.drawImage(spr, -75, -75 + bob * 0.4, 150, 130);
        }
        this.drawSimpleTag(ctx, 0, -82 + bob, '🍓 採集草莓');
      } else if (node.type === 'flour') {
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌾', 0, bob);
        this.drawSimpleTag(ctx, 0, -45 + bob, '🌾 小麥粉');
      } else if (node.type === 'milk') {
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🥛', 0, bob);
        this.drawSimpleTag(ctx, 0, -45 + bob, '🥛 新鮮牛奶');
      } else if (node.type === 'chest') {
        ctx.font = '52px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.opened ? '📭' : '🎁', 0, bob);
        if (!node.opened) {
          this.drawSimpleTag(ctx, 0, -48 + bob, '✨ 神秘星光寶箱');
        }
      }
      ctx.restore();
    }
  }

  renderLandmarkSigns(ctx) {
    const nearest = this.getNearestLandmark();
    for (const lm of this.landmarks) {
      if (lm.map !== this.currentMap) continue;
      const isNear = nearest && nearest.id === lm.id;

      if (isNear) {
        ctx.save();
        ctx.translate(lm.x, lm.y);
        // 腳下發光魔法陣
        ctx.strokeStyle = '#ff6fa5';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.ellipse(0, 20, 95, 48, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 浮動互動提示框
        ctx.setLineDash([]);
        ctx.fillStyle = '#fff0f6';
        ctx.strokeStyle = '#5e3a24';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-130, -140, 260, 44, 18);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 18px "Microsoft JhengHei"';
        ctx.fillStyle = '#5e3a24';
        ctx.textAlign = 'center';
        ctx.fillText(`✋ 點擊互動：${lm.actionLabel}`, 0, -112);
        ctx.restore();
      }
    }
  }

  renderPlayerAndVehicle(ctx, charH) {
    const vehicles = this.getVehicleList();
    const v = vehicles[this.player.vehicleIndex] || vehicles[0];
    const bob = Math.sin(this.player.bobPhase) * 6;

    ctx.save();
    ctx.translate(this.player.x, this.player.y + bob);

    // 地面柔和陰影
    ctx.fillStyle = 'rgba(76, 40, 130, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 12 - bob, charH * 0.36, charH * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(this.player.facing, 1);

    // 套用換裝小屋選擇的衣服色調濾鏡
    const hueShift = this.state.equipped.colorHue || 0;
    if (hueShift !== 0) {
      ctx.filter = `hue-rotate(${hueShift}deg)`;
    }

    // 繪製背後翅膀飾品
    if (this.state.equipped.wings && this.state.equipped.wings !== 'none') {
      ctx.save();
      ctx.font = `${Math.round(charH * 0.34)}px sans-serif`;
      ctx.textAlign = 'center';
      const wingIcon = this.state.equipped.wings === 'fairy_wings' ? '🦋' : '🕊️';
      ctx.fillText(wingIcon, -charH * 0.22, -charH * 0.48);
      ctx.restore();
    }

    if (v.id === 'walk') {
      const img = this.images.witch_walk;
      if (img && img.complete) {
        const w = charH * (img.naturalWidth / img.naturalHeight);
        ctx.drawImage(img, -w / 2, -charH, w, charH);
      }
    } else if (v.id === 'bike') {
      const img = this.images.witch_bike;
      if (img && img.complete) {
        const w = charH * (img.naturalWidth / img.naturalHeight);
        ctx.drawImage(img, -w / 2, -charH, w, charH);
        // 若已解鎖 1-2 獎勵「小黃鴨單車車籃」
        if (this.state.unlockedItems.includes('duck_basket')) {
          ctx.font = `${Math.round(charH * 0.22)}px sans-serif`;
          ctx.fillText('🐤', -w * 0.28, -charH * 0.38);
        }
      }
    } else if (v.id === 'scooter') {
      const img = this.images.witch_scooter;
      if (img && img.complete) {
        const w = charH * (img.naturalWidth / img.naturalHeight);
        ctx.drawImage(img, -w / 2, -charH, w, charH);
      }
    } else if (v.id === 'car_pink' || v.id === 'car_blue') {
      // 先畫敞篷車內的魔女上半身，再疊加敞篷車
      const walkImg = this.images.witch_walk;
      const carImg = this.images.car_pink;
      if (walkImg && walkImg.complete) {
        const ww = (charH * 0.82) * (walkImg.naturalWidth / walkImg.naturalHeight);
        ctx.drawImage(walkImg, -ww * 0.4, -charH * 0.98, ww, charH * 0.82);
      }
      if (carImg && carImg.complete) {
        ctx.save();
        if (v.id === 'car_blue') {
          ctx.filter = 'hue-rotate(195deg) saturate(130%)';
        }
        const cw = (charH * 0.88) * (carImg.naturalWidth / carImg.naturalHeight);
        ctx.drawImage(carImg, -cw / 2, -charH * 0.72, cw, charH * 0.82);
        ctx.restore();
      }
    } else if (v.id === 'unicorn') {
      const walkImg = this.images.witch_walk;
      const uniImg = this.images.unicorn;
      if (uniImg && uniImg.complete) {
        const uw = (charH * 0.95) * (uniImg.naturalWidth / uniImg.naturalHeight);
        ctx.drawImage(uniImg, -uw / 2, -charH * 0.85, uw, charH * 0.9);
      }
      if (walkImg && walkImg.complete) {
        const ww = (charH * 0.75) * (walkImg.naturalWidth / walkImg.naturalHeight);
        ctx.drawImage(walkImg, -ww * 0.45, -charH * 1.12, ww, charH * 0.75);
      }
    }

    ctx.filter = 'none';

    // 繪製穿戴的特殊頭飾圖示（如 1-1 粉紅花朵安全帽、珍珠皇冠等）
    if (this.state.equipped.hat && this.state.equipped.hat !== 'default_witch') {
      const hatIcons = {
        flower_helmet: '🌸',
        pearl_crown: '👑',
        cat_ears: '🐱'
      };
      const icon = hatIcons[this.state.equipped.hat];
      if (icon) {
        ctx.font = `${Math.round(charH * 0.24)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(icon, 0, -charH * 0.92);
      }
    }

    ctx.restore();
  }

  renderFlyingCat(ctx, catH) {
    const img = this.images.cat_flying;
    if (!img || !img.complete) return;

    const vehicles = this.getVehicleList();
    const v = vehicles[this.player.vehicleIndex] || vehicles[0];
    const isRiding = v.id !== 'walk';

    ctx.save();
    // 騎車時小貓會坐在車籃/後座/副駕，走路時在旁邊飛翔跟隨
    let drawX = this.cat.x;
    let drawY = this.cat.y;
    let scale = 1;

    if (isRiding) {
      drawX = this.player.x - this.player.facing * (catH * 0.55);
      drawY = this.player.y - catH * 0.48 + Math.sin(this.player.bobPhase) * 6;
      scale = 0.78;
    }

    ctx.translate(drawX, drawY);
    ctx.save();
    ctx.scale(this.cat.facing * scale, scale);
    const w = catH * (img.naturalWidth / img.naturalHeight);
    ctx.drawImage(img, -w / 2, -catH, w, catH);

    // 寵物飾品或代理店長高帽
    if (this.state.equipped.petItem === 'chef_hat' || this.state.showcaseCount > 0) {
      ctx.font = `${Math.round(catH * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🎩', -w * 0.1, -catH * 0.85);
    } else if (this.state.equipped.petItem === 'angel_halo') {
      ctx.font = `${Math.round(catH * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('😇', -w * 0.1, -catH * 0.88);
    }
    ctx.restore();

    // 繪製小貓的「喵嗚~」對話泡泡
    if (this.cat.speechTimer > 0 && this.cat.speechText) {
      ctx.font = 'bold 16px "Microsoft JhengHei"';
      const tw = ctx.measureText(this.cat.speechText).width + 24;
      ctx.fillStyle = '#fff9db';
      ctx.strokeStyle = '#5e3a24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-tw / 2, -catH - 42, tw, 34, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5e3a24';
      ctx.textAlign = 'center';
      ctx.fillText(this.cat.speechText, 0, -catH - 20);
    }

    ctx.restore();
  }

  renderCalicoCat(ctx, h) {
    const bob = Math.sin(this.calicoCat.bobPhase) * 5;
    ctx.save();
    ctx.translate(this.calicoCat.x, this.calicoCat.y + bob);
    ctx.font = `${Math.round(h * 0.75)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🐈', 0, 0);
    this.drawSimpleTag(ctx, 0, -h * 0.75, '三花小貓');
    ctx.restore();
  }
}

window.StarlightWorld = StarlightWorld;
