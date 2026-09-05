/**
 * ICEBERG Focus Tools & Ambient Sound Synthesizer
 * Built with Web Audio API for zero-latency, network-free ambient audio loops
 */

window.FocusModeState = {
  mode: 'POMODORO', // 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'
  timeLeft: 25 * 60,
  totalDuration: 25 * 60,
  isRunning: false,
  timerInterval: null,
  ambientSound: 'OFF', // 'OFF' | 'RAIN' | 'ALPHA' | 'CAFE' | 'WHITE_NOISE'
  audioCtx: null,
  ambientNodes: [],
  volume: 0.5
};

const POMODORO_MODES = {
  POMODORO: { label: 'Deep Focus', duration: 25 * 60, color: '#06b6d4' },
  SHORT_BREAK: { label: 'Short Break', duration: 5 * 60, color: '#10b981' },
  LONG_BREAK: { label: 'Long Break', duration: 15 * 60, color: '#8b5cf6' }
};

// Initialize Focus View
async function initFocusMode() {
  setPomodoroMode('POMODORO');
  await loadFocusAnalytics();
}

// Set Pomodoro Mode
function setPomodoroMode(modeKey) {
  if (window.FocusModeState.isRunning) {
    pausePomodoroTimer();
  }
  const config = POMODORO_MODES[modeKey] || POMODORO_MODES.POMODORO;
  window.FocusModeState.mode = modeKey;
  window.FocusModeState.timeLeft = config.duration;
  window.FocusModeState.totalDuration = config.duration;
  updateTimerDisplay();

  // Update tabs UI
  ['POMODORO', 'SHORT_BREAK', 'LONG_BREAK'].forEach(m => {
    const tab = document.getElementById(`focus-tab-${m.toLowerCase()}`);
    if (tab) {
      if (m === modeKey) {
        tab.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm';
      } else {
        tab.className = 'px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 border border-transparent';
      }
    }
  });
}

// Toggle Timer (Start / Pause)
function togglePomodoroTimer() {
  if (window.FocusModeState.isRunning) {
    pausePomodoroTimer();
  } else {
    startPomodoroTimer();
  }
}

function startPomodoroTimer() {
  window.FocusModeState.isRunning = true;
  const playBtn = document.getElementById('focus-play-btn');
  if (playBtn) {
    playBtn.innerHTML = `<i data-lucide="pause" class="w-6 h-6"></i> Pause`;
    if (window.lucide) window.lucide.createIcons();
  }

  // Ensure Audio Context is active if sound selected
  if (window.FocusModeState.ambientSound !== 'OFF') {
    startAmbientSound(window.FocusModeState.ambientSound);
  }

  window.FocusModeState.timerInterval = setInterval(() => {
    if (window.FocusModeState.timeLeft > 0) {
      window.FocusModeState.timeLeft--;
      updateTimerDisplay();
    } else {
      completePomodoroInterval();
    }
  }, 1000);
}

function pausePomodoroTimer() {
  window.FocusModeState.isRunning = false;
  clearInterval(window.FocusModeState.timerInterval);
  const playBtn = document.getElementById('focus-play-btn');
  if (playBtn) {
    playBtn.innerHTML = `<i data-lucide="play" class="w-6 h-6"></i> Start Focus`;
    if (window.lucide) window.lucide.createIcons();
  }
}

function resetPomodoroTimer() {
  pausePomodoroTimer();
  const config = POMODORO_MODES[window.FocusModeState.mode];
  window.FocusModeState.timeLeft = config.duration;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(window.FocusModeState.timeLeft / 60);
  const s = window.FocusModeState.timeLeft % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const timerEl = document.getElementById('focus-timer-text');
  if (timerEl) timerEl.innerText = str;

  // Update circular progress ring
  const circle = document.getElementById('focus-progress-ring');
  if (circle) {
    const total = window.FocusModeState.totalDuration;
    const progress = (total - window.FocusModeState.timeLeft) / total;
    const circumference = 2 * Math.PI * 110;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference * (1 - progress);
  }
}

// Complete interval & record session
async function completePomodoroInterval() {
  pausePomodoroTimer();
  playNotificationChime();

  const minutes = Math.round(window.FocusModeState.totalDuration / 60);
  try {
    await fetch('/api/iams/focus/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        mode: window.FocusModeState.mode,
        duration_minutes: minutes,
        ambient_sound: window.FocusModeState.ambientSound,
        completed: true
      })
    });
    await loadFocusAnalytics();
    alert(`🎉 Great job! You completed a ${minutes}-minute ${POMODORO_MODES[window.FocusModeState.mode].label} session.`);
  } catch (e) {
    console.error('Failed to log session:', e);
  }

  resetPomodoroTimer();
}

// ==========================================
// WEB AUDIO API REAL-TIME AMBIENT SYNTHESIZER
// ==========================================

function getAudioContext() {
  if (!window.FocusModeState.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    window.FocusModeState.audioCtx = new AudioCtx();
  }
  if (window.FocusModeState.audioCtx.state === 'suspended') {
    window.FocusModeState.audioCtx.resume();
  }
  return window.FocusModeState.audioCtx;
}

function stopAmbientSound() {
  window.FocusModeState.ambientNodes.forEach(node => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch (e) {}
  });
  window.FocusModeState.ambientNodes = [];
}

function setAmbientSound(soundType) {
  window.FocusModeState.ambientSound = soundType;
  stopAmbientSound();

  // Update sound buttons UI
  ['OFF', 'RAIN', 'ALPHA', 'CAFE', 'WHITE_NOISE'].forEach(t => {
    const btn = document.getElementById(`sound-btn-${t.toLowerCase()}`);
    if (btn) {
      if (t === soundType) {
        btn.className = 'px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm flex items-center gap-2';
      } else {
        btn.className = 'px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900/60 flex items-center gap-2';
      }
    }
  });

  if (soundType !== 'OFF') {
    startAmbientSound(soundType);
  }
}

function startAmbientSound(soundType) {
  stopAmbientSound();
  const ctx = getAudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(window.FocusModeState.volume, ctx.currentTime);
  masterGain.connect(ctx.destination);
  window.FocusModeState.ambientNodes.push(masterGain);

  if (soundType === 'RAIN') {
    // Pink noise buffer filtered as rainfall
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    whiteNoise.start();
    window.FocusModeState.ambientNodes.push(whiteNoise, filter);

  } else if (soundType === 'ALPHA') {
    // 10Hz Binaural Beat (200Hz Left, 210Hz Right)
    const merger = ctx.createChannelMerger(2);
    
    const oscL = ctx.createOscillator();
    oscL.frequency.setValueAtTime(200, ctx.currentTime);
    oscL.type = 'sine';

    const oscR = ctx.createOscillator();
    oscR.frequency.setValueAtTime(210, ctx.currentTime);
    oscR.type = 'sine';

    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(masterGain);

    oscL.start();
    oscR.start();
    window.FocusModeState.ambientNodes.push(oscL, oscR, merger);

  } else if (soundType === 'CAFE' || soundType === 'WHITE_NOISE') {
    // Warm low-frequency ambient drone
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.type = 'triangle';

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);

    osc.connect(filter);
    filter.connect(masterGain);
    osc.start();
    window.FocusModeState.ambientNodes.push(osc, filter);
  }
}

// Play interval finish chime
function playNotificationChime() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
}

// Adjust ambient volume
function setAmbientVolume(vol) {
  window.FocusModeState.volume = parseFloat(vol);
  const master = window.FocusModeState.ambientNodes[0];
  if (master && master.gain && window.FocusModeState.audioCtx) {
    master.gain.setValueAtTime(window.FocusModeState.volume, window.FocusModeState.audioCtx.currentTime);
  }
}

// Load Focus Analytics
async function loadFocusAnalytics() {
  try {
    const res = await fetch('/api/iams/focus/stats', {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    const result = await res.json();
    if (result.success) {
      const todayEl = document.getElementById('focus-today-mins');
      const countEl = document.getElementById('focus-today-count');
      const weekEl = document.getElementById('focus-week-mins');
      if (todayEl) todayEl.innerText = `${result.data.today.total_minutes}m`;
      if (countEl) countEl.innerText = `${result.data.today.pomodoro_count} pomodoros`;
      if (weekEl) weekEl.innerText = `${result.data.week.total_minutes}m this week`;
    }
  } catch (e) {
    console.error('Failed to load focus stats:', e);
  }
}

window.initFocusMode = initFocusMode;
window.setPomodoroMode = setPomodoroMode;
window.togglePomodoroTimer = togglePomodoroTimer;
window.resetPomodoroTimer = resetPomodoroTimer;
window.setAmbientSound = setAmbientSound;
window.setAmbientVolume = setAmbientVolume;
