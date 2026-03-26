// ── DATE ──
(function setDate() {
    const d      = new Date();
    const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('topDate').textContent =
        `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
})();

// ── TOAST ──
function showToast(msg, duration = 3500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── THEME ──
function toggleTheme() {
    const isGreen = document.body.classList.toggle('theme-green');
    document.getElementById('themeLabel').textContent = isGreen ? 'green' : 'e-ink';
    api('PATCH', `/session/${deviceId}`, { theme: isGreen ? 'green' : 'eink' });
    renderClock();
}

// ── HARD RESET ──
async function hardReset() {
    if (!confirm('Reset everything — timer, pomodoros and tasks?')) return;
    clearInterval(timerInt);
    running   = false;
    timerEndAt = 0;
    stopAlarm();
    pomCount  = 0;
    todos     = [];
    nnItems   = nnItems.map((i) => ({ ...i, done: false }));
    nnStreak  = 0;
    mode      = 'focus';
    totalSec  = cfg.focus * MULT;
    remaining = totalSec;
    updateAdjLabel();
    setClockState('idle');
    renderClock();
    renderDots();
    renderTodos();
    renderNN();
    await api('PATCH', `/session/${deviceId}`, { pomCount: 0 });
    showToast('Everything reset.');
}

// ── SERVICE WORKER ──
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.warn);

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'TIMER_ENDED') onEnd();
    });
}

// ── INIT ──
async function initApp() {
    document.getElementById('themeLabel').textContent = 'e-ink';
    renderClock();
    renderDots();
    renderTodos();
    renderNN();
    updateAdjLabel();
    setClockState('idle');

    // Session (pomCount + theme)
    const session = await api('GET', `/session/${deviceId}`);
    if (session) {
        pomCount = session.pomCount || 0;
        if (session.theme === 'green') {
            document.body.classList.add('theme-green');
            document.getElementById('themeLabel').textContent = 'green';
        }
        renderDots();
        renderClock();
    }

    // Todos
    const fetchedTodos = await api('GET', `/todos/${deviceId}`);
    if (fetchedTodos) { todos = fetchedTodos; renderTodos(); }

    // Non-negotiables
    const nnData = await api('GET', `/nn/${deviceId}`);
    if (nnData) {
        nnItems  = nnData.items;
        nnStreak = nnItems.reduce((max, i) => Math.max(max, i.streak || 0), 0);
        renderNN();
    }
}

initApp();
