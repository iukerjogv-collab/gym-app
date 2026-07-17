import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { determineStatus } from "@/lib/scheduleUtils";
import {
  UserCircle2,
  MapPin,
  CalendarDays,
  BadgeCheck,
  Fingerprint,
  Mail,
  Phone,
  Palmtree
} from "lucide-react";
import RetardosPanel from "./RetardosPanel";
import type { QuincenaPeriod, RetardoRecord } from "./RetardosPanel";
import VacationProfileContainer from "./VacationProfileContainer";
import type { VacationRequestRecord } from "./VacationProfileContainer";

// =============================================================================
// Helper: Cálculos de tiempo sin problemas de hidratación (se corre en backend)
// =============================================================================

function calculateAntiguedad(startDate: Date): string {
  const currentDate = new Date();
  let years = currentDate.getFullYear() - startDate.getFullYear();
  let months = currentDate.getMonth() - startDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0 && months === 0) return "Menos de 1 mes";
  if (years === 0) return `${months} mes${months !== 1 ? 'es' : ''}`;
  if (months === 0) return `${years} año${years !== 1 ? 's' : ''}`;

  return `${years} año${years !== 1 ? 's' : ''} y ${months} mes${months !== 1 ? 'es' : ''}`;
}

// Prestación Contrato Interno (Estricto por Aniversario Cumplido)
function calculateVacacionesLFT(startDate: Date): number {
  const currentDate = new Date();
  let yearsCumplidos = currentDate.getFullYear() - startDate.getFullYear();
  const m = currentDate.getMonth() - startDate.getMonth();
  
  // Condición estricta: solo se cumple si el mes actual es mayor,
  // o si es el mismo mes pero el día actual es igual o mayor.
  if (m < 0 || (m === 0 && currentDate.getDate() < startDate.getDate())) {
    yearsCumplidos--;
  }

  if (yearsCumplidos < 1) return 0;

  // Fórmula: 6 + (años_cumplidos - 1) * 2
  return 6 + (yearsCumplidos - 1) * 2;
}

// =============================================================================
// Helper: Cálculo de Periodos de Corte (Quincenas Naturales)
// Primera Quincena: del 1 al 15 del mes (pago el 15)
// Segunda Quincena: del 16 al último día del mes (pago el 30)
// =============================================================================

const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

interface PeriodRange {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

/** Devuelve el último día del mes (28, 29, 30 o 31). */
function lastDayOfMonth(year: number, month: number): number {
  // new Date(year, month + 1, 0) da el último día del mes indicado
  return new Date(year, month + 1, 0).getDate();
}

function getCurrentAndPreviousPeriods(now: Date): PeriodRange[] {
  const day = now.getDate();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();

  let current: PeriodRange;
  let previous: PeriodRange;

  if (day <= 15) {
    // ── Estamos en Primera Quincena (1–15) ──
    current = {
      key: `${year}-${String(month + 1).padStart(2, "0")}-1Q`,
      label: `1ra Quincena — 1 al 15 ${MONTHS_SHORT[month]} ${year} (Pago día 15)`,
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: new Date(year, month, 15, 23, 59, 59, 999),
    };

    // La anterior es Segunda Quincena del mes pasado (16 – último día)
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const lastDay = lastDayOfMonth(prevYear, prevMonth);
    previous = {
      key: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-2Q`,
      label: `2da Quincena — 16 al ${lastDay} ${MONTHS_SHORT[prevMonth]} ${prevYear} (Pago día 30)`,
      start: new Date(prevYear, prevMonth, 16, 0, 0, 0, 0),
      end: new Date(prevYear, prevMonth, lastDay, 23, 59, 59, 999),
    };
  } else {
    // ── Estamos en Segunda Quincena (16–último día) ──
    const lastDay = lastDayOfMonth(year, month);
    current = {
      key: `${year}-${String(month + 1).padStart(2, "0")}-2Q`,
      label: `2da Quincena — 16 al ${lastDay} ${MONTHS_SHORT[month]} ${year} (Pago día 30)`,
      start: new Date(year, month, 16, 0, 0, 0, 0),
      end: new Date(year, month, lastDay, 23, 59, 59, 999),
    };

    // La anterior es Primera Quincena de este mismo mes (1–15)
    previous = {
      key: `${year}-${String(month + 1).padStart(2, "0")}-1Q`,
      label: `1ra Quincena — 1 al 15 ${MONTHS_SHORT[month]} ${year} (Pago día 15)`,
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: new Date(year, month, 15, 23, 59, 59, 999),
    };
  }

  return [current, previous];
}

export default async function PerfilPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch from Prisma using the JWT sub (userId)
  const userId = parseInt(session.sub, 10);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      branch: true,
      vacationBalance: true,
      vacationRequests: {
        orderBy: { createdAt: "desc" },
      },
    }
  });

  if (!user) {
    redirect("/login");
  }

  const antiguedadStr = calculateAntiguedad(user.fechaIngreso);
  
  // Calcular días totales por ley clásica
  const totalDays = calculateVacacionesLFT(user.fechaIngreso);
  
  // Calcular rango de aniversario actual para aplicar candado de no acumulación (Reset Anual)
  const now = new Date();
  let anniversaryThisYear = new Date(now.getFullYear(), user.fechaIngreso.getMonth(), user.fechaIngreso.getDate());
  let anniversaryStart: Date;
  let anniversaryEnd: Date;
  if (now >= anniversaryThisYear) {
    anniversaryStart = anniversaryThisYear;
    anniversaryEnd = new Date(now.getFullYear() + 1, user.fechaIngreso.getMonth(), user.fechaIngreso.getDate());
  } else {
    anniversaryStart = new Date(now.getFullYear() - 1, user.fechaIngreso.getMonth(), user.fechaIngreso.getDate());
    anniversaryEnd = anniversaryThisYear;
  }
  
  // Calcular días tomados (solicitudes únicamente en estado APPROVED dentro del año de antigüedad actual)
  const approvedRequests = user.vacationRequests.filter((r) => {
    return (
      r.status === "APPROVED" &&
      r.startDate >= anniversaryStart &&
      r.startDate < anniversaryEnd
    );
  });
  const usedDays = approvedRequests.reduce((sum, r) => sum + r.requestedDays, 0);
  
  // Calcular días disponibles
  const remainingDays = totalDays - usedDays;

  // Serializar historial para el client component
  const vacationHistory: VacationRequestRecord[] = user.vacationRequests.map((r) => ({
    id: r.id,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    requestedDays: r.requestedDays,
    restDays: r.restDays,
    coveringEmployee: r.coveringEmployee,
    reason: r.reason,
    status: r.status as "PENDING" | "APPROVED" | "REJECTED",
    createdAt: r.createdAt.toISOString(),
  }));

  // Fecha segura pre-renderizada en servidor
  const joinedDate = user.fechaIngreso.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // ── Control de Retardos: Calcular periodos y consultar BD ──
  const [currentPeriod, previousPeriod] = getCurrentAndPreviousPeriods(now);

  // Consulta eficiente: un solo query que cubre ambos periodos
  const earliestDate = previousPeriod.start < currentPeriod.start
    ? previousPeriod.start
    : currentPeriod.start;
  const latestDate = previousPeriod.end > currentPeriod.end
    ? previousPeriod.end
    : currentPeriod.end;

  // Traer TODAS las asistencias del rango (sin filtrar por isLate de la BD)
  // y recalcular el estatus con determineStatus() — la misma función que usa
  // el Monitoreo General del admin — para garantizar sincronización exacta.
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId: userId,
      checkIn: {
        gte: earliestDate,
        lte: latestDate,
      },
    },
    orderBy: { checkIn: "desc" },
    select: {
      id: true,
      checkIn: true,
    },
  });

  // Recalcular isLate con la lógica canónica de scheduleUtils (role-aware)
  const userRoleSlug = user.role.slug;
  function recordToPeriod(rec: { id: number; checkIn: Date }): RetardoRecord {
    const status = determineStatus(rec.checkIn, userRoleSlug);
    return { id: rec.id, checkIn: rec.checkIn.toISOString(), isLate: status.isLate };
  }

  // Solo incluir registros cuyo estatus recalculado sea RETARDO
  const currentRecords = attendanceRecords
    .filter((r) => r.checkIn >= currentPeriod.start && r.checkIn <= currentPeriod.end)
    .map(recordToPeriod)
    .filter((r) => r.isLate);

  const previousRecords = attendanceRecords
    .filter((r) => r.checkIn >= previousPeriod.start && r.checkIn <= previousPeriod.end)
    .map(recordToPeriod)
    .filter((r) => r.isLate);

  const quincenaPeriods: QuincenaPeriod[] = [
    { key: currentPeriod.key, label: currentPeriod.label, records: currentRecords },
    { key: previousPeriod.key, label: previousPeriod.label, records: previousRecords },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Mi Perfil Corporativo</h1>
        <p className="text-slate-500 mt-2">
          Expediente personal
        </p>
      </div>

      {/* Grid General Responsivo: En móvil se apila (1 col), en tablet 2 cols, en desktop avanzado 3 o combina */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* =========================================================
            CARD: Resumen del Empleado (Premium Dark)
        ========================================================= */}
        <div className="md:col-span-2 lg:col-span-3 rounded-2xl p-6 bg-gradient-to-br from-[#1a1a1e] to-[#121215] shadow-xl text-white relative overflow-hidden border border-[#252529]">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-[0.03]">
            <UserCircle2 size={300} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-[#252529] border border-[#333338] flex items-center justify-center text-4xl font-bold text-slate-200 shadow-inner shrink-0">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-slate-100">{user.firstName} {user.lastName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase">
                  <BadgeCheck size={14} />
                  {user.role.name}
                </span>
                {user.branch && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wide uppercase">
                    <MapPin size={14} />
                    {user.branch.name}
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 text-sm">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Mail size={16} className="text-slate-500" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Phone size={16} className="text-slate-500" />
                    {user.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            CARD: Identidad Oficial
        ========================================================= */}
        <div className="rounded-2xl border border-[#252529] bg-[#1a1a1e] shadow-xl flex flex-col overflow-hidden">
          <div className="bg-[#121215] px-6 py-4 flex items-center justify-between border-b border-[#252529]">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Fingerprint size={18} className="text-blue-400" /> Identidad Oficial
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-5">
            <div className="bg-[#121215] p-3 rounded-lg border border-[#252529]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CURP</p>
              <p className="font-mono text-slate-200 font-semibold">{user.curp || 'No registrado'}</p>
            </div>
          </div>
        </div>

        {/* =========================================================
            CARD: Antigüedad
        ========================================================= */}
        <div className="rounded-2xl border border-[#252529] bg-[#1a1a1e] shadow-xl flex flex-col overflow-hidden">
          <div className="bg-[#121215] px-6 py-4 flex items-center justify-between border-b border-[#252529]">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <CalendarDays size={18} className="text-amber-400" /> Antigüedad
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Antigüedad en la empresa</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black tracking-tight text-red-500">{antiguedadStr}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-[#252529]">
              <p className="text-sm font-medium text-slate-500 mb-1">Fecha de Ingreso</p>
              <p className="text-lg font-semibold text-slate-200 capitalize">{joinedDate}</p>
            </div>

            <div className="pt-6 border-t border-[#252529]">
              <p className="text-sm font-medium text-slate-500 mb-2">Estatus</p>
              {user.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-bold shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  Vigente / En Nómina
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-sm font-bold shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Baja Laboral
                </span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            SECCIÓN INTERACTIVA: Vacaciones (Spans 3 Cols)
        ========================================================= */}
        <VacationProfileContainer
          diasTotales={totalDays}
          diasTomados={usedDays}
          diasDisponibles={remainingDays}
          history={vacationHistory}
        />

      </div>

      {/* =========================================================
          MÓDULO: Control de Retardos (Full width below grid)
      ========================================================= */}
      <div className="mt-6">
        <RetardosPanel
          periods={quincenaPeriods}
          defaultPeriodKey={currentPeriod.key}
        />
      </div>
    </div>
  );
}
