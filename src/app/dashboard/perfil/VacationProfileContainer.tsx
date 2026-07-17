"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitVacationRequest } from "./vacationActions";
import {
  Palmtree,
  CalendarDays,
  UserCheck,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
} from "lucide-react";

export interface VacationRequestRecord {
  id: number;
  startDate: string;
  endDate: string;
  requestedDays: number;
  restDays: number;
  coveringEmployee: string | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface Props {
  diasTotales: number;
  diasTomados: number;
  diasDisponibles: number;
  history: VacationRequestRecord[];
}

export default function VacationProfileContainer({
  diasTotales,
  diasTomados,
  diasDisponibles,
  history,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del formulario para la validación reactiva
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestedDays, setRequestedDays] = useState(0);
  const [restDays, setRestDays] = useState(0);
  const [coveringEmployee, setCoveringEmployee] = useState("");
  const [reason, setReason] = useState("");

  // Validación de saldo de días
  const isOverLimit = requestedDays > diasDisponibles;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isOverLimit) {
      setErrorMsg("No puedes solicitar más días de los que tienes disponibles.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await submitVacationRequest({
        startDate,
        endDate,
        requestedDays,
        restDays,
        coveringEmployee,
        reason,
      });

      if (res.success) {
        // Reset form
        setStartDate("");
        setEndDate("");
        setRequestedDays(0);
        setRestDays(0);
        setCoveringEmployee("");
        setReason("");
        setOpen(false);
        alert("¡Solicitud de vacaciones enviada con éxito! Aparecerá en tu historial.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  // Helpers visuales para el estatus
  const getStatusBadge = (status: "PENDING" | "APPROVED" | "REJECTED") => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-full text-xs font-bold shadow-sm">
            <Clock size={12} className="animate-pulse" />
            Pendiente
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold shadow-sm">
            <CheckCircle size={12} />
            Autorizado
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold shadow-sm">
            <XCircle size={12} />
            Rechazado
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    });
  };

  return (
    <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-6">
      {/* ─── TARJETAS DE SALDO (DISEÑO PREMIUM) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Días Totales */}
        <div className="rounded-2xl border border-[#252529] bg-[#1a1a1e] p-6 shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-slate-100 group-hover:scale-110 transition-transform duration-300">
            <CalendarDays size={100} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Días Totales</p>
            <span className="text-4xl font-black text-slate-100 tracking-tight">{diasTotales}</span>
            <p className="text-xs text-slate-500 mt-2 font-medium">Asignados por antigüedad</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
            <CalendarDays size={22} />
          </div>
        </div>

        {/* Días Tomados */}
        <div className="rounded-2xl border border-[#252529] bg-[#1a1a1e] p-6 shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-slate-100 group-hover:scale-110 transition-transform duration-300">
            <UserCheck size={100} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Días Tomados</p>
            <span className="text-4xl font-black text-red-400 tracking-tight">{diasTomados}</span>
            <p className="text-xs text-red-400/60 mt-2 font-medium">Solicitudes aprobadas</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <UserCheck size={22} />
          </div>
        </div>

        {/* Días Disponibles */}
        <div className="rounded-2xl border border-[#252529] bg-gradient-to-br from-[#122620] to-[#121215] p-6 shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05] text-teal-400 group-hover:scale-110 transition-transform duration-300">
            <Palmtree size={100} />
          </div>
          <div>
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-2">Días Disponibles</p>
            <span className="text-4xl font-black text-teal-400 tracking-tight">{diasDisponibles}</span>
            <p className="text-xs text-teal-400/80 mt-2 font-medium bg-teal-500/10 border border-teal-500/20 px-3 py-0.5 rounded-full inline-block">
              Saldo Activo
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Palmtree size={22} />
          </div>
        </div>
      </div>

      {/* ─── BOTÓN DE SOLICITUD Y MODAL ─── */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#dc2626] hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-red-500/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <PlusCircle size={18} />
              Solicitar Vacaciones
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-[#1a1a1e] text-slate-100 border border-[#252529] max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-100">
                <Palmtree className="text-teal-400" /> Nueva Solicitud de Vacaciones
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Completa el formulario para enviar tu solicitud al Panel de Administración.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Días Disponibles Informacionales */}
              <div className="bg-[#121215] p-3 rounded-xl border border-[#252529] flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Tus días disponibles:</span>
                <span className="text-sm font-bold text-teal-400">{diasDisponibles} días útiles</span>
              </div>

              {/* Rango de Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Fecha de Inicio</label>
                  <Input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[#121215] border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Fecha de Regreso (inclusive)</label>
                  <Input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#121215] border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              {/* Cantidades y Descanso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Cantidad de días solicitados</label>
                  <Input
                    type="number"
                    min={1}
                    required
                    placeholder="Ej. 5"
                    value={requestedDays || ""}
                    onChange={(e) => setRequestedDays(parseInt(e.target.value) || 0)}
                    className={`bg-[#121215] border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200 ${
                      isOverLimit ? "border-red-500/50 text-red-400" : ""
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Días de descanso atravesados</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ej. 2"
                    value={restDays || ""}
                    onChange={(e) => setRestDays(parseInt(e.target.value) || 0)}
                    className="bg-[#121215] border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              {/* Validación de Tope de Saldo (Ajuste 1) */}
              {isOverLimit && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold flex items-start gap-2 animate-pulse">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">¡Exceso de días solicitados!</p>
                    <p className="text-red-400/80 font-normal mt-0.5">
                      No puedes solicitar {requestedDays} días porque solo tienes {diasDisponibles} días disponibles en tu saldo actual.
                    </p>
                  </div>
                </div>
              )}

              {/* Quién cubre posición */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex flex-col gap-0.5">
                  <span>¿Quién cubre posición?</span>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight">
                    Si aplica para tu puesto o turno, especifica qué compañero te apoyará.
                  </span>
                </label>
                <Input
                  type="text"
                  placeholder="Ej. Carlos Mendoza (Turno Matutino)"
                  value={coveringEmployee}
                  onChange={(e) => setCoveringEmployee(e.target.value)}
                  className="bg-[#121215] border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200"
                />
              </div>

              {/* Motivo de la solicitud */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Motivo de la solicitud</label>
                <textarea
                  required
                  placeholder="Especifica el motivo de tu solicitud de vacaciones..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full bg-[#121215] border border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200 text-sm p-3 focus:outline-none"
                />
              </div>

              {/* Texto de advertencia estático destacado */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                <span className="text-[11px] font-bold text-amber-500">
                  ⚠️ Recuerda reportar esta solicitud directamente con tu Coordinador o Gerencia.
                </span>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-white rounded-lg hover:bg-slate-500/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isOverLimit}
                  className={`bg-[#dc2626] hover:bg-red-700 text-white font-bold rounded-lg px-6 ${
                    isOverLimit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {loading ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─── HISTORIAL DE SOLICITUDES ─── */}
      <div className="rounded-2xl border border-[#252529] bg-[#1a1a1e] shadow-xl flex flex-col overflow-hidden">
        <div className="bg-[#121215] px-6 py-4 flex items-center justify-between border-b border-[#252529]">
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <FileText size={18} className="text-teal-400" /> Historial de Solicitudes
          </h3>
        </div>
        <div className="p-6">
          {history.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#252529]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#121215] text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3.5 font-semibold">Fechas Solicitadas</th>
                    <th className="text-center px-6 py-3.5 font-semibold">Días Útiles</th>
                    <th className="text-center px-6 py-3.5 font-semibold">Descansos</th>
                    <th className="text-left px-6 py-3.5 font-semibold">Quién Cubre</th>
                    <th className="text-left px-6 py-3.5 font-semibold">Motivo</th>
                    <th className="text-center px-6 py-3.5 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252529]">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-[#252529]/40 transition-colors">
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {formatDate(h.startDate)} al {formatDate(h.endDate)}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-300 font-mono font-bold">
                        {h.requestedDays}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono">
                        {h.restDays || 0}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium text-xs max-w-[150px] truncate">
                        {h.coveringEmployee || (
                          <span className="text-slate-500 italic">No aplica</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs max-w-[180px] truncate" title={h.reason}>
                        {h.reason}
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(h.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm font-medium">
              No tienes solicitudes previas registradas. 🌴
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
