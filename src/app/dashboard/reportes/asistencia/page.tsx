import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendanceTableClient from "./AttendanceTableClient";
import type { Metadata } from "next";

// 🚀 SOLUCIÓN PUNTO 2: Forzar carga dinámica para ver registros recientes sin caché
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Reporte de Asistencia | GymAdmin",
};

export default async function AsistenciaReportePage() {
  const isAuth = await isAdmin();

  if (!isAuth) {
    redirect("/dashboard");
  }

  return (
    /* Eliminamos bg-slate-50 para usar el fondo oscuro de globals.css */
    <div className="p-8 min-h-screen flex flex-col">

      {/* ENCABEZADO ACTUALIZADO A MODO OSCURO */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Reportes Operativos
        </h1>
        <p className="text-slate-400 mt-2">
          Panel de supervisión de jornada laboral. Los retardos oficiales aplican sobre 10 minutos de tolerancia (LFT-MX).
        </p>
      </div>

      {/* CONTENEDOR DE LA TABLA */}
      <div className="flex-1 pb-10">
        <AttendanceTableClient />
      </div>
    </div>
  );
}
