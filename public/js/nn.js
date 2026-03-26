// ── NON-NEGOTIABLES ──
let nnItems  = [];
let nnStreak = 0;

async function addNN() {
    const inp = document.getElementById('nnInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    const created = await api('POST', `/nn/${deviceId}`, { text: txt });
    if (created) nnItems.push(created);
    renderNN();
}

async function toggleNN(id) {
    const item = nnItems.find((i) => i._id === id);
    if (!item) return;
    item.done = !item.done; // optimistic
    renderNN();
    const result = await api('PATCH', `/nn/${id}/toggle`);
    if (result) {
        Object.assign(item, result.item);
        if (result.allDone) {
            nnStreak++;
            showToast('All non-negotiables done — streak: ' + nnStreak + ' 🔥');
        }
        renderNN();
    }
}

async function deleteNN(id) {
    nnItems = nnItems.filter((i) => i._id !== id);
    renderNN();
    await api('DELETE', `/nn/${id}`);
}

function renderNN() {
    const el = document.getElementById('nnList');
    if (!nnItems.length) {
        el.innerHTML = `<div style="font-size:13px;color:var(--muted);text-align:center;padding:24px 0;">Add your daily must-dos above.</div>`;
    } else {
        el.innerHTML = nnItems.map((i) => `
            <div class="nn-item ${i.done ? 'done' : ''}">
                <div class="nn-check" onclick="toggleNN('${i._id}')">${i.done ? '✓' : ''}</div>
                <div class="nn-text">${i.text}</div>
                <button class="nn-del" onclick="deleteNN('${i._id}')">✕</button>
            </div>`).join('');
    }

    const done  = nnItems.filter((i) => i.done).length;
    const total = nnItems.length;
    document.getElementById('nnProgFill').style.width = total ? (done / total) * 100 + '%' : '0%';
    document.getElementById('nnProgTxt').textContent  = total ? `${done}/${total} done` : '0 items';

    const streakEl = document.getElementById('nnStreak');
    streakEl.innerHTML = nnStreak > 0
        ? `<span class="nn-streak-num">${nnStreak}</span> day streak 🔥`
        : '';
}
