"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

const MONTO_POR_RETARDO = 10; // $10.00 MXN por retardo

export interface RetardoRecord {
  id: number;
  checkIn: string;   // ISO string (serializado desde el servidor)
  isLate: boolean;
}

export interface QuincenaPeriod {
  key: string;       // Identificador único, e.g. "2026-04-A"
  label: string;     // Etiqueta visible, e.g. "1ra Quincena — 1 al 15 May 2026 (Pago día 15)"
  records: RetardoRecord[];
}

interface Props {
  periods: QuincenaPeriod[];
  defaultPeriodKey: string;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

export default function RetardosPanel({ periods, defaultPeriodKey }: Props) {
  const [selectedKey, setSelectedKey] = useState(defaultPeriodKey);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentPeriod = periods.find((p) => p.key === selectedKey) ?? periods[0];
  const retardos = currentPeriod?.records.filter((r) => r.isLate) ?? [];
  const totalDescuento = retardos.length * MONTO_POR_RETARDO;

  return (
    <div className="rounded-2xl border border-[#252529] bg-[#1a1a1e] shadow-xl flex flex-col overflow-hidden md:col-span-2 lg:col-span-3">
      {/* Header */}
      <div className="bg-[#121215] px-6 py-4 flex items-center justify-between border-b border-[#252529]">
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-400" /> Control de Retardos
        </h3>

        {/* Dropdown de Quincena */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-[#252529] text-slate-300 rounded-lg border border-[#333338] hover:border-slate-500 transition-colors"
          >
            {currentPeriod?.label.split("—")[0]?.trim() ?? "Periodo"}
            <ChevronDown
              size={14}
              className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-[#1a1a1e] border border-[#333338] rounded-xl shadow-2xl z-50 overflow-hidden">
              {periods.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(p.key);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    selectedKey === p.key
                      ? "bg-[#252529] text-slate-100 font-bold"
                      : "text-slate-400 hover:bg-[#252529]/50 hover:text-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* ── Resumen Visual ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#121215] rounded-xl border border-[#252529] p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Retardos en este periodo
            </p>
            <span className="text-4xl font-black text-amber-400">
              {retardos.length}
            </span>
          </div>
          <div className="bg-[#121215] rounded-xl border border-[#252529] p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Descuento Proyectado
            </p>
            <span className="text-4xl font-black text-red-400">
              -{formatMoney(totalDescuento)}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {formatMoney(MONTO_POR_RETARDO)} por retardo
            </p>
          </div>
        </div>

        {/* ── Tabla de Retardos ── */}
        {retardos.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#252529]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#121215] text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold">Hora de Entrada</th>
                  <th className="text-center px-4 py-3 font-semibold">Estatus</th>
                  <th className="text-right px-4 py-3 font-semibold">Monto a Descontar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252529]">
                {retardos.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#252529]/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {formatDate(r.checkIn)}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {formatTime(r.checkIn)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                        Retardo
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-red-400 font-bold font-mono">
                      -{formatMoney(MONTO_POR_RETARDO)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm font-medium">
            Sin retardos en este periodo. ¡Excelente puntualidad! 🎯
          </div>
        )}
      </div>
    </div>
  );
}
