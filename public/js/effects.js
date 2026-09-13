const Effects = (() => {
  let canvas = null;
  let ctxC = null;
  let particles = [];
  let animId = null;

  function initCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'fx-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:999;pointer-events:none';
    document.body.appendChild(canvas);
    ctxC = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function animate() {
    if (!ctxC) return;
    ctxC.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.15;
      p.life--;
      p.rotation += p.spin || 0;
      ctxC.save();
      ctxC.translate(p.x, p.y);
      ctxC.rotate(p.rotation);
      ctxC.globalAlpha = Math.min(1, p.life / 20);
      if (p.type === 'confetti') {
        ctxC.fillStyle = p.color;
        ctxC.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (p.type === 'spark') {
        ctxC.fillStyle = p.color;
        ctxC.beginPath();
        ctxC.arc(0, 0, p.size, 0, Math.PI * 2);
        ctxC.fill();
      } else if (p.type === 'star') {
        ctxC.fillStyle = p.color;
        ctxC.font = `${p.size}px sans-serif`;
        ctxC.fillText('★', -p.size / 2, p.size / 2);
      } else if (p.type === 'emoji') {
        ctxC.font = `${p.size}px sans-serif`;
        ctxC.fillText(p.emoji, -p.size / 2, p.size / 2);
      }
      ctxC.restore();
    });
    if (particles.length > 0) {
      animId = requestAnimationFrame(animate);
    } else {
      animId = null;
    }
  }

  function startAnim() {
    if (!animId) animId = requestAnimationFrame(animate);
  }

  function confetti(x, y, count) {
    initCanvas();
    const colors = ['#c9a227', '#f0d050', '#ff4757', '#3b82f6', '#2ed573', '#8b5cf6', '#ff6b81', '#60a5fa'];
    for (let i = 0; i < (count || 80); i++) {
      particles.push({
        type: 'confetti',
        x: x || canvas.width / 2,
        y: y || canvas.height / 3,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 1) * 10 - 2,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 80 + Math.random() * 60,
        gravity: 0.12,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2
      });
    }
    startAnim();
  }

  function sparks(x, y, color) {
    initCanvas();
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 / 20) * i;
      particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 4),
        vy: Math.sin(angle) * (2 + Math.random() * 4),
        size: 2 + Math.random() * 3,
        color: color || '#c9a227',
        life: 30 + Math.random() * 20,
        gravity: 0.05,
        rotation: 0, spin: 0
      });
    }
    startAnim();
  }

  function emojiRain(emoji, count) {
    initCanvas();
    for (let i = 0; i < (count || 30); i++) {
      particles.push({
        type: 'emoji',
        emoji,
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 3,
        size: 16 + Math.random() * 20,
        color: '',
        life: 120 + Math.random() * 60,
        gravity: 0.02,
        rotation: Math.random() * 0.5,
        spin: (Math.random() - 0.5) * 0.05
      });
    }
    startAnim();
  }

  function explosion(x, y) {
    initCanvas();
    const colors = ['#ff4757', '#ff6b81', '#ffa502', '#c9a227'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 40 + Math.random() * 30,
        gravity: 0.1,
        rotation: 0, spin: 0
      });
    }
    startAnim();
  }

  function screenShake(duration) {
    const app = document.getElementById('app');
    if (!app) return;
    const start = Date.now();
    const dur = duration || 400;
    function shake() {
      const elapsed = Date.now() - start;
      if (elapsed > dur) { app.style.transform = ''; return; }
      const intensity = 6 * (1 - elapsed / dur);
      const x = (Math.random() - 0.5) * intensity;
      const y = (Math.random() - 0.5) * intensity;
      app.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(shake);
    }
    shake();
  }

  function glowPulse(element) {
    if (!element) return;
    element.style.animation = 'glowPulseAnim 0.6s ease-out';
    element.addEventListener('animationend', () => { element.style.animation = ''; }, { once: true });
  }

  return { confetti, sparks, emojiRain, explosion, screenShake, glowPulse };
})();
