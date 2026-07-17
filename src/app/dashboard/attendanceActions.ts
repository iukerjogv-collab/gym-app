"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { determineStatus } from "@/lib/scheduleUtils";

export async function checkAttendanceStatus() {
  const session = await getServerSession();
  if (!session) return { hasActiveCheckIn: false, error: "No autorizado" };

  const userId = parseInt(session.sub, 10);

  try {
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        checkOut: null,
      },
      orderBy: { checkIn: "desc" }
    });
    return { hasActiveCheckIn: !!activeAttendance, error: null };
  } catch (error) {
    return { hasActiveCheckIn: false, error: "Error de base de datos" };
  }
}

export async function registerAttendance(latitude: number, longitude: number, distanceMts: number) {
  const session = await getServerSession();
  if (!session) return { success: false, error: "No autorizado" };

  const userId = parseInt(session.sub, 10);

  try {
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        checkOut: null,
      },
    });

    if (activeAttendance) {
      // ── BLOQUEO DE SALIDA INMEDIATA (< 1 hora) ───────────────────────────
      // Protege contra clics repetidos y salidas accidentales en los primeros
      // 60 minutos de un turno, evitando dobles registros por error.
      const checkInTime = new Date(activeAttendance.checkIn).getTime();
      const nowTime = Date.now();
      const elapsedMinutes = (nowTime - checkInTime) / (1000 * 60);

      if (elapsedMinutes < 60) {
        return {
          success: false,
          error: "No puedes terminar tu turno porque apenas comenzaste. Por favor, inténtalo más tarde.",
        };
      }
      // ───────────────────────────────────────────────────────────────────────

      // Registrar Salida
      await prisma.attendance.update({
        where: { id: activeAttendance.id },
        data: { checkOut: new Date() }
      });
      revalidatePath("/dashboard");
      return { success: true, newState: false, action: "checkout" };
    } else {
      const checkInDate = new Date();

      // ── PREVENCIÓN DE DUPLICADOS ────────────────────────────────────────────
      // Verificar si ya existe una entrada SIN salida para HOY (cualquier hora).
      // Esto protege contra registros duplicados incluso si el cliente no está
      // sincronizado (p.ej. después de un cierre de sesión intermedio).
      const startOfToday = new Date(checkInDate);
      startOfToday.setHours(0, 0, 0, 0);

      const duplicateToday = await prisma.attendance.findFirst({
        where: {
          userId: userId,
          checkOut: null,
          checkIn: { gte: startOfToday },
        },
      });

      if (duplicateToday) {
        return {
          success: false,
          error: "Ya tienes una entrada activa registrada hoy. Si crees que es un error, contacta al administrador.",
        };
      }
      // ───────────────────────────────────────────────────────────────────────

      // Consultar User con rol para determinar umbral correcto
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: { select: { slug: true } } },
      });

      // ── Determinar estatus con lógica canónica (role-aware) ──
      const status = determineStatus(checkInDate, user?.role?.slug);

      // Registrar Entrada
      await prisma.attendance.create({
        data: {
          userId: userId,
          checkIn: checkInDate,
          latitude,
          longitude,
          distanceMts,
          isLate: status.isLate,
        }
      });
      revalidatePath("/dashboard");
      return { success: true, newState: true, action: "checkin" };
    }
  } catch (error) {
    console.error("Attendance Error:", error);
    return { success: false, error: "Error crítico al guardar asistencia en BD." };
  }
}
