import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AttendanceAction from "./AttendanceAction";
import { Users, Building2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asistencia | GymAdmin",
};

export default async function DashboardPage() {
  const session = await getServerSession();

  // Precargar las métricas de Coordenadas de Sucursal y Registro Activo
  const userId = session?.sub ? parseInt(session.sub, 10) : 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { branch: true }
  });

  const activeAttendance = await prisma.attendance.findFirst({
    where: {
      userId: userId,
      checkOut: null
    }
  });

  // ── CANDADO ESTRICTO: VERIFICAR SI JORNADA YA CONCLUYÓ HOY ──
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const journeyCompletedRecord = await prisma.attendance.findFirst({
    where: {
      userId: userId,
      checkIn: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
      checkOut: { not: null },
    },
  });

  const branchLat = user?.branch?.latitud ?? null;
  const branchLng = user?.branch?.longitud ?? null;
  const isCheckedIn = !!activeAttendance;
  const checkInTime = activeAttendance?.checkIn?.toISOString() ?? null;
  const isJourneyCompleted = !!journeyCompletedRecord;

  // Determinar si es rol operativo (NO ve KPIs gerenciales)
  const roleLower = session?.role?.toLowerCase() ?? "";
  const isOperativeRole = ["coach", "entrenador", "recepcion", "recepcionista", "mantenimiento", "limpieza", "sabatino"].includes(roleLower);
  const firstName = user?.firstName ?? "Usuario";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Registro de Jornada</h1>
        <p className="text-slate-400 mt-2">
          Bienvenido, <span className="text-slate-200 font-semibold">{firstName}</span>
        </p>
      </div>

      {isOperativeRole ? (
        /* ── LAYOUT OPERATIVO: Reloj Checador centrado, sin KPIs ── */
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <AttendanceAction
              branchLat={branchLat}
              branchLng={branchLng}
              hasActiveCheckIn={isCheckedIn}
              checkInTime={checkInTime}
              isJourneyCompleted={isJourneyCompleted}
            />
          </div>
        </div>
      ) : (
        /* ── LAYOUT ADMINISTRATIVO: Reloj Checador + KPIs gerenciales ── */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* MÓDULO DE GEOFENCING: Injectado (Toma 1 columna) */}
          <div className="lg:col-span-1">
            <AttendanceAction
              branchLat={branchLat}
              branchLng={branchLng}
              hasActiveCheckIn={isCheckedIn}
              checkInTime={checkInTime}
              isJourneyCompleted={isJourneyCompleted}
            />
          </div>

          {/* MÉTRICAS GERENCIALES (Admin / Super Admin) */}
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[#252529] bg-[#1a1a1e] text-slate-100 shadow-xl p-6 flex items-start gap-4 h-fit">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-400 tracking-tight">Usuarios Activos</h3>
                <div className="text-2xl font-black text-slate-100">--</div>
              </div>
            </div>
            <div className="rounded-xl border border-[#252529] bg-[#1a1a1e] text-slate-100 shadow-xl p-6 flex items-start gap-4 h-fit">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-400 tracking-tight">Sucursales</h3>
                <div className="text-2xl font-black text-slate-100">--</div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
