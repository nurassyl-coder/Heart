/**
 * Romantic Heart Drawing & Interactive Experience
 */

// Canvas & Context Setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const messageBox = document.getElementById('messageBox');
const loveTitle = document.getElementById('loveTitle');
const loveText = document.getElementById('loveText');
const replayBtn = document.getElementById('replayBtn');
const musicBtn = document.getElementById('musicBtn');
const musicText = document.getElementById('musicText');
const hintText = document.getElementById('hintText');

// Dimensions
let width = 0;
let height = 0;
let scale = 1;
let centerX = 0;
let centerY = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const isPortrait = height > width;
  centerX = width / 2;

  // На экранах смартфонов (portrait) поднимаем сердце чуть выше, чтобы текст комфортно помещался
  if (isPortrait) {
    centerY = height * 0.35;
    // Ограничиваем масштаб, чтобы сердце гарантированно помещалось по ширине и высоте
    scale = Math.min(width * 0.78 / 34, height * 0.36 / 34);
  } else {
    centerY = height * 0.42;
    const minDim = Math.min(width, height);
    scale = minDim / 38;
  }
}

window.addEventListener('resize', resize);
resize();

// ==========================================
// 1. Звезды и фоновые частицы (Ambient Stars)
// ==========================================
class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 1.8 + 0.5;
    this.alpha = Math.random() * 0.7 + 0.2;
    this.speed = Math.random() * 0.02 + 0.005;
    this.phase = Math.random() * Math.PI * 2;
  }

  update() {
    this.phase += this.speed;
    this.currentAlpha = this.alpha + Math.sin(this.phase) * 0.25;
    if (this.x > width || this.y > height) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
    }
  }

  draw() {
    ctx.save();
    ctx.fillStyle = `rgba(255, 230, 240, ${Math.max(0.1, this.currentAlpha)})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff6b8b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const stars = Array.from({ length: 90 }, () => new Star());

// ==========================================
// 2. Искры от пера (Drawing Sparks & Dust)
// ==========================================
class Sparkle {
  constructor(x, y, color = '#ff6b8b') {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 2.5 + 1;
    this.life = 1;
    this.decay = Math.random() * 0.025 + 0.015;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.size *= 0.96;
  }

  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let sparkles = [];

// ==========================================
// 3. Плавающие сердечки от кликов (Floating Hearts)
// ==========================================
class FloatingHeart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 14 + 10;
    this.vy = -(Math.random() * 2 + 1.2);
    this.vx = (Math.random() - 0.5) * 1.5;
    this.life = 1;
    this.decay = Math.random() * 0.012 + 0.008;
    this.sway = Math.random() * Math.PI * 2;
    this.swaySpeed = Math.random() * 0.05 + 0.03;
    this.color = ['#ff3366', '#ff6b8b', '#ff9ebb', '#ffd166'][Math.floor(Math.random() * 4)];
  }

  update() {
    this.y += this.vy;
    this.sway += this.swaySpeed;
    this.x += Math.sin(this.sway) * 0.8 + this.vx;
    this.life -= this.decay;
  }

  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;

    // Рисование мини-сердечка через кривые
    const s = this.size;
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.moveTo(0, -s / 4);
    ctx.bezierCurveTo(-s / 2, -s, -s, -s / 3, 0, s / 2);
    ctx.bezierCurveTo(s, -s / 3, s / 2, -s, 0, -s / 4);
    ctx.fill();
    ctx.restore();
  }
}

let floatingHearts = [];

// ==========================================
// 4. Математика сердца (Parametric Heart)
// ==========================================
// x(t) = 16 * sin^3(t)
// y(t) = -(13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t))
function getHeartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return { x, y };
}

// Преобразование математических координат в экранные с учетом центра, масштаба и пульса
function toScreen(pt, pulse = 1) {
  return {
    x: centerX + pt.x * scale * pulse,
    y: centerY + pt.y * scale * pulse
  };
}

// Состояние анимации рисования сердца
let heartProgress = -Math.PI; // от -PI до +PI
const heartSpeed = 0.024;     // скорость рисования линии
let isDrawingComplete = false;
let drawnPoints = [];
let heartbeatTime = 0;

function resetDrawing() {
  heartProgress = -Math.PI;
  isDrawingComplete = false;
  drawnPoints = [];
  messageBox.classList.remove('visible');
  hintText.classList.remove('fade-out');
}

// ==========================================
// 5. Рендеринг и Цикл Анимации
// ==========================================
function animate(currentTime) {
  requestAnimationFrame(animate);

  // Очистка с эффектом мягкого шлейфа
  ctx.fillStyle = 'rgba(10, 3, 11, 0.28)';
  ctx.fillRect(0, 0, width, height);

  // 1. Отрисовка звезд
  stars.forEach(star => {
    star.update();
    star.draw();
  });

  // 2. Отрисовка и обновление плавающих сердечек
  for (let i = floatingHearts.length - 1; i >= 0; i--) {
    floatingHearts[i].update();
    floatingHearts[i].draw();
    if (floatingHearts[i].life <= 0) {
      floatingHearts.splice(i, 1);
    }
  }

  // 3. Шаг рисования сердца
  if (!isDrawingComplete) {
    const stepsPerFrame = 2;
    for (let s = 0; s < stepsPerFrame; s++) {
      if (heartProgress <= Math.PI) {
        const pt = getHeartPoint(heartProgress);
        drawnPoints.push(pt);

        // Экранные координаты для искр пера
        const screenTip = toScreen(pt);
        sparkles.push(new Sparkle(screenTip.x, screenTip.y, '#ffd166'));
        sparkles.push(new Sparkle(screenTip.x, screenTip.y, '#ff6b8b'));

        heartProgress += heartSpeed;
      } else {
        isDrawingComplete = true;
        onDrawFinished();
        break;
      }
    }
  }

  // 4. Отрисовка контура сердца
  if (drawnPoints.length > 1) {
    ctx.save();

    let currentPulseScale = 1;
    if (isDrawingComplete) {
      heartbeatTime += 0.04;
      const b = Math.sin(heartbeatTime);
      const b2 = Math.sin(heartbeatTime * 2);
      currentPulseScale = 1 + (Math.max(0, b) * 0.04 + Math.max(0, b2) * 0.02);

      // Нежное свечение/заливка внутри сердца
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, scale * 18 * currentPulseScale);
      gradient.addColorStop(0, 'rgba(255, 51, 102, 0.28)');
      gradient.addColorStop(0.7, 'rgba(255, 107, 139, 0.12)');
      gradient.addColorStop(1, 'rgba(255, 51, 102, 0)');

      ctx.beginPath();
      const p0 = toScreen(drawnPoints[0], currentPulseScale);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < drawnPoints.length; i++) {
        const p = toScreen(drawnPoints[i], currentPulseScale);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    const pulse = isDrawingComplete ? currentPulseScale : 1;

    // Рисование светящейся линии сердца
    ctx.lineWidth = Math.max(3.5, scale * 0.18);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Внешнее свечение
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.8)';
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#ff3366';

    ctx.beginPath();
    const p0 = toScreen(drawnPoints[0], pulse);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < drawnPoints.length; i++) {
      const p = toScreen(drawnPoints[i], pulse);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Внутренняя яркая линия (неоновое ядро)
    ctx.lineWidth = Math.max(1.5, scale * 0.07);
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.stroke();

    // Рисующий светящийся кончик пера
    if (!isDrawingComplete && drawnPoints.length > 0) {
      const tip = toScreen(drawnPoints[drawnPoints.length - 1]);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffd166';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 5. Отрисовка и обновление искр
  for (let i = sparkles.length - 1; i >= 0; i--) {
    sparkles[i].update();
    sparkles[i].draw();
    if (sparkles[i].life <= 0) {
      sparkles.splice(i, 1);
    }
  }
}

// Завершение рисования: фейерверк искр и показ сообщения
function onDrawFinished() {
  hintText.classList.add('fade-out');

  // Взрыв искр и маленьких сердец в честь завершения
  for (let i = 0; i < 35; i++) {
    const pt = drawnPoints[Math.floor(Math.random() * drawnPoints.length)];
    const screenPt = toScreen(pt);
    sparkles.push(new Sparkle(screenPt.x, screenPt.y, '#ffd166'));
    sparkles.push(new Sparkle(screenPt.x, screenPt.y, '#ff6b8b'));
    floatingHearts.push(new FloatingHeart(screenPt.x, screenPt.y));
  }

  // Показываем блок с посланием
  setTimeout(() => {
    messageBox.classList.add('visible');
  }, 400);
}

// ==========================================
// 6. Интерактивность (Клики, Тапы, Свайпы)
// ==========================================
function spawnHeartsAt(clientX, clientY, count = 4) {
  for (let i = 0; i < count; i++) {
    floatingHearts.push(new FloatingHeart(
      clientX + (Math.random() - 0.5) * 24,
      clientY + (Math.random() - 0.5) * 24
    ));
    sparkles.push(new Sparkle(clientX, clientY, '#ffd166'));
  }
}

function handlePointerDown(e) {
  if (e.target.closest('.glass-btn') || e.target.closest('.action-btn') || e.target.closest('.modal-content')) {
    return;
  }
  spawnHeartsAt(e.clientX, e.clientY, 5);
}

function handlePointerMove(e) {
  // На мобильном при движении пальцем или с зажатой кнопкой мыши пускаем искры
  if (e.pointerType === 'touch' || e.buttons > 0) {
    if (e.target.closest('.glass-btn') || e.target.closest('.action-btn') || e.target.closest('.modal-content')) {
      return;
    }
    if (Math.random() < 0.45) {
      sparkles.push(new Sparkle(e.clientX, e.clientY, '#ffd166'));
      if (Math.random() < 0.15) {
        floatingHearts.push(new FloatingHeart(e.clientX, e.clientY));
      }
    }
  }
}

window.addEventListener('pointerdown', handlePointerDown, { passive: true });
window.addEventListener('pointermove', handlePointerMove, { passive: true });

// Кнопка перерисовки
replayBtn.addEventListener('click', () => {
  resetDrawing();
});

// ==========================================
// 7. Романтическая генеративная музыка (Web Audio API)
// ==========================================
let audioCtx = null;
let isMusicPlaying = false;
let musicInterval = null;

// Нежные аккорды (ноты в Гц: ля-минор / фа-мажор / до-мажор / соль-мажор)
const chords = [
  [220.00, 261.63, 329.63, 392.00], // Am7
  [174.61, 220.00, 261.63, 329.63], // Fmaj7
  [130.81, 164.81, 196.00, 246.94], // C
  [196.00, 246.94, 293.66, 392.00]  // G
];

function playSoftTone(freq, duration = 2.5, timeOffset = 0) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime + timeOffset;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  // Мягкий низкочастотный фильтр для тепла
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);

  // Плавное нарастание и затухание громкости (envelope)
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

let chordIndex = 0;
function playNextChord() {
  if (!isMusicPlaying || !audioCtx) return;
  const chord = chords[chordIndex % chords.length];
  chordIndex++;

  // Перебор арпеджио
  chord.forEach((note, idx) => {
    playSoftTone(note, 3.2, idx * 0.28);
  });
}

function toggleMusic() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isMusicPlaying = !isMusicPlaying;

  if (isMusicPlaying) {
    musicText.textContent = 'Музыка: Вкл';
    musicBtn.style.borderColor = '#ff3366';
    musicBtn.style.boxShadow = '0 0 15px rgba(255, 51, 102, 0.6)';
    playNextChord();
    musicInterval = setInterval(playNextChord, 2600);
  } else {
    musicText.textContent = 'Музыка: Выкл';
    musicBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    musicBtn.style.boxShadow = 'none';
    clearInterval(musicInterval);
  }
}

musicBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMusic();
});

// Инициализация
requestAnimationFrame(animate);
