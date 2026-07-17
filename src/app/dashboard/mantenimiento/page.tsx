import NuevoTicketForm from "./NuevoTicketForm";
import TicketsTable from "./TicketsTable";
import { Wrench } from "lucide-react";

export default function MantenimientoPage() {
  return (
    <div className="space-y-6 p-6 min-h-full">
      {/* Encabezado de Módulo */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Wrench className="text-amber-400" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Nuevo Ticket
          </h1>
          <p className="text-sm text-slate-500">
            Reporta fallas de equipo y da seguimiento a las solicitudes de reparación.
          </p>
        </div>
      </div>

      {/* Formulario de Nuevo Ticket */}
      <NuevoTicketForm />

      {/* Monitor de Tickets */}
      <TicketsTable />
    </div>
  );
}
