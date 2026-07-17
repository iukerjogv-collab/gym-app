"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitLeaveRequest } from "./actions";
import { Calendar } from "lucide-react";

export default function RequestLeaveForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    try {
      await submitLeaveRequest(formData);
      e.currentTarget.reset();
      alert("Solicitud enviada correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al enviar solicitud.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
        <Calendar size={20} />
        Solicitud de Vacaciones / Permisos
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo de Solicitud</label>
            <select name="type" required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]">
              <option value="Vacation">Vacaciones</option>
              <option value="Permission">Permiso Especial / Personal</option>
              <option value="Sick">Incapacidad Médica</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Motivo Breve</label>
            <Input name="reason" required placeholder="Ej. Viaje familiar, Cita médica" className="border-slate-200 focus-visible:ring-[#1e3a5f]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Fecha de Inicio</label>
            <Input type="date" name="startDate" required className="border-slate-200 focus-visible:ring-[#1e3a5f]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Fecha de Fin (Inclusive)</label>
            <Input type="date" name="endDate" required className="border-slate-200 focus-visible:ring-[#1e3a5f]" />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={loading} className="bg-[#1e3a5f] hover:bg-blue-900 text-white w-full sm:w-auto shadow-md">
            {loading ? "Enviando..." : "Enviar a Recursos Humanos"}
          </Button>
        </div>
      </form>
    </div>
  );
}
