// ── AUDIO CONTEXT ──
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Resume on any interaction (browser autoplay policy)
document.addEventListener('click',   () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });
document.addEventListener('keydown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });

// ── DING — soft triple bell, end of focus session ──
function playDing() {
    const go = () => {
        const now = audioCtx.currentTime;
        [0, 0.15, 0.3].forEach((t, i) => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now + t);
            osc.frequency.exponentialRampToValueAtTime(660, now + t + 0.4);
            gain.gain.setValueAtTime(0, now + t);
            gain.gain.linearRampToValueAtTime(0.28 - i * 0.06, now + t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.9);
            osc.start(now + t);
            osc.stop(now + t + 0.9);
        });
    };
    audioCtx.state === 'suspended' ? audioCtx.resume().then(go) : go();
}

// ── ALARM — rising siren, end of break, plays for 3s ──
let alarmInterval = null;

function playAlarm() {
    stopAlarm();
    let elapsed   = 0;
    const cycleLen = 1.95; // 3 chirps × 0.55s + 0.3s gap

    function burst() {
        if (elapsed >= 3) { stopAlarm(); return; }
        const go = () => {
            const now = audioCtx.currentTime;
            for (let i = 0; i < 3; i++) {
                const osc  = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sawtooth';
                const t = now + i * 0.55;
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.linearRampToValueAtTime(900, t + 0.45);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.setValueAtTime(0.3, t + 0.38);
                gain.gain.linearRampToValueAtTime(0, t + 0.5);
                osc.start(t);
                osc.stop(t + 0.5);
            }
        };
        audioCtx.state === 'suspended' ? audioCtx.resume().then(go) : go();
        elapsed += cycleLen;
    }

    burst();
    alarmInterval = setInterval(burst, cycleLen * 1000);
    setTimeout(stopAlarm, 3000);
}

function stopAlarm() {
    if (alarmInterval) { clearInterval(alarmInterval); alarmInterval = null; }
}
