"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, LogOut } from "lucide-react";
import { getActiveShiftStatus } from "@/app/dashboard/shiftActions";

// =============================================================================
// ShiftAlertBanner — Banner persistente para turnos prolongados (> 8.5 horas)
// Premium dark design system con animación de pulso de emergencia.
// =============================================================================

const POLL_INTERVAL_MS = 5 * 60 * 1000; // Polling cada 5 minutos

function formatElapsed(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}min`;
}

export default function ShiftAlertBanner() {
  const [isOvertime, setIsOvertime] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const checkShift = useCallback(async () => {
    try {
      const status = await getActiveShiftStatus();
      if (status && status.isOvertime) {
        setIsOvertime(true);
        setElapsedMinutes(status.elapsedMinutes);
        setCheckInTime(status.checkInTime);
      } else {
        setIsOvertime(false);
      }
    } catch {
      // Silently fail — don't block the UI
    }
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkShift();

    // Poll every 5 minutes
    const interval = setInterval(checkShift, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkShift]);

  if (!isOvertime) return null;

  const checkInFormatted = checkInTime
    ? new Date(checkInTime).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Mexico_City",
      })
    : "--:--";

  return (
    <div className="relative overflow-hidden rounded-xl mx-4 mt-4 mb-2 border border-amber-500/30 bg-gradient-to-r from-amber-900/40 via-red-900/30 to-amber-900/40 shadow-lg shadow-amber-500/5">
      {/* Animated pulse overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-red-500/10 to-amber-500/5 animate-pulse pointer-events-none" />

      <div className="relative z-10 px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
        {/* Icon + Message */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <AlertTriangle size={20} className="text-amber-400 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-200 leading-tight">
              ⚠️ Turno prolongado: Por favor marca tu salida ahora
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-amber-300/70">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Entrada: {checkInFormatted}
              </span>
              <span className="font-mono font-bold text-amber-300">
                {formatElapsed(elapsedMinutes)} en turno
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <a
          href="/dashboard"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Marcar Salida</span>
          <span className="sm:hidden">Salida</span>
        </a>
      </div>

      {/* Bottom progress-like accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
    </div>
  );
}
