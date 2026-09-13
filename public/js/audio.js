const AudioManager = (() => {
  let ctx = null;
  let bgmGain = null;
  let sfxGain = null;
  let bgmPlaying = false;
  let bgmNodes = [];
  let bgmInterval = null;
  let muted = true;
  let currentStyle = null;
  let intensity = 0;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    bgmGain = ctx.createGain();
    bgmGain.gain.value = muted ? 0 : 0.12;
    bgmGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = muted ? 0 : 0.3;
    sfxGain.connect(ctx.destination);
  }

  function ensureCtx() {
    if (muted) return false;
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function note(freq, duration, time, type, gainNode) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + duration * 0.9);
    osc.connect(g);
    g.connect(gainNode);
    osc.start(time);
    osc.stop(time + duration);
    return osc;
  }

  const scales = {
    pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
    minor: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
    chromatic: [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00]
  };

  const patterns = {
    home: { notes: [0,2,4,5,4,2,3,1], scale: 'pentatonic', bpm: 100, type: 'triangle' },
    calm: { notes: [4,5,7,5,4,2,3,2], scale: 'pentatonic', bpm: 90, type: 'sine' },
    tense: {
      notes: [0,0,3,3,2,2,4,1, 0,1,3,5,4,2,1,0],
      scale: 'minor', bpm: 130, type: 'triangle'
    },
    battle: {
      notes: [0,3,4,3,0,2,4,5, 5,4,2,0,3,5,7,4],
      scale: 'pentatonic', bpm: 150, type: 'triangle'
    },
    battleHigh: {
      notes: [0,2,4,6,7,5,3,1, 7,6,4,2,5,7,6,3],
      scale: 'minor', bpm: 170, type: 'sawtooth'
    },
    climax: {
      notes: [0,4,7,4,0,5,7,5, 3,7,5,3,7,4,2,0],
      scale: 'chromatic', bpm: 180, type: 'sawtooth'
    }
  };

  function startBGM(style) {
    if (muted) return;
    if (!ensureCtx()) return;
    if (currentStyle === style && bgmPlaying) return;
    if (bgmPlaying) stopBGM();
    bgmPlaying = true;
    currentStyle = style;

    const p = patterns[style] || patterns.home;
    const scale = scales[p.scale];
    const bpm = p.bpm + (intensity * 10);
    const beatLen = 60 / bpm;
    let step = 0;
    let measureCount = 0;

    function playStep() {
      if (!bgmPlaying || !ctx) return;
      const t = ctx.currentTime + 0.05;
      const idx = p.notes[step % p.notes.length];
      const freq = scale[idx % scale.length] * (idx >= scale.length ? 2 : 1);

      note(freq, beatLen * 0.8, t, p.type, bgmGain);

      if (step % 2 === 0) {
        note(freq / 2, beatLen * 1.8, t, 'sine', bgmGain);
      }

      // Percussion varies with style
      const noise = ctx.createOscillator();
      const ng = ctx.createGain();
      noise.type = 'square';
      if (style === 'battleHigh' || style === 'climax') {
        noise.frequency.value = step % 2 === 0 ? 4000 : 8000 + Math.random() * 3000;
        ng.gain.setValueAtTime(0.04, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      } else if (style === 'battle' || style === 'tense') {
        noise.frequency.value = 6000 + Math.random() * 2000;
        ng.gain.setValueAtTime(0.03, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        if (step % 4 === 0) {
          const kick = ctx.createOscillator();
          const kg = ctx.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(150, t);
          kick.frequency.exponentialRampToValueAtTime(40, t + 0.1);
          kg.gain.setValueAtTime(0.15, t);
          kg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          kick.connect(kg); kg.connect(bgmGain);
          kick.start(t); kick.stop(t + 0.15);
        }
      } else {
        noise.frequency.value = 6000 + Math.random() * 2000;
        ng.gain.setValueAtTime(0.02, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      }
      noise.connect(ng); ng.connect(bgmGain);
      noise.start(t); noise.stop(t + 0.06);

      step++;
      measureCount++;

      // Add variation every 16 beats
      if (measureCount % 16 === 0 && (style === 'battle' || style === 'tense')) {
        const fillFreqs = [523, 659, 784, 880];
        fillFreqs.forEach((f, i) => {
          note(f, 0.06, t + i * 0.06, 'square', bgmGain);
        });
      }
    }

    bgmInterval = setInterval(playStep, beatLen * 1000);
    playStep();
  }

  function setIntensity(level) {
    intensity = Math.max(0, Math.min(5, level));
    if (bgmPlaying && currentStyle) {
      let newStyle = currentStyle;
      if (currentStyle === 'battle' && intensity >= 3) newStyle = 'battleHigh';
      if (currentStyle === 'battle' && intensity >= 5) newStyle = 'climax';
      if (currentStyle === 'battleHigh' && intensity < 3) newStyle = 'battle';
      if (currentStyle === 'climax' && intensity < 5) newStyle = 'battleHigh';
      if (newStyle !== currentStyle) {
        currentStyle = null;
        startBGM(newStyle);
      }
    }
  }

  function stopBGM() {
    bgmPlaying = false;
    currentStyle = null;
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
  }

  function playClick() {
    if (!ensureCtx()) return;
    const t = ctx.currentTime;
    note(800, 0.08, t, 'square', sfxGain);
    note(1200, 0.06, t + 0.03, 'square', sfxGain);
  }

  function playWin() {
    if (!ensureCtx()) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      note(f, 0.3, t + i * 0.12, 'triangle', sfxGain);
    });
  }

  function playLose() {
    if (!ensureCtx()) return;
    const t = ctx.currentTime;
    [400, 350, 300, 200].forEach((f, i) => {
      note(f, 0.4, t + i * 0.15, 'sawtooth', sfxGain);
    });
  }

  function playExplosion() {
    if (!ensureCtx()) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
    for (let i = 0; i < 3; i++) {
      const n = ctx.createOscillator();
      const ng = ctx.createGain();
      n.type = 'square';
      n.frequency.value = 80 + Math.random() * 200;
      ng.gain.setValueAtTime(0.2, t + i * 0.03);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + i * 0.03);
      n.connect(ng);
      ng.connect(sfxGain);
      n.start(t + i * 0.03);
      n.stop(t + 0.4);
    }
  }

  function playCardFlip() {
    if (!ensureCtx()) return;
    const t = ctx.currentTime;
    note(1500, 0.06, t, 'sine', sfxGain);
    note(2000, 0.04, t + 0.04, 'sine', sfxGain);
  }

  function playReveal() {
    if (!ensureCtx()) return;
    const t = ctx.currentTime;
    note(440, 0.15, t, 'triangle', sfxGain);
    note(660, 0.15, t + 0.1, 'triangle', sfxGain);
    note(880, 0.2, t + 0.2, 'triangle', sfxGain);
  }

  function playCountdown() {
    if (!ensureCtx()) return;
    const t = ctx.currentTime;
    note(600, 0.15, t, 'square', sfxGain);
  }

  function playSelect() {
    if (!ensureCtx()) return;
    const t = ctx.currentTime;
    note(1000, 0.1, t, 'sine', sfxGain);
  }

  function toggleMute() {
    muted = !muted;
    if (!muted) {
      if (!ctx) init();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    }
    if (bgmGain) bgmGain.gain.value = muted ? 0 : 0.12;
    if (sfxGain) sfxGain.gain.value = muted ? 0 : 0.3;
    if (muted) stopBGM();
    return muted;
  }

  return {
    init, startBGM, stopBGM, setIntensity, toggleMute,
    playClick, playWin, playLose, playExplosion,
    playCardFlip, playReveal, playCountdown, playSelect,
    get muted() { return muted; }
  };
})();
