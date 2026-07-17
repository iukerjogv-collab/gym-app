"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Building2,
  Clock,
  ChevronDown,
  ChevronRight,
  Check,
  X as XIcon,
  AlertCircle,
  CalendarCheck,
  CalendarX,
  Shield,
  Star,
  Printer,
} from "lucide-react";
import { justifyDay, removeJustification } from "./prenominaActions";
import type { PayrollResult } from "@/lib/payrollUtils";

// =============================================================================
// Types
// =============================================================================

export interface EmployeePayrollFull {
  id: number;
  name: string;
  role: string;
  roleSlug: string;
  sueldoBase: number;
  payroll: PayrollResult;
  attendanceDates: string[];  // YYYY-MM-DD keys (Mexico TZ)
  justifiedDates: string[];   // YYYY-MM-DD keys
  periodDays: string[];       // All days of the period
  curp: string | null;
  fechaIngreso: string;
}

export interface BranchPayrollData {
  id: number;
  name: string;
  city: string | null;
  employeeCount: number;
  totalBruta: number;
  totalNeta: number;
  totalDescuentos: number;
  totalBonos: number;
  employees: EmployeePayrollFull[];
}

interface Props {
  branches: BranchPayrollData[];
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
}

// =============================================================================
// Sucursal Mappings for Official Training Zone Format
// =============================================================================

interface BranchMachote {
  title: string;
  address: string;
}

const BRANCH_MACHOTES: Record<string, BranchMachote> = {
  xilotzingo: {
    title: "NOMINA SUCURSAL XILOTZINGO",
    address: "Av. Del Jardin no. 2239 Rancho San José Xilotzingo. C.P. 72583, Puebla, Pue."
  },
  heroes: {
    title: "NOMINA SUCURSAL HÉROES",
    address: "Calle 111 D Oriente no. 1404-1402, San Francisco Totimehuacán. C.P. 72587, Puebla, Pue."
  },
  héroes: {
    title: "NOMINA SUCURSAL HÉROES",
    address: "Calle 111 D Oriente no. 1404-1402, San Francisco Totimehuacán. C.P. 72587, Puebla, Pue."
  },
  periferico: {
    title: "NOMINA SUCURSAL PERIFÉRICO",
    address: "Calle 15 Sur no. 11502, Ex Hacienda Mayorazgo, San Francisco Mayorazgo. C.P. 72480, Puebla, Pue."
  },
  periférico: {
    title: "NOMINA SUCURSAL PERIFÉRICO",
    address: "Calle 15 Sur no. 11502, Ex Hacienda Mayorazgo, San Francisco Mayorazgo. C.P. 72480, Puebla, Pue."
  },
  forjadores: {
    title: "NOMINA SUCURSAL FORJADORES",
    address: "Blvd. Forjadores de Puebla no. 8112, Col. Independencia. C.P. 72760, Puebla, Pue."
  },
  cuautlancingo: {
    title: "NOMINA SUCURSAL CUAUTLANCINGO",
    address: "Av. Tlaxcala no. 124, San Juan Cuautlancingo. C.P. 72730, Puebla, Pue."
  },
  misiones: {
    title: "NOMINA SUCURSAL MISIONES",
    address: "Estación Central no. 24, Misiones de San Francisco. C.P. 72710, Puebla, Pue."
  },
  vw: {
    title: "NOMINA SUCURSAL VW",
    address: "Blvd. Hermanos Serdán no. 234, Col. Real del Monte. C.P. 72060, Puebla, Pue."
  },
  "staff de direccion": {
    title: "NOMINA STAFF DE DIRECCIÓN",
    address: "Av. Del Jardin no. 2239 Rancho San José Xilotzingo. C.P. 72583, Puebla, Pue."
  },
  "staff de dirección": {
    title: "NOMINA STAFF DE DIRECCIÓN",
    address: "Av. Del Jardin no. 2239 Rancho San José Xilotzingo. C.P. 72583, Puebla, Pue."
  }
};

function getBranchHeader(branchName: string, defaultAddress: string | null): BranchMachote {
  const norm = branchName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const key = Object.keys(BRANCH_MACHOTES).find(k => k.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === norm);
  
  if (key) {
    return BRANCH_MACHOTES[key];
  }
  
  return {
    title: `NOMINA SUCURSAL ${branchName.toUpperCase()}`,
    address: defaultAddress || "Av. Del Jardin no. 2239 Rancho San José Xilotzingo. C.P. 72583, Puebla, Pue."
  };
}

function formatDateStr(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getPeriodNumber(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getMonth() * 2 + (d.getDate() <= 15 ? 1 : 2);
}

// =============================================================================
// Helpers
// =============================================================================

function fmt(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function getDayOfWeek(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sun, 6=Sat
}

function isWeekend(dateKey: string): boolean {
  const dow = getDayOfWeek(dateKey);
  return dow === 0 || dow === 6;
}

function formatDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return `${dayNames[date.getDay()]} ${d}`;
}

// =============================================================================
// DayDot — Individual day indicator in the mini-calendar
// =============================================================================

interface DayDotProps {
  dateKey: string;
  status: "attended" | "absent" | "justified" | "weekend";
  isSabatino: boolean;
  employeeId: number;
  onJustify: (employeeId: number, dateKey: string) => void;
  onRemoveJustify: (employeeId: number, dateKey: string) => void;
}

function DayDot({ dateKey, status, isSabatino, employeeId, onJustify, onRemoveJustify }: DayDotProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const colors = {
    attended: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
    absent: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]",
    justified: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]",
    weekend: "bg-slate-600/50",
  };

  const statusLabel = {
    attended: "Asistencia",
    absent: "Falta",
    justified: "Justificado",
    weekend: isSabatino ? "Día laboral (Sáb)" : "Descanso",
  };

  const canJustify = status === "absent";
  const canRemoveJustify = status === "justified";

  return (
    <div
      className="relative flex flex-col items-center gap-0.5 group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-[9px] text-slate-500 font-medium leading-none">
        {formatDayLabel(dateKey)}
      </span>
      <button
        type="button"
        onClick={() => {
          if (canJustify) onJustify(employeeId, dateKey);
          else if (canRemoveJustify) onRemoveJustify(employeeId, dateKey);
        }}
        disabled={!canJustify && !canRemoveJustify}
        className={`h-4 w-4 rounded-full transition-all ${colors[status]} ${
          canJustify ? "cursor-pointer hover:ring-2 hover:ring-amber-400/50 hover:scale-125" :
          canRemoveJustify ? "cursor-pointer hover:ring-2 hover:ring-red-400/50 hover:scale-125" :
          "cursor-default"
        }`}
        title={`${formatDayLabel(dateKey)}: ${statusLabel[status]}`}
      />
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md bg-[#252529] border border-[#333338] text-[10px] text-slate-200 font-medium z-50 shadow-xl pointer-events-none">
          {statusLabel[status]}
          {canJustify && <span className="text-amber-400 ml-1">· Click para justificar</span>}
          {canRemoveJustify && <span className="text-red-400 ml-1">· Click para quitar</span>}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// NominaClient — Interactive Table with expandable mini-calendar
// =============================================================================

export default function NominaClient({ branches, periodLabel, periodStart, periodEnd }: Props) {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [printEmployees, setPrintEmployees] = useState<(EmployeePayrollFull & { branchName: string })[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handlePrint = (employees: (EmployeePayrollFull & { branchName: string })[]) => {
    setPrintEmployees(employees);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter employees by selected branch
  const filteredBranches = selectedBranch === "all"
    ? branches
    : branches.filter((b) => b.id === parseInt(selectedBranch));

  const allEmployees = filteredBranches.flatMap((b) =>
    b.employees.map((e) => ({ ...e, branchName: b.name }))
  );

  // Totals for filtered view
  const totalBruta = allEmployees.reduce((s, e) => s + e.sueldoBase, 0);
  const totalNeta = allEmployees.reduce((s, e) => s + e.payroll.pagoFinal, 0);

  const selectedBranchName = selectedBranch === "all"
    ? "Todas las Sucursales"
    : branches.find((b) => b.id === parseInt(selectedBranch))?.name ?? "Sucursal";

  // ── Handlers ──
  function handleJustify(employeeId: number, dateKey: string) {
    startTransition(async () => {
      await justifyDay(employeeId, dateKey, "Descanso justificado por administrador");
    });
  }

  function handleRemoveJustify(employeeId: number, dateKey: string) {
    startTransition(async () => {
      await removeJustification(employeeId, dateKey);
    });
  }

  return (
    <>
      {/* ── Toolbar: Branch Filter + Period Label ── */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        {/* Branch Filter & Massive Print */}
        <div ref={dropdownRef} className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1a1a1e] text-slate-200 rounded-xl border border-[#252529] hover:border-slate-500 transition-colors shadow-lg"
          >
            <Building2 size={15} className="text-blue-400" />
            {selectedBranchName}
            <ChevronDown
              size={14}
              className={`transition-transform text-slate-500 ${branchDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {allEmployees.length > 0 && (
            <button
              type="button"
              onClick={() => handlePrint(allEmployees)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg"
            >
              <Printer size={15} />
              Imprimir Recibos ({allEmployees.length})
            </button>
          )}

          {branchDropdownOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-[#1a1a1e] border border-[#333338] rounded-xl shadow-2xl z-50 overflow-hidden">
              <button
                type="button"
                onClick={() => { setSelectedBranch("all"); setBranchDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  selectedBranch === "all"
                    ? "bg-[#252529] text-slate-100 font-bold"
                    : "text-slate-400 hover:bg-[#252529]/50 hover:text-slate-200"
                }`}
              >
                Todas las Sucursales
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setSelectedBranch(String(b.id)); setBranchDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedBranch === String(b.id)
                      ? "bg-[#252529] text-slate-100 font-bold"
                      : "text-slate-400 hover:bg-[#252529]/50 hover:text-slate-200"
                  }`}
                >
                  {b.name}
                  {b.city && <span className="text-slate-600 ml-1 text-xs">· {b.city}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Period Label */}
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {periodLabel}
          </span>
          {isPending && (
            <span className="text-[10px] text-amber-400 font-semibold animate-pulse">
              Actualizando...
            </span>
          )}
        </div>
      </div>

      {/* ── Main Table ── */}
      <div className="rounded-xl border border-[#252529] bg-[#1a1a1e] shadow-xl overflow-hidden no-print">
        {allEmployees.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#121215] text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-semibold w-[200px]">Empleado</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Rol</th>
                  <th className="text-center px-2 py-2.5 font-semibold">Meta</th>
                  <th className="text-center px-2 py-2.5 font-semibold">Asist.</th>
                  <th className="text-center px-2 py-2.5 font-semibold">Just.</th>
                  <th className="text-center px-2 py-2.5 font-semibold">Faltas</th>
                  <th className="text-center px-2 py-2.5 font-semibold">Extras</th>
                  <th className="text-center px-2 py-2.5 font-semibold">Retardos</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Base</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Desc.</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Bono</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Pago Final</th>
                  <th className="text-center px-2 py-2.5 font-semibold w-[50px] no-print">Imp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252529]/60">
                {allEmployees.map((emp) => {
                  const isExpanded = expandedEmployee === emp.id;
                  const p = emp.payroll;
                  const totalDesc = p.descuentoFaltas + p.descuentoRetardos;

                  return (
                    <EmployeeRow
                      key={emp.id}
                      emp={emp}
                      isExpanded={isExpanded}
                      totalDesc={totalDesc}
                      onToggle={() => setExpandedEmployee(isExpanded ? null : emp.id)}
                      onJustify={handleJustify}
                      onRemoveJustify={handleRemoveJustify}
                      onPrint={(selectedEmp) => handlePrint([selectedEmp])}
                    />
                  );
                })}
              </tbody>
              {/* Footer Totals */}
              <tfoot>
                <tr className="bg-[#121215] border-t border-[#252529]">
                  <td colSpan={9} className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total {selectedBranchName} ({allEmployees.length} empleados)
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-bold text-slate-300">
                    {fmt(totalBruta)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-bold text-red-400">
                    -{fmt(allEmployees.reduce((s, e) => s + e.payroll.descuentoFaltas + e.payroll.descuentoRetardos, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-bold text-blue-400">
                    +{fmt(allEmployees.reduce((s, e) => s + e.payroll.bonoExtras, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-black text-emerald-400">
                    {fmt(totalNeta)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            <Building2 size={40} className="mx-auto text-slate-600 mb-3" />
            No hay colaboradores activos en la sucursal seleccionada.
          </div>
        )}
      </div>

      {/* ── Print Container (Visible only when printing) ── */}
      <div className="print-area hidden print:block bg-white text-black min-h-screen w-full font-sans text-xs">
        {printEmployees.map((emp) => {
          const p = emp.payroll;
          const branchInfo = getBranchHeader(emp.branchName, null);
          const periodStartFormatted = formatDateStr(periodStart);
          const periodEndFormatted = formatDateStr(periodEnd);
          const periodNumber = getPeriodNumber(periodStart);
          
          const totalPercepciones = emp.sueldoBase + p.bonoExtras;
          const totalDeducciones = p.descuentoRetardos + p.descuentoFaltas;
          
          function fmtPrint(n: number): string {
            return n.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
              minimumFractionDigits: 2,
            });
          }

          return (
            <div key={emp.id} className="receipt-page py-6 px-10 border-b border-dashed border-gray-400 print:border-b-0 print:border-none print:shadow-none bg-white text-black">
              {/* Receipt Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-black">
                {/* Logo */}
                <div className="flex items-center">
                  <img
                    src="/logo-gym.png"
                    alt="Training Zone Logo"
                    className="h-10 object-contain text-black"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="ml-2 font-black text-sm uppercase tracking-wider text-black">
                    Training Zone
                  </span>
                </div>
                {/* Sucursal Title and address */}
                <div className="text-right">
                  <h2 className="font-extrabold text-sm uppercase m-0 leading-tight text-black">
                    {branchInfo.title}
                  </h2>
                  <p className="text-[9px] text-gray-700 m-0 leading-normal max-w-md font-medium">
                    {branchInfo.address}
                  </p>
                </div>
              </div>

              {/* Metadata Table */}
              <div className="mb-4">
                <table className="w-full border-collapse border border-black text-left text-[9px] text-black">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1.5 border-r border-black font-bold w-[18%]">RECIBO DE NÓMINA:</td>
                      <td className="p-1.5 border-r border-black w-[32%] font-semibold uppercase">{emp.name} <span className="text-gray-500 font-normal">({emp.id})</span></td>
                      <td className="p-1.5 border-r border-black font-bold w-[10%]">CURP:</td>
                      <td className="p-1.5 w-[40%] font-mono uppercase">{emp.curp || "N/A"}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 border-r border-black font-bold">FECHA DE INGRESO:</td>
                      <td className="p-1.5 border-r border-black font-semibold">{emp.fechaIngreso || "N/A"}</td>
                      <td className="p-1.5 border-r border-black font-bold">PUESTO:</td>
                      <td className="p-1.5 border-r border-black font-semibold uppercase">{emp.role}</td>
                      <td className="p-1.5 border-r border-black font-bold"># PERIODO:</td>
                      <td className="p-1.5 font-semibold">{periodNumber}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-black font-bold">SALARIO DIARIO:</td>
                      <td className="p-1.5 border-r border-black font-mono font-semibold">{fmtPrint(p.valorDia)}</td>
                      <td className="p-1.5 border-r border-black font-bold">Días laborados:</td>
                      <td className="p-1.5 border-r border-black font-semibold">{p.asistenciasReales + p.diasJustificados}</td>
                      <td className="p-1.5 border-r border-black font-bold">Rango de fechas:</td>
                      <td className="p-1.5 font-semibold">{periodStartFormatted} - {periodEndFormatted}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bilateral Breakdown Table */}
              <div className="mb-6 flex w-full">
                {/* Percepciones (Left column) */}
                <div className="w-1/2 border border-black border-r-0">
                  <table className="w-full text-[9px] border-collapse text-black">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black">
                        <th className="p-1.5 text-left font-bold border-r border-black w-2/3 uppercase">PERCEPCIONES</th>
                        <th className="p-1.5 text-right font-bold w-1/3 uppercase">IMPORTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-1.5 border-r border-black font-medium">Sueldo Base</td>
                        <td className="p-1.5 text-right font-mono font-semibold">{fmtPrint(emp.sueldoBase)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="p-1.5 border-r border-black font-medium flex justify-between">
                          <span>Hrs. Extras (Días Extras)</span>
                          <span className="text-gray-500 font-normal">({p.diasExtras})</span>
                        </td>
                        <td className="p-1.5 text-right font-mono font-semibold">{p.bonoExtras > 0 ? fmtPrint(p.bonoExtras) : "$ -"}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="p-1.5 border-r border-black font-medium">Bono Puntualidad</td>
                        <td className="p-1.5 text-right font-mono">$ -</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-1.5 border-r border-black font-medium">Compensación</td>
                        <td className="p-1.5 text-right font-mono">$ -</td>
                      </tr>
                      {/* Total Percepciones */}
                      <tr className="font-bold border-t border-black bg-gray-50 text-[10px]">
                        <td className="p-1.5 border-r border-black uppercase text-left">Total de Percepciones</td>
                        <td className="p-1.5 text-right font-mono font-extrabold">{fmtPrint(totalPercepciones)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deducciones (Right column) */}
                <div className="w-1/2 border border-black">
                  <table className="w-full text-[9px] border-collapse text-black">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black">
                        <th className="p-1.5 text-left font-bold border-r border-black w-2/3 uppercase">DEDUCCIONES</th>
                        <th className="p-1.5 text-right font-bold w-1/3 uppercase">IMPORTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-1.5 border-r border-black font-medium flex justify-between">
                          <span>Retardos <span className="text-gray-500 font-normal">({p.retardos})</span></span>
                        </td>
                        <td className="p-1.5 text-right font-mono font-semibold">{p.descuentoRetardos > 0 ? fmtPrint(p.descuentoRetardos) : "$ -"}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="p-1.5 border-r border-black font-medium">Otros Descuentos (Faltas)</td>
                        <td className="p-1.5 text-right font-mono font-semibold">{p.descuentoFaltas > 0 ? fmtPrint(p.descuentoFaltas) : "$ -"}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="p-1.5 border-r border-black font-medium">&nbsp;</td>
                        <td className="p-1.5 text-right font-mono">&nbsp;</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-1.5 border-r border-black font-medium">&nbsp;</td>
                        <td className="p-1.5 text-right font-mono">&nbsp;</td>
                      </tr>
                      {/* Total Deducciones */}
                      <tr className="font-bold border-t border-black bg-gray-50 text-[10px]">
                        <td className="p-1.5 border-r border-black uppercase text-left">Total de Deducciones</td>
                        <td className="p-1.5 text-right font-mono font-extrabold">{totalDeducciones > 0 ? fmtPrint(totalDeducciones) : "$ -"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Calce Section */}
              <div className="flex justify-between items-end mb-8 pt-2 w-full text-black">
                {/* Neto a pagar */}
                <div className="w-1/2">
                  <div className="border border-black p-2.5 flex items-center justify-between w-[85%] bg-gray-50 shadow-sm">
                    <span className="font-black text-[11px] uppercase">NETO A PAGAR:</span>
                    <span className="font-mono text-base font-black">{fmtPrint(p.pagoFinal)}</span>
                  </div>
                </div>
                {/* Firma Line */}
                <div className="w-1/3 text-center">
                  <div className="border-t border-black pt-1">
                    <span className="font-extrabold text-[9px] uppercase tracking-wider text-black">Nombre y Firma</span>
                  </div>
                </div>
              </div>

              {/* Legal Text Footnote */}
              <div className="text-justify border-t border-gray-300 pt-2 w-full text-black">
                <p className="text-[8px] text-gray-700 leading-relaxed m-0 font-medium">
                  Las cantidades de este recibo cubren a la fecha todas las prestaciones de trabajo ordinario y extraordinario del periodo correspondiente a mi entera satisfacción.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333338; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      {/* Global CSS for Printing */}
      <style jsx global>{`
        @media print {
          /* Hide all screen elements */
          body * {
            visibility: hidden !important;
          }
          /* Show print elements only */
          .print-area, .print-area * {
            visibility: visible !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            display: block !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          /* Page size and layout margin */
          @page {
            size: letter;
            margin: 1cm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .receipt-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            height: 94vh !important;
            box-sizing: border-box !important;
            padding: 1cm 1.5cm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </>
  );
}

// =============================================================================
// EmployeeRow — Row + expandable mini-calendar
// =============================================================================

interface EmployeeRowProps {
  emp: EmployeePayrollFull & { branchName: string };
  isExpanded: boolean;
  totalDesc: number;
  onToggle: () => void;
  onJustify: (employeeId: number, dateKey: string) => void;
  onRemoveJustify: (employeeId: number, dateKey: string) => void;
  onPrint: (emp: EmployeePayrollFull & { branchName: string }) => void;
}

function EmployeeRow({ emp, isExpanded, totalDesc, onToggle, onJustify, onRemoveJustify, onPrint }: EmployeeRowProps) {
  const p = emp.payroll;

  // Determine day status for calendar
  function getDayStatus(dateKey: string): "attended" | "absent" | "justified" | "weekend" {
    const weekend = isWeekend(dateKey);

    if (p.isSabatino) {
      // Sabatino: weekends are work days, weekdays are rest
      if (!weekend) return "weekend"; // weekday = rest for sabatino
      if (emp.attendanceDates.includes(dateKey)) return "attended";
      if (emp.justifiedDates.includes(dateKey)) return "justified";
      return "absent";
    } else {
      // Regular staff
      if (emp.attendanceDates.includes(dateKey)) return "attended";
      if (emp.justifiedDates.includes(dateKey)) return "justified";
      return "absent";
    }
  }

  return (
    <>
      {/* Main Row */}
      <tr
        className={`hover:bg-[#252529]/30 transition-colors cursor-pointer ${
          isExpanded ? "bg-[#252529]/20" : ""
        }`}
        onClick={onToggle}
      >
        {/* Name */}
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ChevronRight
              size={14}
              className={`text-slate-500 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`}
            />
            <span className="text-slate-200 font-medium truncate">{emp.name}</span>
          </div>
        </td>

        {/* Role */}
        <td className="px-3 py-2.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
            emp.payroll.isSabatino
              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
          }`}>
            {emp.payroll.isSabatino && <Star size={8} />}
            {emp.role}
          </span>
        </td>

        {/* Meta */}
        <td className="px-2 py-2.5 text-center">
          <span className="text-slate-300 font-mono text-xs font-bold">{p.asistenciasMeta}</span>
        </td>

        {/* Asistencias */}
        <td className="px-2 py-2.5 text-center">
          <span className={`font-mono text-xs font-bold ${
            p.asistenciasReales >= p.asistenciasMeta ? "text-emerald-400" : "text-slate-300"
          }`}>
            {p.asistenciasReales}
          </span>
        </td>

        {/* Justificados */}
        <td className="px-2 py-2.5 text-center">
          {p.diasJustificados > 0 ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Shield size={9} />
              {p.diasJustificados}
            </span>
          ) : (
            <span className="text-slate-600 text-xs">0</span>
          )}
        </td>

        {/* Faltas */}
        <td className="px-2 py-2.5 text-center">
          {p.faltasReales > 0 ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
              <CalendarX size={9} />
              {p.faltasReales}
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Check size={9} />
              0
            </span>
          )}
        </td>

        {/* Extras */}
        <td className="px-2 py-2.5 text-center">
          {p.diasExtras > 0 ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
              <CalendarCheck size={9} />
              +{p.diasExtras}
            </span>
          ) : (
            <span className="text-slate-600 text-xs">0</span>
          )}
        </td>

        {/* Retardos */}
        <td className="px-2 py-2.5 text-center">
          {p.retardos > 0 ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <AlertCircle size={9} />
              {p.retardos}
            </span>
          ) : (
            <span className="text-slate-600 text-xs">0</span>
          )}
        </td>

        {/* Sueldo Base */}
        <td className="px-3 py-2.5 text-right text-slate-300 font-mono text-xs">
          {fmt(emp.sueldoBase)}
        </td>

        {/* Descuentos */}
        <td className="px-3 py-2.5 text-right">
          {totalDesc > 0 ? (
            <span className="text-red-400 font-mono text-xs font-bold">-{fmt(totalDesc)}</span>
          ) : (
            <span className="text-slate-600 font-mono text-xs">$0.00</span>
          )}
        </td>

        {/* Bono */}
        <td className="px-3 py-2.5 text-right">
          {p.bonoExtras > 0 ? (
            <span className="text-blue-400 font-mono text-xs font-bold">+{fmt(p.bonoExtras)}</span>
          ) : (
            <span className="text-slate-600 font-mono text-xs">$0.00</span>
          )}
        </td>

        {/* Pago Final */}
        <td className="px-3 py-2.5 text-right font-medium">
          <span className={`font-mono text-xs font-black ${
            p.pagoFinal < emp.sueldoBase ? "text-amber-400" : "text-emerald-400"
          }`}>
            {fmt(p.pagoFinal)}
          </span>
        </td>

        {/* Print cell */}
        <td className="px-2 py-2.5 text-center no-print" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onPrint(emp)}
            className="text-slate-400 hover:text-blue-400 p-1.5 transition-colors rounded-lg hover:bg-slate-800/40 font-medium"
            title="Imprimir Recibo"
          >
            <Printer size={14} />
          </button>
        </td>
      </tr>

      {/* Expanded Calendar Row */}
      {isExpanded && (
        <tr>
          <td colSpan={13} className="px-4 py-4 bg-[#16161a] border-t border-[#252529]">
            <div className="flex flex-col gap-3">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  Asistencia
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
                  Falta
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                  Justificado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600/50 inline-block" />
                  {p.isSabatino ? "Día no laboral" : "Fin de semana"}
                </span>
                <span className="text-amber-400/70 ml-2">
                  Click en 🔴 para justificar · Click en 🟡 para quitar
                </span>
              </div>

              {/* Calendar Grid */}
              <div className="flex flex-wrap gap-2">
                {emp.periodDays.map((dayKey) => (
                  <DayDot
                    key={dayKey}
                    dateKey={dayKey}
                    status={getDayStatus(dayKey)}
                    isSabatino={p.isSabatino}
                    employeeId={emp.id}
                    onJustify={onJustify}
                    onRemoveJustify={onRemoveJustify}
                  />
                ))}
              </div>

              {/* Summary line */}
              <div className="flex flex-wrap gap-4 text-[11px] font-semibold text-slate-400 pt-2 border-t border-[#252529]">
                <span>Valor/Día: <span className="text-slate-200">{fmt(p.valorDia)}</span></span>
                {p.descuentoFaltas > 0 && (
                  <span>Desc. Faltas: <span className="text-red-400">-{fmt(p.descuentoFaltas)}</span></span>
                )}
                {p.bonoExtras > 0 && (
                  <span>Bono Extras: <span className="text-blue-400">+{fmt(p.bonoExtras)}</span></span>
                )}
                {p.descuentoRetardos > 0 && (
                  <span>Desc. Retardos: <span className="text-amber-400">-{fmt(p.descuentoRetardos)} ({p.retardos}×$10)</span></span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
