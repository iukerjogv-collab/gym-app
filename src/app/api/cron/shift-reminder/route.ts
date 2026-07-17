import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import webpush from "web-push";

// =============================================================================
// GET /api/cron/shift-reminder
// Vercel Cron Job — Cada 15 min detecta turnos > 8.5h y envía push notification.
// Solo notifica UNA VEZ por turno (anti-spam via lastNotifiedAt).
// =============================================================================

const OVERTIME_THRESHOLD_MS = 8.5 * 60 * 60 * 1000; // 8.5 horas en milisegundos

// Configurar VAPID
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@trainingzone.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function GET(request: NextRequest) {
  // ── Seguridad: Validar CRON_SECRET ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoffTime = new Date(Date.now() - OVERTIME_THRESHOLD_MS);

    // Buscar turnos abiertos que excedan 8.5 horas Y no hayan sido notificados
    const overtimeAttendances = await prisma.attendance.findMany({
      where: {
        checkOut: null,
        lastNotifiedAt: null,
        checkIn: {
          lte: cutoffTime, // checkIn fue hace más de 8.5 horas
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            pushSubscriptions: true,
          },
        },
      },
    });

    let notifiedCount = 0;
    let failedCount = 0;

    for (const attendance of overtimeAttendances) {
      const subscriptions = attendance.user.pushSubscriptions;

      if (subscriptions.length === 0) {
        // No tiene suscripciones push, marcar como notificado para no reintentar
        await prisma.attendance.update({
          where: { id: attendance.id },
          data: { lastNotifiedAt: new Date() },
        });
        continue;
      }

      // Calcular horas transcurridas para el mensaje
      const elapsedMs = Date.now() - attendance.checkIn.getTime();
      const elapsedHours = Math.floor(elapsedMs / 3600000);
      const elapsedMins = Math.floor((elapsedMs % 3600000) / 60000);

      const pushPayload = JSON.stringify({
        title: "⚠️ Recordatorio de Salida",
        body: `¡Atención ${attendance.user.firstName}! Llevas ${elapsedHours}h ${elapsedMins}min en turno. No olvides marcar tu salida para que tu pago se calcule correctamente.`,
        icon: "/logo-gym.png",
        badge: "/logo-gym.png",
        tag: `shift-reminder-${attendance.id}`,
        requireInteraction: true,
        data: { url: "/dashboard" },
      });

      // Enviar a todas las suscripciones del usuario
      let anySuccess = false;
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload
          );
          anySuccess = true;
        } catch (err: unknown) {
          const pushError = err as { statusCode?: number };
          // Si la suscripción expiró (410 Gone), eliminarla
          if (pushError.statusCode === 410 || pushError.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          console.error(`Push failed for sub ${sub.id}:`, pushError);
        }
      }

      if (anySuccess) notifiedCount++;
      else failedCount++;

      // Marcar como notificado (independientemente del resultado push)
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { lastNotifiedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      checked: overtimeAttendances.length,
      notified: notifiedCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron shift-reminder error:", error);
    return NextResponse.json(
      { error: "Error interno del cron job" },
      { status: 500 }
    );
  }
}
