"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteSucursal } from "./actions";

export default function DeleteBranchButton({ id }: { id: number }) {
  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar permanentemente esta sucursal? Esta acción no se puede deshacer.")) {
      try {
        await deleteSucursal(id);
      } catch (error) {
        console.error("Error deleting branch:", error);
        alert("Ocurrió un error al intentar eliminar la sucursal.");
      }
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10" 
      title="Eliminar"
      onClick={handleDelete}
    >
      <Trash2 size={14} />
    </Button>
  );
}
