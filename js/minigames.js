/**
 * 🧠 5. 階梯式高難度小遊戲關卡設計 (Mini-Games System)
 * 1-1 冰淇淋快遞：【空間與反應】三軌道動態跑酷 + 跳躍斜坡 + 躲避彩虹大球
 * 1-2 幾何地磚：【幾何與空間】3D 幾何塊旋轉/翻轉嵌入 + 旋轉水管將紅光+藍光合成紫光通電
 * 1-3 失蹤的小貓：【動態記憶】記憶 5~7 個音符光芒順序，播放後花朵圓盤旋轉 180° 干擾位置
 * 2-1 貝殼水果派對：【數理邏輯】魔法天平左邊重量 15，從飄過的貝殼選出 3 個數字相加等於 15
 */

class MiniGameManager {
  constructor(gameState, world) {
    this.state = gameState;
    this.world = world;
    this.canvas = document.getElementById('mg-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.activeGame = null;
    this.animId = null;

    this.bindInput();
  }

  bindInput() {
    if (!this.canvas) return;

    this.canvas.addEventListener('pointerdown', e => {
      if (!this.activeGame) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.onCanvasClick(x, y);
    });

    window.addEventListener('keydown', e => {
      if (!this.activeGame) return;
      if (this.activeGame.id === '1-1') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          this.activeGame.lane = Math.max(0, this.activeGame.lane - 1);
          window.Sound.playChime(520, 0.08);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          this.activeGame.lane = Math.min(2, this.activeGame.lane + 1);
          window.Sound.playChime(440, 0.08);
        } else if (e.key === ' ' || e.key === 'ArrowRight') {
          this.runnerJump();
        }
      }
    });
  }

  startGame(gameId) {
    this.stopGame();
    const lobby = document.getElementById('mg-lobby-view');
    const stage = document.getElementById('mg-active-stage');
    if (lobby) lobby.style.display = 'none';
    if (stage) stage.style.display = 'flex';

    if (gameId === '1-1') this.initGame1_1();
    else if (gameId === '1-2') this.initGame1_2();
    else if (gameId === '1-3') this.initGame1_3();
    else if (gameId === '2-1') this.initGame2_1();

    const loop = () => {
      if (!this.activeGame) return;
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stopGame() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = null;
    this.activeGame = null;
  }

  backToLobby() {
    this.stopGame();
    const lobby = document.getElementById('mg-lobby-view');
    const stage = document.getElementById('mg-active-stage');
    if (lobby) lobby.style.display = 'grid';
    if (stage) stage.style.display = 'none';
  }

  setControlsHTML(html) {
    const ctrl = document.getElementById('mg-controls-bar');
    if (ctrl) ctrl.innerHTML = html;
  }

  setHeaderInfo(title, desc) {
    const titleEl = document.getElementById('mg-stage-title');
    const descEl = document.getElementById('mg-stage-desc');
    if (titleEl) titleEl.innerHTML = window.Bopomofo.toHTML(title);
    if (descEl) descEl.innerHTML = window.Bopomofo.toHTML(desc);
  }

  /* ==========================================================================
     🛵 1-1 冰淇淋快遞【空間與反應】三軌道動態跑酷
     ========================================================================== */
  initGame1_1() {
    this.setHeaderInfo(
      '1-1 冰淇淋快遞【空間與反應】',
      '點擊上下軌道切換位置，遇到斜坡按「跳躍」飛過去，躲避彩虹大球並收集 10 個冰淇淋！'
    );

    this.activeGame = {
      id: '1-1',
      lane: 1, // 0, 1, 2 三條跑道
      jumpY: 0,
      jumpVy: 0,
      isJumping: false,
      score: 0,
      targetScore: 10,
      distance: 0,
      hp: 3,
      obstacles: [],
      spawnTimer: 0,
      finished: false
    };

    this.setControlsHTML(`
      <button class="action-btn" onclick="window.MiniGames.changeLane(-1)">⬆️ ${window.Bopomofo.toHTML('上軌道')}</button>
      <button class="action-btn primary-pink" onclick="window.MiniGames.runnerJump()">🚀 ${window.Bopomofo.toHTML('跳躍斜坡')}</button>
      <button class="action-btn" onclick="window.MiniGames.changeLane(1)">⬇️ ${window.Bopomofo.toHTML('下軌道')}</button>
    `);
  }

  changeLane(delta) {
    if (!this.activeGame || this.activeGame.id !== '1-1' || this.activeGame.finished) return;
    this.activeGame.lane = Math.max(0, Math.min(2, this.activeGame.lane + delta));
    window.Sound.playChime(540, 0.08);
  }

  runnerJump() {
    if (!this.activeGame || this.activeGame.id !== '1-1' || this.activeGame.finished) return;
    if (!this.activeGame.isJumping) {
      this.activeGame.isJumping = true;
      this.activeGame.jumpVy = -11.5;
      window.Sound.playChime(740, 0.16, 'triangle');
    }
  }

  updateGame1_1() {
    const g = this.activeGame;
    if (g.finished) return;

    g.distance += 6.5;

    // 跳躍物理
    if (g.isJumping) {
      g.jumpY += g.jumpVy;
      g.jumpVy += 0.62;
      if (g.jumpY >= 0) {
        g.jumpY = 0;
        g.jumpVy = 0;
        g.isJumping = false;
      }
    }

    // 產生障礙物與冰淇淋
    g.spawnTimer++;
    if (g.spawnTimer >= 42) {
      g.spawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      const r = Math.random();
      let type = 'icecream'; // 收集物
      if (r < 0.36) type = 'ball'; // 彩虹大球 (需換道躲避)
      else if (r < 0.58) type = 'ramp'; // 斜坡 (需跳躍通過，跳過會額外加分！)

      g.obstacles.push({
        x: this.canvas.width + 60,
        lane,
        type,
        hit: false
      });
    }

    // 更新障礙物並檢測碰撞
    const playerX = 155;
    for (let i = g.obstacles.length - 1; i >= 0; i--) {
      const ob = g.obstacles[i];
      ob.x -= 6.8;

      if (!ob.hit && Math.abs(ob.x - playerX) < 42 && ob.lane === g.lane) {
        if (ob.type === 'icecream') {
          ob.hit = true;
          g.score++;
          window.Sound.playCoin();
          if (g.score >= g.targetScore) {
            this.completeMiniGame('1-1', '🌸 粉紅花朵安全帽 + 50 金幣', () => {
              this.state.addCoins(50);
              this.state.unlockItem('flower_helmet');
              this.state.equipped.hat = 'flower_helmet';
            });
          }
        } else if (ob.type === 'ramp') {
          ob.hit = true;
          if (g.isJumping || g.jumpY < -15) {
            // 成功飛越斜坡！
            g.score = Math.min(g.targetScore, g.score + 2);
            window.Sound.playStar();
            if (g.score >= g.targetScore) {
              this.completeMiniGame('1-1', '🌸 粉紅花朵安全帽 + 50 金幣', () => {
                this.state.addCoins(50);
                this.state.unlockItem('flower_helmet');
                this.state.equipped.hat = 'flower_helmet';
              });
            }
          } else {
            // 沒跳起來撞到斜坡但自動彈起
            this.runnerJump();
          }
        } else if (ob.type === 'ball') {
          if (g.jumpY > -45) {
            ob.hit = true;
            g.hp = Math.max(1, g.hp - 1);
            window.Sound.playChime(240, 0.22, 'sawtooth');
          }
        }
      }

      if (ob.x < -80) g.obstacles.splice(i, 1);
    }
  }

  renderGame1_1(ctx, w, h) {
    const g = this.activeGame;
    // 天空與草地背景
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#f3d5ff');
    sky.addColorStop(0.35, '#cfefff');
    sky.addColorStop(0.35, '#d8f3dc');
    sky.addColorStop(1, '#b7e4c7');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 三條鵝黃色石子跑道
    const laneY = [170, 260, 350];
    for (let i = 0; i < 3; i++) {
      const y = laneY[i];
      ctx.fillStyle = g.lane === i ? '#fff3b0' : '#faedcd';
      ctx.strokeStyle = '#5e3a24';
      ctx.lineWidth = 3;
      ctx.fillRect(0, y - 36, w, 72);
      ctx.strokeRect(0, y - 36, w, 72);

      // 跑道流動標線
      ctx.fillStyle = '#e9c46a';
      const offset = (g.distance * 1.2) % 90;
      for (let rx = -offset; rx < w; rx += 90) {
        ctx.fillRect(rx, y - 4, 38, 8);
      }
    }

    // 繪製障礙物與冰淇淋
    for (const ob of g.obstacles) {
      if (ob.hit && ob.type === 'icecream') continue;
      const y = laneY[ob.lane];
      ctx.save();
      ctx.translate(ob.x, y);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (ob.type === 'icecream') {
        ctx.font = '44px sans-serif';
        ctx.fillText('🍦', 0, -6);
      } else if (ob.type === 'ball') {
        // 旋轉彩虹大球
        ctx.rotate(-g.distance * 0.05);
        const rGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, 28);
        rGrad.addColorStop(0, '#fff');
        rGrad.addColorStop(0.4, '#ff6fa5');
        rGrad.addColorStop(0.7, '#ffbe0b');
        rGrad.addColorStop(1, '#9f67ff');
        ctx.fillStyle = rGrad;
        ctx.strokeStyle = '#5e3a24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (ob.type === 'ramp') {
        // 跳躍斜坡
        ctx.fillStyle = '#ff9ebb';
        ctx.strokeStyle = '#5e3a24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-28, 22);
        ctx.lineTo(26, -22);
        ctx.lineTo(26, 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.font = 'bold 14px "Microsoft JhengHei"';
        ctx.fillStyle = '#5e3a24';
        ctx.fillText('跳躍斜坡', 0, 32);
      }
      ctx.restore();
    }

    // 繪製騎粉紅機車的主角與小貓
    const py = laneY[g.lane];
    ctx.save();
    ctx.translate(155, py);
    // 地面車影
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, g.jumpY);
    const spr = this.world.images.witch_scooter;
    if (spr && spr.complete) {
      ctx.drawImage(spr, -42, -78, 84, 110);
    } else {
      ctx.font = '54px sans-serif';
      ctx.fillText('🛵', 0, 0);
    }
    ctx.restore();

    // 頂部進度條
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(20, 16, w - 40, 46, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 20px "Microsoft JhengHei"';
    ctx.fillStyle = '#e04580';
    ctx.textAlign = 'left';
    ctx.fillText(`🍦 冰淇淋快遞進度：${g.score} / ${g.targetScore}   (點擊跑道直接切換！)`, 38, 46);
  }

  /* ==========================================================================
     🧩 1-2 幾何地磚【幾何與空間】3D 旋轉拼圖與紅+藍=紫光束通電
     ========================================================================== */
  initGame1_2() {
    this.setHeaderInfo(
      '1-2 幾何地磚【幾何與空間】',
      '第1步：旋轉並翻轉左側 3D 幾何塊嵌入缺口；第2步：點擊右側光束水管旋轉，將紅光+藍光合成紫光通電！'
    );

    // 階段 A：3D 幾何塊目標角度 (rot: 90, flip: true)
    // 階段 B：3x3 光束管線，將左上紅光與左下藍光匯聚到中央合成紫光並送達右中終點
    this.activeGame = {
      id: '1-2',
      rotAngle: 0, // 0, 90, 180, 270
      flipped: false,
      targetRot: 180,
      targetFlip: true,
      blockMatched: false,
      // 4 個關鍵旋轉水晶接頭的角度 (0, 1, 2, 3 代表 0°, 90°, 180°, 270°)
      // 正確角度皆為 0 (對齊時即導通紅光與藍光匯合為紫光！)
      nodes: [1, 2, 3, 1],
      finished: false
    };

    this.setControlsHTML(`
      <button class="action-btn" onclick="window.MiniGames.rotate3DBlock()">🔄 ${window.Bopomofo.toHTML('旋轉幾何塊')}</button>
      <button class="action-btn" onclick="window.MiniGames.flip3DBlock()">🪞 ${window.Bopomofo.toHTML('水平翻轉幾何塊')}</button>
      <button class="action-btn primary-purple" onclick="window.MiniGames.autoAlignHint()">💡 ${window.Bopomofo.toHTML('魔法提示對齊')}</button>
    `);
  }

  rotate3DBlock() {
    if (!this.activeGame || this.activeGame.id !== '1-2' || this.activeGame.finished) return;
    this.activeGame.rotAngle = (this.activeGame.rotAngle + 90) % 360;
    window.Sound.playChime(580, 0.1);
    this.checkGame1_2Win();
  }

  flip3DBlock() {
    if (!this.activeGame || this.activeGame.id !== '1-2' || this.activeGame.finished) return;
    this.activeGame.flipped = !this.activeGame.flipped;
    window.Sound.playChime(680, 0.1);
    this.checkGame1_2Win();
  }

  autoAlignHint() {
    if (!this.activeGame || this.activeGame.id !== '1-2' || this.activeGame.finished) return;
    this.activeGame.rotAngle = this.activeGame.targetRot;
    this.activeGame.flipped = this.activeGame.targetFlip;
    this.activeGame.nodes = [0, 0, 0, 0];
    this.checkGame1_2Win();
  }

  checkGame1_2Win() {
    const g = this.activeGame;
    g.blockMatched = (g.rotAngle === g.targetRot && g.flipped === g.targetFlip);
    const pipesAligned = g.nodes.every(n => n % 2 === 0);

    if (g.blockMatched && pipesAligned && !g.finished) {
      this.completeMiniGame('1-2', '🦆 小黃鴨單車車籃 + 星光碎片 x1', () => {
        this.state.addShards(1);
        this.state.addCoins(80);
        this.state.unlockItem('duck_basket');
      });
    }
  }

  renderGame1_2(ctx, w, h) {
    const g = this.activeGame;
    ctx.fillStyle = '#f8f0ff';
    ctx.fillRect(0, 0, w, h);

    // 左半部：3D 幾何塊旋轉/翻轉區
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(22, 20, 320, h - 40, 22);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 18px "Microsoft JhengHei"';
    ctx.fillStyle = '#5e3a24';
    ctx.textAlign = 'center';
    ctx.fillText('① 3D 幾何塊嵌入缺口', 182, 52);

    // 目標缺口 (上方)
    ctx.fillStyle = '#e9d8fd';
    ctx.fillText('目標缺口形狀：', 182, 85);
    this.drawLShape3D(ctx, 182, 145, g.targetRot, g.targetFlip, true);

    // 玩家操作的 3D 幾何塊 (下方)
    ctx.fillStyle = '#5e3a24';
    ctx.fillText(g.blockMatched ? '✅ 幾何塊已完美吻合！' : '你的 3D 幾何塊 (請旋轉/翻轉)：', 182, 235);
    this.drawLShape3D(ctx, 182, 310, g.rotAngle, g.flipped, false);
    ctx.restore();

    // 右半部：紅光 + 藍光 = 紫光 水管光束旋轉盤
    ctx.save();
    ctx.fillStyle = '#2b193d';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(362, 20, w - 384, h - 40, 22);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 18px "Microsoft JhengHei"';
    ctx.fillStyle = '#fff3b0';
    ctx.textAlign = 'center';
    ctx.fillText('② 點擊水晶管旋轉：將【紅光🔴】+【藍光🔵】合成【紫光🟣】通電！', 362 + (w - 384) / 2, 52);

    // 繪製 4 個水晶旋轉節點
    const nodePositions = [
      { x: 480, y: 140, color: '#ff4d6d', label: '紅光管 A' },
      { x: 610, y: 140, color: '#ff4d6d', label: '紅光管 B' },
      { x: 480, y: 290, color: '#4cc9f0', label: '藍光管 A' },
      { x: 610, y: 290, color: '#4cc9f0', label: '藍光管 B' }
    ];

    const redAligned = (g.nodes[0] % 2 === 0) && (g.nodes[1] % 2 === 0);
    const blueAligned = (g.nodes[2] % 2 === 0) && (g.nodes[3] % 2 === 0);
    const purpleActive = redAligned && blueAligned;

    // 發射源
    ctx.font = '26px sans-serif';
    ctx.fillText('🔴', 400, 148);
    ctx.fillText('🔵', 400, 298);

    // 光束連線
    if (g.nodes[0] % 2 === 0) {
      this.drawLaserBeam(ctx, 415, 140, 545, 140, '#ff4d6d');
    }
    if (redAligned) {
      this.drawLaserBeam(ctx, 545, 140, 720, 215, '#ff4d6d');
    }
    if (g.nodes[2] % 2 === 0) {
      this.drawLaserBeam(ctx, 415, 290, 545, 290, '#4cc9f0');
    }
    if (blueAligned) {
      this.drawLaserBeam(ctx, 545, 290, 720, 215, '#4cc9f0');
    }
    if (purpleActive) {
      this.drawLaserBeam(ctx, 720, 215, 815, 215, '#c77dff', 10);
    }

    // 繪製可點擊旋轉的水晶管節點
    nodePositions.forEach((np, idx) => {
      const aligned = g.nodes[idx] % 2 === 0;
      ctx.save();
      ctx.translate(np.x, np.y);
      ctx.fillStyle = aligned ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = aligned ? np.color : '#8d99ae';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.rotate((g.nodes[idx] * Math.PI) / 2);
      ctx.fillStyle = np.color;
      ctx.fillRect(-28, -8, 56, 16);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(-28, -8, 56, 16);
      ctx.restore();

      ctx.font = '14px "Microsoft JhengHei"';
      ctx.fillStyle = '#e0aaff';
      ctx.fillText(aligned ? '✅ 已導通' : '點擊旋轉', np.x, np.y + 56);
    });

    // 中央合成稜鏡與終點彩虹塔核心
    ctx.font = '38px sans-serif';
    ctx.fillText('💎', 720, 226);
    ctx.fillText(purpleActive ? '🟣✨' : '⚪', 815, 226);
    ctx.font = 'bold 15px "Microsoft JhengHei"';
    ctx.fillStyle = '#fff';
    ctx.fillText('合成稜鏡', 720, 265);
    ctx.fillText(purpleActive ? '紫光已通電！' : '彩虹能量座', 815, 265);

    ctx.restore();
  }

  drawLShape3D(ctx, cx, cy, rotDeg, flipped, isGhost) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotDeg * Math.PI) / 180);
    if (flipped) ctx.scale(-1, 1);

    ctx.fillStyle = isGhost ? 'rgba(159, 103, 255, 0.25)' : '#ff6fa5';
    ctx.strokeStyle = isGhost ? '#9f67ff' : '#5e3a24';
    ctx.lineWidth = 3.5;
    if (isGhost) ctx.setLineDash([6, 4]);

    // 繪製 L 型 3D 幾何方塊
    ctx.beginPath();
    ctx.moveTo(-36, -36);
    ctx.lineTo(0, -36);
    ctx.lineTo(0, 0);
    ctx.lineTo(36, 0);
    ctx.lineTo(36, 36);
    ctx.lineTo(-36, 36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 頂部鑽石高光標記（方便小朋友辨識翻轉與旋轉方向）
    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath();
    ctx.arc(-18, -18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLaserBeam(ctx, x1, y1, x2, y2, color, width = 6) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  /* ==========================================================================
     🎵 1-3 失蹤的小貓【動態記憶】多重音律與 180° 花朵位置旋轉
     ========================================================================== */
  initGame1_3() {
    this.setHeaderInfo(
      '1-3 失蹤的小貓【動態記憶】',
      '記住 5 個音符花朵發光的順序！注意：播放完後花壇會旋轉 180° 干擾位置，請找出正確花朵點擊！'
    );

    const flowers = [
      { id: 0, name: '紅花 Do', color: '#ff5d8f', icon: '🌺', note: 0 },
      { id: 1, name: '橘花 Re', color: '#ff9f1c', icon: '🌻', note: 1 },
      { id: 2, name: '黃花 Mi', color: '#ffbe0b', icon: '🌼', note: 2 },
      { id: 3, name: '綠花 Fa', color: '#52b788', icon: '🍀', note: 3 },
      { id: 4, name: '藍花 Sol', color: '#4cc9f0', icon: '💠', note: 4 },
      { id: 5, name: '紫花 La', color: '#9f67ff', icon: '🌸', note: 5 }
    ];

    // 產生 5 個音符序列
    const sequence = [];
    for (let i = 0; i < 5; i++) {
      sequence.push(Math.floor(Math.random() * 6));
    }

    this.activeGame = {
      id: '1-3',
      flowers,
      sequence,
      userIndex: 0,
      phase: 'demo', // 'demo' (播放音符) -> 'rotating' (旋轉180度) -> 'input' (玩家點擊)
      highlightedId: -1,
      boardAngle: 0,
      targetBoardAngle: Math.PI, // 旋轉 180°
      finished: false
    };

    this.setControlsHTML(`
      <button class="action-btn primary-gold" onclick="window.MiniGames.replayMelodyDemo()">🔊 ${window.Bopomofo.toHTML('重新播放音符序列')}</button>
    `);

    this.playMelodyDemoSequence();
  }

  replayMelodyDemo() {
    if (!this.activeGame || this.activeGame.id !== '1-3' || this.activeGame.finished) return;
    this.activeGame.userIndex = 0;
    this.activeGame.boardAngle = 0;
    this.playMelodyDemoSequence();
  }

  playMelodyDemoSequence() {
    const g = this.activeGame;
    if (!g) return;
    g.phase = 'demo';
    g.highlightedId = -1;

    g.sequence.forEach((flowerId, idx) => {
      setTimeout(() => {
        if (!this.activeGame || this.activeGame.id !== '1-3') return;
        g.highlightedId = flowerId;
        window.Sound.playNote(flowerId);
        setTimeout(() => {
          if (this.activeGame && this.activeGame.id === '1-3') {
            g.highlightedId = -1;
          }
        }, 380);
      }, (idx + 1) * 620);
    });

    // 播放完畢後啟動 180° 旋轉干擾！
    setTimeout(() => {
      if (!this.activeGame || this.activeGame.id !== '1-3') return;
      g.phase = 'rotating';
      window.Sound.playChime(440, 0.25, 'sine');
    }, (g.sequence.length + 1) * 620);
  }

  updateGame1_3() {
    const g = this.activeGame;
    if (g.phase === 'rotating') {
      g.boardAngle += 0.055;
      if (g.boardAngle >= g.targetBoardAngle) {
        g.boardAngle = g.targetBoardAngle;
        g.phase = 'input';
      }
    }
  }

  renderGame1_3(ctx, w, h) {
    const g = this.activeGame;
    ctx.fillStyle = '#f0fff4';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 + 15;
    const radius = 135;

    // 繪製旋轉魔法花壇圓盤
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#d8f3dc';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 中央躲藏的三花小貓
    ctx.font = '46px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐱🎵', 0, 0);

    // 繪製 6 朵音符花朵（位置隨 boardAngle 旋轉 180°）
    for (let i = 0; i < 6; i++) {
      const f = g.flowers[i];
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2 + g.boardAngle;
      const fx = Math.cos(angle) * radius;
      const fy = Math.sin(angle) * radius;
      const isLit = g.highlightedId === f.id;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.fillStyle = isLit ? '#ffffff' : f.color;
      ctx.strokeStyle = '#5e3a24';
      ctx.lineWidth = isLit ? 5 : 3;
      if (isLit) {
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 24;
      }
      ctx.beginPath();
      ctx.arc(0, 0, isLit ? 44 : 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '28px sans-serif';
      ctx.fillText(f.icon, 0, -4);
      ctx.font = 'bold 13px "Microsoft JhengHei"';
      ctx.fillStyle = isLit ? '#e04580' : '#fff';
      ctx.fillText(f.name, 0, 20);
      ctx.restore();
    }
    ctx.restore();

    // 頂部狀態與序列進度提示
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(24, 14, w - 48, 46, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 18px "Microsoft JhengHei"';
    ctx.fillStyle = '#5e3a24';
    ctx.textAlign = 'center';
    if (g.phase === 'demo') {
      ctx.fillText('👀 請仔細觀察並記住音符花朵發光的順序...', cx, 43);
    } else if (g.phase === 'rotating') {
      ctx.fillStyle = '#e04580';
      ctx.fillText('🌀 花朵正在旋轉 180° 干擾位置！別被轉暈囉！', cx, 43);
    } else {
      ctx.fillStyle = '#4c2882';
      ctx.fillText(`🎵 請依序點擊花朵 (已完成：${g.userIndex} / ${g.sequence.length})`, cx, 43);
    }
  }

  /* ==========================================================================
     ⚖️ 2-1 貝殼水果派對【數理邏輯】三數組合與魔法天平平衡 (Sum = 15)
     ========================================================================== */
  initGame2_1() {
    this.setHeaderInfo(
      '2-1 貝殼水果派對【數理邏輯】',
      '魔法天平左邊重量是 15，請從海浪飄過的數字貝殼中選出「3 個數字」相加等於 15（例如 4+5+6）！'
    );

    this.activeGame = {
      id: '2-1',
      targetWeight: 15,
      selected: [], // 最多選 3 個數字
      shells: [],
      round: 1,
      totalRounds: 2,
      finished: false
    };

    this.spawnShellsFor2_1();

    this.setControlsHTML(`
      <button class="action-btn" onclick="window.MiniGames.clearSelectedShells()">🔄 ${window.Bopomofo.toHTML('清除重選')}</button>
    `);
  }

  spawnShellsFor2_1() {
    // 確保海浪上的貝殼一定包含多組 3 數相加 = 15 的組合 (如 4,5,6 / 3,5,7 / 2,4,9 / 1,6,8)
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const colors = ['#ff9ebb', '#ffbe0b', '#72efdd', '#c79dff', '#a8e6cf', '#ffd166', '#ff8fab', '#90e0ef', '#cdb4db'];
    this.activeGame.shells = nums.map((n, idx) => ({
      num: n,
      x: 95 + idx * 88,
      y: 335 + (idx % 2) * 32,
      color: colors[idx],
      picked: false
    }));
  }

  clearSelectedShells() {
    if (!this.activeGame || this.activeGame.id !== '2-1') return;
    this.activeGame.selected = [];
    this.activeGame.shells.forEach(s => (s.picked = false));
    window.Sound.playChime(400, 0.1);
  }

  renderGame2_1(ctx, w, h) {
    const g = this.activeGame;
    // 海洋沙灘漸層背景
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fff3d6');
    grad.addColorStop(0.65, '#ffe5ec');
    grad.addColorStop(0.65, '#90e0ef');
    grad.addColorStop(1, '#00b4d8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 計算目前右盤總和與天平傾斜角
    const currentSum = g.selected.reduce((a, b) => a + b, 0);
    const diff = currentSum - g.targetWeight;
    const tiltAngle = Math.max(-0.28, Math.min(0.28, diff * 0.025));

    const cx = w / 2;
    const pivotY = 145;

    // 繪製黃金魔法天平底座
    ctx.save();
    ctx.fillStyle = '#ffbe0b';
    ctx.strokeStyle = '#5e3a24';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx - 45, 255);
    ctx.lineTo(cx + 45, 255);
    ctx.lineTo(cx, pivotY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 天平橫桿
    ctx.translate(cx, pivotY);
    ctx.rotate(tiltAngle);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-190, -7, 380, 14);
    ctx.strokeRect(-190, -7, 380, 14);

    // 左秤盤 (固定重量 15)
    ctx.save();
    ctx.translate(-165, 0);
    ctx.rotate(-tiltAngle);
    ctx.fillStyle = '#ff6fa5';
    ctx.beginPath();
    ctx.roundRect(-52, 35, 104, 56, 16);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 26px "Microsoft JhengHei"';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`⚖️ ${g.targetWeight}`, 0, 72);
    ctx.restore();

    // 右秤盤 (玩家選擇的 3 個貝殼總和)
    ctx.save();
    ctx.translate(165, 0);
    ctx.rotate(-tiltAngle);
    const isBalanced = g.selected.length === 3 && currentSum === g.targetWeight;
    ctx.fillStyle = isBalanced ? '#52b788' : '#9f67ff';
    ctx.beginPath();
    ctx.roundRect(-72, 35, 144, 56, 16);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 20px "Microsoft JhengHei"';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const expr = g.selected.length > 0 ? `${g.selected.join(' + ')} = ${currentSum}` : '請選 3 個貝殼';
    ctx.fillText(expr, 0, 70);
    ctx.restore();

    ctx.restore();

    // 頂部提示
    ctx.font = 'bold 19px "Microsoft JhengHei"';
    ctx.fillStyle = '#5e3a24';
    ctx.textAlign = 'center';
    ctx.fillText(
      `🐚 第 ${g.round}/${g.totalRounds} 題：請從下方海浪點擊 3 個數字貝殼，讓相加剛好等於 ${g.targetWeight}！`,
      cx,
      36
    );

    // 繪製下方海浪上的 1~9 數字貝殼
    const time = Date.now() * 0.003;
    for (const sh of g.shells) {
      if (sh.picked) continue;
      const sy = sh.y + Math.sin(time + sh.num) * 6;
      ctx.save();
      ctx.translate(sh.x, sy);
      ctx.fillStyle = sh.color;
      ctx.strokeStyle = '#5e3a24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 26px "Microsoft JhengHei"';
      ctx.fillStyle = '#5e3a24';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🐚${sh.num}`, 0, 2);
      ctx.restore();
    }
  }

  /* ==========================================================================
     🖱️ 畫布點擊分派與通關結算
     ========================================================================== */
  onCanvasClick(x, y) {
    const g = this.activeGame;
    if (!g || g.finished) return;

    if (g.id === '1-1') {
      // 點擊三條跑道直接切換，或點擊右側跳躍
      if (y < 215) this.changeLane(-1);
      else if (y > 305) this.changeLane(1);
      else this.runnerJump();
    } else if (g.id === '1-2') {
      // 點擊左側幾何塊旋轉，或點擊右側 4 個光束節點旋轉
      if (x < 340) {
        this.rotate3DBlock();
      } else {
        const nodePositions = [
          { x: 480, y: 140 },
          { x: 610, y: 140 },
          { x: 480, y: 290 },
          { x: 610, y: 290 }
        ];
        nodePositions.forEach((np, idx) => {
          if (Math.hypot(x - np.x, y - np.y) < 46) {
            g.nodes[idx] = (g.nodes[idx] + 1) % 4;
            window.Sound.playChime(520 + idx * 80, 0.1);
            this.checkGame1_2Win();
          }
        });
      }
    } else if (g.id === '1-3') {
      if (g.phase !== 'input') return;
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2 + 15;
      const radius = 135;

      for (let i = 0; i < 6; i++) {
        const f = g.flowers[i];
        const angle = (i * Math.PI * 2) / 6 - Math.PI / 2 + g.boardAngle;
        const fx = cx + Math.cos(angle) * radius;
        const fy = cy + Math.sin(angle) * radius;

        if (Math.hypot(x - fx, y - fy) < 44) {
          g.highlightedId = f.id;
          window.Sound.playNote(f.id);
          setTimeout(() => {
            if (this.activeGame && this.activeGame.id === '1-3') g.highlightedId = -1;
          }, 260);

          const expected = g.sequence[g.userIndex];
          if (f.id === expected) {
            g.userIndex++;
            if (g.userIndex >= g.sequence.length) {
              this.completeMiniGame('1-3', '🐱 跟隨寵物『三花小貓』 + 100 金幣', () => {
                this.state.addCoins(100);
                this.state.addShards(1);
                if (!this.state.unlockedPets.includes('calico')) {
                  this.state.unlockedPets.push('calico');
                }
              });
            }
          } else {
            // 點錯了，溫柔提示並重新播放一次
            window.Sound.playChime(280, 0.25, 'sawtooth');
            g.userIndex = 0;
            setTimeout(() => this.replayMelodyDemo(), 700);
          }
          break;
        }
      }
    } else if (g.id === '2-1') {
      if (g.selected.length >= 3) return;
      const time = Date.now() * 0.003;
      for (const sh of g.shells) {
        if (sh.picked) continue;
        const sy = sh.y + Math.sin(time + sh.num) * 6;
        if (Math.hypot(x - sh.x, y - sy) < 36) {
          sh.picked = true;
          g.selected.push(sh.num);
          window.Sound.playNote(sh.num);

          if (g.selected.length === 3) {
            const sum = g.selected.reduce((a, b) => a + b, 0);
            if (sum === g.targetWeight) {
              window.Sound.playStar();
              if (g.round < g.totalRounds) {
                setTimeout(() => {
                  g.round++;
                  g.targetWeight = 18; // 第二題目標 18 (如 5+6+7)
                  this.clearSelectedShells();
                }, 900);
              } else {
                this.completeMiniGame('2-1', '🚙 藍色海洋敞篷小汽車 + 150 金幣', () => {
                  this.state.addCoins(150);
                  this.state.addShards(1);
                  if (!this.state.unlockedVehicles.includes('car_blue')) {
                    this.state.unlockedVehicles.push('car_blue');
                  }
                });
              }
            } else {
              // 3 個數字加起來不等於目標，1秒後自動彈回重選
              window.Sound.playChime(280, 0.2, 'sawtooth');
              setTimeout(() => this.clearSelectedShells(), 950);
            }
          }
          break;
        }
      }
    }
  }

  completeMiniGame(gameId, rewardText, rewardCallback) {
    if (!this.activeGame || this.activeGame.finished) return;
    this.activeGame.finished = true;
    window.Sound.playFanfare();
    this.state.completedGames[gameId] = true;
    this.state.addExp(50);
    if (rewardCallback) rewardCallback();
    this.state.updateHUD();

    this.setControlsHTML(`
      <div style="font-size:20px; color:#e04580; font-weight:900;">
        ⭐⭐⭐ ${window.Bopomofo.toHTML(`恭喜三星過關！獲得：${rewardText}`)}
      </div>
      <button class="action-btn primary-pink" onclick="window.MiniGames.backToLobby()">🎉 ${window.Bopomofo.toHTML('領取獎勵並返回')}</button>
    `);
  }

  update() {
    if (!this.activeGame) return;
    if (this.activeGame.id === '1-1') this.updateGame1_1();
    else if (this.activeGame.id === '1-3') this.updateGame1_3();
  }

  render() {
    if (!this.ctx || !this.activeGame) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    if (this.activeGame.id === '1-1') this.renderGame1_1(this.ctx, w, h);
    else if (this.activeGame.id === '1-2') this.renderGame1_2(this.ctx, w, h);
    else if (this.activeGame.id === '1-3') this.renderGame1_3(this.ctx, w, h);
    else if (this.activeGame.id === '2-1') this.renderGame2_1(this.ctx, w, h);
  }
}

window.MiniGameManager = MiniGameManager;
