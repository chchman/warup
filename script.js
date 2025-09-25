'use strict';

// ===== Настройки =====
const HACKER_LOG_ENABLED   = true;
const HACKER_TOTAL_MS      = 1400;
const HACKER_FINAL_HOLD_MS = 250;

const TAKEOFF_DURATION_MS  = 2400;
const ANGLE_RESPONSE       = 12;
const ANGLE_LIMIT_UP       = -28;
const ANGLE_LIMIT_DOWN     = 12;

const EXPLOSION_DURATION_MS = 500;
const P_CRUSH               = 0.68;
const MAX_RESULTS_STORED    = 50;



// session key для того, чтобы первый показ был только один раз
const HACKER_SHOWN_KEY = 'airdrop_hacker_shown';

// ===== DOM =====
const phone         = document.querySelector('.phone');
const plane         = document.querySelector('.plane');
const explosion     = document.querySelector('.explosion');
const startBtn      = document.querySelector('.start-btn');
const hackerOverlay = document.querySelector('.hacker-overlay');
// безопасный поиск hack-log: по классу или по id
const hackLog       = document.querySelector('.hack-log') || document.getElementById('hackLog');

// результаты
const resultsBox    = document.querySelector('.results-box');
const resultsTitle  = document.querySelector('.results-title');
const resultsList   = document.querySelector('.results-list');

// кнопка/меню языков
const settingsBtn   = document.querySelector('.settings-btn');
const langMenu      = document.querySelector('.lang-menu');

let runIndex = 0;
let resultsHistory = [];

// ===== Переводы =====
const TRANSLATIONS = {
  en: {
    getStart: "GET START",
    panelTitle: "> SIGNAL CONSOLE — ANALYTICS",
    crushLabel: "CRUSH",
    resultSuffix: "x",
    results: "Results",
    languages: "Languages"
  },
  ru: {
    getStart: "СТАРТ",
    panelTitle: "> КОНСОЛЬ СИГНАЛОВ — АНАЛИТИКА",
    crushLabel: "КРАШ",
    resultSuffix: "x",
    results: "Результаты",
    languages: "Языки"
  },
  es: {
    getStart: "INICIAR",
    panelTitle: "> CONSOLA DE SEÑAL — ANALÍTICA",
    crushLabel: "CRASH",
    resultSuffix: "x",
    results: "Resultados",
    languages: "Idiomas"
  }
};
let currentLang = 'en';

// хакерское меню (оставляем на английском)
const hackerLines = [
  "[SYS] boot sequence initiated...",
  "[NET] linking telemetry adapters...",
  "[I/O] streaming anonymized telemetry...",
  "[ANALYTICS] extracting session features...",
  "[MODEL] running quick pattern pass...",
  "> READY. EXECUTE GET SIGNAL."
];

// ===== Утилиты =====
function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function lerp(a,b,t){ return a + (b - a) * t; }
function calcAngleDeg(vx, vy){ return Math.atan2(vy, vx) * 180 / Math.PI; }

function getCssPlaneStart(){
  const root = getComputedStyle(document.documentElement);
  return {
    x: parseInt(root.getPropertyValue('--plane-start-x'), 10) || 0,
    y: parseInt(root.getPropertyValue('--plane-start-y'), 10) || 0
  };
}
function setPlaneCenterPx(x, y){
  if (!plane) return;
  plane.style.left = Math.round(x) + "px";
  plane.style.top  = Math.round(y) + "px";
}

// генерация случайного символа для глитча
const GLITCH_CHARS = "!@#$%^&*()_+=-[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function randomChar(){ return GLITCH_CHARS.charAt(Math.floor(Math.random()*GLITCH_CHARS.length)); }

// ===== Хакерская панель (full / quick) =====
function countChars(lines){ return lines.reduce((s, l) => s + (l?.length || 0) + 1, 0); }

function createScanline(){
  if (!hackerOverlay) return null;
  const sl = document.createElement('div');
  sl.className = 'scanline';
  hackerOverlay.appendChild(sl);
  return sl;
}
async function runHackerConsole(full = true){
  if (!HACKER_LOG_ENABLED) return;
  if (!hackerOverlay){
    await wait((full ? HACKER_TOTAL_MS : 140) + HACKER_FINAL_HOLD_MS);
    return;
  }

  hackerOverlay.classList.add('show');
  hackerOverlay.setAttribute('aria-hidden', 'false');

  const scan = createScanline();
  await wait(60);

  if (!hackLog){
    await wait((full ? HACKER_TOTAL_MS : 140) + HACKER_FINAL_HOLD_MS);
    hackerOverlay.classList.remove('show');
    hackerOverlay.setAttribute('aria-hidden', 'true');
    if (scan) scan.remove();
    return;
  }

  if (full){
    hackLog.textContent = '';
    const lines = hackerLines;
    const totalChars = Math.max(1, countChars(lines));
    let baseDelay = Math.max(3, Math.round(HACKER_TOTAL_MS / totalChars));
    baseDelay = clamp(baseDelay, 3, 24);

    for (let i = 0; i < lines.length; i++){
      const line = lines[i] + (i === lines.length - 1 ? "" : "\n");
      for (let c = 0; c < line.length; c++){
        if (Math.random() < 0.12){
          const gCount = 1 + Math.floor(Math.random()*2);
          for (let g = 0; g < gCount; g++){
            hackLog.textContent += randomChar();
            const panel = hackLog.parentElement;
            if (panel) panel.scrollTop = panel.scrollHeight;
            await wait(Math.round(baseDelay * (0.35 + Math.random()*0.6)));
            hackLog.textContent = hackLog.textContent.slice(0, -1);
          }
        }
        hackLog.textContent += line[c];
        const panel = hackLog.parentElement;
        if (panel) panel.scrollTop = panel.scrollHeight;
        const jitter = baseDelay * (0.7 + Math.random() * 0.6);
        await wait(Math.round(jitter));
      }
      await wait(40 + Math.random() * 80);
    }
    await wait(HACKER_FINAL_HOLD_MS);
  } else {
    hackLog.textContent = hackerLines.join('\n');
    const panel = hackLog.parentElement;
    if (panel) panel.scrollTop = panel.scrollHeight;
    hackerOverlay.classList.add('quick-glitch','pulse');
    await wait(120 + Math.random()*80);
    hackerOverlay.classList.remove('quick-glitch','pulse');
  }

  hackerOverlay.classList.remove('show');
  hackerOverlay.setAttribute('aria-hidden', 'true');
  if (scan) scan.remove();
}

// ===== Взлёт =====
const easeInOutCubic = t => t < 0.5
  ? 4 * t * t * t
  : 1 - Math.pow(-2 * t + 2, 3) / 2;

function animateRAF(duration, onUpdate){
  return new Promise(resolve => {
    const start = performance.now();
    function frame(now){
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      onUpdate(t);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

async function runTakeoffToOffset(offsetXPercent=0.72, offsetYPercent=0.42){
  if (!plane || !phone || !explosion) return { x:0, y:0 };

  const start = getCssPlaneStart();
  const phoneRect = phone.getBoundingClientRect();
  const targetX = phoneRect.width * offsetXPercent;
  const targetY = phoneRect.height * offsetYPercent;

  let sx = start.x, sy = start.y;
  sx = clamp(sx, 8, phoneRect.width - 8);
  sy = clamp(sy, 8, phoneRect.height - 8);

  setPlaneCenterPx(sx, sy);
  plane.style.opacity = "1";
  plane.style.transform = `translate(-50%,-50%) rotate(0deg)`;

  let prevX = sx, prevY = sy, angle = 0;

  await animateRAF(TAKEOFF_DURATION_MS, t => {
    const p = easeInOutCubic(t);
    const curX = lerp(sx, targetX, p);
    const curY = lerp(sy, targetY, p);

    const vx = (curX - prevX) * 60;
    const vy = (curY - prevY) * 60;

    let targetAngle = calcAngleDeg(vx, vy);
    targetAngle = clamp(targetAngle, ANGLE_LIMIT_UP, ANGLE_LIMIT_DOWN);
    const dt = 1/60;
    const blend = 1 - Math.exp(-ANGLE_RESPONSE * dt);
    angle = lerp(angle, targetAngle, blend);

    setPlaneCenterPx(curX, curY);
    plane.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;

    prevX = curX; prevY = curY;
  });

  const planeRect = plane.getBoundingClientRect();
  const phoneRect2 = phone.getBoundingClientRect();
  const exX = planeRect.left - phoneRect2.left + planeRect.width/2;
  const exY = planeRect.top  - phoneRect2.top  + planeRect.height/2;

  explosion.style.left = `${exX}px`;
  explosion.style.top  = `${exY}px`;
  explosion.classList.remove("active");
  void explosion.offsetWidth;
  explosion.classList.add("active");

  plane.style.opacity = "0";
  await wait(EXPLOSION_DURATION_MS);
  return { x: exX, y: exY };
}

// ===== Генерация результата =====
function sampleSkew(min, max, power=3){
  const u = Math.random();
  const v = Math.pow(u, power);
  return min + (max-min)*v;
}
function generateResult(runIdx){
  if (runIdx === 1) return { type:'CRUSH', value: null };
  if (runIdx === 2){
    const v = sampleSkew(2,6,1.8);
    return { type:'MULT', value: Math.round(v*100)/100 };
  }
  if (Math.random() < P_CRUSH) return { type:'CRUSH', value: null };

  const buckets = [
    {min:0.6,max:0.99,abs:8,power:3.0},
    {min:1.0,max:7.0,abs:14,power:2.2},
    {min:7.0,max:11.0,abs:4,power:1.9},
    {min:11.0,max:50.0,abs:3,power:1.6},
    {min:50.0,max:200.0,abs:3,power:1.4}
  ];
  const totalAbs = buckets.reduce((s,b)=>s+b.abs,0);
  let r = Math.random()*totalAbs, chosen=buckets[buckets.length-1];
  for (const b of buckets){
    if (r < b.abs){ chosen = b; break; }
    r -= b.abs;
  }
  const raw = sampleSkew(chosen.min, chosen.max, chosen.power);
  return { type:'MULT', value: Math.round(raw*100)/100 };
}

// ===== Показ результата + история =====
async function showResultAt(x,y,result){
  const label = (result.type==='CRUSH') ? TRANSLATIONS[currentLang].crushLabel : `${result.value}${TRANSLATIONS[currentLang].resultSuffix}`;
  const el = document.createElement('div');
  el.textContent = label;
  Object.assign(el.style,{
    position:'absolute', left:`${x}px`, top:`${y}px`,
    transform:'translate(-50%,-50%)',
    fontFamily:'Courier New, monospace',
    fontSize:'26px', fontWeight:'700',
    color:(result.type==='CRUSH')?'#ff4444':'#07ff6a',
    zIndex:120
  });
  if (phone) phone.appendChild(el);
  await wait(1200);
  el.remove();

  resultsHistory.unshift({ runIndex, type: result.type, value: result.value ?? null, time: Date.now() });
  if (resultsHistory.length > MAX_RESULTS_STORED) resultsHistory.pop();
  renderResultsList();
  const clearResultsBtn = document.querySelector('.clear-results-btn');
if (clearResultsBtn) {
  clearResultsBtn.addEventListener('click', () => {
    resultsHistory = [];
    renderResultsList();
  });
}

}


function renderResultsList(){
  if (!resultsList) return;
  resultsList.innerHTML = '';
  const crushText = TRANSLATIONS[currentLang].crushLabel;
  const suffix = TRANSLATIONS[currentLang].resultSuffix;
  resultsHistory.slice(0, 20).forEach(r => {
    const row = document.createElement('div');
    const val = (r.type === 'CRUSH') ? crushText : `${r.value}${suffix}`;
    row.textContent = `#${r.runIndex} ${val}`;
    row.style.color = (r.type === 'CRUSH') ? '#ff4444' : '#07ff6a';
    resultsList.appendChild(row);
  });
}

// ===== Языки =====
function applyLanguage(lang){
  if(!TRANSLATIONS[lang]) return;
  currentLang = lang;
  const t = TRANSLATIONS[lang];
  if (startBtn) startBtn.textContent = t.getStart;
  const title = document.querySelector('.panel-title');
  if (title) title.textContent = t.panelTitle;
  if (resultsTitle) resultsTitle.textContent = t.results;
  if (settingsBtn) settingsBtn.title = t.languages;
  renderResultsList();
}

// ===== Меню языков (шестерёнка) =====
// -- FIX: повесил обработчики корректно, не ломая остальной код
if (settingsBtn){
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!langMenu) return;
    langMenu.hidden = !langMenu.hidden;
    settingsBtn.setAttribute('aria-expanded', String(!langMenu.hidden));
  });
}
if (langMenu){
  langMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-lang]');
    if (!btn) return;
    const lang = btn.getAttribute('data-lang');
    applyLanguage(lang);
    langMenu.hidden = true;
    settingsBtn.setAttribute('aria-expanded', 'false');
  });
}
document.addEventListener('click', (e) => {
  if (!langMenu || langMenu.hidden) return;
  if (e.target === settingsBtn || langMenu.contains(e.target)) return;
  langMenu.hidden = true;
  settingsBtn.setAttribute('aria-expanded', 'false');
});

// ===== Главный процесс =====
async function handleLaunch(){
  runIndex++;
  if (startBtn) startBtn.disabled = true;
  try {
    const first = !sessionStorage.getItem(HACKER_SHOWN_KEY);
    if (first){
      await runHackerConsole(true);
      try { sessionStorage.setItem(HACKER_SHOWN_KEY, '1'); } catch(e){ /* ignore */ }
    } else {
      await runHackerConsole(false);
    }

    const pos = await runTakeoffToOffset(0.72, 0.42);
    const result = generateResult(runIndex);
    await showResultAt(pos.x, pos.y, result);
  } finally {
    const s = getCssPlaneStart();
    if (s && typeof s.x !== 'undefined') setPlaneCenterPx(s.x, s.y);
    if (plane){
      plane.style.opacity = '1';
      plane.style.transform = `translate(-50%,-50%) rotate(0deg)`;
    }
    if (startBtn) startBtn.disabled = false;
  }
}

if (startBtn){
  startBtn.addEventListener('click', async () => {
    if (startBtn.disabled) return;
    await handleLaunch();
  });
}

// init on load
window.addEventListener('load', () => {
  const s = getCssPlaneStart();
  if (s && typeof s.x !== 'undefined') setPlaneCenterPx(s.x, s.y);
  applyLanguage(currentLang);
  renderResultsList();
});


// ===== OCEAN controls + live loop =====
(function initOceanControls(){
  const root = document.documentElement;
  const controls = document.querySelector('.ocean-controls');
  const motionToggle = document.getElementById('ocean-motion-toggle');
  const resetBtn = document.getElementById('ocean-reset');
  if (!controls) return;

  function setVar(name, value){
    root.style.setProperty(name, value);
  }
  function getVar(name){
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  controls.querySelectorAll('input[data-var]').forEach(inp => {
    const varName = inp.getAttribute('data-var');
    const current = getVar(varName);
    if (inp.type === 'range'){
      if (current.endsWith('%') || current.includes('px')){
        const n = parseFloat(current);
        if (!Number.isNaN(n)) inp.value = n;
      } else {
        const n = parseFloat(current);
        if (!Number.isNaN(n)) inp.value = n;
      }
    } else {
      inp.value = current || inp.value;
    }

    inp.addEventListener('input', () => {
      let v = inp.value;
      if (varName === '--ocean-width'){
        v = (String(v).endsWith('%') ? v : (v + '%'));
      } else if (varName === '--ocean-height'){
        v = (String(v).includes('%')) ? v : (v + 'px');
      } else if (varName === '--ocean-opacity'){
        v = String(parseFloat(v));
      } else if (varName === '--ocean-speed-s'){
        v = String(parseFloat(v));
      } else if (varName === '--ocean-vertical-sway'){
        v = String(parseFloat(v)) + 'px';
      }
      setVar(varName, v);
    });
  });

  resetBtn?.addEventListener('click', () => {
    setVar('--ocean-width', '240%');
    setVar('--ocean-height', '480px');
    setVar('--ocean-opacity', '0.3');
    setVar('--ocean-speed-s', '320');
    setVar('--ocean-vertical-sway', '8px');
    controls.querySelectorAll('input[data-var]').forEach(i => {
      const vn = i.getAttribute('data-var');
      const v = getVar(vn);
      const n = parseFloat(v);
      if (!Number.isNaN(n)) i.value = n;
    });
  });

  let start = performance.now();
  let last = start;
  let running = true;
  motionToggle?.addEventListener('change', () => {
    running = motionToggle.checked;
    if (!running) return;
    start = performance.now() - (last - start);
    last = performance.now();
    requestAnimationFrame(loop);
  });

  function parseNum(v, fallback=0){
    if (!v) return fallback;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function loop(now){
    const dt = now - last;
    last = now;
    if (!running) return;
    const elapsed = (now - start) / 1000; // seconds

    const speedS = parseNum(getVar('--ocean-speed-s'), 320);
    const parallax = parseNum(getVar('--ocean-parallax-factor'), 1.6);
    const baseDistance = 2000;

    const frontOffset = ((elapsed / speedS) * baseDistance) % baseDistance;
    const backOffset  = (frontOffset / parallax) % baseDistance;

    root.style.setProperty('--ocean-pos-front', `${-Math.round(frontOffset)}px`);
    root.style.setProperty('--ocean-pos-back', `${-Math.round(backOffset)}px`);

    const swayAmp = getVar('--ocean-vertical-sway') || '8px';
    const swayPx = parseNum(swayAmp, 8);
    const swayFront = Math.sin(elapsed * 1.2) * (swayPx * 0.6);
    const swayBack  = Math.sin(elapsed * 1.1 + 1.2) * (swayPx * 0.4);
    root.style.setProperty('--ocean-sway-front', `${swayFront.toFixed(2)}px`);
    root.style.setProperty('--ocean-sway-back', `${swayBack.toFixed(2)}px`);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();


