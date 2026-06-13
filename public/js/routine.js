// ── BCS ROUTINE ──
let routineBatch = 'preli';
let routineEntries = [];
let routineToday = '';

function localDateStr() {
    // Returns YYYY-MM-DD in the user's LOCAL timezone (not UTC)
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

async function loadRoutine() {
    const today = localDateStr();
    const data = await api(
        'GET',
        `/routine/${routineBatch}/window?date=${today}`,
    );
    if (!data) return;
    routineEntries = data.entries;
    routineToday = data.today;
    renderRoutine();
}

function switchBatch(batch) {
    routineBatch = batch;
    document
        .getElementById('rtnBtnPreli')
        .classList.toggle('active', batch === 'preli');
    document
        .getElementById('rtnBtnWritten')
        .classList.toggle('active', batch === 'written');
    loadRoutine();
}

function routineDayLabel(dateStr) {
    const today = routineToday;
    const d = new Date(dateStr + 'T00:00:00Z');
    const t = new Date(today + 'T00:00:00Z');
    const diff = Math.round((d - t) / 86400000);
    if (diff === -1) return 'Yesterday';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === 2) return 'In 2 days';
    return dateStr;
}

function routineTypeIcon(entry) {
    switch (entry.entryType) {
        case 'exam':
            return '📝';
        case 'self-study':
            return '📖';
        case 'holiday':
            return '🎉';
        case 'special':
            return '📌';
        default:
            return '🎓';
    }
}

function routineColorClass(entry) {
    if (entry.colorTag === 'teal' || entry.colorTag === 'green')
        return 'rtn-accent';
    if (entry.colorTag === 'yellow') return 'rtn-yellow';
    if (entry.entryType === 'holiday') return 'rtn-holiday';
    return '';
}

function renderRoutine() {
    const el = document.getElementById('routineList');
    if (!routineEntries.length) {
        el.innerHTML = `<div class="rtn-empty">No schedule found for this window.</div>`;
        return;
    }

    // Group entries by date
    const grouped = {};
    routineEntries.forEach((e) => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
    });

    el.innerHTML = Object.keys(grouped)
        .sort()
        .map((date) => {
            const isToday = date === routineToday;
            const dayLabel = routineDayLabel(date);
            const entries = grouped[date];

            const entriesHtml = entries
                .map((e) => {
                    const colorCls = routineColorClass(e);
                    const icon = routineTypeIcon(e);

                    if (e.specialLabel) {
                        return `
                <div class="rtn-entry rtn-special ${colorCls}">
                    <span class="rtn-icon">${icon}</span>
                    <span class="rtn-special-label">${e.specialLabel}</span>
                </div>`;
                    }

                    return `
            <div class="rtn-entry ${colorCls}">
                <span class="rtn-icon">${icon}</span>
                <div class="rtn-body">
                    <div class="rtn-subject">${e.subject || ''}</div>
                    ${e.topic ? `<div class="rtn-topic">${e.topic}</div>` : ''}
                    ${e.classTime ? `<div class="rtn-time">⏰ Class: ${e.classTime}</div>` : ''}
                    ${e.examTopic ? `<div class="rtn-exam-topic">📝 ${e.examTopic}</div>` : ''}
                </div>
            </div>`;
                })
                .join('');

            return `
        <div class="rtn-day ${isToday ? 'rtn-today' : ''}">
            <div class="rtn-day-label">
                <span class="rtn-day-name">${dayLabel}</span>
                <span class="rtn-day-date">${formatRtnDate(date)}</span>
            </div>
            <div class="rtn-entries">${entriesHtml}</div>
        </div>`;
        })
        .join('');
}

function formatRtnDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00Z');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
