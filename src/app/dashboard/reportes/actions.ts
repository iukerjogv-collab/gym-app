"use server";

import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { determineStatus } from "@/lib/scheduleUtils";

// ============================================================================
// Tipado de Resultados — Validación Automática por Horario
// ============================================================================
export interface AttendanceReportItem {
  id: number;
  userId: number;
  userName: string;
  branchName: string;
  /** Fecha del registro de asistencia */
  fecha: string;
  checkIn: Date;
  checkOut: Date | null;
  /** Hora límite que le correspondía (06:00, 14:00 o 08:00) */
  deadlineTime: string;
  isLate: boolean;
  delayMinutes: number;
}

export interface AttendanceReportResponse {
  success: boolean;
  data?: AttendanceReportItem[];
  error?: string;
}

// ============================================================================
// Server Action: Generador de Reportes por Rango de Fechas
// Lógica automática: sin ciclos, sin configuración manual.
// ============================================================================
export async function getAttendanceReport(
  startDateISO: string,
  endDateISO: string,
  branchId?: number
): Promise<AttendanceReportResponse> {
  const authorized = await isAdmin();

  if (!authorized) {
    return { success: false, error: "No autorizado." };
  }

  try {
    // ── Fallback: si no llegan fechas, usar el día actual en zona horaria de México ──
    const getTodayMX = (): string => {
      const now = new Date();
      const mxDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
      const y = mxDate.getFullYear();
      const m = String(mxDate.getMonth() + 1).padStart(2, "0");
      const d = String(mxDate.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const effectiveStart = startDateISO?.trim() ? startDateISO.trim() : getTodayMX();
    const effectiveEnd = endDateISO?.trim() ? endDateISO.trim() : getTodayMX();

    // Extraer solo YYYY-MM-DD si viene un ISO completo (e.g. "2026-04-19T06:00:00.000Z")
    const startDateStr = effectiveStart.substring(0, 10);
    const endDateStr = effectiveEnd.substring(0, 10);

    // Construir fechas con hora explícita para evitar desfase UTC
    const start = new Date(`${startDateStr}T00:00:00`);
    const end = new Date(`${endDateStr}T23:59:59.999`);

    // Validar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: "Rango de fechas inválido." };
    }

    // Condición de búsqueda por Rango
    const whereCondition: Record<string, unknown> = {
      checkIn: {
        gte: start,
        lte: end,
      },
    };

    if (branchId) {
      whereCondition.user = { branchId: branchId };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereCondition,
      include: {
        user: {
          include: {
            branch: true,
            role: { select: { slug: true } },
          },
        },
      },
      orderBy: { checkIn: "desc" },
    });

    const report: AttendanceReportItem[] = attendances.map((record) => {
      // ── Determinar estatus con la lógica automática (role-aware) ──
      const status = determineStatus(record.checkIn, record.user.role.slug);


      // ── Formatear fecha legible (forzar zona horaria de México) ──
      const fecha = record.checkIn.toLocaleDateString("es-MX", {
        timeZone: "America/Mexico_City",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return {
        id: record.id,
        userId: record.user.id,
        userName: `${record.user.firstName} ${record.user.lastName}`,
        branchName: record.user.branch?.name || "Sede Global",
        fecha,
        checkIn: record.checkIn,
        checkOut: record.checkOut || null,
        deadlineTime: status.deadlineTime,
        isLate: status.isLate,
        delayMinutes: status.delayMinutes,
      };
    });

    return { success: true, data: report };

  } catch (error) {
    console.error("Error al generar reporte:", error);
    return { success: false, error: "Error al obtener datos de la base de datos." };
  }
}

export async function getBranchesReportFilter() {
  const authorized = await isAdmin();
  if (!authorized) return [];
  try {
    return await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    });
  } catch (error) {
    return [];
  }
}
