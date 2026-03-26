// ── DEVICE ID ──
function getDeviceId() {
    let id = localStorage.getItem('df_deviceId');
    if (!id) {
        id = 'df_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('df_deviceId', id);
    }
    return id;
}

const deviceId = getDeviceId();
const API_BASE = '/api';

async function api(method, path, body) {
    try {
        const res = await fetch(API_BASE + path, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(`${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('API error:', err.message);
        return null;
    }
}
