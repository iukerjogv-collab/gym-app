// =============================================================================
// Service Worker — Training Zone Gym Management
// Handles push notifications for shift reminders.
// =============================================================================

// Listen for push events from the server
self.addEventListener("push", (event) => {
  const defaultData = {
    title: "⚠️ Recordatorio de Salida",
    body: "Han pasado 8.5 horas de tu entrada. No olvides marcar tu salida para que tu pago se calcule correctamente.",
    icon: "/logo-gym.png",
    badge: "/logo-gym.png",
    tag: "shift-reminder",
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: "/dashboard",
    },
  };

  let data = defaultData;

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...defaultData, ...payload };
    }
  } catch (e) {
    // Use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      vibrate: data.vibrate,
      data: data.data,
    })
  );
});

// When user taps the notification, open/focus the dashboard
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If there's already a window open, focus it
      for (const client of windowClients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Activate immediately (skip waiting)
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
