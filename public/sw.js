// sw.js — DeepFocus Service Worker
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

let timerTimeout = null;

self.addEventListener('message', (event) => {
    const {type, payload} = event.data;

    if (type === 'START_TIMER') {
        if (timerTimeout) clearTimeout(timerTimeout);
        const {remainingMs, mode} = payload;

        timerTimeout = setTimeout(async () => {
            timerTimeout = null;
            const clients = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });
            const anyVisible = clients.some(
                (c) => c.visibilityState === 'visible',
            );

            if (!anyVisible) {
                const title =
                    mode === 'focus'
                        ? '✅ Focus session complete!'
                        : '⏰ Break is over!';
                const body =
                    mode === 'focus'
                        ? 'Time for a 10 min break.'
                        : 'Ready to focus again?';
                await self.registration.showNotification(title, {
                    body,
                    tag: 'deepfocus-timer',
                    renotify: true,
                    requireInteraction: false,
                });
            }

            // Tell the tab the timer ended (so it can update UI + play sound)
            clients.forEach((c) => c.postMessage({type: 'TIMER_ENDED', mode}));
        }, remainingMs);
    }

    if (type === 'CANCEL_TIMER') {
        if (timerTimeout) {
            clearTimeout(timerTimeout);
            timerTimeout = null;
        }
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({type: 'window'}).then((clients) => {
            if (clients.length) return clients[0].focus();
            return self.clients.openWindow('/');
        }),
    );
});
