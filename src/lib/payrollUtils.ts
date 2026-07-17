// =============================================================================
// Payroll Utils — Motor de Cálculo de Pre-Nómina Quincenal
// Calcula asistencias meta, faltas, extras, y pago final por empleado.
//
// Reglas:
//   • Personal de planta: meta = todos los días naturales del periodo (L-D)
//   • Sabatino: meta = solo sábados y domingos del periodo
//   • Justificaciones admin cuentan como día asistido
//   • Días extras = asistencias reales que superan la meta
//   • Retardos = $10 MXN por cada check-in tardío (determineStatus)
// =============================================================================

import { determineStatus } from "./scheduleUtils";

const MEXICO_TZ = "America/Mexico_City";

// =============================================================================
// Types
// =============================================================================

export interface PayrollPeriod {
  label: string;
  start: Date;
  end: Date;
}

export interface PayrollResult {
  diasNaturales: number;
  finesDeSemana: number;       // Sábados + Domingos count
  asistenciasMeta: number;
  asistenciasReales: number;
  diasJustificados: number;
  faltasReales: number;
  diasExtras: number;
  retardos: number;
  valorDia: number;
  descuentoFaltas: number;
  bonoExtras: number;
  descuentoRetardos: number;
  pagoFinal: number;
  isSabatino: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const MONTO_POR_RETARDO = 10;

const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// =============================================================================
// Period Calculation (Quincena Natural)
// =============================================================================

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getCurrentPayrollPeriod(now: Date): PayrollPeriod {
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (day <= 15) {
    return {
      label: `1ra Quincena — 1 al 15 ${MONTHS_SHORT[month]} ${year}`,
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: new Date(year, month, 15, 23, 59, 59, 999),
    };
  } else {
    const lastDay = lastDayOfMonth(year, month);
    return {
      label: `2da Quincena — 16 al ${lastDay} ${MONTHS_SHORT[month]} ${year}`,
      start: new Date(year, month, 16, 0, 0, 0, 0),
      end: new Date(year, month, lastDay, 23, 59, 59, 999),
    };
  }
}

// =============================================================================
// Calendar Helpers
// =============================================================================

/**
 * Genera un array con todas las fechas (Date a medianoche local) del periodo.
 */
export function getPeriodDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (current <= last) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Cuenta cuántos sábados y domingos hay en el periodo.
 */
export function countWeekendDays(start: Date, end: Date): number {
  const days = getPeriodDays(start, end);
  return days.filter((d) => {
    const dow = d.getDay(); // 0=Sun, 6=Sat
    return dow === 0 || dow === 6;
  }).length;
}

/**
 * Para sabatinos: cuenta solo sábados y domingos del periodo.
 */
export function countWeekendOnlyDays(start: Date, end: Date): number {
  return countWeekendDays(start, end);
}

/**
 * Normaliza una fecha a string YYYY-MM-DD para comparaciones fáciles.
 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Convierte un Date UTC a la fecha local de México y retorna el key YYYY-MM-DD.
 */
export function toMexicoDateKey(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts; // format is YYYY-MM-DD in en-CA locale
}

// =============================================================================
// Main Payroll Calculation
// =============================================================================

interface CalculatePayrollParams {
  sueldoBase: number;
  roleSlug: string;
  attendances: Date[];        // check-in timestamps
  justifiedDates: Date[];     // justified day dates (Date only, midnight)
  periodStart: Date;
  periodEnd: Date;
}

export function calculatePayroll(params: CalculatePayrollParams): PayrollResult {
  const { sueldoBase, roleSlug, attendances, justifiedDates, periodStart, periodEnd } = params;

  const isSabatino = roleSlug.toLowerCase() === "sabatino";
  const allDays = getPeriodDays(periodStart, periodEnd);
  const diasNaturales = allDays.length;
  const finesDeSemana = countWeekendDays(periodStart, periodEnd);

  // ── Asistencias Meta ──
  let asistenciasMeta: number;
  if (isSabatino) {
    // Sabatino: solo trabaja fines de semana
    asistenciasMeta = finesDeSemana;
  } else {
    // Planta: todos los días del periodo cuentan
    asistenciasMeta = diasNaturales;
  }

  // ── Asistencias Reales (check-ins únicos por día en zona MX) ──
  const attendanceDateKeys = new Set<string>();
  attendances.forEach((a) => {
    attendanceDateKeys.add(toMexicoDateKey(a));
  });
  const asistenciasReales = attendanceDateKeys.size;

  // ── Días Justificados (dentro del periodo) ──
  const justifiedKeys = new Set<string>();
  justifiedDates.forEach((jd) => {
    const key = toDateKey(jd);
    // Only count if within period
    const periodKeys = allDays.map(toDateKey);
    if (periodKeys.includes(key)) {
      justifiedKeys.add(key);
    }
  });
  // Don't double-count: remove justified days that already have attendance
  justifiedKeys.forEach((k) => {
    if (attendanceDateKeys.has(k)) {
      justifiedKeys.delete(k);
    }
  });
  const diasJustificados = justifiedKeys.size;

  // ── Faltas y Extras ──
  const cumplimiento = asistenciasReales + diasJustificados;
  const faltasReales = Math.max(0, asistenciasMeta - cumplimiento);
  const diasExtras = Math.max(0, cumplimiento - asistenciasMeta);

  // ── Retardos ──
  const retardos = attendances.filter((a) => {
    const status = determineStatus(a, roleSlug);
    return status.isLate;
  }).length;

  // ── Cálculo Financiero ──
  const valorDia = asistenciasMeta > 0 ? sueldoBase / asistenciasMeta : 0;
  const descuentoFaltas = faltasReales * valorDia;
  const bonoExtras = diasExtras * valorDia;
  const descuentoRetardos = retardos * MONTO_POR_RETARDO;
  const pagoFinal = Math.max(0, sueldoBase - descuentoFaltas + bonoExtras - descuentoRetardos);

  return {
    diasNaturales,
    finesDeSemana,
    asistenciasMeta,
    asistenciasReales,
    diasJustificados,
    faltasReales,
    diasExtras,
    retardos,
    valorDia,
    descuentoFaltas,
    bonoExtras,
    descuentoRetardos,
    pagoFinal,
    isSabatino,
  };
}
