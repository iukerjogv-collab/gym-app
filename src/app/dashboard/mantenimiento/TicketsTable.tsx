"use client";

import { useEffect, useState, useCallback } from "react";
import { getTickets, resolveTicket, getUserRole, getBranchesForFilter, TicketItem } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Minus,
  ChevronDown,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  ClipboardCheck,
  Inbox,
  CalendarIcon,
  MessageSquareText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// Configuraciones visuales (Dark Mode)
// =============================================================================
const PRIORITY_MAP: Record<string, { label: string; icon: React.ElementType; classes: string }> = {
  LOW: {
    label: "Baja",
    icon: Minus,
    classes: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  MEDIUM: {
    label: "Media",
    icon: ChevronDown,
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  HIGH: {
    label: "Alta",
    icon: AlertTriangle,
    classes: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

const STATUS_MAP: Record<string, { label: string; dot: string; classes: string }> = {
  OPEN: {
    label: "Abierto",
    dot: "bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]",
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  IN_PROGRESS: {
    label: "En Proceso",
    dot: "bg-blue-500 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]",
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  CLOSED: {
    label: "Cerrado",
    dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]",
    classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

export default function TicketsTable() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // ── Filtros Maestros ─────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  // ── Modal de resolución ──────────────────────────────────────────
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveFeedback, setResolveFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isAdmin = userRole === "admin" || userRole === "super-admin";

  // Calcula el total de columnas dinámicamente para colSpan
  const totalColumns = isAdmin ? 8 : 5;

  // ── Fetch principal ──────────────────────────────────────────────
  const fetchData = useCallback(
    async (dateToFetch?: Date, branchIdToFetch: string = "all") => {
      setLoading(true);
      setErrorMsg("");

      const dateISO = dateToFetch ? dateToFetch.toISOString() : undefined;
      const parsedBranchId =
        branchIdToFetch !== "all" ? parseInt(branchIdToFetch, 10) : undefined;

      const [ticketsRes, role] = await Promise.all([
        getTickets(dateISO, parsedBranchId),
        getUserRole(),
      ]);

      if (ticketsRes.success && ticketsRes.data) {
        setTickets(ticketsRes.data);
      } else {
        setErrorMsg(ticketsRes.error || "Error al cargar los tickets.");
      }

      setUserRole(role);
      setLoading(false);
    },
    []
  );

  // ── Fetch de sucursales para el selector (solo admin) ────────────
  useEffect(() => {
    const loadBranches = async () => {
      const data = await getBranchesForFilter();
      setBranches(data);
    };
    loadBranches();
  }, []);

  // ── Dispara fetch cuando cambian los filtros ─────────────────────
  useEffect(() => {
    fetchData(selectedDate, selectedBranchId);
  }, [fetchData, selectedDate, selectedBranchId]);

  // ── Abrir modal de resolución ────────────────────────────────────
  const openResolveModal = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setAdminComment("");
    setResolveFeedback(null);
    setResolveModalOpen(true);
  };

  // ── Ejecutar resolución ──────────────────────────────────────────
  const handleResolve = async () => {
    if (!selectedTicket) return;

    setResolving(true);
    setResolveFeedback(null);

    const result = await resolveTicket(selectedTicket.id, adminComment);

    if (result.success) {
      setResolveFeedback({
        type: "success",
        message: "Ticket resuelto exitosamente.",
      });
      setTimeout(() => {
        setResolveModalOpen(false);
        fetchData(selectedDate, selectedBranchId);
      }, 1200);
    } else {
      setResolveFeedback({
        type: "error",
        message: result.error || "Error al resolver el ticket.",
      });
    }

    setResolving(false);
  };

  // ── Limpiar filtros ──────────────────────────────────────────────
  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedBranchId("all");
  };

  const hasActiveFilters = selectedDate !== undefined || selectedBranchId !== "all";

  // ── Helpers de render ────────────────────────────────────────────
  const renderPriority = (priority: string) => {
    const config = PRIORITY_MAP[priority] || PRIORITY_MAP.MEDIUM;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${config.classes}`}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const renderStatus = (status: string) => {
    const config = STATUS_MAP[status] || STATUS_MAP.OPEN;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.classes}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  return (
    <>
      <div className="bg-[#1a1a1e] rounded-xl shadow-xl border border-[#252529] overflow-hidden">
        {/* ════════════════════════════════════════════════════════════════
             HEADER PREMIUM DARK + FILTROS MAESTROS
           ════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#121215] px-6 py-5 flex flex-col gap-4 border-b border-[#252529]">
          {/* Fila 1: Título + Refrescar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <ClipboardCheck className="text-emerald-400" size={20} />
                </div>
                Monitor de Tickets
                <span className="ml-2 inline-flex items-center justify-center bg-[#252529] text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#333338]">
                  {tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}
                </span>
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 ml-[3.25rem]">
                {isAdmin
                  ? "Vista global de todas las solicitudes de mantenimiento."
                  : "Solicitudes de mantenimiento de tu sucursal."}
              </p>
            </div>

            <button
              onClick={() => fetchData(selectedDate, selectedBranchId)}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 bg-[#252529] hover:bg-[#333338] text-emerald-400 rounded-lg transition-colors border border-[#333338] text-sm font-semibold active:scale-95 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refrescar
            </button>
          </div>

          {/* Fila 2: Filtros Maestros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 border-t border-[#252529] mt-2 pt-4">
            {/* ── Date Picker (Popover + Calendar) ──────────── */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[220px] justify-start text-left font-normal bg-[#1a1a1e] text-slate-200 border-[#252529] hover:bg-[#252529] hover:text-slate-100",
                    !selectedDate && "text-slate-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {selectedDate
                    ? format(selectedDate, "PPP", { locale: es })
                    : "Todas las fechas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1a1a1e] border-[#252529] text-slate-200" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || undefined)}
                  initialFocus
                  className="bg-[#1a1a1e] text-slate-200"
                />
              </PopoverContent>
            </Popover>

            {/* ── Select de Sucursal (Solo Admin) ──────────── */}
            {isAdmin && (
              <Select
                value={selectedBranchId}
                onValueChange={(val) => setSelectedBranchId(val)}
              >
                <SelectTrigger className="w-full sm:w-[220px] bg-[#1a1a1e] text-slate-200 border-[#252529] hover:bg-[#252529] focus:ring-emerald-500/30">
                  <Building2 size={14} className="mr-2 shrink-0 text-slate-500" />
                  <SelectValue placeholder="Todas las Sucursales" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1e] text-slate-200 border-[#252529]">
                  <SelectItem value="all" className="focus:bg-[#252529]">Todas las Sucursales</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()} className="focus:bg-[#252529]">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* ── Botón Limpiar Filtros ─────────────────────── */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors px-3 py-2 rounded-lg hover:bg-[#252529] border border-transparent hover:border-[#333338]"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────── */}
        {errorMsg && (
          <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 font-medium text-sm">
            <XCircle size={18} /> {errorMsg}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
             TABLA DE TICKETS
           ════════════════════════════════════════════════════════════════ */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-[#121215] border-b border-[#252529]">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">
                  Ticket
                </th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">
                  Falla
                </th>
                {isAdmin && (
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider">
                    Sucursal
                  </th>
                )}
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">
                  Reportado por
                </th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">
                  Estado
                </th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-4 font-bold tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <MessageSquareText size={13} />
                    Solución
                  </div>
                </th>
                {isAdmin && (
                  <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">
                    Acción
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252529]">
              {/* ── Estado de Carga ──────────────────────────── */}
              {loading ? (
                <tr>
                  <td
                    colSpan={totalColumns}
                    className="px-6 py-14 text-center text-slate-500 font-medium"
                  >
                    <RefreshCw
                      className="animate-spin mx-auto mb-3 text-slate-600"
                      size={28}
                    />
                    Cargando tickets de mantenimiento...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                /* ── Sin resultados ─────────────────────────── */
                <tr>
                  <td
                    colSpan={totalColumns}
                    className="px-6 py-14 text-center"
                  >
                    <Inbox
                      className="mx-auto mb-3 text-slate-600"
                      size={36}
                    />
                    <p className="text-slate-400 font-semibold">
                      No hay tickets pendientes
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {hasActiveFilters
                        ? "No se encontraron tickets con los filtros seleccionados."
                        : "Todo está en orden. ¡Excelente trabajo, equipo!"}
                    </p>
                  </td>
                </tr>
              ) : (
                /* ── Filas de Tickets ───────────────────────── */
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-[#252529]/30 transition-colors align-top"
                  >
                    {/* Ticket: Título + Prioridad */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 max-w-[200px]">
                        <span className="font-semibold text-slate-200 leading-tight">
                          {ticket.title}
                        </span>
                        {renderPriority(ticket.priority)}
                      </div>
                    </td>

                    {/* Falla: Descripción completa (sin truncar) */}
                    <td className="px-6 py-4">
                      <div className="max-w-[300px]">
                        <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {ticket.description}
                        </p>
                      </div>
                    </td>

                    {/* Sucursal (Solo Admin) */}
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                          <Building2 size={12} />
                          {ticket.branchName}
                        </div>
                      </td>
                    )}

                    {/* Reportado por */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#252529] border border-[#333338] text-slate-300 flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                          {ticket.reportedByName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-300 text-sm">
                          {ticket.reportedByName}
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {renderStatus(ticket.status)}
                    </td>

                    {/* Fecha relativa */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-medium bg-[#121215] border border-[#252529] px-2 py-1 rounded">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(ticket.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </div>
                    </td>

                    {/* Solución (adminComment) — NUEVA COLUMNA */}
                    <td className="px-6 py-4">
                      <div className="max-w-[300px]">
                        {ticket.adminComment ? (
                          <p className="text-emerald-400/80 text-sm italic leading-relaxed whitespace-pre-wrap break-words">
                            {ticket.adminComment}
                          </p>
                        ) : (
                          <span className="text-slate-600 text-xs italic">
                            Sin comentarios todavía
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acción Admin */}
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {ticket.status !== "CLOSED" ? (
                          <button
                            onClick={() => openResolveModal(ticket)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            <CheckCircle2 size={14} />
                            Resolver
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Shield size={14} />
                            Resuelto
                            {ticket.resolvedByName && (
                              <span className="text-slate-400">
                                por {ticket.resolvedByName}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
           MODAL: Resolver Ticket
         ════════════════════════════════════════════════════════════════ */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="bg-[#1a1a1e] border-[#252529] text-slate-200 sm:max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-100">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="text-emerald-400" size={18} />
              </div>
              Resolver Ticket
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Marca este ticket como resuelto y deja un comentario para el
              equipo.
            </DialogDescription>
          </DialogHeader>

          {/* Info del ticket */}
          {selectedTicket && (
            <div className="p-3 bg-[#121215] rounded-lg border border-[#252529] space-y-1.5 mt-2">
              <p className="font-semibold text-slate-200 text-sm">
                {selectedTicket.title}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.description}
              </p>
              <div className="flex items-center gap-2 pt-1">
                {renderPriority(selectedTicket.priority)}
                <span className="text-xs text-slate-500">
                  — {selectedTicket.branchName}
                </span>
              </div>
            </div>
          )}

          {/* Textarea para comentario admin */}
          <div className="space-y-2 mt-4">
            <label className="block text-sm font-semibold text-slate-300">
              Comentario de Resolución{" "}
              <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="Ej. Se reparó la fuga, se reemplazó la manguera."
              disabled={resolving}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-[#252529] bg-[#121215] text-slate-200 text-sm
                         placeholder:text-slate-600 resize-none
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
            />
          </div>

          {/* Feedback dentro del modal */}
          {resolveFeedback && (
            <div
              className={`p-3 mt-4 rounded-lg flex items-center gap-2 text-sm font-medium border ${
                resolveFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {resolveFeedback.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={16} className="text-red-400 shrink-0" />
              )}
              {resolveFeedback.message}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <button
              type="button"
              onClick={() => setResolveModalOpen(false)}
              disabled={resolving}
              className="px-4 py-2 text-sm font-medium text-slate-400 bg-[#252529] hover:bg-[#333338] hover:text-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleResolve}
              disabled={resolving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resolving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Resolviendo...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Confirmar Resolución
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
