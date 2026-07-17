"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Edit2, Trash2 } from "lucide-react";
import { saveSucursal } from "./actions";

interface CreateBranchModalProps {
  branch?: any;
  children?: React.ReactNode;
}

export default function CreateBranchModal({ branch, children }: CreateBranchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!branch;

  // Closures State
  const [closures, setClosures] = useState<{fecha: string, motivo: string}[]>(
    branch?.specialClosures?.map((c: any) => ({
      fecha: new Date(c.fecha).toISOString().split('T')[0],
      motivo: c.motivo
    })) || []
  );
  
  const [newClosureDate, setNewClosureDate] = useState("");
  const [newClosureMotivo, setNewClosureMotivo] = useState("");

  const handleAddClosure = () => {
    if(newClosureDate && newClosureMotivo) {
       setClosures([...closures, { fecha: newClosureDate, motivo: newClosureMotivo }]);
       setNewClosureDate("");
       setNewClosureMotivo("");
    }
  }

  const handleRemoveClosure = (idx: number) => {
    setClosures(closures.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    if (isEdit) {
      formData.append("id", branch.id.toString());
    }
    
    try {
      await saveSucursal(formData);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children || (
          <Button className="gap-2 bg-[#dc2626] hover:bg-red-700 text-white shadow-md shadow-red-500/20 active:scale-95 transition-all">
            <Plus size={16} />
            Nueva Sucursal
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#1a1a1e] border border-[#252529] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#252529] px-6 py-4 bg-[#121215]">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100">
                  {isEdit ? "Editar Sucursal" : "Nueva Sucursal"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {isEdit ? "Modifica los datos de este punto matriz." : "Añade un nuevo punto físico al sistema matriz."}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)} 
                className="h-8 w-8 p-0 rounded-full hover:bg-[#252529] text-slate-400"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto px-6 py-6">
              <form id="branch-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-200">Información General</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Nombre de Sede</label>
                      <Input name="name" defaultValue={branch?.name} required placeholder="Ej. Centro Norte" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Teléfono (Público)</label>
                      <Input name="phone" type="tel" defaultValue={branch?.phone} placeholder="81 1234 5678" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-200">Ubicación</label>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Dirección</label>
                    <Input name="address" defaultValue={branch?.address} required placeholder="Av. Principal 123" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Ciudad</label>
                      <Input name="city" defaultValue={branch?.city} required placeholder="Monterrey" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Estado / Región</label>
                      <Input name="state" defaultValue={branch?.state} required placeholder="Nuevo León" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-200">Horarios de Atención</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Lunes a Viernes</label>
                      <Input name="horarioLunesViernes" defaultValue={branch?.horarioLunesViernes} placeholder="06:00 - 22:00" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Sábados</label>
                      <Input name="horarioSabado" defaultValue={branch?.horarioSabado} placeholder="08:00 - 18:00" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Domingos</label>
                      <Input name="horarioDomingo" defaultValue={branch?.horarioDomingo} placeholder="Cerrado" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-[#121215] p-4 rounded-lg border border-[#252529]">
                  <label className="text-sm font-bold text-slate-200">Días Inhábiles (Cierres Especiales)</label>
                  
                  {/* List of existing closures */}
                  {closures.length > 0 && (
                    <div className="flex flex-col gap-2 mb-4 mt-2">
                      {closures.map((closure, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#1a1a1e] px-3 py-2 border border-[#252529] rounded-md text-sm">
                          <span className="text-slate-300 font-medium">{closure.fecha} - <span className="font-normal text-slate-500">{closure.motivo}</span></span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveClosure(idx)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new closure miniature form */}
                  <div className="flex flex-col md:flex-row gap-2 items-end mt-2">
                     <div className="flex-1 space-y-1 w-full">
                       <label className="text-xs font-medium text-slate-400">Fecha</label>
                       <Input type="date" value={newClosureDate} onChange={e => setNewClosureDate(e.target.value)} className="border-[#252529] bg-[#1a1a1e] text-slate-200 h-9 text-sm" />
                     </div>
                     <div className="flex-1 space-y-1 w-full">
                       <label className="text-xs font-medium text-slate-400">Motivo</label>
                       <Input type="text" placeholder="Ej. Navidad" value={newClosureMotivo} onChange={e => setNewClosureMotivo(e.target.value)} className="border-[#252529] bg-[#1a1a1e] text-slate-200 h-9 text-sm placeholder:text-slate-600" />
                     </div>
                     <Button type="button" onClick={handleAddClosure} className="h-9 bg-[#252529] hover:bg-[#333338] text-slate-200 shadow-none text-xs px-3 border border-[#333338]">
                       Añadir
                     </Button>
                  </div>
                </div>

                <div className="space-y-2 flex-col mt-4">
                  <label className="text-sm font-bold text-slate-200">Infraestructura e Intranet</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Total Máquinas</label>
                      <Input name="totalMaquinas" type="number" min="0" defaultValue={branch?.totalMaquinas || ""} placeholder="0" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Latitud</label>
                      <Input name="latitud" type="number" step="any" defaultValue={branch?.latitud || ""} placeholder="25.6866" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Longitud</label>
                      <Input name="longitud" type="number" step="any" defaultValue={branch?.longitud || ""} placeholder="-100.3161" className="border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600" />
                    </div>
                  </div>
                </div>

                <input type="hidden" name="email" value={branch?.email || ""} /> 
                <input type="hidden" name="specialClosures" value={JSON.stringify(closures)} />
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[#252529] px-6 py-4 bg-[#121215]">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200 hover:bg-[#252529]">
                Cancelar
              </Button>
              <Button form="branch-form" type="submit" disabled={loading} className="bg-[#dc2626] hover:bg-red-700 text-white shadow-md shadow-red-500/20">
                {loading ? "Guardando..." : "Guardar Sucursal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
