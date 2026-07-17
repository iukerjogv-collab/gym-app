"use client";

import { useState } from "react";
import { createTicket } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wrench,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Minus,
  ChevronDown,
} from "lucide-react";

// =============================================================================
// Configuración de Prioridades
// =============================================================================
const PRIORITY_OPTIONS = [
  {
    value: "LOW",
    label: "Baja",
    description: "Mantenimiento general",
    color: "text-sky-400",
    bgBadge: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    icon: Minus,
  },
  {
    value: "MEDIUM",
    label: "Media",
    description: "Afecta el uso pero funciona",
    color: "text-amber-400",
    bgBadge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    icon: ChevronDown,
  },
  {
    value: "HIGH",
    label: "Alta",
    description: "Máquina fuera de servicio / Peligro",
    color: "text-red-400",
    bgBadge: "bg-red-500/10 border-red-500/20 text-red-400",
    icon: AlertTriangle,
  },
];

export default function NuevoTicketForm() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === priority);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validación mínima del lado del cliente
    if (!title.trim()) {
      setFeedback({ type: "error", message: "El título es obligatorio." });
      return;
    }
    if (!description.trim()) {
      setFeedback({
        type: "error",
        message: "La descripción es obligatoria.",
      });
      return;
    }

    setLoading(true);

    const result = await createTicket(title, description, priority);

    if (result.success) {
      setFeedback({
        type: "success",
        message: "¡Ticket creado exitosamente! El equipo de mantenimiento ha sido notificado.",
      });
      // Limpiar formulario
      setTitle("");
      setPriority("MEDIUM");
      setDescription("");
    } else {
      setFeedback({
        type: "error",
        message: result.error || "Ocurrió un error inesperado.",
      });
    }

    setLoading(false);

    // Auto-ocultar toast de éxito después de 5 segundos
    if (result.success) {
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="bg-[#1a1a1e] rounded-xl shadow-xl border border-[#252529] overflow-hidden">
      {/* ── Header Premium Dark ────────────────────────────────────── */}
      <div className="bg-[#121215] px-6 py-5 border-b border-[#252529]">
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Wrench className="text-amber-400" size={20} />
          </div>
          Reportar Falla de Equipo
        </h2>
        <p className="text-slate-500 text-sm mt-1.5 ml-[3.25rem]">
          Describe el problema con el mayor detalle posible para agilizar la
          reparación.
        </p>
      </div>

      {/* ── Toast / Feedback ───────────────────────────────────────── */}
      {feedback && (
        <div
          className={`mx-6 mt-5 p-4 rounded-lg flex items-start gap-3 text-sm font-medium border animate-in fade-in slide-in-from-top-2 duration-300 ${feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Formulario ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Campo: Título */}
        <div className="space-y-2">
          <label
            htmlFor="ticket-title"
            className="block text-sm font-semibold text-slate-300"
          >
            Título del Reporte <span className="text-red-500">*</span>
          </label>
          <input
            id="ticket-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Fuga en regadera de hombres"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg border border-[#252529] bg-[#121215] text-slate-200 text-sm
                       placeholder:text-slate-600
                       focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
          />
        </div>

        {/* Campo: Prioridad */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300">
            Prioridad <span className="text-red-500">*</span>
          </label>
          <Select
            value={priority}
            onValueChange={(val) => setPriority(val)}
            disabled={loading}
          >
            <SelectTrigger
              className="w-full px-4 py-3 h-auto rounded-lg border border-[#252529] bg-[#121215] text-slate-200 text-sm
                          focus:ring-2 focus:ring-red-500/30 focus:border-transparent"
            >
              <SelectValue placeholder="Selecciona la prioridad" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1e] border border-[#252529] shadow-xl rounded-lg text-slate-200">
              {PRIORITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="py-3 px-3 cursor-pointer focus:bg-[#252529]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1 rounded border ${opt.bgBadge}`}
                      >
                        <Icon size={14} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">
                          {opt.label}
                        </span>
                        <span className="text-slate-500 ml-1.5 text-xs">
                          — {opt.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Badge de prioridad seleccionada */}
          {selectedPriority && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold mt-1 ${selectedPriority.bgBadge}`}
            >
              <selectedPriority.icon size={12} />
              Prioridad: {selectedPriority.label}
            </div>
          )}
        </div>

        {/* Campo: Descripción */}
        <div className="space-y-2">
          <label
            htmlFor="ticket-description"
            className="block text-sm font-semibold text-slate-300"
          >
            Descripción Detallada <span className="text-red-500">*</span>
          </label>
          <textarea
            id="ticket-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe la falla con el mayor detalle posible: ubicación exacta, cuándo se detectó, si hay riesgo para los usuarios..."
            disabled={loading}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-[#252529] bg-[#121215] text-slate-200 text-sm
                       placeholder:text-slate-600 resize-none
                       focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
          />
          <p className="text-xs text-slate-500">
            Entre más detallado sea el reporte, más rápido se podrá resolver.
          </p>
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5
                     bg-[#DC2626] hover:bg-[#b91c1c] active:scale-[0.98]
                     text-white font-bold text-sm rounded-lg
                     shadow-lg shadow-red-500/20 hover:shadow-red-500/30
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                     transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando Reporte...
            </>
          ) : (
            <>
              <Send size={18} />
              Enviar Reporte
            </>
          )}
        </button>
      </form>
    </div>
  );
}
