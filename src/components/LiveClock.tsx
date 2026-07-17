"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const DAYS_ES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];
const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  // Hydration-safe: only set after mount on client
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div className="flex flex-col items-center justify-center py-4 gap-1 select-none">
        <div className="h-10 w-40 bg-[#252529] animate-pulse rounded-lg" />
        <div className="h-4 w-56 bg-[#252529] animate-pulse rounded mt-1" />
      </div>
    );
  }

  const dayName = DAYS_ES[now.getDay()];
  const day = now.getDate();
  const month = MONTHS_ES[now.getMonth()];
  const year = now.getFullYear();
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return (
    <div className="flex flex-col items-center justify-center py-4 gap-1 select-none">
      {/* Reloj principal */}
      <div className="flex items-baseline gap-1">
        <span className="font-black text-slate-100 tabular-nums leading-none"
          style={{ fontSize: "clamp(2rem, 8vw, 3rem)" }}>
          {hours}:{minutes}
        </span>
        <span
          className="font-extrabold text-[#dc2626] tabular-nums"
          style={{ fontSize: "clamp(1.25rem, 5vw, 2rem)", minWidth: "2.2ch" }}
        >
          :{seconds}
        </span>
      </div>
      {/* Fecha completa */}
      <div className="flex items-center gap-1.5 text-slate-400 text-sm font-semibold tracking-wide">
        <Clock size={13} className="text-slate-500 flex-shrink-0" />
        <span>{dayName}, {day} de {month} de {year}</span>
      </div>
    </div>
  );
}
