// ── TODOS ──
let todos = [];

async function addTodo() {
    const inp = document.getElementById('todoInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    const created = await api('POST', `/todos/${deviceId}`, { text: txt });
    if (created) todos.unshift(created);
    renderTodos();
}

async function toggleTodo(id) {
    const t = todos.find((t) => t._id === id);
    if (!t) return;
    t.done = !t.done;
    renderTodos();
    await api('PATCH', `/todos/${id}`, { done: t.done });
}

async function deleteTodo(id) {
    todos = todos.filter((t) => t._id !== id);
    renderTodos();
    await api('DELETE', `/todos/${id}`);
}

async function clearDone() {
    todos = todos.filter((t) => !t.done);
    renderTodos();
    await api('DELETE', `/todos/${deviceId}/done`);
}

function renderTodos() {
    const el = document.getElementById('todoList');
    if (!todos.length) {
        el.innerHTML = `<div style="font-size:13px;color:var(--muted);text-align:center;padding:28px 0;">No tasks yet — add one above.</div>`;
    } else {
        el.innerHTML = todos.map((t) => `
            <div class="todo-item ${t.done ? 'done' : ''}">
                <div class="check" onclick="toggleTodo('${t._id}')">${t.done ? '✓' : ''}</div>
                <div class="todo-text">${t.text}</div>
                <button class="del-btn" onclick="deleteTodo('${t._id}')">✕</button>
            </div>`).join('');
    }

    const done  = todos.filter((t) => t.done).length;
    const total = todos.length;
    document.getElementById('todoCount').textContent = total ? `${done}/${total} done` : '—';
    document.getElementById('progFill').style.width  = total ? (done / total) * 100 + '%' : '0%';
    document.getElementById('progTxt').textContent   = `${total} task${total !== 1 ? 's' : ''}`;
}
