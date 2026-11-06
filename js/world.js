/**
 * 🗺️ v2.0 2.5D 等角視角世界引擎 (Isometric World Engine)
 * 參考《哆啦A夢 牧場物語 自然王國與和樂家人》：
 * 1. 四大相連水彩繪本地圖：星光鎮廣場 (town) <-> 微風清溪森林 (creek) <-> 陽光畜牧農場 (ranch) <-> 蔚藍海岸碼頭 (coast)
 * 2. 真實地形與木橋碰撞判定（方向 A：過河走木橋、建築與深水防穿牆、路口邊緣自然過場）
 * 3. 陽光牧場放養小羊與小雞（現場餵食飼料、收穫雞蛋與羊毛）
 * 4. 微風清溪【溪釣點】與蔚藍海岸【海釣點】
 */

const MAP_INFO = {
  town: { name: '🏘️ 星光鎮中心廣場', bgKey: 'map_town' },
  creek: { name: '🌲 微風清溪與夢幻森林', bgKey: 'map_creek' },
  ranch: { name: '🌾 陽光畜牧農場', bgKey: 'map_ranch' },
  coast: { name: '🏖️ 蔚藍海岸與木棧碼頭', bgKey: 'map_coast' }
};

class StarlightWorld {
  constructor(canvasId, gameState) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.state = gameState;

    this.images = {};
    this.loadAssets();

    this.worldWidth = 2752;
    this.worldHeight = 1536;
    this.currentMap = 'town';
    this.portalCooldown = 0;

    this.player = {
      x: 1380,
      y: 940,
      vx: 0,
      vy: 0,
      facing: 1,
      vehicleIndex: 0,
      bobPhase: 0,
      targetX: null,
      targetY: null
    };

    this.cat = {
      x: 1310,
      y: 950,
      facing: 1,
      wingPhase: 0,
      meowCooldown: 0,
      speechText: '',
      speechTimer: 0
    };

    this.calicoCat = {
      x: 1260,
      y: 960,
      facing: 1,
      bobPhase: 0
    };

    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };
    this.particles = [];
    this.floatingTexts = [];

    // 陽光牧場放養的動物們（小羊與小雞）
    this.ranchAnimals = [];
    this.initRanchAnimals();

    this.initWorldEntities();
    this.bindEvents();
    this.resize();
  }

  loadAssets() {
    const assetList = {
      map_town: 'assets/maps/map_town.jpg',
      map_creek: 'assets/maps/map_creek.jpg',
      map_ranch: 'assets/maps/map_ranch.jpg',
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
      cafe_table: 'assets/sprites/prop_cafe_table.png',
      // v2.0 新增畜牧與釣魚圖資
      animal_sheep: 'assets/sprites/animal_sheep.png',
      animal_chicken: 'assets/sprites/animal_chicken.png',
      animal_chick: 'assets/sprites/animal_chick.png',
      item_feed_bag: 'assets/sprites/item_feed_bag.png',
      fish_creek_trout: 'assets/sprites/fish_creek_trout.png',
      fish_sea_bream: 'assets/sprites/fish_sea_bream.png',
      item_egg_wool: 'assets/sprites/item_egg_wool.png',
      item_fishing_rod: 'assets/sprites/item_fishing_rod.png'
    };

    for (const [key, src] of Object.entries(assetList)) {
      const img = new Image();
      img.src = src;
      this.images[key] = img;
    }
  }

  initRanchAnimals() {
    // 初始在陽光畜牧農場圍欄內放養 2 隻軟綿綿小羊、2 隻咕咕母雞、1 隻小黃雞
    this.ranchAnimals = [
      { id: 'sh1', species: 'sheep', name: '雲朵小羊咩咩', x: 1220, y: 690, vx: 0.7, vy: 0.3, facing: 1, hungry: true, hasProduct: false, timer: 0 },
      { id: 'sh2', species: 'sheep', name: '棉花糖小羊', x: 1480, y: 780, vx: -0.6, vy: 0.4, facing: -1, hungry: true, hasProduct: false, timer: 40 },
      { id: 'ch1', species: 'chicken', name: '黃金咕咕雞', x: 1150, y: 860, vx: 0.9, vy: -0.4, facing: 1, hungry: true, hasProduct: false, timer: 20 },
      { id: 'ch2', species: 'chicken', name: '元氣咕咕雞', x: 1380, y: 920, vx: -0.8, vy: -0.3, facing: -1, hungry: true, hasProduct: false, timer: 60 },
      { id: 'ck1', species: 'chick', name: '小黃雞啾啾', x: 1290, y: 840, vx: 1.0, vy: 0.5, facing: 1, hungry: false, hasProduct: false, timer: 10 }
    ];
  }

  addRanchAnimal(species) {
    const isSheep = species === 'sheep';
    this.ranchAnimals.push({
      id: `${species}_${Date.now()}`,
      species,
      name: isSheep ? '新領養小綿羊' : '新領養咕咕雞',
      x: 1180 + Math.random() * 340,
      y: 680 + Math.random() * 260,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.0,
      facing: 1,
      hungry: true,
      hasProduct: false,
      timer: 0
    });
  }

  initWorldEntities() {
    // 四張地圖的野外採集點與隱藏寶箱
    this.harvestNodes = [
      // 1. 星光鎮 (town)
      { id: 't_sb1', map: 'town', x: 340, y: 1180, type: 'strawberry', name: '彩虹草莓叢', cooldown: 0, sprite: 'strawberry1' },
      { id: 't_chest1', map: 'town', x: 240, y: 390, type: 'chest', name: '森林角落寶箱', opened: false },

      // 2. 微風清溪與夢幻森林 (creek)
      { id: 'cr_sb1', map: 'creek', x: 960, y: 540, type: 'strawberry', name: '溪畔甜草莓', cooldown: 0, sprite: 'strawberry2' },
      { id: 'cr_sb2', map: 'creek', x: 1740, y: 980, type: 'strawberry', name: '森林彩虹草莓', cooldown: 0, sprite: 'strawberry1' },
      { id: 'cr_ms1', map: 'creek', x: 650, y: 880, type: 'mushroom', name: '發光松露蘑菇', cooldown: 0 },
      { id: 'cr_ms2', map: 'creek', x: 1860, y: 560, type: 'mushroom', name: '森林香甜蘑菇', cooldown: 0 },
      { id: 'cr_chest1', map: 'creek', x: 2150, y: 360, type: 'chest', name: '瀑布秘境寶箱', opened: false },

      // 3. 陽光畜牧農場 (ranch)
      { id: 'rn_fl1', map: 'ranch', x: 2050, y: 420, type: 'flour', name: '金色麥田小麥粉', cooldown: 0 },
      { id: 'rn_fl2', map: 'ranch', x: 2340, y: 520, type: 'flour', name: '陽光小麥粉', cooldown: 0 },
      { id: 'rn_chest1', map: 'ranch', x: 460, y: 360, type: 'chest', name: '穀倉私房寶箱', opened: false },

      // 4. 蔚藍海岸與木棧碼頭 (coast)
      { id: 'co_sb1', map: 'coast', x: 360, y: 980, type: 'strawberry', name: '海風甜草莓', cooldown: 0, sprite: 'strawberry2' },
      { id: 'co_chest1', map: 'coast', x: 1290, y: 1280, type: 'chest', name: '沙灘貝殼寶箱', opened: false }
    ];

    this.gems = [];
    this.spawnRandomGems();

    // 四張地圖的建築、釣魚點、路口指標與 NPC
    this.landmarks = [
      // --- 🏘️ 星光鎮廣場 (town) ---
      { id: 'restaurant', map: 'town', x: 530, y: 660, radius: 200, title: '🏡 星光餐廳 (蘑菇屋)', actionLabel: '進入星光餐廳下廚', type: 'restaurant' },
      { id: 'fountain', map: 'town', x: 1580, y: 710, radius: 185, title: '⛲ 彩虹音樂噴泉', actionLabel: '挑戰 1-3 失蹤的小貓', type: 'minigame', gameId: '1-3' },
      { id: 'bear_shop', map: 'town', x: 2350, y: 560, radius: 195, title: '🐻 熊熊店長雜貨鋪', actionLabel: '買飼料 / 領養小雞小羊 / 1-1', type: 'npc_bear' },
      { id: 'bunny_bakery', map: 'town', x: 1760, y: 270, radius: 175, title: '🐰 麵包兔烘焙坊', actionLabel: '挑戰 1-2 幾何地磚', type: 'npc_bunny' },
      { id: 'town_to_creek', map: 'town', x: 960, y: 180, radius: 165, title: '🌲 往微風清溪與森林 (溪釣)', actionLabel: '前往微風清溪釣魚', type: 'portal', targetMap: 'creek', targetX: 460, targetY: 660 },
      { id: 'town_to_ranch', map: 'town', x: 2560, y: 260, radius: 175, title: '🌾 往陽光畜牧農場 (養羊養雞)', actionLabel: '前往陽光牧場餵羊餵雞', type: 'portal', targetMap: 'ranch', targetX: 380, targetY: 720 },
      { id: 'town_to_coast', map: 'town', x: 2560, y: 1020, radius: 175, title: '🏖️ 往蔚藍海岸碼頭 (海釣)', actionLabel: '前往蔚藍海岸海釣', type: 'portal', targetMap: 'coast', targetX: 420, targetY: 1100 },

      // --- 🌲 微風清溪與夢幻森林 (creek) ---
      { id: 'creek_fish_bridge', map: 'creek', x: 1350, y: 760, radius: 220, title: '🎣 清溪木橋釣魚點', actionLabel: '拋竿溪釣 (香魚/櫻花鱒)', type: 'fishing', spotType: 'creek' },
      { id: 'creek_fish_falls', map: 'creek', x: 1120, y: 420, radius: 210, title: '🎣 瀑布水潭釣魚點', actionLabel: '瀑布溪釣 (櫻花鱒/甜河蝦)', type: 'fishing', spotType: 'creek' },
      { id: 'creek_to_town', map: 'creek', x: 220, y: 630, radius: 170, title: '🏘️ 返回星光鎮廣場', actionLabel: '回星光鎮廣場', type: 'portal', targetMap: 'town', targetX: 980, targetY: 260 },
      { id: 'creek_to_ranch', map: 'creek', x: 2500, y: 650, radius: 175, title: '🌾 前往陽光畜牧農場', actionLabel: '前往陽光牧場', type: 'portal', targetMap: 'ranch', targetX: 1460, targetY: 220 },

      // --- 🌾 陽光畜牧農場 (ranch) ---
      { id: 'ranch_coop_barn', map: 'ranch', x: 760, y: 460, radius: 210, title: '🏡 陽光牧場雞舍與羊舍', actionLabel: '打開牧場餵食與買飼料面板', type: 'ranch_panel' },
      { id: 'ranch_pasture_gate', map: 'ranch', x: 1320, y: 790, radius: 280, title: '🐑 牧場放養圍欄區', actionLabel: '餵食小羊與小雞 / 收穫雞蛋羊毛', type: 'feed_animals' },
      { id: 'ranch_to_town', map: 'ranch', x: 210, y: 680, radius: 170, title: '🏘️ 返回星光鎮廣場', actionLabel: '回星光鎮廣場', type: 'portal', targetMap: 'town', targetX: 2420, targetY: 320 },
      { id: 'ranch_to_creek', map: 'ranch', x: 1480, y: 150, radius: 165, title: '🌲 前往微風清溪 (溪釣)', actionLabel: '前往微風清溪', type: 'portal', targetMap: 'creek', targetX: 2340, targetY: 660 },
      { id: 'ranch_to_coast', map: 'ranch', x: 2350, y: 1360, radius: 175, title: '🏖️ 前往蔚藍海岸 (海釣)', actionLabel: '前往蔚藍海岸', type: 'portal', targetMap: 'coast', targetX: 820, targetY: 320 },

      // --- 🏖️ 蔚藍海岸與木棧碼頭 (coast) ---
      { id: 'coast_sea_fishing', map: 'coast', x: 2260, y: 740, radius: 230, title: '🌊 木棧道海釣碼頭', actionLabel: '拋竿海釣 (星光鯛/藍寶石鮪魚)', type: 'fishing', spotType: 'sea' },
      { id: 'sailor_duck_pier', map: 'coast', x: 1850, y: 560, radius: 185, title: '🦆 水手鴨船長', actionLabel: '挑戰 2-1 貝殼水果派對', type: 'npc_duck' },
      { id: 'coast_to_town', map: 'coast', x: 280, y: 1160, radius: 175, title: '🏘️ 返回星光鎮廣場', actionLabel: '回星光鎮廣場', type: 'portal', targetMap: 'town', targetX: 2420, targetY: 980 },
      { id: 'coast_to_ranch', map: 'coast', x: 760, y: 220, radius: 170, title: '🌾 前往陽光畜牧農場', actionLabel: '前往陽光牧場', type: 'portal', targetMap: 'ranch', targetX: 2220, targetY: 1260 }
    ];
  }

  spawnRandomGems() {
    this.gems = [];
    const maps = ['town', 'creek', 'ranch', 'coast'];
    const colors = ['#ff6fa5', '#ffbe0b', '#72efdd', '#9f67ff', '#ff9ebb'];
    for (let i = 0; i < 16; i++) {
      this.gems.push({
        map: maps[i % maps.length],
        x: 380 + Math.random() * 1900,
        y: 320 + Math.random() * 880,
        color: colors[i % colors.length],
        bob: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * 🚧 方向 A：地形、河流、海洋與建築物碰撞檢查 (防止穿牆與直接走進深水)
   */
  isPositionBlocked(map, x, y) {
    // 畫布四周安全邊界
    if (x < 95 || x > this.worldWidth - 95 || y < 120 || y > this.worldHeight - 80) {
      return true;
    }

    if (map === 'creek') {
      // 微風清溪中央是湍急溪流 (x 約 1140 ~ 1560)，必須走中央木橋 (y: 650 ~ 890) 才能過河！
      const inRiverX = x > 1150 && x < 1550;
      const onWoodenBridgeY = y >= 640 && y <= 900;
      if (inRiverX && !onWoodenBridgeY) {
        return true;
      }
      // 上方瀑布岩石區
      if (y < 290 && x > 1020 && x < 1680) return true;
    } else if (map === 'coast') {
      // 蔚藍海岸右下方為深海區域，但木棧道碼頭 (x: 2040..2560, y: 540..920) 可以行走去海釣！
      const onPier = x >= 2020 && x <= 2580 && y >= 520 && y <= 930;
      if (!onPier && x > 1280 && y > 860 && (x - 1280) + (y - 860) > 360) {
        return true;
      }
    } else if (map === 'town') {
      // 星光鎮中央噴泉池與蘑菇屋主體防穿牆
      if (Math.hypot(x - 1585, y - 660) < 125) return true; // 噴泉水池中心
      if (Math.hypot(x - 450, y - 500) < 145) return true;  // 蘑菇屋主體
      if (Math.hypot(x - 2420, y - 470) < 120) return true; // 熊熊商店屋體
    } else if (map === 'ranch') {
      // 陽光牧場左上角紅穀倉屋體防穿牆
      if (x > 310 && x < 980 && y > 140 && y < 430) return true;
    }

    return false;
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

    this.canvas.addEventListener('pointerdown', e => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cam = this.getCamera();
      const wx = sx / cam.scale + cam.x;
      const wy = sy / cam.scale + cam.y;

      this.player.targetX = Math.max(110, Math.min(this.worldWidth - 110, wx));
      this.player.targetY = Math.max(130, Math.min(this.worldHeight - 90, wy));
      this.addSparkleBurst(wx, wy, '#fff3b0', 6);
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  getVehicleList() {
    const list = [
      { id: 'walk', name: '步行', icon: '🚶‍♀️', speed: 4.5 },
      { id: 'bike', name: '黃色腳踏車', icon: '🚲', speed: 6.2 },
      { id: 'scooter', name: '酷炫粉紅機車', icon: '🛵', speed: 7.6 },
      { id: 'car_pink', name: '粉紅敞篷車', icon: '🚗', speed: 8.8 },
      { id: 'unicorn', name: '魔法獨角獸', icon: '🦄', speed: 9.4 }
    ];
    if (this.state.unlockedVehicles.includes('car_blue')) {
      list.push({ id: 'car_blue', name: '藍色海洋敞篷車', icon: '🚙', speed: 9.6 });
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
    if (!MAP_INFO[targetMap]) return;
    this.currentMap = targetMap;
    this.portalCooldown = 45;
    if (tx !== undefined && ty !== undefined) {
      this.player.x = tx;
      this.player.y = ty;
      this.cat.x = tx - 60;
      this.cat.y = ty + 10;
    }
    this.player.targetX = null;
    this.player.targetY = null;
    window.Sound.playStar();

    const info = MAP_INFO[targetMap];
    this.addFloatingText(this.player.x, this.player.y - 100, info.name, '#9f67ff');
    const badge = document.getElementById('hud-map-name');
    if (badge) badge.innerHTML = window.Bopomofo.toHTML(info.name);
  }

  getCamera() {
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
      life: 58
    });
  }

  update() {
    if (this.portalCooldown > 0) this.portalCooldown--;

    const vehicles = this.getVehicleList();
    const currentVehicle = vehicles[this.player.vehicleIndex] || vehicles[0];
    const spd = currentVehicle.speed;

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
      if (dist > 14) {
        dx = tdx / dist;
        dy = tdy / dist;
      } else {
        this.player.targetX = null;
        this.player.targetY = null;
      }
    }

    this.player.vx = dx * spd;
    this.player.vy = dy * spd;

    // 分離 X / Y 軸碰撞檢測，讓角色遇到河岸或圍欄時可以順著邊緣滑動，不會卡死！
    const nextX = this.player.x + this.player.vx;
    const nextY = this.player.y + this.player.vy;

    if (!this.isPositionBlocked(this.currentMap, nextX, this.player.y)) {
      this.player.x = nextX;
    }
    if (!this.isPositionBlocked(this.currentMap, this.player.x, nextY)) {
      this.player.y = nextY;
    } else if (this.player.targetX !== null) {
      // 點擊移動遇到河岸時自動停止目標尋路並提示走木橋
      this.player.targetX = null;
      this.player.targetY = null;
    }

    if (Math.abs(this.player.vx) > 0.2) {
      this.player.facing = this.player.vx > 0 ? 1 : -1;
    }

    const isMoving = Math.hypot(this.player.vx, this.player.vy) > 0.25;
    if (isMoving) {
      this.player.bobPhase += 0.22;
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

    // 檢查《哆啦A夢 牧場物語》風格：走到地圖邊緣路口時自然切換到相鄰區域！
    if (this.portalCooldown <= 0 && isMoving) {
      this.checkEdgeMapTransition();
    }

    // 更新陽光牧場的小羊與小雞走動
    this.updateRanchAnimals();

    // 更新飛天星光小貓
    this.cat.wingPhase += 0.28;
    const targetCatX = this.player.x - this.player.facing * 75;
    const targetCatY = this.player.y - 25 + Math.sin(this.cat.wingPhase * 0.5) * 10;

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
      this.cat.x += (nearestGem.gem.x - this.cat.x) * 0.18;
      this.cat.y += (nearestGem.gem.y - this.cat.y) * 0.18;
      if (Math.hypot(nearestGem.gem.x - this.cat.x, nearestGem.gem.y - this.cat.y) < 38) {
        this.gems.splice(nearestGem.index, 1);
        this.state.addCoins(10);
        this.state.addExp(5);
        window.Sound.playCoin();
        this.addSparkleBurst(this.cat.x, this.cat.y, '#72efdd', 8);
        this.addFloatingText(this.cat.x, this.cat.y - 30, '🐾 小貓拾取寶石 +10💰', '#ffbe0b');
        if (this.gems.length < 8) this.spawnRandomGems();
      }
    } else {
      this.cat.x += (targetCatX - this.cat.x) * 0.1;
      this.cat.y += (targetCatY - this.cat.y) * 0.1;
    }
    this.cat.facing = this.player.facing;

    // 寶箱喵嗚提示
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

    if (this.state.unlockedPets.includes('calico')) {
      this.calicoCat.bobPhase += 0.2;
      const tcx = this.player.x - this.player.facing * 135;
      const tcy = this.player.y + 15;
      this.calicoCat.x += (tcx - this.calicoCat.x) * 0.08;
      this.calicoCat.y += (tcy - this.calicoCat.y) * 0.08;
      this.calicoCat.facing = this.player.facing;
    }

    // 檢查野外採集點
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
          node.cooldown = 380;
          if (node.type === 'strawberry') {
            this.state.ingredients.strawberry += 2;
            this.addFloatingText(node.x, node.y - 40, '🍓 採集彩虹草莓 +2', '#ff5d8f');
          } else if (node.type === 'mushroom') {
            this.state.ingredients.mushroom += 2;
            this.addFloatingText(node.x, node.y - 40, '🍄 採集森林松露蘑菇 +2', '#9f67ff');
          } else if (node.type === 'flour') {
            this.state.ingredients.flour += 2;
            this.addFloatingText(node.x, node.y - 40, '🌾 收割黃金小麥粉 +2', '#ffbe0b');
          }
          this.state.addExp(10);
          window.Sound.playCoin();
          this.addSparkleBurst(node.x, node.y, '#ff9ebb', 10);
          this.state.updateHUD();
        }
      }
    }

    // 更新粒子與飄字
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

  checkEdgeMapTransition() {
    const x = this.player.x;
    const y = this.player.y;
    if (this.currentMap === 'town') {
      if (y < 145 && x > 650 && x < 1250) this.switchMap('creek', 320, 650);
      else if (x > 2610 && y < 550) this.switchMap('ranch', 320, 680);
      else if (x > 2610 && y > 820) this.switchMap('coast', 380, 1100);
    } else if (this.currentMap === 'creek') {
      if (x < 140) this.switchMap('town', 960, 260);
      else if (x > 2610) this.switchMap('ranch', 1460, 240);
    } else if (this.currentMap === 'ranch') {
      if (x < 140) this.switchMap('town', 2420, 320);
      else if (y < 145) this.switchMap('creek', 2380, 650);
      else if (y > 1410) this.switchMap('coast', 800, 300);
    } else if (this.currentMap === 'coast') {
      if (x < 160) this.switchMap('town', 2420, 980);
    }
  }

  updateRanchAnimals() {
    for (const a of this.ranchAnimals) {
      a.timer++;
      a.x += a.vx;
      a.y += a.vy;

      // 保持在陽光牧場中央木柵欄草地內 (x: 1020..1640, y: 600..990)
      if (a.x < 1040 || a.x > 1620) a.vx *= -1;
      if (a.y < 620 || a.y > 970) a.vy *= -1;
      if (Math.random() < 0.015) {
        a.vx = (Math.random() - 0.5) * 1.3;
        a.vy = (Math.random() - 0.5) * 0.9;
      }
      if (Math.abs(a.vx) > 0.05) a.facing = a.vx > 0 ? 1 : -1;
    }
  }

  feedAnimalsOnMap() {
    let fedCount = 0;
    for (const a of this.ranchAnimals) {
      if (a.species === 'sheep') {
        if (this.state.feeds.sheepFeed > 0) {
          this.state.feeds.sheepFeed--;
        }
        a.hungry = false;
        this.state.ingredients.milk += 2;
        this.state.ingredients.wool += 1;
        fedCount++;
        this.addSparkleBurst(a.x, a.y, '#ff9ebb', 10);
      } else if (a.species === 'chicken' || a.species === 'chick') {
        if (this.state.feeds.chickenFeed > 0) {
          this.state.feeds.chickenFeed--;
        }
        a.hungry = false;
        this.state.ingredients.egg += 2;
        fedCount++;
        this.addSparkleBurst(a.x, a.y, '#ffbe0b', 10);
      }
    }

    if (fedCount > 0) {
      window.Sound.playBaa();
      setTimeout(() => window.Sound.playCluck(), 180);
      this.state.addExp(25);
      this.state.updateHUD();
      this.addFloatingText(
        this.player.x,
        this.player.y - 80,
        '❤️ 餵食小羊與小雞完成！獲得：雞蛋+4、羊奶+4、羊毛+2！',
        '#e04580'
      );
    }
  }

  getNearestLandmark() {
    let best = null;
    let bestDist = 240;
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
      window.Sound.playStar();
      this.addSparkleBurst(this.player.x, this.player.y - 50, '#ff9ebb', 14);
      this.cat.speechText = '喵嗚~ 我們去溪邊釣魚或去牧場餵小羊吧！✨';
      this.cat.speechTimer = 120;
      return;
    }

    if (lm.type === 'restaurant') {
      window.GameApp.openModal('restaurant-modal');
    } else if (lm.type === 'portal') {
      this.switchMap(lm.targetMap, lm.targetX, lm.targetY);
    } else if (lm.type === 'fishing') {
      window.FishingRanch.openFishingSpot(lm.spotType);
    } else if (lm.type === 'ranch_panel') {
      window.GameApp.openModal('shop-ranch-modal');
    } else if (lm.type === 'feed_animals') {
      if (this.state.feeds.sheepFeed <= 0 && this.state.feeds.chickenFeed <= 0) {
        window.GameApp.openModal('shop-ranch-modal');
      } else {
        this.feedAnimalsOnMap();
      }
    } else if (lm.type === 'minigame') {
      window.GameApp.openMiniGame(lm.gameId);
    } else if (lm.type === 'npc_bear') {
      window.GameApp.openModal('shop-ranch-modal');
    } else if (lm.type === 'npc_bunny') {
      window.GameApp.showDialogue(
        '麵包兔',
        'assets/sprites/bread_bunny.png',
        '小魔女你好！廣場的彩虹地磚需要通電，快來挑戰「幾何地磚」把紅光和藍光合成紫光吧！',
        () => window.GameApp.openMiniGame('1-2')
      );
    } else if (lm.type === 'npc_duck') {
      window.GameApp.showDialogue(
        '水手鴨船長',
        'assets/sprites/sailor_duck.png',
        '嘎嘎！木棧道碼頭可以「海釣」釣粉紅星光鯛魚喔！或者先來挑戰「貝殼水果派對」吧！',
        () => window.GameApp.openMiniGame('2-1')
      );
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cam = this.getCamera();
    ctx.save();
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.x, -cam.y);

    // 1. 繪製當前區域繪本地圖
    const info = MAP_INFO[this.currentMap] || MAP_INFO.town;
    const mapImg = this.images[info.bgKey];
    const shardRatio = Math.min(1, this.state.shards / 5);
    const sat = 75 + Math.round(shardRatio * 35);
    ctx.filter = `saturate(${sat}%) brightness(${98 + Math.round(shardRatio * 4)}%)`;

    if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
      ctx.drawImage(mapImg, 0, 0, this.worldWidth, this.worldHeight);
    } else {
      ctx.fillStyle = '#fdf0d5';
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
    }
    ctx.filter = 'none';

    // 2. 依各張地圖繪製專屬場景物件、動物與 NPC
    if (this.currentMap === 'town') {
      this.renderRestaurantExterior(ctx);
      this.renderTownNPCs(ctx);
    } else if (this.currentMap === 'creek') {
      this.renderCreekFishingSpots(ctx);
    } else if (this.currentMap === 'ranch') {
      this.renderRanchAnimalsAndCoop(ctx);
    } else if (this.currentMap === 'coast') {
      this.renderCoastNPCsAndPier(ctx);
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

    // 5. 繪製路口指標牌與互動光圈
    this.renderLandmarkSigns(ctx);

    // 6. 繪製主角與載具（佔畫面高度 1/6）+ 飛天小貓
    const targetCharScreenH = this.canvas.height / 5.6;
    const charWorldH = targetCharScreenH / cam.scale;

    if (this.state.unlockedPets.includes('calico')) {
      this.renderCalicoCat(ctx, charWorldH * 0.45);
    }

    this.renderPlayerAndVehicle(ctx, charWorldH);
    this.renderFlyingCat(ctx, charWorldH * 0.56);

    // 7. 粒子與飄字
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

  renderCreekFishingSpots(ctx) {
    const wave = Math.sin(Date.now() * 0.005) * 6;
    // 在瀑布水潭與木橋旁繪製游動的魚影與溪釣浮標圖示
    const spots = [
      { x: 1350, y: 760, label: '🎣 清溪木橋釣點 (點擊溪釣)' },
      { x: 1120, y: 420, label: '🎣 瀑布水潭釣點 (櫻花鱒出沒)' }
    ];
    for (const s of spots) {
      ctx.save();
      ctx.translate(s.x, s.y);
      if (this.images.item_fishing_rod && this.images.item_fishing_rod.complete) {
        ctx.drawImage(this.images.item_fishing_rod, -45, -90 + wave, 90, 95);
      }
      this.drawSimpleTag(ctx, 0, -98 + wave, s.label);
      ctx.restore();
    }
  }

  renderRanchAnimalsAndCoop(ctx) {
    // 繪製圍欄裡走動的小羊、咕咕雞與小黃雞
    for (const a of this.ranchAnimals) {
      const bob = Math.abs(Math.sin((Date.now() * 0.006) + a.timer)) * 7;
      ctx.save();
      ctx.translate(a.x, a.y - bob);

      // 陰影
      ctx.fillStyle = 'rgba(94, 58, 36, 0.18)';
      ctx.beginPath();
      ctx.ellipse(0, bob + 6, 36, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.scale(a.facing, 1);
      let spr = this.images.animal_sheep;
      let w = 115, h = 115;
      if (a.species === 'chicken') {
        spr = this.images.animal_chicken;
        w = 92; h = 86;
      } else if (a.species === 'chick') {
        spr = this.images.animal_chick;
        w = 64; h = 64;
      }
      if (spr && spr.complete) {
        ctx.drawImage(spr, -w / 2, -h, w, h);
      }
      ctx.restore();

      // 頭頂狀態泡泡：肚子餓顯示飼料袋，吃飽顯示愛心與雞蛋/羊毛
      const statusTxt = a.hungry
        ? (a.species === 'sheep' ? '💭 想吃牧草飼料' : '💭 想吃穀物飼料')
        : (a.species === 'sheep' ? '❤️ 產出羊奶與羊毛✨' : '❤️ 產出黃金雞蛋🥚');
      this.drawSimpleTag(ctx, 0, -h - 8, statusTxt);
      ctx.restore();
    }

    // 穀倉前繪製飼料袋與雞蛋羊毛籃圖示
    if (this.images.item_feed_bag && this.images.item_feed_bag.complete) {
      ctx.drawImage(this.images.item_feed_bag, 710, 410, 80, 95);
    }
    if (this.images.item_egg_wool && this.images.item_egg_wool.complete) {
      ctx.drawImage(this.images.item_egg_wool, 800, 420, 88, 88);
    }
    this.drawSimpleTag(ctx, 785, 395, '🏡 牧場雞舍與飼料倉 (點擊管理)');
  }

  renderCoastNPCsAndPier(ctx) {
    const bob = Math.sin(Date.now() * 0.004) * 5;
    if (this.images.sailor_duck && this.images.sailor_duck.complete) {
      ctx.drawImage(this.images.sailor_duck, 1800, 480 + bob, 105, 160);
      this.drawSimpleTag(ctx, 1852, 465 + bob, '🦆 水手鴨船長 (2-1 貝殼派對)');
    }
    // 木棧道海釣點
    if (this.images.item_fishing_rod && this.images.item_fishing_rod.complete) {
      ctx.drawImage(this.images.item_fishing_rod, 2220, 650 + bob, 95, 105);
    }
    this.drawSimpleTag(ctx, 2265, 635 + bob, '🌊 木棧道海釣點 (星光鯛魚/鮪魚)');
  }

  renderRestaurantExterior(ctx) {
    const tableImg = this.images.cafe_table;
    if (this.state.upgrades.umbrellaTables && tableImg && tableImg.complete) {
      ctx.drawImage(tableImg, 640, 620, 140, 155);
      ctx.drawImage(tableImg, 790, 560, 140, 155);
    }

    ctx.save();
    ctx.translate(530, 440);
    ctx.fillStyle = 'rgba(255, 250, 245, 0.95)';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-130, -36, 260, 68, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 20px "Microsoft JhengHei"';
    ctx.fillStyle = '#e04580';
    ctx.textAlign = 'center';
    ctx.fillText('🏡 星光餐廳 (蘑菇屋)', 0, -8);
    ctx.font = 'bold 16px "Microsoft JhengHei"';
    ctx.fillStyle = this.state.showcaseCount > 0 ? '#2a9d8f' : '#e76f51';
    const statusTxt = this.state.showcaseCount > 0
      ? `🐾 營業中 (櫥窗:${this.state.showcaseCount}份料理)`
      : '🍓 準備中 (點擊進屋料理魚跟甜點)';
    ctx.fillText(statusTxt, 0, 18);
    ctx.restore();
  }

  renderTownNPCs(ctx) {
    const bob = Math.sin(Date.now() * 0.004) * 5;
    if (this.images.bread_bunny && this.images.bread_bunny.complete) {
      ctx.drawImage(this.images.bread_bunny, 1690, 220 + bob, 95, 155);
      this.drawSimpleTag(ctx, 1737, 205 + bob, '🐰 麵包兔 (1-2 幾何地磚)');
    }
    // 熊熊雜貨鋪前擺放飼料袋招牌
    if (this.images.item_feed_bag && this.images.item_feed_bag.complete) {
      ctx.drawImage(this.images.item_feed_bag, 2280, 540 + bob * 0.5, 72, 88);
    }
    this.drawSimpleTag(ctx, 2360, 420 + bob, '🐻 熊熊雜貨鋪 (買飼料/領養雞羊)');
  }

  drawSimpleTag(ctx, x, y, text) {
    ctx.save();
    ctx.font = 'bold 16px "Microsoft JhengHei"';
    const w = ctx.measureText(text).width + 22;
    ctx.fillStyle = 'rgba(255, 252, 245, 0.92)';
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
      } else if (node.type === 'mushroom') {
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍄✨', 0, bob);
        this.drawSimpleTag(ctx, 0, -45 + bob, '🍄 森林松露蘑菇');
      } else if (node.type === 'flour') {
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌾', 0, bob);
        this.drawSimpleTag(ctx, 0, -45 + bob, '🌾 收割小麥粉');
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

      // 常駐顯示路口方向指標牌 (Portals)
      if (lm.type === 'portal') {
        this.drawSimpleTag(ctx, lm.x, lm.y - 30, lm.title);
      }

      const isNear = nearest && nearest.id === lm.id;
      if (isNear) {
        ctx.save();
        ctx.translate(lm.x, lm.y);
        ctx.strokeStyle = '#ff6fa5';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.ellipse(0, 20, 95, 48, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#fff0f6';
        ctx.strokeStyle = '#5e3a24';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-155, -140, 310, 44, 18);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 18px "Microsoft JhengHei"';
        ctx.fillStyle = '#e04580';
        ctx.textAlign = 'center';
        ctx.fillText(`✋ 空白鍵 / 互動鍵：${lm.actionLabel}`, 0, -112);
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

    ctx.fillStyle = 'rgba(76, 40, 130, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 12 - bob, charH * 0.36, charH * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(this.player.facing, 1);

    const hueShift = this.state.equipped.colorHue || 0;
    if (hueShift !== 0) {
      ctx.filter = `hue-rotate(${hueShift}deg)`;
    }

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
