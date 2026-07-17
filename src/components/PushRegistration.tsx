"use client";

import { useEffect } from "react";

// =============================================================================
// PushRegistration — Invisible client component
// Registers the Service Worker and requests push notification permission.
// Runs once per session (uses sessionStorage flag to avoid re-prompting).
// =============================================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushRegistration() {
  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;

    // Don't re-register in the same session
    if (sessionStorage.getItem("push-registered")) return;

    async function registerPush() {
      try {
        // Check browser support
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.log("Push notifications not supported in this browser.");
          return;
        }

        // Register Service Worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Wait for the SW to be ready
        await navigator.serviceWorker.ready;

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission denied.");
          return;
        }

        // Get VAPID public key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID public key not configured.");
          return;
        }

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
        });

        // Send subscription to our API
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("p256dh")!)
                )
              ),
              auth: btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("auth")!)
                )
              ),
            },
          }),
        });

        if (res.ok) {
          sessionStorage.setItem("push-registered", "1");
          console.log("Push notification subscription registered.");
        }
      } catch (error) {
        console.error("Error registering push subscription:", error);
      }
    }

    // Small delay to not block initial render
    const timeout = setTimeout(registerPush, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // This component renders nothing — it's purely side-effect
  return null;
}
