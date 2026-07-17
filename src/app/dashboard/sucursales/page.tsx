import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Edit2 } from "lucide-react";
import CreateBranchModal from "./CreateBranchModal";
import DeleteBranchButton from "./DeleteBranchButton";

export default async function SucursalesPage() {
  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "desc" },
    include: { specialClosures: true },
  });

  return (
    <div className="p-8 min-h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Sucursales</h1>
          <p className="text-slate-500 mt-2">
            Administración de sedes y puntos físicos
          </p>
        </div>
        <CreateBranchModal />
      </div>

      <div className="rounded-xl border border-[#252529] bg-[#1a1a1e] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-[#252529] bg-[#121215] text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Ciudad/Estado</th>
                <th className="px-6 py-4 font-medium">Contacto</th>
                <th className="px-6 py-4 font-medium">Horario</th>
                <th className="px-6 py-4 font-medium">Máquinas</th>
                <th className="px-6 py-4 font-medium">Estatus</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252529]">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No hay sucursales registradas
                  </td>
                </tr>
              ) : (
                branches.map((branch: any) => (
                  <tr key={branch.id} className="hover:bg-[#252529]/30 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2 text-slate-200">
                      <MapPin size={16} className="text-[#dc2626]" />
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {branch.city ? `${branch.city}, ${branch.state}` : 'N/D'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-300">{branch.phone || 'N/D'}</span>
                        <span className="text-xs text-slate-500">{branch.email || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400"><strong className="font-semibold text-slate-300">L-V:</strong> {branch.horarioLunesViernes || 'N/D'}</span>
                        <span className="text-slate-400"><strong className="font-semibold text-slate-300">Sáb:</strong> {branch.horarioSabado || 'N/D'}</span>
                        <span className="text-slate-400"><strong className="font-semibold text-slate-300">Dom:</strong> {branch.horarioDomingo || 'N/D'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300">
                      {branch.totalMaquinas || 0}
                    </td>
                    <td className="px-6 py-4">
                      {branch.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                          Operativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Cerrada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <CreateBranchModal branch={branch}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/10" title="Editar">
                            <Edit2 size={14} />
                          </Button>
                        </CreateBranchModal>
                        <DeleteBranchButton id={branch.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
