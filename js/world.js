/**
 * 🗺️ v2.2 2.5D 等角視角世界引擎 (Isometric World Engine)
 * 升級重點：
 * 1. 修正所有角色、載具、飛天小貓與牧場動物的移動朝向（原圖朝左，往右移動時自動鏡像翻轉並帶轉向傾角）
 * 2. 結合 Python 像素級影像分析與幾何多邊形的真實碰撞系統 (window.COLLISION_GRIDS)：
 *    精準阻擋建築物、海洋、溪流、噴泉、森林與高低差岩壁，僅木橋、木棧道、石子路與草地沙灘可行走
 * 3. 針對手機與平板觸控最佳化的鏡頭縮放與防卡牆滑動物理
 */

const MAP_INFO = {
  town: { name: '🏘️ 星光鎮中心廣場', bgKey: 'map_town', safeSpawn: { x: 1320, y: 920 } },
  creek: { name: '🌲 微風清溪與夢幻森林', bgKey: 'map_creek', safeSpawn: { x: 860, y: 740 } },
  ranch: { name: '🌾 陽光畜牧農場', bgKey: 'map_ranch', safeSpawn: { x: 1280, y: 800 } },
  coast: { name: '🏖️ 蔚藍海岸與木棧碼頭', bgKey: 'map_coast', safeSpawn: { x: 1120, y: 920 } }
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
    this.gridW = 172;
    this.gridH = 96;
    this.cellSize = 16;

    this.currentMap = 'town';
    this.portalCooldown = 0;
    this.showCollisionDebug = false; // 可切換顯示地形碰撞網格

    // 主角狀態：facing = 1 (朝右), -1 (朝左)
    this.player = {
      x: 1320,
      y: 920,
      vx: 0,
      vy: 0,
      facing: 1,
      tiltAngle: 0,
      vehicleIndex: 0,
      bobPhase: 0,
      targetX: null,
      targetY: null,
      bumpCooldown: 0
    };

    this.cat = {
      x: 1240,
      y: 930,
      facing: 1,
      wingPhase: 0,
      meowCooldown: 0,
      speechText: '',
      speechTimer: 0
    };

    this.calicoCat = {
      x: 1190,
      y: 950,
      facing: 1,
      bobPhase: 0
    };

    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };
    this.particles = [];
    this.floatingTexts = [];

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
    this.ranchAnimals = [
      { id: 'sh1', species: 'sheep', name: '雲朵小羊咩咩', x: 1220, y: 720, vx: 0.7, vy: 0.3, facing: 1, hungry: true, timer: 0 },
      { id: 'sh2', species: 'sheep', name: '棉花糖小羊', x: 1460, y: 780, vx: -0.6, vy: 0.4, facing: -1, hungry: true, timer: 40 },
      { id: 'ch1', species: 'chicken', name: '黃金咕咕雞', x: 1180, y: 850, vx: 0.9, vy: -0.4, facing: 1, hungry: true, timer: 20 },
      { id: 'ch2', species: 'chicken', name: '元氣咕咕雞', x: 1380, y: 900, vx: -0.8, vy: -0.3, facing: -1, hungry: true, timer: 60 },
      { id: 'ck1', species: 'chick', name: '小黃雞啾啾', x: 1300, y: 830, vx: 1.0, vy: 0.5, facing: 1, hungry: false, timer: 10 }
    ];
  }

  addRanchAnimal(species) {
    const isSheep = species === 'sheep';
    this.ranchAnimals.push({
      id: `${species}_${Date.now()}`,
      species,
      name: isSheep ? '新領養小綿羊' : '新領養咕咕雞',
      x: 1220 + Math.random() * 260,
      y: 720 + Math.random() * 180,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.0,
      facing: 1,
      hungry: true,
      timer: 0
    });
  }

  initWorldEntities() {
    this.harvestNodes = [
      // 1. 星光鎮 (town)
      { id: 't_sb1', map: 'town', x: 740, y: 1180, type: 'strawberry', name: '彩虹草莓叢', cooldown: 0, sprite: 'strawberry1' },
      { id: 't_chest1', map: 'town', x: 980, y: 360, type: 'chest', name: '森林入口寶箱', opened: false },

      // 2. 微風清溪與夢幻森林 (creek)
      { id: 'cr_sb1', map: 'creek', x: 920, y: 580, type: 'strawberry', name: '溪畔甜草莓', cooldown: 0, sprite: 'strawberry2' },
      { id: 'cr_sb2', map: 'creek', x: 1760, y: 960, type: 'strawberry', name: '森林彩虹草莓', cooldown: 0, sprite: 'strawberry1' },
      { id: 'cr_ms1', map: 'creek', x: 720, y: 780, type: 'mushroom', name: '發光松露蘑菇', cooldown: 0 },
      { id: 'cr_ms2', map: 'creek', x: 1860, y: 680, type: 'mushroom', name: '森林香甜蘑菇', cooldown: 0 },
      { id: 'cr_chest1', map: 'creek', x: 2020, y: 740, type: 'chest', name: '清溪秘境寶箱', opened: false },

      // 3. 陽光畜牧農場 (ranch)
      { id: 'rn_fl1', map: 'ranch', x: 1780, y: 360, type: 'flour', name: '金色麥田小麥粉', cooldown: 0 },
      { id: 'rn_fl2', map: 'ranch', x: 2180, y: 640, type: 'flour', name: '陽光小麥粉', cooldown: 0 },
      { id: 'rn_chest1', map: 'ranch', x: 880, y: 560, type: 'chest', name: '穀倉私房寶箱', opened: false },

      // 4. 蔚藍海岸與木棧碼頭 (coast)
      { id: 'co_sb1', map: 'coast', x: 560, y: 960, type: 'strawberry', name: '海風甜草莓', cooldown: 0, sprite: 'strawberry2' },
      { id: 'co_chest1', map: 'coast', x: 1020, y: 1180, type: 'chest', name: '沙灘貝殼寶箱', opened: false }
    ];

    this.gems = [];
    this.spawnRandomGems();

    this.landmarks = [
      // --- 🏘️ 星光鎮廣場 (town) ---
      { id: 'restaurant', map: 'town', x: 820, y: 780, radius: 220, title: '🏡 星光餐廳 (蘑菇屋)', actionLabel: '進入星光餐廳下廚', type: 'restaurant' },
      { id: 'fountain', map: 'town', x: 1605, y: 920, radius: 210, title: '⛲ 彩虹音樂噴泉', actionLabel: '挑戰 1-3 失蹤的小貓', type: 'minigame', gameId: '1-3' },
      { id: 'bear_shop', map: 'town', x: 2160, y: 620, radius: 210, title: '🐻 熊熊店長雜貨鋪', actionLabel: '買飼料 / 領養雞羊', type: 'npc_bear' },
      { id: 'bunny_bakery', map: 'town', x: 1760, y: 470, radius: 190, title: '🐰 麵包兔烘焙坊', actionLabel: '挑戰 1-2 幾何地磚', type: 'npc_bunny' },
      { id: 'town_to_creek', map: 'town', x: 720, y: 180, radius: 180, title: '🌲 往微風清溪 (溪釣)', actionLabel: '前往微風清溪釣魚', type: 'portal', targetMap: 'creek', targetX: 460, targetY: 660 },
      { id: 'town_to_ranch', map: 'town', x: 2480, y: 210, radius: 190, title: '🌾 往陽光牧場 (養羊養雞)', actionLabel: '過木橋去陽光牧場', type: 'portal', targetMap: 'ranch', targetX: 420, targetY: 680 },
      { id: 'town_to_coast', map: 'town', x: 2560, y: 1010, radius: 190, title: '🏖️ 往蔚藍海岸 (海釣)', actionLabel: '過木橋去蔚藍海岸', type: 'portal', targetMap: 'coast', targetX: 360, targetY: 1180 },

      // --- 🌲 微風清溪與夢幻森林 (creek) ---
      { id: 'creek_fish_bridge', map: 'creek', x: 1350, y: 780, radius: 240, title: '🎣 清溪木橋釣魚點', actionLabel: '拋竿溪釣 (香魚/櫻花鱒)', type: 'fishing', spotType: 'creek' },
      { id: 'creek_fish_falls', map: 'creek', x: 960, y: 480, radius: 220, title: '🎣 瀑布水潭釣魚點', actionLabel: '瀑布溪釣 (櫻花鱒/甜河蝦)', type: 'fishing', spotType: 'creek' },
      { id: 'creek_to_town', map: 'creek', x: 200, y: 630, radius: 180, title: '🏘️ 返回星光鎮廣場', actionLabel: '回星光鎮廣場', type: 'portal', targetMap: 'town', targetX: 820, targetY: 260 },
      { id: 'creek_to_ranch', map: 'creek', x: 2480, y: 680, radius: 185, title: '🌾 前往陽光畜牧農場', actionLabel: '前往陽光牧場', type: 'portal', targetMap: 'ranch', targetX: 1460, targetY: 220 },

      // --- 🌾 陽光畜牧農場 (ranch) ---
      { id: 'ranch_coop_barn', map: 'ranch', x: 860, y: 560, radius: 220, title: '🏡 陽光牧場雞舍與羊舍', actionLabel: '打開牧場餵食與買飼料面板', type: 'ranch_panel' },
      { id: 'ranch_pasture_gate', map: 'ranch', x: 1320, y: 800, radius: 320, title: '🐑 牧場放養圍欄區', actionLabel: '餵食小羊與小雞 / 收雞蛋羊毛', type: 'feed_animals' },
      { id: 'ranch_to_town', map: 'ranch', x: 220, y: 680, radius: 180, title: '🏘️ 返回星光鎮廣場', actionLabel: '回星光鎮廣場', type: 'portal', targetMap: 'town', targetX: 2380, targetY: 280 },
      { id: 'ranch_to_creek', map: 'ranch', x: 1520, y: 150, radius: 180, title: '🌲 前往微風清溪 (溪釣)', actionLabel: '前往微風清溪', type: 'portal', targetMap: 'creek', targetX: 2320, targetY: 680 },
      { id: 'ranch_to_coast', map: 'ranch', x: 2350, y: 1360, radius: 185, title: '🏖️ 前往蔚藍海岸 (海釣)', actionLabel: '前往蔚藍海岸', type: 'portal', targetMap: 'coast', targetX: 980, targetY: 820 },

      // --- 🏖️ 蔚藍海岸與木棧碼頭 (coast) ---
      { id: 'coast_sea_fishing', map: 'coast', x: 2350, y: 740, radius: 250, title: '🌊 木棧道海釣碼頭', actionLabel: '拋竿海釣 (星光鯛/藍寶石鮪魚)', type: 'fishing', spotType: 'sea' },
      { id: 'sailor_duck_pier', map: 'coast', x: 1920, y: 680, radius: 210, title: '🦆 水手鴨船長', actionLabel: '挑戰 2-1 貝殼水果派對', type: 'npc_duck' },
      { id: 'coast_to_town', map: 'coast', x: 320, y: 1180, radius: 185, title: '🏘️ 返回星光鎮廣場', actionLabel: '過木橋回星光鎮', type: 'portal', targetMap: 'town', targetX: 2420, targetY: 980 }
    ];
  }

  spawnRandomGems() {
    this.gems = [];
    const maps = ['town', 'creek', 'ranch', 'coast'];
    const colors = ['#ff6fa5', '#ffbe0b', '#72efdd', '#9f67ff', '#ff9ebb'];
    for (let i = 0; i < 16; i++) {
      const m = maps[i % maps.length];
      const pos = this.findNearestWalkable(m, 500 + Math.random() * 1700, 350 + Math.random() * 850);
      this.gems.push({
        map: m,
        x: pos.x,
        y: pos.y,
        color: colors[i % colors.length],
        bob: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * 🚧 像素級 + 多邊形地形碰撞判定 (查詢 window.COLLISION_GRIDS)
   * 精準阻擋：海水、溪流、瀑布、高低差岩壁、房屋、攤販、柵欄與樹林
   */
  isPositionBlocked(map, x, y) {
    if (x < 64 || x > this.worldWidth - 64 || y < 80 || y > this.worldHeight - 64) {
      return true;
    }

    const grids = window.COLLISION_GRIDS;
    if (grids && grids[map]) {
      const gx = Math.floor(x / this.cellSize);
      const gy = Math.floor(y / this.cellSize);
      if (gy < 0 || gy >= this.gridH || gx < 0 || gx >= this.gridW) return true;
      return grids[map][gy].charCodeAt(gx) === 49; // '1' 代表不可通行障礙物
    }
    return false;
  }

  /**
   * 若座標落在障礙物內，自動向外螺旋搜尋最近的可行走地面座標
   */
  findNearestWalkable(map, x, y) {
    if (!this.isPositionBlocked(map, x, y)) return { x, y };
    for (let r = 16; r <= 480; r += 16) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const tx = x + Math.cos(a) * r;
        const ty = y + Math.sin(a) * r;
        if (!this.isPositionBlocked(map, tx, ty)) {
          return { x: tx, y: ty };
        }
      }
    }
    return MAP_INFO[map] ? MAP_INFO[map].safeSpawn : { x: 1320, y: 920 };
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

      if (this.isPositionBlocked(this.currentMap, wx, wy)) {
        // 點擊到海洋、河流或建築物時，自動引導至岸邊最近的可行走點並給予友善提示
        const near = this.findNearestWalkable(this.currentMap, wx, wy);
        this.player.targetX = near.x;
        this.player.targetY = near.y;
        this.addSparkleBurst(wx, wy, '#ff6fa5', 5);
      } else {
        this.player.targetX = wx;
        this.player.targetY = wy;
        this.addSparkleBurst(wx, wy, '#fff3b0', 6);
      }
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  getVehicleList() {
    const list = [
      { id: 'walk', name: '步行', icon: '🚶‍♀️', speed: 4.6 },
      { id: 'bike', name: '黃色腳踏車', icon: '🚲', speed: 6.4 },
      { id: 'scooter', name: '酷炫粉紅機車', icon: '🛵', speed: 7.8 },
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
    this.portalCooldown = 50;

    const rawX = tx !== undefined ? tx : MAP_INFO[targetMap].safeSpawn.x;
    const rawY = ty !== undefined ? ty : MAP_INFO[targetMap].safeSpawn.y;
    const safePos = this.findNearestWalkable(targetMap, rawX, rawY);

    this.player.x = safePos.x;
    this.player.y = safePos.y;
    this.cat.x = safePos.x - 50;
    this.cat.y = safePos.y + 10;
    this.player.targetX = null;
    this.player.targetY = null;
    window.Sound.playStar();

    const info = MAP_INFO[targetMap];
    this.addFloatingText(this.player.x, this.player.y - 100, info.name, '#9f67ff');
    const badge = document.getElementById('hud-map-name');
    if (badge) badge.innerHTML = window.Bopomofo.toHTML(info.name);
  }

  getCamera() {
    // 針對手機、平板與電腦自動計算最佳視野縮放
    const isMobile = this.canvas.width < 900 || this.canvas.height < 540;
    const baseScale = isMobile
      ? Math.max(this.canvas.width / 1500, this.canvas.height / 860, 0.48)
      : Math.max(this.canvas.width / 1920, this.canvas.height / 1080, 0.72);

    const viewW = this.canvas.width / baseScale;
    const viewH = this.canvas.height / baseScale;

    let camX = this.player.x - viewW / 2;
    let camY = this.player.y - viewH / 2;

    camX = Math.max(0, Math.min(this.worldWidth - viewW, camX));
    camY = Math.max(0, Math.min(this.worldHeight - viewH, camY));

    return { x: camX, y: camY, scale: baseScale, viewW, viewH };
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

  /**
   * 嘗試移動角色並支援沿著斜向道路/橋樑/海岸線平滑滑動
   */
  tryMovePlayer(vx, vy) {
    const px = this.player.x;
    const py = this.player.y;
    const m = this.currentMap;

    // 1. 直接移動
    if (!this.isPositionBlocked(m, px + vx, py + vy)) {
      this.player.x += vx;
      this.player.y += vy;
      return true;
    }

    // 2. X 軸或 Y 軸單獨滑動
    if (Math.abs(vx) > 0.1 && !this.isPositionBlocked(m, px + vx, py)) {
      this.player.x += vx;
      return true;
    }
    if (Math.abs(vy) > 0.1 && !this.isPositionBlocked(m, px, py + vy)) {
      this.player.y += vy;
      return true;
    }

    // 3. 針對 2.5D 斜向石子路與木橋，嘗試 ±35° 與 ±60° 切線滑動
    const speed = Math.hypot(vx, vy);
    const baseAngle = Math.atan2(vy, vx);
    for (const offsetDeg of [35, -35, 60, -60]) {
      const rad = baseAngle + (offsetDeg * Math.PI) / 180;
      const sx = Math.cos(rad) * speed * 0.75;
      const sy = Math.sin(rad) * speed * 0.75;
      if (!this.isPositionBlocked(m, px + sx, py + sy)) {
        this.player.x += sx;
        this.player.y += sy;
        return true;
      }
    }

    // 完全被障礙物或海水擋住時停止點擊尋路並顯示輕微反饋
    this.player.targetX = null;
    this.player.targetY = null;
    if (this.player.bumpCooldown <= 0) {
      this.player.bumpCooldown = 45;
      this.addSparkleBurst(px + vx * 2, py + vy * 2, '#72efdd', 4);
    }
    return false;
  }

  update() {
    if (this.portalCooldown > 0) this.portalCooldown--;
    if (this.player.bumpCooldown > 0) this.player.bumpCooldown--;

    // 確保玩家不會因為任何原因卡在障礙物格內
    if (this.isPositionBlocked(this.currentMap, this.player.x, this.player.y)) {
      const safe = this.findNearestWalkable(this.currentMap, this.player.x, this.player.y);
      this.player.x = safe.x;
      this.player.y = safe.y;
    }

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

    // 更新人物移動朝向與上下斜角微傾：
    // 往右移動 (vx > 0) -> facing = 1；往左移動 (vx < 0) -> facing = -1
    if (Math.abs(this.player.vx) > 0.15) {
      this.player.facing = this.player.vx > 0 ? 1 : -1;
    }

    const isMoving = Math.hypot(this.player.vx, this.player.vy) > 0.2;
    if (isMoving) {
      this.tryMovePlayer(this.player.vx, this.player.vy);
      // 根據垂直移動方向 (vy) 給予自然的車頭/身體俯仰角，讓朝上走或朝下走更有方向感！
      const targetTilt = (this.player.vy / spd) * 0.16;
      this.player.tiltAngle += (targetTilt - this.player.tiltAngle) * 0.25;
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
      this.player.tiltAngle *= 0.8;
      this.player.bobPhase += 0.06;
    }

    if (this.portalCooldown <= 0 && isMoving) {
      this.checkEdgeMapTransition();
    }

    this.updateRanchAnimals();

    // 更新飛天小貓跟隨與朝向
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
      const cdx = nearestGem.gem.x - this.cat.x;
      if (Math.abs(cdx) > 1) this.cat.facing = cdx > 0 ? 1 : -1;
      this.cat.x += cdx * 0.18;
      this.cat.y += (nearestGem.gem.y - this.cat.y) * 0.18;
      if (Math.hypot(cdx, nearestGem.gem.y - this.cat.y) < 38) {
        this.gems.splice(nearestGem.index, 1);
        this.state.addCoins(10);
        this.state.addExp(5);
        window.Sound.playCoin();
        this.addSparkleBurst(this.cat.x, this.cat.y, '#72efdd', 8);
        this.addFloatingText(this.cat.x, this.cat.y - 30, '🐾 小貓拾取寶石 +10💰', '#ffbe0b');
        if (this.gems.length < 8) this.spawnRandomGems();
      }
    } else {
      const cdx = targetCatX - this.cat.x;
      if (Math.abs(cdx) > 4) {
        this.cat.facing = cdx > 0 ? 1 : -1;
      } else {
        this.cat.facing = this.player.facing;
      }
      this.cat.x += cdx * 0.12;
      this.cat.y += (targetCatY - this.cat.y) * 0.12;
    }

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
      if (dist < 120) {
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
      if (y < 145 && x > 450 && x < 1150) this.switchMap('creek', 320, 650);
      else if (x > 2580 && y < 420) this.switchMap('ranch', 320, 680);
      else if (x > 2580 && y > 840) this.switchMap('coast', 360, 1180);
    } else if (this.currentMap === 'creek') {
      if (x < 140) this.switchMap('town', 760, 260);
      else if (x > 2580) this.switchMap('ranch', 1480, 220);
    } else if (this.currentMap === 'ranch') {
      if (x < 140) this.switchMap('town', 2380, 280);
      else if (y < 145) this.switchMap('creek', 2360, 680);
      else if (y > 1400) this.switchMap('coast', 980, 820);
    } else if (this.currentMap === 'coast') {
      if (x < 180) this.switchMap('town', 2420, 980);
    }
  }

  updateRanchAnimals() {
    for (const a of this.ranchAnimals) {
      a.timer++;
      const nx = a.x + a.vx;
      const ny = a.y + a.vy;

      // 保持在陽光牧場中央木柵欄草地內且不穿過柵欄
      if (nx < 1060 || nx > 1580 || this.isPositionBlocked('ranch', nx, a.y)) {
        a.vx *= -1;
      } else {
        a.x = nx;
      }
      if (ny < 650 || ny > 950 || this.isPositionBlocked('ranch', a.x, ny)) {
        a.vy *= -1;
      } else {
        a.y = ny;
      }

      if (Math.random() < 0.015) {
        a.vx = (Math.random() - 0.5) * 1.3;
        a.vy = (Math.random() - 0.5) * 0.9;
      }
      if (Math.abs(a.vx) > 0.05) {
        a.facing = a.vx > 0 ? 1 : -1;
      }
    }
  }

  feedAnimalsOnMap() {
    let fedCount = 0;
    for (const a of this.ranchAnimals) {
      if (a.species === 'sheep') {
        if (this.state.feeds.sheepFeed > 0) this.state.feeds.sheepFeed--;
        a.hungry = false;
        this.state.ingredients.milk += 2;
        this.state.ingredients.wool += 1;
        fedCount++;
        this.addSparkleBurst(a.x, a.y, '#ff9ebb', 10);
      } else if (a.species === 'chicken' || a.species === 'chick') {
        if (this.state.feeds.chickenFeed > 0) this.state.feeds.chickenFeed--;
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
    let bestDist = 250;
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
    const sat = 78 + Math.round(shardRatio * 32);
    ctx.filter = `saturate(${sat}%) brightness(${98 + Math.round(shardRatio * 4)}%)`;

    if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
      ctx.drawImage(mapImg, 0, 0, this.worldWidth, this.worldHeight);
    } else {
      ctx.fillStyle = '#fdf0d5';
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
    }
    ctx.filter = 'none';

    // 若開啟碰撞偵錯檢視
    if (this.showCollisionDebug && window.COLLISION_GRIDS && window.COLLISION_GRIDS[this.currentMap]) {
      const grid = window.COLLISION_GRIDS[this.currentMap];
      ctx.fillStyle = 'rgba(255, 50, 80, 0.28)';
      for (let gy = 0; gy < this.gridH; gy++) {
        const row = grid[gy];
        for (let gx = 0; gx < this.gridW; gx++) {
          if (row.charCodeAt(gx) === 49) {
            ctx.fillRect(gx * 16, gy * 16, 16, 16);
          }
        }
      }
    }

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
    const targetCharScreenH = Math.max(96, this.canvas.height / 5.4);
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
    const spots = [
      { x: 1350, y: 780, label: '🎣 清溪木橋釣點 (點擊溪釣)' },
      { x: 960, y: 480, label: '🎣 瀑布水潭釣點 (櫻花鱒出沒)' }
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
    for (const a of this.ranchAnimals) {
      const bob = Math.abs(Math.sin((Date.now() * 0.006) + a.timer)) * 7;
      ctx.save();
      ctx.translate(a.x, a.y - bob);

      ctx.fillStyle = 'rgba(94, 58, 36, 0.18)';
      ctx.beginPath();
      ctx.ellipse(0, bob + 6, 36, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      // 原圖小羊與小雞皆朝左 (-x)，因此當 a.facing === 1 (往右走) 時水平翻轉 (-1, 1)！
      ctx.scale(-a.facing, 1);
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

      const statusTxt = a.hungry
        ? (a.species === 'sheep' ? '💭 想吃牧草飼料' : '💭 想吃穀物飼料')
        : (a.species === 'sheep' ? '❤️ 產出羊奶與羊毛✨' : '❤️ 產出黃金雞蛋🥚');
      this.drawSimpleTag(ctx, 0, -h - 8, statusTxt);
      ctx.restore();
    }

    if (this.images.item_feed_bag && this.images.item_feed_bag.complete) {
      ctx.drawImage(this.images.item_feed_bag, 790, 490, 80, 95);
    }
    if (this.images.item_egg_wool && this.images.item_egg_wool.complete) {
      ctx.drawImage(this.images.item_egg_wool, 880, 500, 88, 88);
    }
    this.drawSimpleTag(ctx, 860, 470, '🏡 牧場雞舍與飼料倉 (點擊管理)');
  }

  renderCoastNPCsAndPier(ctx) {
    const bob = Math.sin(Date.now() * 0.004) * 5;
    if (this.images.sailor_duck && this.images.sailor_duck.complete) {
      ctx.drawImage(this.images.sailor_duck, 1870, 600 + bob, 105, 160);
      this.drawSimpleTag(ctx, 1922, 585 + bob, '🦆 水手鴨船長 (2-1 貝殼派對)');
    }
    if (this.images.item_fishing_rod && this.images.item_fishing_rod.complete) {
      ctx.drawImage(this.images.item_fishing_rod, 2310, 680 + bob, 95, 105);
    }
    this.drawSimpleTag(ctx, 2355, 665 + bob, '🌊 木棧道海釣點 (星光鯛魚/鮪魚)');
  }

  renderRestaurantExterior(ctx) {
    const tableImg = this.images.cafe_table;
    if (this.state.upgrades.umbrellaTables && tableImg && tableImg.complete) {
      ctx.drawImage(tableImg, 660, 660, 140, 155);
      ctx.drawImage(tableImg, 810, 600, 140, 155);
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
      ctx.drawImage(this.images.bread_bunny, 1710, 380 + bob, 95, 155);
      this.drawSimpleTag(ctx, 1757, 365 + bob, '🐰 麵包兔 (1-2 幾何地磚)');
    }
    if (this.images.item_feed_bag && this.images.item_feed_bag.complete) {
      ctx.drawImage(this.images.item_feed_bag, 2120, 560 + bob * 0.5, 72, 88);
    }
    this.drawSimpleTag(ctx, 2160, 540 + bob, '🐻 熊熊雜貨鋪 (買飼料/領養雞羊)');
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

    // 地面陰影
    ctx.fillStyle = 'rgba(76, 40, 130, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 12 - bob, charH * 0.36, charH * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 重要修正：原圖 (witch_walk / witch_bike / witch_scooter / car_pink / unicorn) 皆面向左方 (-x)！
    // 因此當 this.player.facing === 1 (向右移動) 時，使用 scale(-1, 1) 讓角色與車頭朝向正右方！
    // 當 this.player.facing === -1 (向左移動) 時，使用 scale(1, 1) 讓角色與車頭朝向正左方！
    ctx.scale(-this.player.facing, 1);
    ctx.rotate(-this.player.tiltAngle);

    const hueShift = this.state.equipped.colorHue || 0;
    if (hueShift !== 0) {
      ctx.filter = `hue-rotate(${hueShift}deg)`;
    }

    if (this.state.equipped.wings && this.state.equipped.wings !== 'none') {
      ctx.save();
      ctx.font = `${Math.round(charH * 0.34)}px sans-serif`;
      ctx.textAlign = 'center';
      const wingIcon = this.state.equipped.wings === 'fairy_wings' ? '🦋' : '🕊️';
      ctx.fillText(wingIcon, charH * 0.22, -charH * 0.48);
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
    let facingDir = this.cat.facing;

    if (isRiding) {
      drawX = this.player.x - this.player.facing * (catH * 0.55);
      drawY = this.player.y - catH * 0.48 + Math.sin(this.player.bobPhase) * 6;
      scale = 0.78;
      facingDir = this.player.facing;
    }

    ctx.translate(drawX, drawY);
    ctx.save();
    // 原圖 cat_flying.png 朝左 (-x)，因此向右 (facingDir=1) 時使用 -scale 鏡像翻轉朝右！
    ctx.scale(-facingDir * scale, scale);
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
    ctx.save();
    ctx.scale(-this.calicoCat.facing, 1);
    ctx.font = `${Math.round(h * 0.75)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🐈', 0, 0);
    ctx.restore();
    this.drawSimpleTag(ctx, 0, -h * 0.75, '三花小貓');
    ctx.restore();
  }
}

window.StarlightWorld = StarlightWorld;
