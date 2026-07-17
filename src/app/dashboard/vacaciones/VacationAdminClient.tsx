"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveVacationRequest, rejectVacationRequest, createHistoricAdjustment } from "./adminActions";
import {
  Palmtree,
  Check,
  X,
  Search,
  Building2,
  Calendar,
  UserCheck,
  AlertCircle,
  Clock,
  User,
  Heart,
  ChevronRight,
  Wrench,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApprovedRequestRecord {
  id: number;
  startDate: string;
  endDate: string;
  requestedDays: number;
  restDays: number;
  coveringEmployee: string | null;
  reason: string;
  status: string;
  createdAt: string;
}

interface EmployeeRecord {
  id: number;
  name: string;
  puesto: string;
  fechaIngreso: string;
  branchId: number | null;
  isActive: boolean;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  approvedRequests: ApprovedRequestRecord[];
}

interface PendingRequestRecord {
  id: number;
  employeeName: string;
  employeeId: number;
  puesto: string;
  branchName: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  restDays: number;
  coveringEmployee: string | null;
  reason: string;
  createdAt: string;
}

interface BranchRecord {
  id: number;
  name: string;
}

interface Props {
  initialEmployees: EmployeeRecord[];
  initialPendingRequests: PendingRequestRecord[];
  branches: BranchRecord[];
}

export default function VacationAdminClient({
  initialEmployees,
  initialPendingRequests,
  branches,
}: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Estados del modal de ajuste histórico
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustEmployee, setAdjustEmployee] = useState<EmployeeRecord | null>(null);
  const [adjustDays, setAdjustDays] = useState(0);
  const [adjustReason, setAdjustReason] = useState("Ajuste de días tomados previo a la intranet");
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Estados del modal de historial
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<EmployeeRecord | null>(null);

  // Manejador del guardado del ajuste histórico
  async function handleSaveAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustEmployee) return;
    if (adjustDays <= 0) {
      alert("Ingresa una cantidad de días válida mayor a 0.");
      return;
    }

    setAdjustLoading(true);
    try {
      const res = await createHistoricAdjustment(adjustEmployee.id, adjustDays, adjustReason);
      if (res.success) {
        alert(`✓ Se han registrado ${adjustDays} días tomados históricos para ${adjustEmployee.name}.`);
        setAdjustModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || "Error al aplicar el ajuste histórico.");
    } finally {
      setAdjustLoading(false);
    }
  }

  // Acción de Autorizar
  async function handleApprove(requestId: number) {
    if (!confirm("¿Estás seguro de que deseas AUTORIZAR esta solicitud de vacaciones?")) return;
    
    startTransition(async () => {
      try {
        const res = await approveVacationRequest(requestId);
        if (res.success) {
          // Remover de solicitudes pendientes localmente de inmediato para UX fluida
          setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
          // Recargar saldos (en un ambiente real, el revalidatePath refresca las server props,
          // pero para garantizar reactividad instantánea, actualizamos el estado o el browser recarga)
          alert("✓ Solicitud autorizada con éxito y saldo descontado.");
          window.location.reload();
        }
      } catch (err: any) {
        alert(err.message || "Error al procesar la autorización.");
      }
    });
  }

  // Acción de Rechazar
  async function handleReject(requestId: number) {
    if (!confirm("¿Estás seguro de que deseas RECHAZAR esta solicitud de vacaciones?")) return;

    startTransition(async () => {
      try {
        const res = await rejectVacationRequest(requestId);
        if (res.success) {
          setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
          alert("✗ Solicitud rechazada correctamente.");
          window.location.reload();
        }
      } catch (err: any) {
        alert(err.message || "Error al procesar el rechazo.");
      }
    });
  }

  // Filtrado de empleados en tiempo real
  const filteredEmployees = employees.filter((emp) => {
    // Filtro de sucursal
    if (selectedBranch !== "all" && emp.branchId !== parseInt(selectedBranch)) {
      return false;
    }
    // Filtro de búsqueda (nombre o puesto)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(query);
      const matchPuesto = emp.puesto.toLowerCase().includes(query);
      return matchName || matchPuesto;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const getBranchName = (branchId: number | null) => {
    if (!branchId) return "Sin Sucursal";
    return branches.find((b) => b.id === branchId)?.name || "Sin Sucursal";
  };

  return (
    <div className="space-y-10">
      
      {/* ─── CONTENEDOR DE SOLICITUDES PENDIENTES (AJUSTE 2: TABLA EXPLICITA CON LOGISTICA) ─── */}
      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-amber-400" /> Solicitudes de Vacaciones Pendientes
        </h2>

        {pendingRequests.length > 0 ? (
          <div className="rounded-2xl border border-amber-500/20 bg-[#1a1a1e] shadow-xl overflow-hidden">
            <div className="bg-amber-500/5 px-6 py-3 border-b border-[#252529] flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Requieren revisión logística ({pendingRequests.length})
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#252529] bg-[#121215] text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Empleado / Puesto</th>
                    <th className="px-6 py-4 font-semibold">Sucursal</th>
                    <th className="px-6 py-4 font-semibold">Fechas Solicitadas</th>
                    {/* Columnas dedicadas del Ajuste 2 */}
                    <th className="px-6 py-4 font-semibold text-center bg-slate-900/40">Días Solicitados</th>
                    <th className="px-6 py-4 font-semibold text-center bg-slate-900/40">Días Descanso</th>
                    <th className="px-6 py-4 font-semibold bg-slate-900/40">Empleado que Cubre</th>
                    <th className="px-6 py-4 font-semibold">Motivo</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252529]">
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#252529]/30 transition-colors">
                      {/* Empleado */}
                      <td className="px-6 py-4 font-bold text-slate-200">
                        <div>{req.employeeName}</div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{req.puesto}</div>
                      </td>
                      {/* Sucursal */}
                      <td className="px-6 py-4 text-slate-300 font-medium text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#252529] text-slate-300">
                          <Building2 size={10} />
                          {req.branchName}
                        </span>
                      </td>
                      {/* Fechas */}
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                        {formatDate(req.startDate)} al {formatDate(req.endDate)}
                      </td>
                      {/* Días Solicitados */}
                      <td className="px-6 py-4 text-center font-mono font-extrabold text-teal-400 bg-slate-900/20 text-base">
                        {req.requestedDays}
                      </td>
                      {/* Días de Descanso */}
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-400 bg-slate-900/20">
                        {req.restDays || 0}
                      </td>
                      {/* Quién Cubre */}
                      <td className="px-6 py-4 font-medium text-xs bg-slate-900/20 text-slate-300 max-w-[150px] truncate">
                        {req.coveringEmployee ? (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
                            <span className="truncate" title={req.coveringEmployee}>{req.coveringEmployee}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No asignado</span>
                        )}
                      </td>
                      {/* Motivo */}
                      <td className="px-6 py-4 text-slate-400 text-xs max-w-[200px] truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 shrink-0">
                          <Button
                            onClick={() => handleApprove(req.id)}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 rounded-lg flex items-center gap-1 shadow-md shadow-emerald-600/10 cursor-pointer"
                          >
                            <Check size={14} /> Autorizar
                          </Button>
                          <Button
                            onClick={() => handleReject(req.id)}
                            disabled={isPending}
                            className="bg-[#dc2626] hover:bg-red-700 text-white font-bold h-8 px-3 rounded-lg flex items-center gap-1 shadow-md shadow-red-600/10 cursor-pointer"
                          >
                            <X size={14} /> Rechazar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#252529] bg-[#1a1a1e] p-8 text-center text-slate-500 text-sm font-medium shadow-md">
            🌴 No hay solicitudes de vacaciones pendientes por revisar. ¡Todo al día!
          </div>
        )}
      </div>

      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#1a1a1e] p-5 rounded-2xl border border-[#252529] shadow-xl">
        {/* Filtro por Sucursal */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Building2 size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Sucursal:</span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="flex h-9 w-full sm:w-48 rounded-lg border border-[#252529] bg-[#121215] px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          >
            <option value="all">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id.toString()}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Buscar por empleado o puesto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-[#121215] border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* ─── TABLA GENERAL DE SALDOS DE EMPLEADOS ─── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-200">
            Saldos del Personal en Tiempo Real
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            Mostrando {filteredEmployees.length} empleados
          </span>
        </div>

        <div className="rounded-2xl border border-[#252529] bg-[#1a1a1e] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-[#252529] bg-[#121215] text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Empleado</th>
                  <th className="px-6 py-4 font-semibold">Puesto</th>
                  <th className="px-6 py-4 font-semibold">Sucursal</th>
                  <th className="px-6 py-4 font-semibold">Ingreso</th>
                  <th className="px-6 py-4 font-semibold text-center bg-slate-900/40">Días Totales</th>
                  <th className="px-6 py-4 font-semibold text-center bg-slate-900/40">Días Tomados</th>
                  <th className="px-6 py-4 font-semibold text-center bg-teal-500/5 text-teal-400">Días Disponibles</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252529]">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className={`hover:bg-[#252529]/40 transition-colors ${
                        !emp.isActive ? "opacity-50" : ""
                      }`}
                    >
                      {/* Nombre */}
                      <td className="px-6 py-4 font-bold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span>{emp.name}</span>
                          {!emp.isActive && (
                            <span className="text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded px-1 uppercase tracking-wide">
                              Baja
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Puesto */}
                      <td className="px-6 py-4 font-medium text-slate-400 text-xs">
                        {emp.puesto}
                      </td>
                      {/* Sucursal */}
                      <td className="px-6 py-4 text-slate-300 font-medium text-xs">
                        {getBranchName(emp.branchId)}
                      </td>
                      {/* Ingreso */}
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        {formatDate(emp.fechaIngreso)}
                      </td>
                      {/* Días Totales */}
                      <td className="px-6 py-4 text-center font-mono text-slate-300 font-bold bg-slate-900/20 text-sm">
                        {emp.totalDays}
                      </td>
                      {/* Días Tomados */}
                      <td className="px-6 py-4 text-center font-mono text-red-400 font-bold bg-slate-900/20 text-sm">
                        {emp.usedDays}
                      </td>
                      {/* Días Disponibles */}
                      <td className="px-6 py-4 text-center font-mono font-black text-teal-400 bg-teal-500/5 text-base">
                        {emp.remainingDays}
                      </td>
                      {/* Acciones de Ajuste Histórico e Historial */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => {
                              setHistoryEmployee(emp);
                              setHistoryModalOpen(true);
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-teal-400 hover:text-teal-300 hover:bg-teal-400/10 h-8 px-2 flex items-center gap-1 cursor-pointer font-bold text-xs"
                            title="Historial de Vacaciones"
                          >
                            <History size={12} />
                            Historial
                          </Button>
                          <Button
                            onClick={() => {
                              setAdjustEmployee(emp);
                              setAdjustDays(0);
                              setAdjustReason("Ajuste de días tomados previo a la intranet");
                              setAdjustModalOpen(true);
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 h-8 px-2 flex items-center gap-1 cursor-pointer font-bold text-xs"
                            title="Ajuste Histórico"
                          >
                            <Wrench size={12} />
                            Ajuste
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500 font-medium">
                      No se encontraron empleados que coincidan con los filtros aplicados. 🔍
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── MODAL DE AJUSTE HISTÓRICO ─── */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="bg-[#1a1a1e] text-slate-100 border border-[#252529] max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-100">
              <Wrench className="text-amber-400" /> Ajuste Histórico de Vacaciones
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Registra días de vacaciones que {adjustEmployee?.name} ya haya tomado anteriormente fuera de la intranet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAdjustment} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Días ya tomados anteriormente</label>
              <Input
                type="number"
                min={1}
                required
                placeholder="Ej. 10"
                value={adjustDays || ""}
                onChange={(e) => setAdjustDays(parseInt(e.target.value) || 0)}
                className="bg-[#121215] border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Notas / Justificación</label>
              <textarea
                required
                placeholder="Ej. Ajuste de días tomados previo a la intranet"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={3}
                className="w-full bg-[#121215] border border-[#252529] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg text-slate-200 text-sm p-3 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAdjustModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-lg hover:bg-slate-500/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={adjustLoading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg px-6 cursor-pointer"
              >
                {adjustLoading ? "Guardando..." : "Guardar Ajuste"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL DE HISTORIAL DETALLADO (AUDITORÍA DIRECTIVA) ─── */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="bg-[#1a1a1e] text-slate-100 border border-[#252529] max-w-4xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-100">
              <History className="text-teal-400" /> Historial de Días Tomados — {historyEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Listado detallado de solicitudes de vacaciones en estado APPROVED durante el período de aniversario actual.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#252529] bg-[#121215]">
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#252529] bg-[#18181b] text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Fecha Inicio</th>
                    <th className="px-4 py-3">Fecha Regreso</th>
                    <th className="px-4 py-3 text-center">Días Solicitados</th>
                    <th className="px-4 py-3 text-center">Días Descanso</th>
                    <th className="px-4 py-3">Quién Cubre</th>
                    <th className="px-4 py-3">Justificación / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252529] text-xs text-slate-300">
                  {historyEmployee && historyEmployee.approvedRequests && historyEmployee.approvedRequests.length > 0 ? (
                    historyEmployee.approvedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#1c1c21] transition-colors">
                        <td className="px-4 py-3 font-mono">
                          {formatDate(req.startDate)}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {formatDate(req.endDate)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-teal-400">
                          {req.requestedDays}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-400">
                          {req.restDays || 0}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {req.coveringEmployee ? (
                            <span className="text-emerald-400 font-medium">{req.coveringEmployee}</span>
                          ) : (
                            <span className="text-slate-500 italic">No aplica</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-xs break-words" title={req.reason}>
                          {req.reason}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">
                        No hay vacaciones registradas o tomadas en este período de aniversario. 🌴
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={() => setHistoryModalOpen(false)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg px-6 cursor-pointer"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
