import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ShieldCheck, TrendingUp } from "lucide-react";
import {
  getCurrentPayrollPeriod,
  calculatePayroll,
  toMexicoDateKey,
  toDateKey,
  getPeriodDays,
} from "@/lib/payrollUtils";
import NominaClient from "./NominaClient";
import type { BranchPayrollData, EmployeePayrollFull } from "./NominaClient";

// =============================================================================
// Asistencia y Pre-Nómina — Server Component
// Premium Dark design system: bg-[#1a1a1e], border-[#252529]
// =============================================================================

// ── Custom Sort Order ──
const BRANCH_SORT_ORDER: string[] = [
  "Heroes",
  "Periferico",
  "Misiones",
  "Forjadores",
  "Cuautlancingo",
  "Xilotzingo",
];

function branchSortIndex(name: string): number {
  const normalized = name.trim().toLowerCase();
  const idx = BRANCH_SORT_ORDER.findIndex(
    (b) => b.toLowerCase() === normalized
  );
  return idx === -1 ? BRANCH_SORT_ORDER.length : idx;
}

// Helper to format date as DD/MM/YYYY
function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default async function PayrollPage() {
  // ── Auth & RBAC guard ──
  const session = await getServerSession();
  if (!session) redirect("/login");

  const allowedRoles = ["admin", "super-admin"];
  if (!allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }

  // ── Current quincena period ──
  const now = new Date();
  const period = getCurrentPayrollPeriod(now);
  const periodDays = getPeriodDays(period.start, period.end);
  const periodDayKeys = periodDays.map(toDateKey);

  // ── Data fetch: branches + users + attendance + justifications ──
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: { isActive: true },
        include: {
          role: true,
          attendances: {
            where: {
              checkIn: {
                gte: period.start,
                lte: period.end,
              },
            },
            select: {
              checkIn: true,
            },
          },
          justificationsReceived: {
            where: {
              date: {
                gte: period.start,
                lte: period.end,
              },
            },
            select: {
              date: true,
            },
          },
        },
      },
    },
  });

  // ── Build payroll data using the payroll engine ──
  const branchData: BranchPayrollData[] = branches
    .map((b) => {
      const employees: EmployeePayrollFull[] = b.users.map((u) => {
        const attendanceDates = u.attendances.map((a) => a.checkIn);
        const justifiedDates = u.justificationsReceived.map((j) => j.date);

        const payroll = calculatePayroll({
          sueldoBase: u.sueldoBase,
          roleSlug: u.role.slug,
          attendances: attendanceDates,
          justifiedDates,
          periodStart: period.start,
          periodEnd: period.end,
        });

        // Build per-day attendance keys for the calendar
        const attendanceDateKeySet = new Set<string>();
        attendanceDates.forEach((a) => attendanceDateKeySet.add(toMexicoDateKey(a)));

        const justifiedDateKeySet = new Set<string>();
        justifiedDates.forEach((jd) => justifiedDateKeySet.add(toDateKey(jd)));

        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role.name,
          roleSlug: u.role.slug,
          sueldoBase: u.sueldoBase,
          payroll,
          attendanceDates: Array.from(attendanceDateKeySet),
          justifiedDates: Array.from(justifiedDateKeySet),
          periodDays: periodDayKeys,
          curp: u.curp,
          fechaIngreso: formatDate(u.fechaIngreso),
        };
      });

      const totalBruta = employees.reduce((s, e) => s + e.sueldoBase, 0);
      const totalNeta = employees.reduce((s, e) => s + e.payroll.pagoFinal, 0);
      const totalDescuentos = employees.reduce(
        (s, e) => s + e.payroll.descuentoFaltas + e.payroll.descuentoRetardos,
        0
      );
      const totalBonos = employees.reduce((s, e) => s + e.payroll.bonoExtras, 0);

      return {
        id: b.id,
        name: b.name,
        city: b.city,
        employeeCount: employees.length,
        totalBruta,
        totalNeta,
        totalDescuentos,
        totalBonos,
        employees,
      };
    })
    .sort((a, b) => branchSortIndex(a.name) - branchSortIndex(b.name));

  const globalEmployees = branchData.reduce((s, b) => s + b.employeeCount, 0);
  const globalBruta = branchData.reduce((s, b) => s + b.totalBruta, 0);
  const globalNeta = branchData.reduce((s, b) => s + b.totalNeta, 0);
  const globalDescuentos = branchData.reduce((s, b) => s + b.totalDescuentos, 0);
  const globalBonos = branchData.reduce((s, b) => s + b.totalBonos, 0);

  const fmt = (n: number) =>
    n.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-full">
      {/* ── Header ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Asistencia y Pre-Nómina
        </h1>
        <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
          <ShieldCheck size={14} className="text-blue-400" />
          Acceso exclusivo para administradores
        </p>
      </div>

      {/* ── Global Summary Bar ── */}
      <div className="mb-5 rounded-xl p-4 bg-gradient-to-br from-[#1a1a1e] to-[#121215] shadow-xl border border-[#252529] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-[0.03]">
          <TrendingUp size={200} />
        </div>

        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex flex-col items-center sm:items-start">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Sucursales
            </p>
            <span className="text-2xl font-black text-slate-100 tracking-tight">
              {branchData.length}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Colaboradores
            </p>
            <span className="text-2xl font-black text-slate-100 tracking-tight">
              {globalEmployees}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Nómina Bruta
            </p>
            <span className="text-2xl font-black text-slate-200 tracking-tight">
              {fmt(globalBruta)}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Descuentos
            </p>
            <span className="text-2xl font-black text-red-400 tracking-tight">
              -{fmt(globalDescuentos)}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Bonos Extra
            </p>
            <span className="text-2xl font-black text-blue-400 tracking-tight">
              +{fmt(globalBonos)}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Nómina Neta
            </p>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              {fmt(globalNeta)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Interactive Table (Client Component) ── */}
      <NominaClient
        branches={branchData}
        periodLabel={period.label}
        periodStart={period.start.toISOString()}
        periodEnd={period.end.toISOString()}
      />
    </div>
  );
}
