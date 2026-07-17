"use server";

import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// =============================================================================
// Pre-Nómina Server Actions — Justify / Remove day justifications
// =============================================================================

/**
 * Justify a rest day for an employee. Only admins can do this.
 * Creates an AttendanceJustification record.
 */
export async function justifyDay(
  userId: number,
  dateISO: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "No autenticado" };

    const allowedRoles = ["admin", "super-admin"];
    if (!allowedRoles.includes(session.role)) {
      return { success: false, error: "No autorizado" };
    }

    const adminId = parseInt(session.sub, 10);
    const date = new Date(dateISO);

    // Upsert to avoid duplicate errors
    await prisma.attendanceJustification.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        reason: reason || "Descanso justificado por administrador",
        adminId,
      },
      create: {
        userId,
        date,
        reason: reason || "Descanso justificado por administrador",
        adminId,
      },
    });

    revalidatePath("/dashboard/nomina");
    return { success: true };
  } catch (error: unknown) {
    console.error("justifyDay error:", error);
    return { success: false, error: "Error al justificar el día" };
  }
}

/**
 * Remove a justification for an employee day.
 */
export async function removeJustification(
  userId: number,
  dateISO: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "No autenticado" };

    const allowedRoles = ["admin", "super-admin"];
    if (!allowedRoles.includes(session.role)) {
      return { success: false, error: "No autorizado" };
    }

    const date = new Date(dateISO);

    await prisma.attendanceJustification.deleteMany({
      where: {
        userId,
        date,
      },
    });

    revalidatePath("/dashboard/nomina");
    return { success: true };
  } catch (error: unknown) {
    console.error("removeJustification error:", error);
    return { success: false, error: "Error al eliminar justificación" };
  }
}
