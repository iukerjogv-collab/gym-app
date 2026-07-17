import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// =============================================================================
// POST /api/push/subscribe
// Registra una suscripción Push para el usuario autenticado.
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // ── Autenticación ──
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = parseInt(payload.sub, 10);

    // ── Parsear body ──
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Faltan datos de suscripción push" },
        { status: 400 }
      );
    }

    // ── Upsert: crear o actualizar suscripción ──
    // Usamos un approach de delete + create ya que no podemos hacer unique
    // en campos TEXT. Buscamos por userId + primeros 255 chars del endpoint.
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        userId,
        endpoint: endpoint,
      },
    });

    if (existing) {
      // Actualizar keys si cambiaron
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en push/subscribe:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
