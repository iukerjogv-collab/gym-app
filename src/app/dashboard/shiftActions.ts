"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

/**
 * Verifica si el usuario actual tiene un turno activo que excede 8.5 horas.
 * Usado por el banner visual y el polling del cliente.
 */
export async function getActiveShiftStatus(): Promise<{
  isOvertime: boolean;
  checkInTime: string | null;
  elapsedMinutes: number;
} | null> {
  const session = await getServerSession();
  if (!session) return null;

  const userId = parseInt(session.sub, 10);

  const activeAttendance = await prisma.attendance.findFirst({
    where: {
      userId,
      checkOut: null,
    },
    orderBy: { checkIn: "desc" },
    select: { checkIn: true },
  });

  if (!activeAttendance) return null;

  const now = new Date();
  const elapsedMs = now.getTime() - activeAttendance.checkIn.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  // 8.5 horas = 510 minutos
  const OVERTIME_THRESHOLD_MINUTES = 510;

  return {
    isOvertime: elapsedMinutes >= OVERTIME_THRESHOLD_MINUTES,
    checkInTime: activeAttendance.checkIn.toISOString(),
    elapsedMinutes,
  };
}
