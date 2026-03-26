// ── CONFIG ──
const cfg      = { focus: 50, break: 10, cycle: 8 };
const TEST_MODE = false;
const MULT      = TEST_MODE ? 1 : 60;
const CIRC      = 276.46;

let mode      = 'focus';
let remaining = cfg.focus * MULT;
let totalSec  = cfg.focus * MULT;
let running   = false;
let timerInt  = null;
let timerEndAt = 0;
let pomCount  = 0;

// ── CLOCK STATE ──
function setClockState(state) {
    const ring = document.getElementById('clockRing');
    ring.classList.remove('state-idle', 'state-running');
    ring.classList.add('state-' + state);
}

function pulseClock() {
    const ring = document.getElementById('clockRing');
    ring.classList.remove('pulse');
    void ring.offsetWidth; // reflow to restart animation
    ring.classList.add('pulse');
    ring.addEventListener('animationend', () => ring.classList.remove('pulse'), { once: true });
}

// ── RENDER ──
function renderClock() {
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    document.getElementById('clockTime').textContent = `${m}:${s}`;

    const isGreen  = document.body.classList.contains('theme-green');
    const isBreak  = mode === 'break';

    document.getElementById('breakBadge').classList.toggle('visible', isBreak);
    document.getElementById('timerCard').classList.toggle('break-mode', isBreak);

    const runColor       = isGreen ? '#b8f55a' : '#f0f0f0';
    const idleFocusColor = isGreen ? '#6e7860' : '#555555';
    const idleBreakColor = isGreen ? '#4a5040' : '#3d3d3d';
    document.getElementById('clockTime').style.color = running
        ? runColor
        : isBreak ? idleBreakColor : idleFocusColor;

    const offset    = CIRC * (1 - remaining / totalSec);
    const ring      = document.getElementById('ringFill');
    ring.style.strokeDashoffset = offset;
    const runStroke  = isGreen ? '#b8f55a' : '#f0f0f0';
    const idleStroke = isBreak ? '#333333' : (isGreen ? '#3a4430' : '#444444');
    ring.style.stroke = running ? runStroke : idleStroke;

    document.title = `${m}:${s} — DeepFocus`;
}

function renderDots() {
    document.getElementById('pomDots').innerHTML = Array.from(
        { length: cfg.cycle },
        (_, i) => `<div class="pom-dot ${i < pomCount % cfg.cycle ? 'lit' : ''}"></div>`,
    ).join('');
}

function updateAdjLabel() {
    const unit = TEST_MODE ? 'sec' : 'min';
    document.getElementById('adjLabel').textContent = `${cfg[mode]} ${unit}`;
}

// ── CONTROLS ──
function adjustTime(delta) {
    if (running) return;
    const key = mode;
    const min = TEST_MODE ? 10 : key === 'focus' ? 10 : 5;
    const max = TEST_MODE ? 300 : key === 'focus' ? 120 : 60;
    cfg[key]  = Math.max(min, Math.min(max, cfg[key] + delta));
    totalSec  = cfg[key] * MULT;
    remaining = totalSec;
    updateAdjLabel();
    renderClock();
}

function toggleTimer() {
    stopAlarm();
    pulseClock();
    if (running) {
        clearInterval(timerInt);
        running = false;
        setClockState('idle');
    } else {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        running    = true;
        timerEndAt = Date.now() + remaining * 1000;
        setClockState('running');
        timerInt = setInterval(timerTick, 500);
    }
}

function timerTick() {
    if (!running) return;
    remaining = Math.round((timerEndAt - Date.now()) / 1000);
    if (remaining <= 0) {
        remaining = 0;
        clearInterval(timerInt);
        running = false;
        setClockState('idle');
        renderClock();
        onEnd();
        return;
    }
    renderClock();
}

// Catch up after tab is backgrounded
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && running) timerTick();
});

function resetTimer() {
    clearInterval(timerInt);
    running    = false;
    timerEndAt = 0;
    remaining  = cfg[mode] * MULT;
    totalSec   = remaining;
    pulseClock();
    setClockState('idle');
    renderClock();
}

// ── TAP / DOUBLE-TAP ──
let tapTimer = null;
document.getElementById('clockRing').addEventListener('click', () => {
    if (tapTimer) {
        clearTimeout(tapTimer);
        tapTimer = null;
        resetTimer();
    } else {
        tapTimer = setTimeout(() => { tapTimer = null; toggleTimer(); }, 220);
    }
});

// ── SESSION END ──
function onEnd() {
    if (mode === 'focus') {
        playDing();
        pomCount++;
        renderDots();
        api('PATCH', `/session/${deviceId}`, { pomCount });
        showToast('Session complete — tap to start your break.');
        setTimeout(() => {
            mode      = 'break';
            totalSec  = cfg.break * MULT;
            remaining = totalSec;
            updateAdjLabel();
            setClockState('idle');
            renderClock();
        }, 900);
    } else {
        playAlarm();
        showToast('Break over — tap to start your next session.');
        setTimeout(() => {
            mode      = 'focus';
            totalSec  = cfg.focus * MULT;
            remaining = totalSec;
            updateAdjLabel();
            setClockState('idle');
            renderClock();
        }, 1800);
    }
}
