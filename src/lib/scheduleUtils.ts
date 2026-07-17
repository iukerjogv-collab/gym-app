// =============================================================================
// Schedule Utils — Validación Automática por Horario del Gimnasio
// Simplicidad radical: sin ciclos, sin configuración manual.
// Las reglas se basan en el día de la semana y la hora de checada.
//
// ⚠️  TIMEZONE FIX: Todas las comparaciones de hora se hacen en la zona
//     horaria de México (America/Mexico_City). Esto es crítico porque
//     Vercel ejecuta en UTC y sin esta conversión los turnos se asignan mal.
// =============================================================================

const MEXICO_TZ = "America/Mexico_City";

// =============================================================================
// Types
// =============================================================================

export interface AttendanceStatus {
  /** true si el empleado checó después de su hora límite */
  isLate: boolean;
  /** Minutos de retardo (0 si fue puntual) */
  delayMinutes: number;
  /** Hora límite que le correspondía, e.g. "06:00", "14:00", "08:00" */
  deadlineTime: string;
}

// =============================================================================
// Helper: Extraer componentes de fecha/hora en zona horaria de México
// =============================================================================

interface MexicoTimeComponents {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number; // 0 = Domingo, 6 = Sábado
}

/**
 * Convierte un Date (UTC o cualquier zona) a sus componentes en hora de México.
 * Usa Intl.DateTimeFormat que es nativo en Node.js >= 12 y todos los browsers modernos.
 */
function toMexicoTime(date: Date): MexicoTimeComponents {
  // Obtener el día de la semana en México
  const dayOfWeekStr = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TZ,
    weekday: "short",
  }).format(date);

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  // Obtener componentes numéricos usando formatToParts
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === 24 ? 0 : get("hour"), // midnight edge case
    minute: get("minute"),
    second: get("second"),
    dayOfWeek: dayMap[dayOfWeekStr] ?? 0,
  };
}

// =============================================================================
// Core Logic: Determinar Hora Límite de Entrada
// =============================================================================

/**
 * Calcula la hora límite de entrada basándose en el día, la hora de checada
 * y opcionalmente el rol del empleado, **en zona horaria de México
 * (America/Mexico_City)**.
 *
 * Reglas:
 *   - Sábado y Domingo (todos los roles):
 *       • Límite: 08:00 AM
 *   - Lunes a Viernes:
 *       • Rol "limpieza" → Límite: 09:00 AM
 *       • Rol "coach" (3 turnos):
 *           – Checa antes de las 10:00 AM → Límite: 06:00 AM (matutino)
 *           – Checa entre 10:00 AM y 2:59 PM → Límite: 02:00 PM (vespertino)
 *           – Checa a las 3:00 PM o después → Límite: 04:00 PM (medio turno)
 *       • Resto de roles:
 *           – Checa antes de las 10:00 AM (hora MX) → Límite: 06:00 AM
 *           – Checa a las 10:00 AM o después (hora MX) → Límite: 02:00 PM
 *
 * @param checkInDate La fecha/hora real de checada (UTC o cualquier zona).
 * @param roleSlug    Slug del rol del empleado (opcional). Si es "limpieza",
 *                    aplica ventana de 09:00 AM en días laborales. Si es
 *                    "coach", aplica ventana de 04:00 PM (16:00).
 * @returns La hora límite como string "HH:mm".
 */
export function getEntryDeadline(checkInDate: Date, roleSlug?: string): string {
  const mx = toMexicoTime(new Date(checkInDate));

  // Sábado (6) o Domingo (0) → 08:00 para TODOS los roles
  if (mx.dayOfWeek === 0 || mx.dayOfWeek === 6) {
    return "08:00";
  }

  // ── Lunes a Viernes ──

  // Limpieza: entrada oficial a las 09:00 AM
  if (roleSlug?.toLowerCase() === "limpieza") {
    return "09:00";
  }

  // Coach: 3 turnos diferenciados por hora de checada
  //   • Matutino  (checa antes de 10:00 AM)  → Límite: 06:00 AM
  //   • Vespertino (checa 10:00 AM – 2:59 PM) → Límite: 02:00 PM
  //   • Medio turno (checa 3:00 PM o después)  → Límite: 04:00 PM
  if (roleSlug?.toLowerCase() === "coach") {
    const checkInTotalMinutes = mx.hour * 60 + mx.minute;
    if (checkInTotalMinutes < 600) {        // antes de 10:00 AM
      return "06:00";
    } else if (checkInTotalMinutes < 900) { // 10:00 AM – 2:59 PM
      return "14:00";
    } else {                                // 3:00 PM en adelante
      return "16:00";
    }
  }

  // Resto de roles: depende de la hora de checada en MX
  const checkInTotalMinutes = mx.hour * 60 + mx.minute;

  // 10:00 AM = 600 minutos desde medianoche
  if (checkInTotalMinutes < 600) {
    return "06:00"; // Turno matutino
  } else {
    return "14:00"; // Turno vespertino
  }
}

// =============================================================================
// Main Function: Determinar Estatus de Asistencia
// =============================================================================

/**
 * Determina si un empleado llegó a tiempo o con retardo.
 * Toda la lógica opera en hora de México (America/Mexico_City).
 *
 * - A TIEMPO: Checa exactamente a la hora límite o antes.
 * - RETARDO: Checa 1 minuto o más después de la hora límite.
 *
 * @param checkInDate La fecha/hora real de checada (UTC o cualquier zona).
 * @param roleSlug    Slug del rol del empleado (opcional). Necesario para
 *                    aplicar umbrales diferenciados por rol (e.g. "limpieza",
 *                    "coach").
 * @returns Objeto con isLate, delayMinutes y deadlineTime.
 */
export function determineStatus(checkInDate: Date, roleSlug?: string): AttendanceStatus {
  const date = new Date(checkInDate);
  const mx = toMexicoTime(date);
  const deadlineTime = getEntryDeadline(date, roleSlug);

  // Parsear la hora límite
  const [deadlineHour, deadlineMin] = deadlineTime.split(":").map(Number);

  // Calcular diferencia en minutos usando componentes de hora MX
  const checkInTotalMin = mx.hour * 60 + mx.minute;
  const deadlineTotalMin = deadlineHour * 60 + deadlineMin;
  const diffMinutes = checkInTotalMin - deadlineTotalMin;

  // RETARDO = 1 minuto o más después de la hora límite
  const isLate = diffMinutes >= 1;

  return {
    isLate,
    delayMinutes: isLate ? diffMinutes : 0,
    deadlineTime,
  };
}
