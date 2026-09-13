const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err.message); });
process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err); });

const rooms = new Map();

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? genCode() : code;
}

function broadcastRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const playerNames = room.players.map((p, i) => ({ name: p.name, index: i }));
  room.players.forEach((p, i) => {
    p.socket.emit('room-update', {
      code: roomCode, gameType: room.gameType,
      players: playerNames, yourIndex: i,
      minPlayers: 2,
      maxPlayers: room.gameType === 'beauty-contest' ? 5 : 2,
      started: room.started,
      canAddAi: room.gameType === 'beauty-contest' && room.players.length < 5
    });
  });
}

// ========== MINE GLICO ==========
function initMineGlico(room) {
  room.state = {
    phase: 'mine-placement',
    positions: [0, 0],
    mines: [[], []],
    revealedMines: [],
    consecutiveDraws: 0,
    firstToReach: {},
    choices: [null, null],
    minesReady: [false, false],
    log: [],
    lastRound: null
  };
  room.players.forEach((p, i) => {
    p.socket.emit('game-state', getGlicoState(room, i));
  });
}

function getGlicoState(room, playerIndex) {
  const s = room.state;
  const st = {
    game: 'mine-glico', phase: s.phase,
    positions: s.positions,
    myMines: s.mines[playerIndex],
    revealedMines: s.revealedMines,
    consecutiveDraws: s.consecutiveDraws,
    minesReady: s.minesReady,
    myIndex: playerIndex,
    log: s.log.slice(-20),
    waiting: s.phase === 'playing' && s.choices[playerIndex] !== null,
    lastRound: s.lastRound
  };
  if (s.phase === 'finished') {
    st.opponentMines = s.mines[1 - playerIndex];
    st.winner = s.winner;
  }
  return st;
}

function handleGlicoMines(room, playerIndex, mines) {
  const s = room.state;
  if (s.phase !== 'mine-placement') return;
  if (mines.length !== 3) return;
  if (mines.some(m => m < 1 || m > 45)) return;
  if (new Set(mines).size !== 3) return;
  const otherMines = s.mines[1 - playerIndex];
  const overlap = mines.filter(m => otherMines.includes(m));
  if (overlap.length > 0 && s.minesReady[1 - playerIndex]) {
    s.minesReady[1 - playerIndex] = false;
    room.players.forEach(p => p.socket.emit('mine-overlap', overlap));
    room.players.forEach((p, i) => p.socket.emit('game-state', getGlicoState(room, i)));
    return;
  }
  s.mines[playerIndex] = mines;
  s.minesReady[playerIndex] = true;
  if (s.minesReady[0] && s.minesReady[1]) {
    const overlap2 = s.mines[0].filter(m => s.mines[1].includes(m));
    if (overlap2.length > 0) {
      s.minesReady = [false, false];
      room.players.forEach((p, i) => {
        p.socket.emit('mine-overlap', overlap2);
        p.socket.emit('game-state', getGlicoState(room, i));
      });
      return;
    }
    s.phase = 'playing';
    s.log.push({ type: 'system', text: '地雷設置完了！ジャンケン開始！' });
  }
  room.players.forEach((p, i) => p.socket.emit('game-state', getGlicoState(room, i)));
}

function handleGlicoJanken(room, playerIndex, hand) {
  const s = room.state;
  if (s.phase !== 'playing') return;
  if (s.choices[playerIndex] !== null) return;
  s.choices[playerIndex] = hand;
  if (s.choices[0] !== null && s.choices[1] !== null) resolveGlicoRound(room);
  else room.players[playerIndex].socket.emit('game-state', getGlicoState(room, playerIndex));
}

function resolveGlicoRound(room) {
  const s = room.state;
  const [h0, h1] = s.choices;
  s.choices = [null, null];
  const steps = { rock: 3, scissors: 6, paper: 6 };
  const winMap = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

  s.log.push({ type: 'system', text: `P1: ${handEmoji(h0)} vs P2: ${handEmoji(h1)}` });
  s.lastRound = { id: Date.now(), h0, h1, winner: -1, advance: 0, mineHit: false };

  if (h0 === h1) {
    s.consecutiveDraws++;
    s.log.push({ type: 'system', text: `あいこ！ (${s.consecutiveDraws}回連続)` });
    if (s.consecutiveDraws >= 5) {
      let winner;
      if (s.positions[0] > s.positions[1]) winner = 0;
      else if (s.positions[1] > s.positions[0]) winner = 1;
      else {
        const step = s.positions[0];
        winner = s.firstToReach[step] !== undefined ? s.firstToReach[step] : 0;
      }
      s.consecutiveDraws = 0;
      s.phase = 'aiko-choice';
      s.aikoWinner = winner;
      s.log.push({ type: 'system', text: `5回あいこ！P${winner + 1}の勝ち！3段か6段を選んでください` });
      room.players.forEach((p, i) => p.socket.emit('game-state', { ...getGlicoState(room, i), aikoWinner: winner }));
      return;
    }
  } else {
    s.consecutiveDraws = 0;
    let winner = winMap[h0] === h1 ? 0 : 1;
    const winnerHand = winner === 0 ? h0 : h1;
    let advance = steps[winnerHand];
    let newPos = s.positions[winner] + advance;
    s.log.push({ type: 'system', text: `P${winner + 1}の勝ち！${advance}歩進む` });
    s.lastRound.winner = winner;
    s.lastRound.advance = advance;
    let mineResults = checkMines(s, winner, s.positions[winner], newPos);
    s.lastRound.mineHit = mineResults.offset < 0;
    s.positions[winner] = Math.max(0, newPos + mineResults.offset);
    if (s.positions[winner] < 0) s.positions[winner] = 0;
    s.log.push(...mineResults.logs);
    if (!s.firstToReach[s.positions[winner]]) s.firstToReach[s.positions[winner]] = winner;
    if (s.positions[winner] >= 46) {
      s.phase = 'finished';
      s.winner = winner;
      s.log.push({ type: 'system', text: `P${winner + 1}がゴール！勝利！` });
    }
  }
  room.players.forEach((p, i) => p.socket.emit('game-state', getGlicoState(room, i)));
}

function checkMines(s, mover, oldPos, newPos) {
  const other = 1 - mover;
  let offset = 0;
  const logs = [];
  const landPos = newPos;
  const enemyMines = s.mines[other];
  const myMines = s.mines[mover];

  if (enemyMines.includes(landPos)) {
    offset = -10;
    logs.push({ type: 'hit', text: `P${mover + 1}が${landPos}段目で被弾！10段下がる！` });
    s.revealedMines.push({ step: landPos, owner: other });
  }
  if (myMines.includes(landPos)) {
    logs.push({ type: 'system', text: `P${mover + 1}が自分の地雷(${landPos}段目)を踏んだ！ミス！(ペナルティなし)` });
    s.revealedMines.push({ step: landPos, owner: mover });
  }
  return { offset, logs };
}

function handleAikoChoice(room, playerIndex, stepChoice) {
  const s = room.state;
  if (s.phase !== 'aiko-choice' || playerIndex !== s.aikoWinner) return;
  if (stepChoice !== 3 && stepChoice !== 6) return;
  let newPos = s.positions[playerIndex] + stepChoice;
  s.log.push({ type: 'system', text: `P${playerIndex + 1}が${stepChoice}段進む` });
  let mineResults = checkMines(s, playerIndex, s.positions[playerIndex], newPos);
  s.positions[playerIndex] = Math.max(0, newPos + mineResults.offset);
  s.log.push(...mineResults.logs);
  if (!s.firstToReach[s.positions[playerIndex]]) s.firstToReach[s.positions[playerIndex]] = playerIndex;
  if (s.positions[playerIndex] >= 46) {
    s.phase = 'finished';
    s.winner = playerIndex;
    s.log.push({ type: 'system', text: `P${playerIndex + 1}がゴール！勝利！` });
  } else {
    s.phase = 'playing';
  }
  room.players.forEach((p, i) => p.socket.emit('game-state', getGlicoState(room, i)));
}

function handEmoji(h) {
  return { rock: '✊', scissors: '✌️', paper: '✋' }[h] || h;
}

// ========== FREESTYLE JANKEN ==========
function initFreestyleJanken(room) {
  room.state = {
    phase: 'move-creation',
    players: room.players.map((p, i) => ({
      name: p.name, wins: 0, customMove: null, customApproved: false
    })),
    round: 0, maxRounds: 7, winsNeeded: 4,
    decidedRounds: 0,
    choices: [null, null],
    log: [],
    lastRound: null,
    effectState: { blocked: [false, false], bonusWin: [false, false] }
  };
  room.players.forEach((p, i) => p.socket.emit('game-state', getFreestyleState(room, i)));
}

function getFreestyleState(room, playerIndex) {
  const s = room.state;
  const otherCustom = s.players[1 - playerIndex].customMove;
  return {
    game: 'freestyle-janken', phase: s.phase,
    round: s.decidedRounds + 1, maxRounds: s.maxRounds, winsNeeded: s.winsNeeded,
    decidedRounds: s.decidedRounds,
    myWins: s.players[playerIndex].wins,
    opponentWins: s.players[1 - playerIndex].wins,
    myCustomMove: s.players[playerIndex].customMove,
    myCustomApproved: s.players[playerIndex].customApproved,
    opponentHasCustom: !!s.players[1 - playerIndex].customMove,
    opponentCustomName: otherCustom ? otherCustom.name : null,
    opponentCustomEmoji: otherCustom ? otherCustom.emoji : null,
    opponentCustomEffect: otherCustom ? (otherCustom.effect || null) : null,
    myIndex: playerIndex,
    log: s.log.slice(-20),
    waiting: s.phase === 'playing' && s.choices[playerIndex] !== null,
    lastRound: s.lastRound,
    effectState: s.effectState
  };
}

function judgeCustomMove(move) {
  if (!move.name || !move.beats || !move.losesTo) return { ok: false, reason: '手の名前、勝てる手、負ける手を設定してください' };
  if (move.beats.length === 0) return { ok: false, reason: '最低1つの手に勝つ効果が必要です' };
  if (move.losesTo.length === 0) return { ok: false, reason: '最低1つの手に負ける効果が必要です' };
  const allHands = ['rock', 'scissors', 'paper'];
  if (move.beats.length >= 3 && allHands.every(h => move.beats.includes(h))) {
    return { ok: false, reason: 'すべての基本手に勝つ効果はNGです' };
  }
  if (move.losesTo.length < 1) return { ok: false, reason: '最低1種類の手には負ける必要があります' };
  if (move.effect) {
    const banned = ['無敵', '全勝', '必ず勝', '無条件', '即死', '絶対'];
    if (banned.some(w => move.effect.includes(w))) {
      return { ok: false, reason: `追加効果に禁止ワード「${banned.find(w => move.effect.includes(w))}」が含まれています` };
    }
    if (move.effect.length > 50) return { ok: false, reason: '追加効果は50文字以内にしてください' };
  }
  return { ok: true, reason: '承認されました' };
}

function handleFreestyleCustomMove(room, playerIndex, move) {
  const s = room.state;
  if (s.phase !== 'move-creation') return;
  const judgment = judgeCustomMove(move);
  if (!judgment.ok) {
    room.players[playerIndex].socket.emit('custom-move-rejected', judgment.reason);
    return;
  }
  s.players[playerIndex].customMove = move;
  s.players[playerIndex].customApproved = true;
  room.players[playerIndex].socket.emit('custom-move-approved', judgment.reason);
  if (s.players[0].customApproved && s.players[1].customApproved) {
    s.phase = 'playing';
    s.round = 1;
    s.log.push({ type: 'system', text: '独自手が承認されました！ゲーム開始！' });
  }
  room.players.forEach((p, i) => p.socket.emit('game-state', getFreestyleState(room, i)));
}

function handleFreestyleChoice(room, playerIndex, hand) {
  const s = room.state;
  if (s.phase !== 'playing') return;
  if (s.choices[playerIndex] !== null) return;
  s.choices[playerIndex] = hand;
  if (s.choices[0] !== null && s.choices[1] !== null) resolveFreestyleRound(room);
  else room.players[playerIndex].socket.emit('game-state', getFreestyleState(room, playerIndex));
}

function applyFreestyleEffect(s, winnerIdx, effectText) {
  if (!effectText) return;
  const loserIdx = 1 - winnerIdx;
  if (/封|ブロック|制限|減|使えな/.test(effectText)) {
    s.effectState.blocked[loserIdx] = true;
  }
  if (/2倍|ダブル|追加/.test(effectText)) {
    s.effectState.bonusWin[winnerIdx] = true;
  }
}

function resolveFreestyleRound(room) {
  const s = room.state;
  const [h0, h1] = s.choices;
  s.choices = [null, null];

  const getBeats = (hand) => {
    const base = { rock: ['scissors'], scissors: ['paper'], paper: ['rock'] };
    if (base[hand]) return base[hand];
    if (hand === 'custom0') return s.players[0].customMove.beats;
    if (hand === 'custom1') return s.players[1].customMove.beats;
    return [];
  };

  const h0Name = getHandName(h0, s);
  const h1Name = getHandName(h1, s);

  const h0Beats = getBeats(h0);
  const h1Beats = getBeats(h1);

  const p0wins = h0Beats.includes(h1) || h0Beats.includes(normalizeHand(h1));
  const p1wins = h1Beats.includes(h0) || h1Beats.includes(normalizeHand(h0));

  let winner = -1;
  let effectText = null;

  if (p0wins && !p1wins) {
    winner = 0;
    const isCustom = h0 === 'custom0' || h0 === 'custom1';
    if (isCustom) {
      const ci = h0 === 'custom0' ? 0 : 1;
      effectText = s.players[ci].customMove.effect || null;
      applyFreestyleEffect(s, 0, effectText);
    }
    let wins = 1;
    if (s.effectState.bonusWin[0]) { wins = 2; s.effectState.bonusWin[0] = false; }
    s.players[0].wins += wins;
    s.decidedRounds++;
    s.log.push({ type: 'system', text: `P1[${h0Name}] vs P2[${h1Name}]` });
    s.log.push({ type: 'system', text: `P1の勝ち！${wins > 1 ? ' (2倍効果！)' : ''} (${s.players[0].wins}-${s.players[1].wins})` });
    if (effectText) s.log.push({ type: 'system', text: `💫 効果発動: ${effectText}` });
  } else if (p1wins && !p0wins) {
    winner = 1;
    const isCustom = h1 === 'custom0' || h1 === 'custom1';
    if (isCustom) {
      const ci = h1 === 'custom0' ? 0 : 1;
      effectText = s.players[ci].customMove.effect || null;
      applyFreestyleEffect(s, 1, effectText);
    }
    let wins = 1;
    if (s.effectState.bonusWin[1]) { wins = 2; s.effectState.bonusWin[1] = false; }
    s.players[1].wins += wins;
    s.decidedRounds++;
    s.log.push({ type: 'system', text: `P1[${h0Name}] vs P2[${h1Name}]` });
    s.log.push({ type: 'system', text: `P2の勝ち！${wins > 1 ? ' (2倍効果！)' : ''} (${s.players[0].wins}-${s.players[1].wins})` });
    if (effectText) s.log.push({ type: 'system', text: `💫 効果発動: ${effectText}` });
  } else {
    s.log.push({ type: 'system', text: `P1[${h0Name}] vs P2[${h1Name}] → あいこ！` });
  }

  s.lastRound = { h0, h1, h0Name, h1Name, winner, effectText };

  if (winner >= 0) s.effectState.blocked = [false, false];

  if (s.players[0].wins >= s.winsNeeded) {
    s.phase = 'finished';
    s.winner = 0;
    s.log.push({ type: 'system', text: 'P1の勝利！' });
  } else if (s.players[1].wins >= s.winsNeeded) {
    s.phase = 'finished';
    s.winner = 1;
    s.log.push({ type: 'system', text: 'P2の勝利！' });
  } else if (s.decidedRounds >= s.maxRounds) {
    s.phase = 'finished';
    s.winner = s.players[0].wins > s.players[1].wins ? 0 : s.players[1].wins > s.players[0].wins ? 1 : -1;
    s.log.push({ type: 'system', text: s.winner >= 0 ? `P${s.winner + 1}の勝利！` : '引き分け！' });
  }

  room.players.forEach((p, i) => {
    const st = getFreestyleState(room, i);
    if (s.phase === 'finished') {
      st.opponentCustomDetails = s.players[1 - i].customMove;
    }
    p.socket.emit('game-state', st);
  });
}

function normalizeHand(hand) {
  if (hand === 'custom0' || hand === 'custom1') return hand;
  return hand;
}

function getHandName(hand, s) {
  if (hand === 'rock') return '✊グー';
  if (hand === 'scissors') return '✌️チョキ';
  if (hand === 'paper') return '✋パー';
  if (hand === 'custom0') return s.players[0].customMove.emoji + s.players[0].customMove.name;
  if (hand === 'custom1') return s.players[1].customMove.emoji + s.players[1].customMove.name;
  return hand;
}

// ========== BEAUTY CONTEST ==========
function initBeautyContest(room) {
  room.state = {
    phase: 'choosing',
    penalties: room.players.map(() => 0),
    eliminated: room.players.map(() => false),
    choices: room.players.map(() => null),
    round: 1,
    eliminatedCount: 0,
    log: [],
    timer: null,
    timerEnd: null
  };
  startBeautyTimer(room);
  room.players.forEach((p, i) => p.socket.emit('game-state', getBeautyState(room, i)));
  scheduleAiBeautyChoices(room);
}

function getBeautyState(room, playerIndex) {
  const s = room.state;
  return {
    game: 'beauty-contest', phase: s.phase,
    round: s.round,
    penalties: s.penalties,
    eliminated: s.eliminated,
    myChoice: s.choices[playerIndex],
    myIndex: playerIndex,
    playerNames: room.players.map(p => p.name),
    log: s.log.slice(-20),
    timerEnd: s.timerEnd,
    eliminatedCount: s.eliminatedCount,
    allChosen: s.choices.every((c, i) => c !== null || s.eliminated[i])
  };
}

function startBeautyTimer(room) {
  const s = room.state;
  s.timerEnd = Date.now() + 180000;
  if (s.timer) clearTimeout(s.timer);
  s.timer = setTimeout(() => resolveBeautyRound(room), 180000);
}

function handleBeautyChoice(room, playerIndex, number) {
  const s = room.state;
  if (s.phase !== 'choosing' || s.eliminated[playerIndex]) return;
  if (number < 0 || number > 100 || !Number.isInteger(number)) return;
  s.choices[playerIndex] = number;
  const allChosen = s.choices.every((c, i) => c !== null || s.eliminated[i]);
  if (allChosen) {
    if (s.timer) clearTimeout(s.timer);
    resolveBeautyRound(room);
  } else {
    room.players[playerIndex].socket.emit('game-state', getBeautyState(room, playerIndex));
  }
}

function resolveBeautyRound(room) {
  const s = room.state;
  if (s.timer) clearTimeout(s.timer);
  s.phase = 'results';

  const activeChoices = [];
  const choiceMap = {};
  s.choices.forEach((c, i) => {
    if (c !== null && !s.eliminated[i]) {
      activeChoices.push({ player: i, choice: c });
      choiceMap[c] = (choiceMap[c] || 0) + 1;
    }
  });

  s.choices.forEach((c, i) => {
    if (c === null && !s.eliminated[i]) {
      const randomChoice = Math.floor(Math.random() * 101);
      activeChoices.push({ player: i, choice: randomChoice });
      s.choices[i] = randomChoice;
      choiceMap[randomChoice] = (choiceMap[randomChoice] || 0) + 1;
    }
  });

  let rule3Active = s.eliminatedCount >= 3;
  let hasZero = activeChoices.some(ac => ac.choice === 0);

  let validChoices = activeChoices;
  let invalidPlayers = [];
  if (s.eliminatedCount >= 1) {
    validChoices = activeChoices.filter(ac => choiceMap[ac.choice] === 1);
    invalidPlayers = activeChoices.filter(ac => choiceMap[ac.choice] > 1);
    if (invalidPlayers.length > 0) {
      s.log.push({ type: 'system', text: `追加ルール1: 同数選択で無効 → ${invalidPlayers.map(p => `P${p.player + 1}(${p.choice})`).join(', ')}` });
    }
  }

  let winner = -1;

  if (rule3Active && hasZero) {
    const hundredPlayers = validChoices.filter(ac => ac.choice === 100);
    if (hundredPlayers.length > 0) {
      winner = hundredPlayers[0].player;
      s.log.push({ type: 'system', text: `追加ルール3: 0選択者あり→100を選んだP${winner + 1}が勝者！` });
    }
  }

  if (winner === -1 && validChoices.length > 0) {
    const avg = validChoices.reduce((sum, ac) => sum + ac.choice, 0) / validChoices.length;
    const target = avg * 0.8;
    s.log.push({ type: 'system', text: `平均: ${avg.toFixed(1)} × 0.8 = 目標値: ${target.toFixed(1)}` });

    let minDist = Infinity;
    let exact = false;
    validChoices.forEach(ac => {
      const dist = Math.abs(ac.choice - target);
      if (dist < minDist) { minDist = dist; winner = ac.player; exact = (dist < 0.001); }
    });

    if (exact && s.eliminatedCount >= 2) {
      s.log.push({ type: 'system', text: `追加ルール2: P${winner + 1}がピタリ賞！敗者は2ポイント減点！` });
    }

    s.log.push({ type: 'system', text: `勝者: P${winner + 1} (選択: ${s.choices[winner]})` });

    validChoices.forEach(ac => {
      if (ac.player !== winner && !s.eliminated[ac.player]) {
        const pen = (exact && s.eliminatedCount >= 2) ? 2 : 1;
        s.penalties[ac.player] += pen;
        s.log.push({ type: 'hit', text: `P${ac.player + 1}: -${pen}ポイント (合計: ${s.penalties[ac.player]})` });
      }
    });
    invalidPlayers.forEach(ac => {
      if (!s.eliminated[ac.player]) {
        const pen = (exact && s.eliminatedCount >= 2) ? 2 : 1;
        s.penalties[ac.player] += pen;
      }
    });
  } else if (validChoices.length === 0) {
    s.log.push({ type: 'system', text: '有効な投票がありません。全員1ポイント減点。' });
    s.penalties.forEach((p, i) => { if (!s.eliminated[i]) s.penalties[i]++; });
  }

  s.penalties.forEach((p, i) => {
    if (p >= 10 && !s.eliminated[i]) {
      s.eliminated[i] = true;
      s.eliminatedCount++;
      s.log.push({ type: 'hit', text: `P${i + 1}脱落！硫酸注入！` });
    }
  });

  const alive = s.eliminated.filter(e => !e).length;

  room.players.forEach((p, i) => {
    const st = getBeautyState(room, i);
    st.roundResult = {
      choices: s.choices.map((c, idx) => ({ player: idx, choice: c, eliminated: s.eliminated[idx] })),
      winner
    };
    p.socket.emit('game-state', st);
  });

  if (alive <= 1) {
    s.phase = 'finished';
    s.winner = s.eliminated.findIndex(e => !e);
    s.log.push({ type: 'system', text: s.winner >= 0 ? `P${s.winner + 1}の勝利！ゲームクリア！` : '全員脱落！' });
    room.players.forEach((p, i) => p.socket.emit('game-state', getBeautyState(room, i)));
  } else {
    setTimeout(() => {
      s.phase = 'choosing';
      s.choices = room.players.map(() => null);
      s.round++;
      startBeautyTimer(room);
      room.players.forEach((p, i) => p.socket.emit('game-state', getBeautyState(room, i)));
      scheduleAiBeautyChoices(room);
    }, 5000);
  }
}

// ========== E-CARD ==========
function initECard(room) {
  room.state = {
    phase: 'playing',
    points: [0, 0],
    roles: [0, 1],
    hands: [[], []],
    set: 1, round: 1,
    firstPlayer: 0,
    choices: [null, null],
    log: [],
    pointsToWin: 5
  };
  dealECards(room);
  room.players.forEach((p, i) => p.socket.emit('game-state', getECardState(room, i)));
}

function dealECards(room) {
  const s = room.state;
  const empIdx = s.roles[0] === 0 ? 0 : 1;
  const slaveIdx = 1 - empIdx;
  s.hands[empIdx] = ['emperor', 'citizen', 'citizen', 'citizen', 'citizen'];
  s.hands[slaveIdx] = ['slave', 'citizen', 'citizen', 'citizen', 'citizen'];
  s.round = 1;
  s.choices = [null, null];
}

function getECardState(room, playerIndex) {
  const s = room.state;
  const myRole = s.roles[playerIndex] === 0 ? 'emperor' : 'slave';
  const st = {
    game: 'e-card', phase: s.phase,
    points: s.points,
    myRole, myHand: s.hands[playerIndex],
    opponentCards: s.hands[1 - playerIndex].length,
    set: s.set, round: s.round,
    firstPlayer: s.firstPlayer,
    myIndex: playerIndex,
    pointsToWin: s.pointsToWin,
    log: s.log.slice(-20),
    waiting: s.choices[playerIndex] !== null
  };
  if (s.phase === 'finished') st.winner = s.winner;
  return st;
}

function handleECardChoice(room, playerIndex, cardIndex) {
  const s = room.state;
  if (s.phase !== 'playing') return;
  if (s.choices[playerIndex] !== null) return;
  if (cardIndex < 0 || cardIndex >= s.hands[playerIndex].length) return;

  if (s.firstPlayer === (1 - playerIndex) && s.choices[1 - playerIndex] === null) {
    room.players[playerIndex].socket.emit('e-card-wait', '先手のカード選択を待ってください');
    return;
  }

  s.choices[playerIndex] = cardIndex;

  if (s.firstPlayer === playerIndex && s.choices[1 - playerIndex] === null) {
    room.players[playerIndex].socket.emit('game-state', getECardState(room, playerIndex));
    return;
  }

  if (s.choices[0] !== null && s.choices[1] !== null) resolveECardRound(room);
}

function resolveECardRound(room) {
  const s = room.state;
  const c0 = s.hands[0][s.choices[0]];
  const c1 = s.hands[1][s.choices[1]];

  s.hands[0].splice(s.choices[0], 1);
  s.hands[1].splice(s.choices[1], 1);
  s.choices = [null, null];

  const cardName = c => ({ emperor: '皇帝', citizen: '市民', slave: '奴隷' }[c]);

  s.phase = 'revealing';
  room.players.forEach((p, i) => {
    const st = getECardState(room, i);
    st.reveal = { p0Card: c0, p1Card: c1 };
    p.socket.emit('game-state', st);
  });

  setTimeout(() => {
    s.log.push({ type: 'system', text: `P1[${cardName(c0)}] vs P2[${cardName(c1)}]` });

    if (c0 === c1) {
      s.log.push({ type: 'system', text: 'ドロー！次のカードへ' });
      s.round++;
      if (s.hands[0].length === 0 || s.hands[1].length === 0) {
        s.log.push({ type: 'system', text: 'カード切れ。次のセットへ' });
        nextECardSet(room);
      } else {
        s.firstPlayer = 1 - s.firstPlayer;
        s.phase = 'playing';
      }
    } else {
      let winner = -1;
      let slaveWin = false;
      if (c0 === 'emperor' && c1 === 'citizen') winner = 0;
      else if (c0 === 'citizen' && c1 === 'slave') winner = 0;
      else if (c0 === 'slave' && c1 === 'emperor') { winner = 0; slaveWin = true; }
      else if (c1 === 'emperor' && c0 === 'citizen') winner = 1;
      else if (c1 === 'citizen' && c0 === 'slave') winner = 1;
      else if (c1 === 'slave' && c0 === 'emperor') { winner = 1; slaveWin = true; }

      const pts = slaveWin ? 5 : 1;
      s.points[winner] += pts;
      s.log.push({ type: 'system', text: `P${winner + 1}の勝ち！+${pts}ポイント${slaveWin ? ' (奴隷勝利！5倍！)' : ''}` });

      if (s.points[0] >= s.pointsToWin || s.points[1] >= s.pointsToWin) {
        s.phase = 'finished';
        s.winner = s.points[0] >= s.pointsToWin ? 0 : 1;
        s.log.push({ type: 'system', text: `ゲーム終了！P${s.winner + 1}の勝利！` });
      } else {
        nextECardSet(room);
      }
    }

    room.players.forEach((p, i) => {
      const st = getECardState(room, i);
      st.lastReveal = { p0Card: c0, p1Card: c1 };
      p.socket.emit('game-state', st);
    });
  }, 2500);
}

function nextECardSet(room) {
  const s = room.state;
  s.set++;
  s.roles = [s.roles[1], s.roles[0]];
  s.firstPlayer = 1 - s.firstPlayer;
  dealECards(room);
  s.log.push({ type: 'system', text: `セット${s.set}: 役割交代！` });
  s.phase = 'playing';
}

// ========== ONE POKER ==========
function initOnePoker(room) {
  const deck = [];
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  suits.forEach(s => values.forEach(v => deck.push({ suit: s, value: v, num: v === 'A' ? 14 : v === 'K' ? 13 : v === 'Q' ? 12 : v === 'J' ? 11 : parseInt(v) })));
  shuffle(deck);

  room.state = {
    phase: 'card-selection',
    deck, discards: [],
    hands: [[], []],
    selectedCards: [null, null],
    playedCards: [null, null],
    life: [30, 30],
    losses: [0, 0],
    pot: [0, 0],
    currentBetter: 0,
    roundNum: 1,
    lastWinner: 0,
    log: [],
    bettingPhase: false,
    waitingForCall: [false, false]
  };
  dealOnePoker(room);
  room.players.forEach((p, i) => p.socket.emit('game-state', getOnePokerState(room, i)));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function dealOnePoker(room) {
  const s = room.state;
  const order = [s.lastWinner, 1 - s.lastWinner];
  order.forEach(pi => {
    while (s.hands[pi].length < 2 && s.deck.length > 0) {
      s.hands[pi].push(s.deck.pop());
    }
  });
  s.selectedCards = [null, null];
  s.playedCards = [null, null];
  s.pot = [0, 0];
  s.phase = 'card-selection';
  s.bettingPhase = false;
  s.waitingForCall = [false, false];
}

function getCardIndicator(card) {
  return card.num >= 8 ? 'UP' : 'DOWN';
}

function getOnePokerState(room, playerIndex) {
  const s = room.state;
  const opponentHand = s.hands[1 - playerIndex];
  const indicators = opponentHand.map(c => getCardIndicator(c));
  return {
    game: 'one-poker', phase: s.phase,
    myHand: s.hands[playerIndex],
    opponentCardCount: opponentHand.length,
    opponentIndicators: indicators,
    selectedCard: s.selectedCards[playerIndex],
    life: s.life,
    losses: s.losses,
    pot: s.pot,
    currentBetter: s.currentBetter,
    roundNum: s.roundNum,
    myIndex: playerIndex,
    log: s.log.slice(-20),
    bettingPhase: s.bettingPhase,
    waitingForCall: s.waitingForCall
  };
}

function handleOnePokerSelect(room, playerIndex, cardIndex) {
  const s = room.state;
  if (s.phase !== 'card-selection') return;
  if (cardIndex < 0 || cardIndex >= s.hands[playerIndex].length) return;
  s.selectedCards[playerIndex] = cardIndex;
  if (s.selectedCards[0] !== null && s.selectedCards[1] !== null) {
    s.playedCards = [
      s.hands[0][s.selectedCards[0]],
      s.hands[1][s.selectedCards[1]]
    ];
    s.phase = 'betting';
    s.bettingPhase = true;
    s.currentBetter = s.lastWinner;
    s.pot = [1, 1];
    s.life[0]--;
    s.life[1]--;
    s.log.push({ type: 'system', text: `ラウンド${s.roundNum}: カード選択完了。ベッティング開始。` });
  }
  room.players.forEach((p, i) => p.socket.emit('game-state', getOnePokerState(room, i)));
}

function handleOnePokerBet(room, playerIndex, action, amount) {
  const s = room.state;
  if (s.phase !== 'betting') return;

  if (action === 'call') {
    const diff = s.pot[1 - playerIndex] - s.pot[playerIndex];
    if (diff > 0) {
      const matchAmt = Math.min(diff, s.life[playerIndex]);
      s.pot[playerIndex] += matchAmt;
      s.life[playerIndex] -= matchAmt;
    }
    s.log.push({ type: 'system', text: `P${playerIndex + 1}: コール` });
    if (s.pot[0] === s.pot[1]) {
      resolveOnePokerShowdown(room);
      return;
    }
    s.currentBetter = 1 - playerIndex;
  } else if (action === 'raise') {
    const raiseAmt = Math.min(amount || 1, s.life[playerIndex]);
    if (raiseAmt <= 0) return;
    s.pot[playerIndex] += raiseAmt;
    s.life[playerIndex] -= raiseAmt;
    s.currentBetter = 1 - playerIndex;
    s.log.push({ type: 'system', text: `P${playerIndex + 1}: レイズ +${raiseAmt} (計${s.pot[playerIndex]})` });
  } else if (action === 'drop') {
    s.log.push({ type: 'system', text: `P${playerIndex + 1}: ドロップ` });
    resolveOnePokerDrop(room, playerIndex);
    return;
  }

  room.players.forEach((p, i) => p.socket.emit('game-state', getOnePokerState(room, i)));
}

function resolveOnePokerShowdown(room) {
  const s = room.state;
  const c0 = s.playedCards[0];
  const c1 = s.playedCards[1];

  s.log.push({ type: 'system', text: `ショーダウン！ P1[${c0.value}${c0.suit}] vs P2[${c1.value}${c1.suit}]` });

  let winner = -1;
  if (c0.num === c1.num) {
    s.log.push({ type: 'system', text: '引き分け！ライフ返却。' });
    s.life[0] += s.pot[0];
    s.life[1] += s.pot[1];
  } else if (c0.value === 'A' && c1.value === '2') {
    winner = 1;
    s.log.push({ type: 'system', text: '2がAに勝利！' });
  } else if (c1.value === 'A' && c0.value === '2') {
    winner = 0;
    s.log.push({ type: 'system', text: '2がAに勝利！' });
  } else {
    winner = c0.num > c1.num ? 0 : 1;
  }

  if (winner >= 0) {
    const totalPot = s.pot[0] + s.pot[1];
    s.life[winner] += totalPot;
    s.losses[1 - winner]++;
    s.log.push({ type: 'system', text: `P${winner + 1}の勝ち！ +${totalPot}ライフ獲得` });
    s.lastWinner = winner;
  }

  finishOnePokerRound(room, c0, c1);
}

function resolveOnePokerDrop(room, dropper) {
  const s = room.state;
  const winner = 1 - dropper;
  const totalPot = s.pot[0] + s.pot[1];
  s.life[winner] += totalPot;
  s.losses[dropper]++;
  s.lastWinner = winner;

  const c0 = s.playedCards[0];
  const c1 = s.playedCards[1];
  s.log.push({ type: 'system', text: `カードオープン: P1[${c0.value}${c0.suit}] P2[${c1.value}${c1.suit}]` });
  s.log.push({ type: 'system', text: `P${dropper + 1}ドロップ。P${winner + 1}が${totalPot}ライフ獲得` });

  finishOnePokerRound(room, c0, c1);
}

function finishOnePokerRound(room, c0, c1) {
  const s = room.state;

  s.hands[0] = s.hands[0].filter((_, i) => i !== s.selectedCards[0]);
  s.hands[1] = s.hands[1].filter((_, i) => i !== s.selectedCards[1]);
  s.discards.push(c0, c1);

  if (s.losses[0] >= 3 || s.losses[1] >= 3 || s.life[0] <= 0 || s.life[1] <= 0) {
    s.phase = 'finished';
    if (s.losses[0] >= 3 || s.life[0] <= 0) s.winner = 1;
    else s.winner = 0;
    s.log.push({ type: 'system', text: `ゲーム終了！P${s.winner + 1}の勝利！` });
    room.players.forEach((p, i) => {
      const st = getOnePokerState(room, i);
      st.showdown = { p0Card: c0, p1Card: c1 };
      p.socket.emit('game-state', st);
    });
  } else {
    room.players.forEach((p, i) => {
      const st = getOnePokerState(room, i);
      st.showdown = { p0Card: c0, p1Card: c1 };
      p.socket.emit('game-state', st);
    });
    setTimeout(() => {
      s.roundNum++;
      if (s.deck.length < 2) {
        s.deck = [...s.discards];
        s.discards = [];
        shuffle(s.deck);
      }
      dealOnePoker(room);
      room.players.forEach((p, i) => p.socket.emit('game-state', getOnePokerState(room, i)));
    }, 3000);
  }
}

// ========== AI PLAYERS ==========
const aiNames = ['AI_Alpha', 'AI_Beta', 'AI_Gamma', 'AI_Delta', 'AI_Omega'];
function createAiSocket() {
  return { emit: () => {}, on: () => {}, id: 'ai-' + Math.random().toString(36).slice(2, 8) };
}

function aiBeautyChoice(round, eliminatedCount) {
  const strategies = [
    () => Math.floor(Math.random() * 67),
    () => Math.floor(Math.random() * 50 + 10),
    () => Math.floor(Math.random() * 34),
    () => { const base = 33; return Math.floor(base * (0.7 + Math.random() * 0.6)); },
    () => Math.floor(Math.random() * 80 * 0.8)
  ];
  const idx = Math.min(round - 1, strategies.length - 1);
  return Math.max(0, Math.min(100, strategies[idx]()));
}

function scheduleAiBeautyChoices(room) {
  const s = room.state;
  room.players.forEach((p, i) => {
    if (p.isAi && !s.eliminated[i] && s.choices[i] === null) {
      const delay = 1000 + Math.random() * 3000;
      setTimeout(() => {
        if (s.phase === 'choosing' && s.choices[i] === null && !s.eliminated[i]) {
          handleBeautyChoice(room, i, aiBeautyChoice(s.round, s.eliminatedCount));
        }
      }, delay);
    }
  });
}

// ========== SOCKET HANDLING ==========
io.on('connection', (socket) => {
  let currentRoom = null;
  let playerName = null;

  socket.on('create-room', ({ gameType, name }) => {
    const code = genCode();
    playerName = name || 'Player1';
    const room = {
      code, gameType,
      players: [{ socket, name: playerName }],
      started: false, state: null
    };
    rooms.set(code, room);
    currentRoom = code;
    broadcastRoom(code);
  });

  socket.on('join-room', ({ code, name }) => {
    code = code.toUpperCase();
    const room = rooms.get(code);
    if (!room) { socket.emit('error-msg', 'ルームが見つかりません'); return; }
    const maxP = room.gameType === 'beauty-contest' ? 5 : 2;
    if (room.players.length >= maxP) { socket.emit('error-msg', 'ルームが満員です'); return; }
    if (room.started) { socket.emit('error-msg', 'ゲーム進行中です'); return; }
    playerName = name || `Player${room.players.length + 1}`;
    room.players.push({ socket, name: playerName });
    currentRoom = code;
    broadcastRoom(code);
  });

  socket.on('add-ai-players', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.started) return;
    if (room.gameType !== 'beauty-contest') return;
    const maxP = 5;
    let aiIdx = 0;
    while (room.players.length < maxP) {
      room.players.push({ socket: createAiSocket(), name: aiNames[aiIdx] || `AI_${aiIdx}`, isAi: true });
      aiIdx++;
    }
    broadcastRoom(currentRoom);
  });

  socket.on('leave-room', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    if (pi >= 0) {
      room.players.splice(pi, 1);
      if (room.players.filter(p => !p.isAi).length === 0) {
        if (room.state && room.state.timer) clearTimeout(room.state.timer);
        rooms.delete(currentRoom);
      } else {
        room.players.forEach(p => { if (!p.isAi) p.socket.emit('player-left', playerName); });
        broadcastRoom(currentRoom);
      }
    }
    currentRoom = null;
    socket.emit('left-room');
  });

  socket.on('start-game', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.started) return;
    const minP = room.gameType === 'beauty-contest' ? 2 : 2;
    if (room.players.length < minP) return;
    room.started = true;

    switch (room.gameType) {
      case 'mine-glico': initMineGlico(room); break;
      case 'freestyle-janken': initFreestyleJanken(room); break;
      case 'beauty-contest': initBeautyContest(room); break;
      case 'e-card': initECard(room); break;
      case 'one-poker': initOnePoker(room); break;
    }
  });

  socket.on('glico-mines', (mines) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleGlicoMines(room, pi, mines);
  });

  socket.on('glico-janken', (hand) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleGlicoJanken(room, pi, hand);
  });

  socket.on('glico-aiko-choice', (steps) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleAikoChoice(room, pi, steps);
  });

  socket.on('freestyle-custom-move', (move) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleFreestyleCustomMove(room, pi, move);
  });

  socket.on('freestyle-choice', (hand) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleFreestyleChoice(room, pi, hand);
  });

  socket.on('beauty-choice', (number) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleBeautyChoice(room, pi, number);
  });

  socket.on('e-card-choice', (cardIndex) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleECardChoice(room, pi, cardIndex);
  });

  socket.on('one-poker-select', (cardIndex) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleOnePokerSelect(room, pi, cardIndex);
  });

  socket.on('one-poker-bet', ({ action, amount }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    handleOnePokerBet(room, pi, action, amount);
  });

  socket.on('restart-game', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.started = true;
    switch (room.gameType) {
      case 'mine-glico': initMineGlico(room); break;
      case 'freestyle-janken': initFreestyleJanken(room); break;
      case 'beauty-contest': initBeautyContest(room); break;
      case 'e-card': initECard(room); break;
      case 'one-poker': initOnePoker(room); break;
    }
  });

  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const pi = room.players.findIndex(p => p.socket === socket);
    if (pi >= 0) {
      room.players.splice(pi, 1);
      if (room.players.length === 0) {
        if (room.state && room.state.timer) clearTimeout(room.state.timer);
        rooms.delete(currentRoom);
      } else {
        room.players.forEach(p => p.socket.emit('player-left', playerName));
        broadcastRoom(currentRoom);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
  const nets = require('os').networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
    }
  }
  console.log(`\n🎮 Game Arena サーバー起動！`);
  console.log(`   ローカル:  http://localhost:${PORT}`);
  console.log(`   LAN:       http://${localIP}:${PORT}`);

  try {
    const { Tunnel } = require('cloudflared');
    const t = Tunnel.quick(`http://localhost:${PORT}`);
    t.on('url', (publicUrl) => {
      console.log(`\n   🌐 公開URL: ${publicUrl}`);
      console.log(`   ↑ このURLをスマホで開いてください（WiFi不問）\n`);
    });
    t.on('error', (err) => {
      console.log(`\n   ⚠ トンネルエラー: ${err.message}`);
    });
    process.on('SIGINT', () => { t.stop(); process.exit(); });
    process.on('SIGTERM', () => { t.stop(); process.exit(); });
  } catch (e) {
    console.log(`\n   ⚠ トンネル接続失敗: ${e.message}`);
    console.log(`   同じWi-Fiに接続したスマホで http://${localIP}:${PORT} にアクセスしてください\n`);
  }
});
