const socket = io();
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const app = $('#app');

let myIndex = -1;
let currentGame = null;
let gameState = null;
let roomCode = null;
let rulesShown = {};

function toggleSound() {
  AudioManager.init();
  const muted = AudioManager.toggleMute();
  const btn = document.getElementById('sound-toggle');
  if (btn) { btn.textContent = muted ? '🔇' : '🔊'; btn.classList.toggle('muted', muted); }
  if (!muted) AudioManager.startBGM('home');
}

let userInteracted = false;
document.addEventListener('click', () => {
  if (!userInteracted) {
    userInteracted = true;
    AudioManager.init();
  }
}, { once: true });

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = $(`#${id}`);
  if (el) el.classList.add('active');
}

function render(html) { app.innerHTML = html; }

// ========== HOME ==========
function showHome() {
  if (userInteracted && !AudioManager.muted) AudioManager.startBGM('home');
  render(`
    <div class="screen active" id="home">
      <h1><span class="logo-icon">⚔️</span>GAME ARENA</h1>
      <p class="subtitle">リアルタイム マルチプレイヤー対戦</p>
      <div class="game-list">
        <div class="game-card" onclick="selectGame('mine-glico')">
          <div class="game-card-header">
            <div class="game-card-icon">💣</div>
            <div class="game-title">地雷グリコ</div>
          </div>
          <div class="game-desc">グリコじゃんけん + 地雷の心理戦。46段の階段を駆け上がれ！</div>
          <div class="game-meta">
            <span class="game-players">👥 2人</span>
            <span class="game-tag">心理戦</span>
          </div>
        </div>
        <div class="game-card" onclick="selectGame('freestyle-janken')">
          <div class="game-card-header">
            <div class="game-card-icon">✊</div>
            <div class="game-title">自由律ジャンケン</div>
          </div>
          <div class="game-desc">独自の手を考案して戦え！7回戦4先勝制。</div>
          <div class="game-meta">
            <span class="game-players">👥 2人</span>
            <span class="game-tag">創造力</span>
          </div>
        </div>
        <div class="game-card" onclick="selectGame('beauty-contest')">
          <div class="game-card-header">
            <div class="game-card-icon">🧪</div>
            <div class="game-title">美人投票</div>
          </div>
          <div class="game-desc">0〜100の数字を選べ。平均×0.8に最も近い者が勝者。</div>
          <div class="game-meta">
            <span class="game-players">👥 5人</span>
            <span class="game-tag">頭脳戦</span>
          </div>
        </div>
        <div class="game-card" onclick="selectGame('e-card')">
          <div class="game-card-header">
            <div class="game-card-icon">👑</div>
            <div class="game-title">Eカード</div>
          </div>
          <div class="game-desc">皇帝vs奴隷。圧倒的不利を覆せるか？</div>
          <div class="game-meta">
            <span class="game-players">👥 2人</span>
            <span class="game-tag">駆け引き</span>
          </div>
        </div>
        <div class="game-card" onclick="selectGame('one-poker')">
          <div class="game-card-header">
            <div class="game-card-icon">🃏</div>
            <div class="game-title">ワンポーカー</div>
          </div>
          <div class="game-desc">1枚のカードで命を賭けろ。レイズかドロップか。</div>
          <div class="game-meta">
            <span class="game-players">👥 2人</span>
            <span class="game-tag">ギャンブル</span>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ========== LOBBY ==========
function selectGame(type) {
  currentGame = type;
  const names = {
    'mine-glico': '💣 地雷グリコ',
    'freestyle-janken': '✊ 自由律ジャンケン',
    'beauty-contest': '🧪 美人投票',
    'e-card': '👑 Eカード',
    'one-poker': '🃏 ワンポーカー'
  };
  render(`
    <div class="screen active" id="lobby-choice">
      <h1>${names[type]}</h1>
      <div class="flex-col gap-16" style="margin-top:32px;max-width:360px;margin-left:auto;margin-right:auto;">
        <div class="card">
          <label>あなたの名前</label>
          <input type="text" id="player-name" placeholder="名前を入力" maxlength="10" value="Player">
        </div>
        <button class="btn primary w-full" onclick="createRoom()">ルームを作成</button>
        <div class="divider">または</div>
        <div class="card">
          <label>ルームコードを入力</label>
          <input type="text" id="room-code-input" placeholder="4文字のコード" maxlength="4" style="text-transform:uppercase;text-align:center;font-size:1.5rem;letter-spacing:6px;font-family:var(--font-display)">
        </div>
        <button class="btn w-full" onclick="joinRoom()">ルームに参加</button>
        <button class="btn ghost" onclick="showHome()" style="margin-top:8px">← ゲーム選択に戻る</button>
      </div>
    </div>
  `);
}

function createRoom() {
  AudioManager.playClick();
  const name = $('#player-name').value.trim() || 'Player1';
  if (!rulesShown[currentGame]) {
    rulesShown[currentGame] = true;
    RulesSlides.show(currentGame, () => {
      socket.emit('create-room', { gameType: currentGame, name });
    });
    return;
  }
  socket.emit('create-room', { gameType: currentGame, name });
}

function joinRoom() {
  AudioManager.playClick();
  const name = $('#player-name').value.trim() || 'Player2';
  const code = $('#room-code-input').value.trim().toUpperCase();
  if (code.length !== 4) { alert('4文字のコードを入力してください'); return; }
  if (!rulesShown[currentGame]) {
    rulesShown[currentGame] = true;
    RulesSlides.show(currentGame, () => {
      socket.emit('join-room', { code, name });
    });
    return;
  }
  socket.emit('join-room', { code, name });
}

socket.on('room-update', (data) => {
  roomCode = data.code;
  myIndex = data.yourIndex;
  if (data.started) return;
  const names = {
    'mine-glico': '💣 地雷グリコ',
    'freestyle-janken': '✊ 自由律ジャンケン',
    'beauty-contest': '🧪 美人投票',
    'e-card': '👑 Eカード',
    'one-poker': '🃏 ワンポーカー'
  };
  const playerList = data.players.map((p, i) =>
    `<li class="${i === data.yourIndex ? 'you' : ''}"><span class="dot"></span>${p.name}${i === data.yourIndex ? ' (あなた)' : ''}</li>`
  ).join('');
  const canStart = data.players.length >= data.minPlayers && data.yourIndex === 0;
  const aiBtn = data.canAddAi ? `<button class="btn" onclick="socket.emit('add-ai-players')">AIプレイヤーを追加 (${5 - data.players.length}人)</button>` : '';
  render(`
    <div class="screen active" id="waiting-room">
      <h1>${names[data.gameType]}</h1>
      <div class="room-code">${data.code}</div>
      <p class="text-center text-sm mb-16">このコードを相手に伝えてください</p>
      <div class="card">
        <h3>参加者 (${data.players.length}/${data.maxPlayers || data.minPlayers})</h3>
        <ul class="player-list">${playerList}</ul>
      </div>
      <div class="btn-group mt-16">
        ${canStart ? '<button class="btn primary" onclick="socket.emit(\'start-game\')">ゲーム開始</button>' : '<p class="text-center text-sm text-gold">プレイヤーを待っています...</p>'}
        ${aiBtn}
      </div>
      <button class="btn ghost" onclick="leaveRoom()" style="margin-top:12px;display:block;margin-left:auto;margin-right:auto">← ホームに戻る</button>
    </div>
  `);
});

socket.on('error-msg', (msg) => alert(msg));
socket.on('player-left', (name) => alert(`${name}が退出しました`));
socket.on('left-room', () => showHome());

function leaveRoom() {
  AudioManager.playClick();
  socket.emit('leave-room');
  showHome();
}

// ========== GAME STATE HANDLER ==========
let lastGamePhase = null;
socket.on('game-state', (state) => {
  gameState = state;
  // BGM switching on phase changes
  if (lastGamePhase !== state.phase) {
    if (state.phase === 'finished' && state.game !== 'mine-glico') {
      AudioManager.stopBGM();
      if (state.winner === state.myIndex) { AudioManager.playWin(); Effects.confetti(); Effects.emojiRain('🎉', 15); }
      else if (state.winner !== -1) { AudioManager.playLose(); Effects.screenShake(500); }
    } else if (state.phase === 'playing' || state.phase === 'betting' || state.phase === 'card-selection') {
      AudioManager.startBGM('battle');
    } else if (state.phase === 'mine-placement' || state.phase === 'move-creation') {
      AudioManager.startBGM('calm');
    } else if (state.phase === 'choosing') {
      AudioManager.startBGM('tense');
    }
    lastGamePhase = state.phase;
  }
  // Dynamic BGM intensity
  if (state.game === 'mine-glico' && state.positions) {
    const maxPos = Math.max(state.positions[0], state.positions[1]);
    AudioManager.setIntensity(Math.floor(maxPos / 10));
  } else if (state.game === 'one-poker' && state.life) {
    const minLife = Math.min(state.life[0], state.life[1]);
    AudioManager.setIntensity(minLife < 10 ? 5 : minLife < 20 ? 3 : 1);
  } else if (state.game === 'e-card' && state.points) {
    const maxPts = Math.max(state.points[0], state.points[1]);
    AudioManager.setIntensity(maxPts >= 5 ? 4 : maxPts >= 3 ? 2 : 0);
  }
  switch (state.game) {
    case 'mine-glico': renderMineGlico(state); break;
    case 'freestyle-janken': renderFreestyleJanken(state); break;
    case 'beauty-contest': renderBeautyContest(state); break;
    case 'e-card': renderECard(state); break;
    case 'one-poker': renderOnePoker(state); break;
  }
});

// ========== MINE GLICO ==========
let selectedMines = [];
let lastGlicoRoundId = null;
let jankenAnimating = false;

function buildStaircaseSVG(positions, myMines, revealedMines) {
  const stepsPerRow = 8;
  const totalSteps = 47;
  const stepW = 36, stepH = 14, gapX = 4, rowGap = 52;
  const stepRise = 5;
  const rows = Math.ceil(totalSteps / stepsPerRow);
  const svgW = stepsPerRow * (stepW + gapX) + 30;
  const svgH = rows * rowGap + 40;

  let svg = `<svg class="staircase-svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs>
    <linearGradient id="stepGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a5c"/><stop offset="1" stop-color="#22223a"/></linearGradient>
    <linearGradient id="stepMine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2030"/><stop offset="1" stop-color="#3a1020"/></linearGradient>
    <linearGradient id="stepMyMine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a50"/><stop offset="1" stop-color="#1a2535"/></linearGradient>
    <linearGradient id="p1Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b81"/><stop offset="1" stop-color="#ff4757"/></linearGradient>
    <linearGradient id="p2Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#3b82f6"/></linearGradient>
  </defs>`;

  function getStepPos(step) {
    const row = Math.floor(step / stepsPerRow);
    const col = step % stepsPerRow;
    const x = 15 + col * (stepW + gapX);
    const y = svgH - 25 - row * rowGap - col * stepRise;
    return { x, y, row };
  }

  for (let i = 0; i < totalSteps; i++) {
    const { x, y } = getStepPos(i);
    const isRevealed = revealedMines.some(m => m.step === i);
    const isMyMine = myMines.includes(i);
    const fill = isRevealed ? 'url(#stepMine)' : isMyMine ? 'url(#stepMyMine)' : 'url(#stepGrad)';
    const stroke = isRevealed ? '#ff4757' : isMyMine ? '#4a6a8a' : '#4a4a6c';

    svg += `<rect x="${x}" y="${y}" width="${stepW}" height="${stepH}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
    if (i === 0) svg += `<text x="${x + stepW/2}" y="${y + stepH - 3}" text-anchor="middle" fill="#c9a227" font-size="7" font-weight="700" font-family="Orbitron,sans-serif">START</text>`;
    else if (i === 46) svg += `<text x="${x + stepW/2}" y="${y + stepH - 3}" text-anchor="middle" fill="#f0d050" font-size="7" font-weight="700" font-family="Orbitron,sans-serif">GOAL</text>`;
    else svg += `<text x="${x + stepW/2}" y="${y + stepH - 3}" text-anchor="middle" fill="rgba(240,240,245,.35)" font-size="6" font-family="Orbitron,sans-serif">${i}</text>`;

    if (isRevealed) svg += `<text x="${x + stepW - 5}" y="${y - 2}" font-size="10" text-anchor="middle">💣</text>`;
    if (isMyMine && !isRevealed) svg += `<circle cx="${x + stepW - 5}" cy="${y + 4}" r="3" fill="#4a6a8a" opacity=".6"/>`;
  }

  function drawChibi(step, playerIdx) {
    const { x, y } = getStepPos(Math.min(step, 46));
    const cx = x + (playerIdx === 0 ? stepW * 0.3 : stepW * 0.7);
    const cy = y - 14;
    const grad = playerIdx === 0 ? 'url(#p1Grad)' : 'url(#p2Grad)';
    const label = playerIdx === 0 ? 'P1' : 'P2';
    svg += `<circle cx="${cx}" cy="${cy - 6}" r="7" fill="${grad}" stroke="#fff" stroke-width="1"/>`;
    svg += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#fff" font-size="5" font-weight="800" font-family="Orbitron,sans-serif">${label}</text>`;
    svg += `<rect x="${cx - 4}" y="${cy}" width="8" height="10" rx="2" fill="${grad}"/>`;
    svg += `<line x1="${cx - 3}" y1="${cy + 10}" x2="${cx - 5}" y2="${cy + 16}" stroke="${grad}" stroke-width="2" stroke-linecap="round"/>`;
    svg += `<line x1="${cx + 3}" y1="${cy + 10}" x2="${cx + 5}" y2="${cy + 16}" stroke="${grad}" stroke-width="2" stroke-linecap="round"/>`;
  }

  drawChibi(positions[0], 0);
  drawChibi(positions[1], 1);

  svg += '</svg>';
  return svg;
}

function showJankenAnimation(h0, h1, winner, advance, mineHit) {
  if (jankenAnimating) return;
  jankenAnimating = true;
  const emojis = { rock: '✊', scissors: '✌️', paper: '✋' };
  const overlay = document.createElement('div');
  overlay.className = 'janken-anim-overlay';
  overlay.innerHTML = `
    <div class="janken-anim-text" id="jk-text">最初はグー</div>
    <div class="janken-anim-hands">
      <div class="janken-anim-hand left" id="jk-left">✊</div>
      <div class="janken-anim-vs">VS</div>
      <div class="janken-anim-hand right" id="jk-right">✊</div>
    </div>
    <div class="janken-anim-result" id="jk-result" style="display:none"></div>
  `;
  document.body.appendChild(overlay);
  AudioManager.playCountdown();

  setTimeout(() => {
    const t = document.getElementById('jk-text');
    if (t) { t.textContent = 'じゃんけん...'; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = 'bounceIn .4s ease-out'; }
    AudioManager.playCountdown();
  }, 800);

  setTimeout(() => {
    const t = document.getElementById('jk-text');
    if (t) { t.textContent = 'ぽい！'; t.style.color = '#f0d050'; t.style.fontSize = '2.5rem'; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = 'bounceIn .4s ease-out'; }
    const l = document.getElementById('jk-left');
    const r = document.getElementById('jk-right');
    if (l) { l.textContent = emojis[h0] || '🤘'; l.className = 'janken-anim-hand revealed'; }
    if (r) { r.textContent = emojis[h1] || '🤘'; r.className = 'janken-anim-hand revealed'; }
    AudioManager.playReveal();
  }, 1600);

  setTimeout(() => {
    const res = document.getElementById('jk-result');
    if (res) {
      res.style.display = 'block';
      if (winner === -1) {
        res.textContent = 'あいこ！';
        res.style.color = '#c9a227';
      } else {
        res.textContent = `P${winner + 1}の勝ち！ ${advance}歩進む！`;
        res.style.color = winner === 0 ? '#ff6b81' : '#60a5fa';
        if (mineHit) {
          setTimeout(() => {
            res.textContent += ' 💣 地雷！10段下がる！';
            res.style.color = '#ff4757';
            AudioManager.playExplosion();
            Effects.explosion(window.innerWidth / 2, window.innerHeight / 2);
            Effects.screenShake(400);
          }, 500);
        }
      }
    }
  }, 2200);

  setTimeout(() => {
    overlay.remove();
    jankenAnimating = false;
    if (gameState) renderMineGlico(gameState);
  }, mineHit ? 3800 : 3200);
}

function renderMineGlico(s) {
  if (s.phase === 'mine-placement') {
    renderMinePlacement(s);
  } else if (s.phase === 'playing' || s.phase === 'aiko-choice') {
    if (s.lastRound && s.lastRound.id !== lastGlicoRoundId && !jankenAnimating) {
      lastGlicoRoundId = s.lastRound.id;
      showJankenAnimation(s.lastRound.h0, s.lastRound.h1, s.lastRound.winner, s.lastRound.advance, s.lastRound.mineHit);
      return;
    }
    if (!jankenAnimating) renderGlicoPlaying(s);
  } else if (s.phase === 'finished') {
    if (s.lastRound && s.lastRound.id !== lastGlicoRoundId && !jankenAnimating) {
      lastGlicoRoundId = s.lastRound.id;
      showJankenAnimation(s.lastRound.h0, s.lastRound.h1, s.lastRound.winner, s.lastRound.advance, s.lastRound.mineHit);
      return;
    }
    if (!jankenAnimating) renderGlicoFinished(s);
  }
}

function renderMinePlacement(s) {
  let cells = '';
  for (let i = 1; i <= 45; i++) {
    const sel = selectedMines.includes(i) ? 'selected' : '';
    cells += `<div class="mine-cell ${sel}" onclick="toggleMine(${i})">${i}</div>`;
  }
  render(`
    <div class="screen active">
      <h1>💣 地雷設置</h1>
      <p class="subtitle">3つの段に地雷を設置してください (1〜45段)</p>
      <p class="text-center text-gold">選択中: ${selectedMines.length}/3</p>
      <div class="mine-grid" style="grid-template-columns:repeat(9,1fr)">${cells}</div>
      <div class="btn-group mt-16">
        <button class="btn primary" onclick="submitMines()" ${selectedMines.length !== 3 ? 'disabled' : ''}>設置確定</button>
      </div>
      <p class="text-center text-sm mt-8">${s.minesReady[1 - s.myIndex] ? '相手は設置完了' : '相手の設置を待っています'}</p>
    </div>
  `);
}

function toggleMine(step) {
  AudioManager.playSelect();
  const idx = selectedMines.indexOf(step);
  if (idx >= 0) selectedMines.splice(idx, 1);
  else if (selectedMines.length < 3) selectedMines.push(step);
  renderMinePlacement(gameState);
}

function submitMines() {
  if (selectedMines.length !== 3) return;
  AudioManager.playClick();
  socket.emit('glico-mines', selectedMines);
}

socket.on('mine-overlap', (overlap) => {
  alert(`地雷の位置が重複しています: ${overlap.join(', ')}段目\n両プレイヤーとも選び直してください`);
  selectedMines = selectedMines.filter(m => !overlap.includes(m));
  if (gameState) renderMinePlacement(gameState);
});

function renderGlicoPlaying(s) {
  const staircaseSvg = buildStaircaseSVG(s.positions, s.myMines, s.revealedMines);
  const logHtml = s.log.map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');

  let actionHtml = '';
  if (s.phase === 'aiko-choice' && s.aikoWinner === s.myIndex) {
    actionHtml = `
      <p class="text-center text-gold mb-8">5回あいこ！あなたの勝ちです。進む段数を選んでください：</p>
      <div class="btn-group">
        <button class="btn primary" onclick="socket.emit('glico-aiko-choice',3)">3段</button>
        <button class="btn primary" onclick="socket.emit('glico-aiko-choice',6)">6段</button>
      </div>
    `;
  } else if (s.phase === 'aiko-choice') {
    actionHtml = '<p class="text-center text-sm">相手が段数を選んでいます...</p>';
  } else if (s.waiting) {
    actionHtml = '<p class="text-center text-sm text-gold">相手の手を待っています...</p>';
  } else {
    actionHtml = `
      <div class="janken-hands">
        <div class="janken-hand" onclick="playGlicoJanken('rock')">✊</div>
        <div class="janken-hand" onclick="playGlicoJanken('scissors')">✌️</div>
        <div class="janken-hand" onclick="playGlicoJanken('paper')">✋</div>
      </div>
    `;
  }

  const myColor = s.myIndex === 0 ? '#ff6b81' : '#60a5fa';
  const myLabel = s.myIndex === 0 ? 'P1' : 'P2';
  render(`
    <div class="screen active">
      <div class="status-bar">
        <span style="color:#ff6b81">P1: ${s.positions[0]}段</span>
        <span class="text-gold">あいこ: ${s.consecutiveDraws}</span>
        <span style="color:#60a5fa">P2: ${s.positions[1]}段</span>
      </div>
      <h2>💣 地雷グリコ</h2>
      <p class="text-center text-sm">あなたは <span style="color:${myColor};font-weight:bold">${myLabel}</span></p>
      <div class="staircase-container">${staircaseSvg}</div>
      ${actionHtml}
      <div class="chat-log">${logHtml}</div>
    </div>
  `);
  const log = $('.chat-log');
  if (log) log.scrollTop = log.scrollHeight;
}

function playGlicoJanken(hand) {
  AudioManager.playClick();
  socket.emit('glico-janken', hand);
}

function renderGlicoFinished(s) {
  const isWin = s.winner === s.myIndex;
  AudioManager.stopBGM();
  if (isWin) { AudioManager.playWin(); Effects.confetti(); Effects.emojiRain('🎉', 15); }
  else { AudioManager.playLose(); Effects.screenShake(500); }
  const allMines = [...s.myMines.map(m => ({ step: m, owner: s.myIndex })), ...(s.opponentMines || []).map(m => ({ step: m, owner: 1 - s.myIndex }))];
  const allRevealed = [...s.revealedMines, ...allMines];
  const unique = [];
  const seen = new Set();
  allRevealed.forEach(m => { const k = `${m.step}-${m.owner}`; if (!seen.has(k)) { seen.add(k); unique.push(m); } });
  const staircaseSvg = buildStaircaseSVG(s.positions, s.myMines, unique);
  render(`
    <div class="screen active">
      <div class="result-overlay">
        <div class="result-box" style="text-align:center">
          <div style="font-size:4rem;font-weight:900;letter-spacing:8px;margin-bottom:8px;
            color:${isWin ? '#ffd700' : '#ff4444'};
            text-shadow:0 0 30px ${isWin ? 'rgba(255,215,0,.6)' : 'rgba(255,68,68,.5)'},0 0 60px ${isWin ? 'rgba(255,215,0,.3)' : 'rgba(255,68,68,.25)'}">
            ${isWin ? 'WIN' : 'LOSE'}
          </div>
          <p style="font-size:1rem;margin-bottom:16px;color:var(--text-secondary)">
            P1: ${s.positions[0]}段 / P2: ${s.positions[1]}段
          </p>
          <div class="staircase-container" style="max-height:180px;overflow:auto;margin-bottom:12px">${staircaseSvg}</div>
          <p class="text-xs" style="color:var(--text-secondary)">💣 全ての地雷が表示されています</p>
          <div class="btn-group mt-16">
            <button class="btn primary" onclick="socket.emit('restart-game');selectedMines=[];lastGlicoRoundId=null">もう一度遊ぶ</button>
            <button class="btn" onclick="showHome()">ホームに戻る</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ========== FREESTYLE JANKEN ==========
let customMoveData = { name: '', emoji: '🤘', beats: [], losesTo: [], effect: '' };

let lastFreestyleRound = null;
let freestyleAnimating = false;

function showFreestyleAnimation(lr) {
  if (freestyleAnimating) return;
  freestyleAnimating = true;
  const emojis = { rock: '✊', scissors: '✌️', paper: '✋' };
  const getEmoji = (h) => {
    if (emojis[h]) return emojis[h];
    if (gameState && gameState.myCustomMove && (h === `custom${gameState.myIndex}`)) return gameState.myCustomMove.emoji;
    if (gameState && gameState.opponentCustomEmoji && (h === `custom${1 - gameState.myIndex}`)) return gameState.opponentCustomEmoji;
    return '🤘';
  };
  const overlay = document.createElement('div');
  overlay.className = 'janken-anim-overlay';
  overlay.innerHTML = `
    <div class="janken-anim-text" id="jk-text">最初はグー</div>
    <div class="janken-anim-hands">
      <div class="janken-anim-hand left" id="jk-left">✊</div>
      <div class="janken-anim-vs">VS</div>
      <div class="janken-anim-hand right" id="jk-right">✊</div>
    </div>
    <div class="janken-anim-result" id="jk-result" style="display:none"></div>
  `;
  document.body.appendChild(overlay);
  AudioManager.playCountdown();

  setTimeout(() => {
    const t = document.getElementById('jk-text');
    if (t) { t.textContent = 'じゃんけん...'; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = 'bounceIn .4s ease-out'; }
    AudioManager.playCountdown();
  }, 800);

  setTimeout(() => {
    const t = document.getElementById('jk-text');
    if (t) { t.textContent = 'ぽい！'; t.style.color = '#f0d050'; t.style.fontSize = '2.5rem'; }
    document.getElementById('jk-left').textContent = getEmoji(lr.h0);
    document.getElementById('jk-left').className = 'janken-anim-hand revealed';
    document.getElementById('jk-right').textContent = getEmoji(lr.h1);
    document.getElementById('jk-right').className = 'janken-anim-hand revealed';
    AudioManager.playReveal();
  }, 1600);

  setTimeout(() => {
    const res = document.getElementById('jk-result');
    if (res) {
      res.style.display = 'block';
      if (lr.winner === -1) {
        res.textContent = 'あいこ！';
        res.style.color = '#c9a227';
      } else {
        res.innerHTML = `P${lr.winner + 1}の勝ち！`;
        res.style.color = lr.winner === 0 ? '#ff6b81' : '#60a5fa';
        if (lr.effectText) {
          setTimeout(() => { res.innerHTML += `<br><span style="font-size:1rem;color:#f0d050">💫 ${lr.effectText}</span>`; }, 400);
        }
      }
    }
  }, 2200);

  setTimeout(() => {
    overlay.remove();
    freestyleAnimating = false;
    if (gameState) {
      if (gameState.phase === 'finished') renderFreestyleFinished(gameState);
      else renderFreestylePlaying(gameState);
    }
  }, 3500);
}

function renderFreestyleJanken(s) {
  if (s.phase === 'move-creation') { renderFreestyleMoveCreation(s); return; }
  if (s.lastRound && s.lastRound !== lastFreestyleRound && !freestyleAnimating) {
    lastFreestyleRound = s.lastRound;
    showFreestyleAnimation(s.lastRound);
    return;
  }
  if (freestyleAnimating) return;
  if (s.phase === 'playing') renderFreestylePlaying(s);
  else if (s.phase === 'finished') renderFreestyleFinished(s);
}

function renderFreestyleMoveCreation(s) {
  const allHands = [
    { id: 'rock', name: 'グー', emoji: '✊' },
    { id: 'scissors', name: 'チョキ', emoji: '✌️' },
    { id: 'paper', name: 'パー', emoji: '✋' }
  ];
  const beatsChecks = allHands.map(h =>
    `<label style="display:flex;align-items:center;gap:8px;padding:4px 0">
      <input type="checkbox" ${customMoveData.beats.includes(h.id)?'checked':''} onchange="toggleCustomBeat('${h.id}',this.checked)"> ${h.emoji} ${h.name}に勝つ
    </label>`
  ).join('');
  const losesChecks = allHands.map(h =>
    `<label style="display:flex;align-items:center;gap:8px;padding:4px 0">
      <input type="checkbox" ${customMoveData.losesTo.includes(h.id)?'checked':''} onchange="toggleCustomLose('${h.id}',this.checked)"> ${h.emoji} ${h.name}に負ける
    </label>`
  ).join('');

  render(`
    <div class="screen active">
      <h1>✊ 独自手の作成</h1>
      <p class="subtitle">あなただけのオリジナルの手を考案してください</p>
      <div class="card">
        <label>手の名前</label>
        <input type="text" id="custom-name" placeholder="例: ドラゴンクロー" maxlength="10"
          value="${customMoveData.name}" oninput="customMoveData.name=this.value">
        <label>絵文字</label>
        <input type="text" id="custom-emoji" maxlength="2" style="width:60px;font-size:2rem;text-align:center"
          value="${customMoveData.emoji}" oninput="customMoveData.emoji=this.value">
        <label class="mt-8">勝てる手 (最低1つ)</label>
        ${beatsChecks}
        <label class="mt-8">負ける手 (最低1つ)</label>
        ${losesChecks}
        <label class="mt-8">追加効果 (任意)</label>
        <input type="text" id="custom-effect" placeholder="例: 使用時に相手の手を予測できる" maxlength="50"
          value="${customMoveData.effect}" oninput="customMoveData.effect=this.value">
        <p class="text-xs" style="color:var(--text-tertiary);margin-top:4px">※ AI審判が効果の妥当性をチェックします</p>
      </div>
      <div class="btn-group mt-16">
        <button class="btn primary" onclick="submitCustomMove()">AI審判に提出</button>
      </div>
      ${s.myCustomApproved ? '<p class="text-center text-green mt-8">✓ 承認済み</p>' : ''}
      <p class="text-center text-sm mt-8">${s.opponentHasCustom ? '相手の独自手: 設定済み' : '相手は考案中...'}</p>
    </div>
  `);
}

function toggleCustomBeat(hand, checked) {
  if (checked) { if (!customMoveData.beats.includes(hand)) customMoveData.beats.push(hand); }
  else customMoveData.beats = customMoveData.beats.filter(h => h !== hand);
}
function toggleCustomLose(hand, checked) {
  if (checked) { if (!customMoveData.losesTo.includes(hand)) customMoveData.losesTo.push(hand); }
  else customMoveData.losesTo = customMoveData.losesTo.filter(h => h !== hand);
}

function submitCustomMove() {
  if (!customMoveData.name) { alert('手の名前を入力してください'); return; }
  AudioManager.playClick();
  socket.emit('freestyle-custom-move', customMoveData);
}

socket.on('custom-move-approved', (msg) => alert('AI審判: ' + msg));
socket.on('custom-move-rejected', (msg) => alert('AI審判: NG - ' + msg));

function renderFreestylePlaying(s) {
  const logHtml = s.log.map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');
  const myCustom = s.myCustomMove;
  const opName = s.opponentCustomName || '???';
  const opEmoji = s.opponentCustomEmoji || '❓';
  const blocked = s.effectState || { blocked: [false, false] };

  let actionHtml = '';
  if (s.waiting) {
    actionHtml = '<p class="text-center text-gold">相手の手を待っています...</p>';
  } else {
    const myCustomId = `custom${s.myIndex}`;
    const opCustomId = `custom${1 - s.myIndex}`;
    const myBlocked = blocked.blocked[s.myIndex];
    const opBlocked = blocked.blocked[1 - s.myIndex];
    actionHtml = `
      <p class="text-center text-sm mb-8">手を選んでください</p>
      <div class="janken-hands">
        <div class="janken-hand" onclick="socket.emit('freestyle-choice','rock')">✊</div>
        <div class="janken-hand" onclick="socket.emit('freestyle-choice','scissors')">✌️</div>
        <div class="janken-hand" onclick="socket.emit('freestyle-choice','paper')">✋</div>
        <div class="janken-hand custom-hand ${myBlocked?'blocked':''}" onclick="${myBlocked?'':'socket.emit(\'freestyle-choice\',\''+myCustomId+'\')'}" title="${myCustom.name}${myBlocked?' (封印中)':''}">
          ${myCustom.emoji}
          <span class="hand-label" style="color:#ff6b81">${myCustom.name}</span>
          ${myBlocked?'<span class="hand-blocked">🔒</span>':''}
        </div>
        <div class="janken-hand custom-hand ${opBlocked?'blocked':''}" onclick="${opBlocked?'':'socket.emit(\'freestyle-choice\',\''+opCustomId+'\')'}" title="${opName}${opBlocked?' (封印中)':''}">
          ${opEmoji}
          <span class="hand-label" style="color:#60a5fa">${opName}</span>
          ${opBlocked?'<span class="hand-blocked">🔒</span>':''}
        </div>
      </div>
    `;
  }

  const myEffect = myCustom && myCustom.effect ? myCustom.effect : '';
  const opEffect = s.opponentCustomEffect || '';
  let effectsHtml = '';
  if (myEffect || opEffect) {
    effectsHtml = `<div class="card text-sm mt-8" style="padding:8px 12px">
      ${myEffect ? `<p>💫 ${myCustom.name}: <span class="text-gold">${myEffect}</span></p>` : ''}
      ${opEffect ? `<p>💫 ${opName}: <span class="text-gold">${opEffect}</span></p>` : ''}
    </div>`;
  }

  const myColor = s.myIndex === 0 ? '#ff6b81' : '#60a5fa';

  render(`
    <div class="screen active">
      <div class="status-bar">
        <span>勝負 ${s.decidedRounds || 0}/${s.maxRounds}</span>
        <span class="text-gold">${s.myWins} - ${s.opponentWins}</span>
        <span>${s.winsNeeded}先勝</span>
      </div>
      <h2>✊ 自由律ジャンケン</h2>
      <p class="text-center text-sm">あなたは <span style="color:${myColor};font-weight:bold">P${s.myIndex + 1}</span></p>
      <div class="score-display">
        <div class="score-item"><div class="score-value">${s.myWins}</div><div class="score-label">あなた</div></div>
        <div class="score-item"><div class="score-value text-red">VS</div><div class="score-label"></div></div>
        <div class="score-item"><div class="score-value">${s.opponentWins}</div><div class="score-label">相手</div></div>
      </div>
      ${effectsHtml}
      ${actionHtml}
      <div class="chat-log">${logHtml}</div>
    </div>
  `);
  const log = $('.chat-log');
  if (log) log.scrollTop = log.scrollHeight;
}

function renderFreestyleFinished(s) {
  const logHtml = s.log.map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');
  let detailsHtml = '';
  if (s.opponentCustomDetails) {
    const d = s.opponentCustomDetails;
    detailsHtml = `
      <div class="card mt-8">
        <h3>相手の独自手: ${d.emoji} ${d.name}</h3>
        <p class="text-sm">勝ち: ${d.beats.join(', ')}</p>
        <p class="text-sm">負け: ${d.losesTo.join(', ')}</p>
        ${d.effect ? `<p class="text-sm text-gold">効果: ${d.effect}</p>` : ''}
      </div>
    `;
  }
  render(`
    <div class="screen active">
      <div class="result-overlay">
        <div class="result-box">
          <div class="result-icon">${s.winner === s.myIndex ? '🎉' : s.winner === -1 ? '🤝' : '😢'}</div>
          <h2>${s.winner === s.myIndex ? '勝利！' : s.winner === -1 ? '引き分け' : '敗北...'}</h2>
          <p>${s.myWins} - ${s.opponentWins}</p>
          ${detailsHtml}
          <div class="btn-group mt-16">
            <button class="btn primary" onclick="socket.emit('restart-game')">もう一度</button>
            <button class="btn" onclick="showHome()">ホームへ</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ========== BEAUTY CONTEST ==========
let beautyTimerInterval = null;

function renderBeautyContest(s) {
  if (beautyTimerInterval) clearInterval(beautyTimerInterval);
  if (s.phase === 'choosing') renderBeautyChoosing(s);
  else if (s.phase === 'results') renderBeautyResults(s);
  else if (s.phase === 'finished') renderBeautyFinished(s);
}

function renderBeautyChoosing(s) {
  const existingInput = $('#beauty-number');
  const savedValue = existingInput ? existingInput.value : '';

  const penaltyMeters = s.playerNames.map((name, i) => {
    if (s.eliminated[i]) return `<div class="card" style="opacity:.4"><b>${name}</b> - 脱落</div>`;
    let pips = '';
    for (let j = 0; j < 10; j++) pips += `<div class="pip ${j < s.penalties[i] ? 'filled' : ''}"></div>`;
    return `<div class="card" ${i === s.myIndex ? 'style="border-color:var(--border-active)"' : ''}>
      <b>${name}${i === s.myIndex ? ' (あなた)' : ''}</b>
      <div class="penalty-meter">${pips}</div>
    </div>`;
  }).join('');

  let inputHtml = '';
  if (s.eliminated[s.myIndex]) {
    inputHtml = '<p class="text-center text-red">あなたは脱落しました</p>';
  } else if (s.myChoice !== null) {
    inputHtml = `<p class="text-center text-gold">選択済み: ${s.myChoice}</p>`;
  } else {
    inputHtml = `
      <div class="flex-center gap-8">
        <input type="number" class="number-input" id="beauty-number" min="0" max="100" placeholder="0-100" value="${savedValue}">
        <button class="btn primary" onclick="submitBeautyChoice()">決定</button>
      </div>
    `;
  }

  const rules = [];
  if (s.eliminatedCount >= 1) rules.push('ルール1: 同数は無効');
  if (s.eliminatedCount >= 2) rules.push('ルール2: ピタリ賞=2倍減点');
  if (s.eliminatedCount >= 3) rules.push('ルール3: 0選択→100が勝者');

  render(`
    <div class="screen active">
      <div class="status-bar">
        <span>Round ${s.round}</span>
        <span id="beauty-timer" class="text-gold">3:00</span>
      </div>
      <h2>🧪 美人投票</h2>
      <p class="subtitle">0〜100の数字を選べ。平均×0.8が目標値。</p>
      ${rules.length ? `<div class="card text-sm">${rules.join('<br>')}</div>` : ''}
      ${penaltyMeters}
      <div class="mt-16">${inputHtml}</div>
    </div>
  `);

  if (s.timerEnd) {
    beautyTimerInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((s.timerEnd - Date.now()) / 1000));
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      const el = $('#beauty-timer');
      if (el) el.textContent = `${min}:${String(sec).padStart(2, '0')}`;
      if (remaining <= 0) clearInterval(beautyTimerInterval);
    }, 100);
  }
}

function submitBeautyChoice() {
  const val = parseInt($('#beauty-number').value);
  if (isNaN(val) || val < 0 || val > 100) { alert('0〜100の整数を入力してください'); return; }
  AudioManager.playClick();
  socket.emit('beauty-choice', val);
}

function renderBeautyResults(s) {
  if (!s.roundResult) return;
  const rows = s.roundResult.choices.map(c =>
    `<tr style="${c.eliminated?'opacity:.4':''}${c.player===s.roundResult.winner?' ;color:var(--accent);font-weight:bold':''}">
      <td>${s.playerNames[c.player]}${c.player===s.myIndex?' (あなた)':''}</td>
      <td>${c.choice !== null ? c.choice : '-'}</td>
      <td>${c.player===s.roundResult.winner?'👑':c.eliminated?'💀':''}</td>
    </tr>`
  ).join('');

  const logHtml = s.log.slice(-5).map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');

  render(`
    <div class="screen active">
      <h2>🧪 Round ${s.round} 結果</h2>
      <table style="width:100%;text-align:center;margin:16px 0;font-size:.9rem">
        <tr style="color:var(--text-secondary)"><th>プレイヤー</th><th>選択</th><th></th></tr>
        ${rows}
      </table>
      <div class="chat-log">${logHtml}</div>
      <p class="text-center text-sm mt-8">次のラウンドを準備中...</p>
    </div>
  `);
}

function renderBeautyFinished(s) {
  render(`
    <div class="screen active">
      <div class="result-overlay">
        <div class="result-box">
          <div class="result-icon">${s.winner === s.myIndex ? '🎉' : '💀'}</div>
          <h2>${s.winner === s.myIndex ? 'ゲームクリア！' : 'ゲームオーバー'}</h2>
          <p>勝者: ${s.winner >= 0 ? s.playerNames[s.winner] : 'なし'}</p>
          <div class="btn-group mt-16">
            <button class="btn primary" onclick="socket.emit('restart-game')">もう一度</button>
            <button class="btn" onclick="showHome()">ホームへ</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ========== E-CARD ==========
function eCardSVG(type, size = 60) {
  const w = size, h = Math.round(size * 1.4);
  if (type === 'emperor') {
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${w-2}" height="${h-2}" rx="6" fill="#1a1a2e" stroke="#ffd700" stroke-width="2"/>
      <polygon points="${w/2},12 ${w/2-8},28 ${w/2+8},28" fill="#ffd700"/>
      <polygon points="${w/2-10},12 ${w/2-14},26 ${w/2-4},26" fill="#ffd700"/>
      <polygon points="${w/2+10},12 ${w/2+4},26 ${w/2+14},26" fill="#ffd700"/>
      <circle cx="${w/2}" cy="${h/2+4}" r="10" fill="none" stroke="#ffd700" stroke-width="1.5"/>
      <circle cx="${w/2}" cy="${h/2+1}" r="4" fill="#ffd700"/>
      <line x1="${w/2-6}" y1="${h/2+8}" x2="${w/2-10}" y2="${h/2+18}" stroke="#ffd700" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="${w/2+6}" y1="${h/2+8}" x2="${w/2+10}" y2="${h/2+18}" stroke="#ffd700" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="${w/2}" y1="${h/2+14}" x2="${w/2}" y2="${h/2+22}" stroke="#ffd700" stroke-width="1.5" stroke-linecap="round"/>
      <text x="${w/2}" y="${h-6}" text-anchor="middle" fill="#ffd700" font-size="8" font-weight="bold">皇帝</text>
    </svg>`;
  } else if (type === 'slave') {
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${w-2}" height="${h-2}" rx="6" fill="#1a1a2e" stroke="#ff4444" stroke-width="2"/>
      <circle cx="${w/2}" cy="22" r="7" fill="none" stroke="#ff6666" stroke-width="1.5"/>
      <line x1="${w/2}" y1="29" x2="${w/2}" y2="${h/2+10}" stroke="#ff6666" stroke-width="1.5"/>
      <line x1="${w/2-8}" y1="${h/2+2}" x2="${w/2+8}" y2="${h/2+2}" stroke="#888" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${w/2-8}" cy="${h/2+2}" r="2" fill="#888"/>
      <circle cx="${w/2+8}" cy="${h/2+2}" r="2" fill="#888"/>
      <line x1="${w/2-4}" y1="${h/2+10}" x2="${w/2-8}" y2="${h/2+20}" stroke="#ff6666" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="${w/2+4}" y1="${h/2+10}" x2="${w/2+8}" y2="${h/2+20}" stroke="#ff6666" stroke-width="1.5" stroke-linecap="round"/>
      <text x="${w/2}" y="${h-6}" text-anchor="middle" fill="#ff6666" font-size="8" font-weight="bold">奴隷</text>
    </svg>`;
  } else {
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${w-2}" height="${h-2}" rx="6" fill="#1a1a2e" stroke="#888" stroke-width="1.5"/>
      <circle cx="${w/2}" cy="22" r="7" fill="none" stroke="#aaa" stroke-width="1.5"/>
      <line x1="${w/2}" y1="29" x2="${w/2}" y2="${h/2+10}" stroke="#aaa" stroke-width="1.5"/>
      <line x1="${w/2-6}" y1="${h/2+4}" x2="${w/2-10}" y2="${h/2+14}" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="${w/2+6}" y1="${h/2+4}" x2="${w/2+10}" y2="${h/2+14}" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="${w/2-4}" y1="${h/2+10}" x2="${w/2-8}" y2="${h/2+20}" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="${w/2+4}" y1="${h/2+10}" x2="${w/2+8}" y2="${h/2+20}" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
      <text x="${w/2}" y="${h-6}" text-anchor="middle" fill="#aaa" font-size="8">市民</text>
    </svg>`;
  }
}

function renderECard(s) {
  if (s.phase === 'playing') renderECardPlaying(s);
  else if (s.phase === 'revealing') renderECardRevealing(s);
  else if (s.phase === 'finished') renderECardFinished(s);
}

function renderECardPlaying(s) {
  const logHtml = s.log.map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');
  const handCards = s.myHand.map((card, i) => {
    return `<div class="e-card-svg ${card}" onclick="socket.emit('e-card-choice',${i})" style="cursor:pointer">
      ${eCardSVG(card)}
    </div>`;
  }).join('');

  let opponentCards = '';
  for (let i = 0; i < s.opponentCards; i++) {
    opponentCards += `<div class="e-card face-down"><div class="card-icon">?</div></div>`;
  }

  const isFirst = s.firstPlayer === s.myIndex;
  const ptw = s.pointsToWin || 5;

  render(`
    <div class="screen active">
      <div class="status-bar">
        <span>Set ${s.set}</span>
        <span class="text-gold">P1:${s.points[0]} - P2:${s.points[1]}</span>
        <span>${ptw}pt先勝</span>
      </div>
      <h2>👑 Eカード</h2>
      <div class="score-display">
        <div class="score-item"><div class="score-value">${s.points[0]}</div><div class="score-label">P1</div></div>
        <div class="score-item"><div class="score-value text-red">VS</div><div class="score-label">Set${s.set}</div></div>
        <div class="score-item"><div class="score-value">${s.points[1]}</div><div class="score-label">P2</div></div>
      </div>
      <div class="card text-center">
        <p>あなたは <b class="${s.myRole === 'emperor' ? 'text-gold' : 'text-red'}">${s.myRole === 'emperor' ? '👑 皇帝側' : '⛓️ 奴隷側'}</b></p>
        <p class="text-sm mt-8">${isFirst ? '先手（あなたが先に出す）' : '後手（相手の後に出す）'}</p>
        ${s.myRole === 'slave' ? '<p class="text-sm text-gold mt-8">奴隷勝利 = 5ポイント！</p>' : ''}
      </div>
      <div class="text-center mt-8">
        <p class="text-sm text-gold mb-8">相手の手札 (${s.opponentCards}枚)</p>
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:4px">${opponentCards}</div>
      </div>
      <div class="mt-16">
        <p class="text-sm text-gold mb-8 text-center">${s.waiting ? '相手のカード選択を待っています...' : 'カードを選んでください'}</p>
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:8px">${handCards}</div>
      </div>
      <div class="chat-log mt-8">${logHtml}</div>
    </div>
  `);
  const log = $('.chat-log');
  if (log) log.scrollTop = log.scrollHeight;
}

function renderECardRevealing(s) {
  const cards = s.reveal || {};
  const myCard = s.myIndex === 0 ? cards.p0Card : cards.p1Card;
  const opCard = s.myIndex === 0 ? cards.p1Card : cards.p0Card;
  const myLabel = myCard === 'emperor' ? '皇帝' : myCard === 'slave' ? '奴隷' : myCard === 'citizen' ? '市民' : '?';
  const opLabel = opCard === 'emperor' ? '皇帝' : opCard === 'slave' ? '奴隷' : opCard === 'citizen' ? '市民' : '?';

  render(`
    <div class="screen active">
      <div class="status-bar">
        <span>Set ${s.set}</span>
        <span class="text-gold">P1:${s.points[0]} - P2:${s.points[1]}</span>
      </div>
      <h2>👑 Eカード</h2>
      <p class="text-center text-gold mb-16" style="font-size:1.1rem">カードオープン！</p>
      <div style="display:flex;justify-content:center;align-items:center;gap:24px">
        <div class="text-center">
          <p class="text-sm mb-8">あなた</p>
          <div class="e-card-svg ${myCard} card-flip">${eCardSVG(myCard, 70)}</div>
          <p class="text-sm mt-4" style="font-weight:bold">${myLabel}</p>
        </div>
        <div class="text-red" style="font-size:1.5rem;font-weight:bold">VS</div>
        <div class="text-center">
          <p class="text-sm mb-8">相手</p>
          <div class="e-card-svg ${opCard} card-flip" style="animation-delay:.3s">${eCardSVG(opCard, 70)}</div>
          <p class="text-sm mt-4" style="font-weight:bold">${opLabel}</p>
        </div>
      </div>
      <p class="text-center text-sm mt-16" style="opacity:.6">判定中...</p>
    </div>
  `);
}

socket.on('e-card-wait', (msg) => {
  const el = document.createElement('div');
  el.className = 'text-center text-sm text-gold';
  el.textContent = msg;
  el.style.position = 'fixed';
  el.style.bottom = '20px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  el.style.background = 'var(--bg-card)';
  el.style.padding = '8px 16px';
  el.style.borderRadius = '8px';
  el.style.zIndex = '300';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
});

function renderECardFinished(s) {
  const logHtml = s.log.map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');
  render(`
    <div class="screen active">
      <div class="result-overlay">
        <div class="result-box">
          <div class="result-icon">${s.winner === s.myIndex ? '🎉' : s.winner === -1 ? '🤝' : '😢'}</div>
          <h2>${s.winner === s.myIndex ? '勝利！' : s.winner === -1 ? '引き分け' : '敗北...'}</h2>
          <p>P1: ${s.points[0]}pt vs P2: ${s.points[1]}pt</p>
          <div class="chat-log mt-8">${logHtml}</div>
          <div class="btn-group mt-16">
            <button class="btn primary" onclick="socket.emit('restart-game')">もう一度</button>
            <button class="btn" onclick="showHome()">ホームへ</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ========== ONE POKER ==========
function renderOnePoker(s) {
  if (s.phase === 'card-selection') renderOnePokerSelection(s);
  else if (s.phase === 'betting') renderOnePokerBetting(s);
  else if (s.phase === 'finished') renderOnePokerFinished(s);
}

function renderOnePokerSelection(s) {
  const logHtml = s.log.map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');
  const indicators = s.opponentIndicators.map(ind =>
    `<span class="indicator ${ind.toLowerCase()}">${ind}</span>`
  ).join(' ');

  const handCards = s.myHand.map((card, i) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return `<div class="poker-card face-up ${isRed ? 'hearts' : 'spades'} ${s.selectedCard === i ? 'selected' : ''}"
      onclick="socket.emit('one-poker-select',${i})">${card.value}${card.suit}</div>`;
  }).join('');

  render(`
    <div class="screen active">
      <div class="status-bar">
        <span>Round ${s.roundNum}</span>
        <span class="text-gold">Life: ${s.life[s.myIndex]}</span>
      </div>
      <h2>🃏 ワンポーカー</h2>
      <div class="score-display">
        <div class="score-item">
          <div class="score-value">${s.life[0]}</div>
          <div class="score-label">P1 Life</div>
          <div class="text-sm text-red">${s.losses[0]}敗</div>
        </div>
        <div class="score-item"><div class="score-value text-red">VS</div></div>
        <div class="score-item">
          <div class="score-value">${s.life[1]}</div>
          <div class="score-label">P2 Life</div>
          <div class="text-sm text-red">${s.losses[1]}敗</div>
        </div>
      </div>
      <div class="card text-center">
        <p class="text-sm mb-8">相手のカード情報:</p>
        <div>${indicators}</div>
      </div>
      <div class="mt-16 text-center">
        <p class="text-sm text-gold mb-8">勝負に出すカードを選んでください</p>
        <div style="display:flex;justify-content:center">${handCards}</div>
      </div>
      <div class="chat-log mt-8">${logHtml}</div>
    </div>
  `);
}

function renderOnePokerBetting(s) {
  const logHtml = s.log.map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');
  const isMyTurn = s.currentBetter === s.myIndex;
  const diff = Math.abs(s.pot[0] - s.pot[1]);
  const needToMatch = s.pot[1 - s.myIndex] - s.pot[s.myIndex];

  let actionHtml = '';
  if (isMyTurn) {
    if (needToMatch > 0) {
      actionHtml = `
        <p class="text-center text-gold mb-8">相手が${s.pot[1-s.myIndex]}をベット中。コール(+${needToMatch})、レイズ、またはドロップ？</p>
        <div class="btn-group">
          <button class="btn primary" onclick="handlePokerCall()">コール (+${needToMatch})</button>
          <button class="btn" onclick="showRaiseInput()">レイズ</button>
          <button class="btn danger" onclick="socket.emit('one-poker-bet',{action:'drop'})">ドロップ</button>
        </div>
        <div id="raise-input" class="hidden mt-8 flex-center gap-8">
          <input type="number" id="raise-amount" class="number-input" min="1" max="${s.life[s.myIndex]}" value="1" style="width:80px">
          <button class="btn primary small" onclick="submitRaise()">レイズ</button>
        </div>
      `;
    } else {
      actionHtml = `
        <p class="text-center text-gold mb-8">コール or レイズ？</p>
        <div class="btn-group">
          <button class="btn primary" onclick="socket.emit('one-poker-bet',{action:'call'})">コール</button>
          <button class="btn" onclick="showRaiseInput()">レイズ</button>
          <button class="btn danger" onclick="socket.emit('one-poker-bet',{action:'drop'})">ドロップ</button>
        </div>
        <div id="raise-input" class="hidden mt-8 flex-center gap-8">
          <input type="number" id="raise-amount" class="number-input" min="1" max="${s.life[s.myIndex]}" value="1" style="width:80px">
          <button class="btn primary small" onclick="submitRaise()">レイズ</button>
        </div>
      `;
    }
  } else {
    actionHtml = '<p class="text-center text-sm">相手のアクションを待っています...</p>';
  }

  let showdownHtml = '';
  if (s.showdown) {
    const c0 = s.showdown.p0Card;
    const c1 = s.showdown.p1Card;
    showdownHtml = `
      <div class="card text-center">
        <p class="text-sm mb-8">前のラウンド結果:</p>
        <div style="display:flex;justify-content:center;gap:16px">
          <div class="poker-card face-up ${(c0.suit==='♥'||c0.suit==='♦')?'hearts':'spades'}">${c0.value}${c0.suit}</div>
          <span style="align-self:center;font-size:1.5rem">VS</span>
          <div class="poker-card face-up ${(c1.suit==='♥'||c1.suit==='♦')?'hearts':'spades'}">${c1.value}${c1.suit}</div>
        </div>
      </div>
    `;
  }

  render(`
    <div class="screen active">
      <div class="status-bar">
        <span>Pot: ${s.pot[0]+s.pot[1]}</span>
        <span class="text-gold">Round ${s.roundNum}</span>
      </div>
      <h2>🃏 ワンポーカー - ベッティング</h2>
      <div class="score-display">
        <div class="score-item">
          <div class="score-value">${s.life[0]}</div>
          <div class="score-label">P1 Life</div>
          <div class="text-sm">Bet: ${s.pot[0]}</div>
        </div>
        <div class="score-item"><div class="score-value text-red">VS</div></div>
        <div class="score-item">
          <div class="score-value">${s.life[1]}</div>
          <div class="score-label">P2 Life</div>
          <div class="text-sm">Bet: ${s.pot[1]}</div>
        </div>
      </div>
      ${showdownHtml}
      <div class="mt-16">${actionHtml}</div>
      <div class="chat-log mt-8">${logHtml}</div>
    </div>
  `);
  const log = $('.chat-log');
  if (log) log.scrollTop = log.scrollHeight;
}

function handlePokerCall() {
  AudioManager.playClick();
  socket.emit('one-poker-bet', { action: 'call' });
}

function showRaiseInput() {
  const el = $('#raise-input');
  if (el) el.classList.toggle('hidden');
}

function submitRaise() {
  const amt = parseInt($('#raise-amount').value);
  if (isNaN(amt) || amt < 1) return;
  AudioManager.playClick();
  socket.emit('one-poker-bet', { action: 'raise', amount: amt });
}

function renderOnePokerFinished(s) {
  let showdownHtml = '';
  if (s.showdown) {
    const c0 = s.showdown.p0Card;
    const c1 = s.showdown.p1Card;
    showdownHtml = `
      <div style="display:flex;justify-content:center;gap:16px;margin:16px 0">
        <div class="poker-card face-up ${(c0.suit==='♥'||c0.suit==='♦')?'hearts':'spades'}">${c0.value}${c0.suit}</div>
        <span style="align-self:center;font-size:1.5rem">VS</span>
        <div class="poker-card face-up ${(c1.suit==='♥'||c1.suit==='♦')?'hearts':'spades'}">${c1.value}${c1.suit}</div>
      </div>
    `;
  }
  const logHtml = s.log.map(l => `<div class="msg ${l.type}">${l.text}</div>`).join('');
  render(`
    <div class="screen active">
      <div class="result-overlay">
        <div class="result-box">
          <div class="result-icon">${s.winner === s.myIndex ? '🎉' : '😢'}</div>
          <h2>${s.winner === s.myIndex ? '勝利！' : '敗北...'}</h2>
          <p>Life: P1=${s.life[0]} P2=${s.life[1]}</p>
          <p>敗北数: P1=${s.losses[0]} P2=${s.losses[1]}</p>
          ${showdownHtml}
          <div class="chat-log mt-8" style="max-height:150px">${logHtml}</div>
          <div class="btn-group mt-16">
            <button class="btn primary" onclick="socket.emit('restart-game')">もう一度</button>
            <button class="btn" onclick="showHome()">ホームへ</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ========== INIT ==========
showHome();
