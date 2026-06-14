// ── BCS ROUTINE ──
let routineEntriesPreli   = [];
let routineEntriesWritten = [];
let routineToday = '';

const BATCH_CONFIG = {
    preli: {
        zoom:  'https://zoom.us/j/98635016175?pwd=N8q1S65XhtqcbWXDJli8av2oSIOezo.1',
        sheet: 'https://docs.google.com/spreadsheets/d/1tDF83zu5FHdYsDC_-lZVUv7gyQ1IdyfU9GbV9sIhIfo/edit?gid=0#gid=0',
    },
    written: {
        zoom:  'https://zoom.us/j/98975994161?pwd=v4SZxQIqO85YGYer9LeOr4ZwcT7drI.1',
        sheet: 'https://docs.google.com/spreadsheets/d/19JwlJBgfR3TFoWcUKJy8pjb0KRBcXmWg5i7411JEWTE/edit?gid=1153290852#gid=1153290852',
    },
};

function localDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isCurrentlyClassTime(classTime) {
    if (!classTime) return false;
    const now = new Date();
    const [time, period] = classTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const start = new Date(); start.setHours(hours, minutes, 0, 0);
    const end   = new Date(start); end.setHours(start.getHours() + 3);
    return now >= start && now <= end;
}

async function loadRoutine() {
    const today = localDateStr();
    const d      = new Date(today + 'T00:00:00Z');
    const next2  = new Date(d); next2.setUTCDate(next2.getUTCDate() + 2);
    const toDate = next2.toISOString().slice(0, 10);

    const [preliData, writtenData] = await Promise.all([
        api('GET', `/routine/preli/range?from=${today}&to=${toDate}`),
        api('GET', `/routine/written/range?from=${today}&to=${toDate}`),
    ]);

    routineToday          = today;
    routineEntriesPreli   = preliData   || [];
    routineEntriesWritten = writtenData || [];
    renderRoutine();
}

function routineDayLabel(dateStr) {
    const d    = new Date(dateStr + 'T00:00:00Z');
    const t    = new Date(routineToday + 'T00:00:00Z');
    const diff = Math.round((d - t) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === 2) return 'In 2 days';
    return dateStr;
}

function routineTypeIcon(e) {
    switch (e.entryType) {
        case 'exam':       return '📝';
        case 'self-study': return '📖';
        case 'holiday':    return '🎉';
        case 'special':    return '📌';
        default:           return '🎓';
    }
}

function routineColorClass(e) {
    if (e.colorTag === 'teal' || e.colorTag === 'green') return 'rtn-accent';
    if (e.colorTag === 'yellow') return 'rtn-yellow';
    if (e.entryType === 'holiday') return 'rtn-holiday';
    return '';
}

function formatRtnDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00Z');
    const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function buildColumnHtml(entries, batch) {
    const cfg = BATCH_CONFIG[batch];

    if (!entries.length) {
        return `
        <div class="rtn-sheet-link">
            <a href="${cfg.sheet}" target="_blank" class="rtn-link rtn-link-sheet">📋 Full Routine</a>
        </div>
        <div class="rtn-empty">No schedule for this window.</div>`;
    }

    const sheetHtml = `
    <div class="rtn-sheet-link">
        <a href="${cfg.sheet}" target="_blank" class="rtn-link rtn-link-sheet">📋 Full Routine</a>
    </div>`;

    // Group by date
    const grouped = {};
    entries.forEach((e) => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
    });

    const daysHtml = Object.keys(grouped).sort().map((date) => {
        const isToday  = date === routineToday;
        const dayLabel = routineDayLabel(date);

        // Join link only for today
        const joinLinksHtml = isToday ? `
        <div class="rtn-join-links">
            ${cfg.zoom ? `<a href="${cfg.zoom}" target="_blank" class="rtn-link rtn-link-zoom">🔵 Join Live (Zoom)</a>` : ''}
        </div>` : '';

        const entriesHtml = grouped[date].map((e) => {
            const colorCls = routineColorClass(e);
            const icon     = routineTypeIcon(e);
            const live     = isToday && isCurrentlyClassTime(e.classTime);

            if (e.specialLabel) {
                return `
                <div class="rtn-entry rtn-special ${colorCls} ${live ? 'rtn-live' : ''}">
                    <span class="rtn-icon">${icon}</span>
                    <span class="rtn-special-label">${e.specialLabel}</span>
                    ${live ? '<span class="rtn-live-badge">LIVE</span>' : ''}
                </div>`;
            }

            return `
            <div class="rtn-entry ${colorCls} ${live ? 'rtn-live' : ''}">
                <span class="rtn-icon">${icon}</span>
                <div class="rtn-body">
                    <div class="rtn-subject-row">
                        <span class="rtn-subject">${e.subject || ''}</span>
                        ${live ? '<span class="rtn-live-badge">LIVE</span>' : ''}
                    </div>
                    ${e.topic     ? `<div class="rtn-topic">${e.topic}</div>`             : ''}
                    ${e.classTime ? `<div class="rtn-time">⏰ ${e.classTime}</div>`        : ''}
                    ${e.examTopic ? `<div class="rtn-exam-topic">📝 ${e.examTopic}</div>` : ''}
                </div>
            </div>`;
        }).join('');

        return `
        <div class="rtn-day ${isToday ? 'rtn-today' : ''}">
            <div class="rtn-day-label">
                <span class="rtn-day-name">${dayLabel}</span>
                <span class="rtn-day-date">${formatRtnDate(date)}</span>
            </div>
            ${joinLinksHtml}
            <div class="rtn-entries">${entriesHtml}</div>
        </div>`;
    }).join('');

    return sheetHtml + daysHtml;
}

function renderRoutine() {
    document.getElementById('routinePreli').innerHTML   = buildColumnHtml(routineEntriesPreli,   'preli');
    document.getElementById('routineWritten').innerHTML = buildColumnHtml(routineEntriesWritten, 'written');
}

// Re-check live status every minute
setInterval(() => { if (routineToday) renderRoutine(); }, 60000);
