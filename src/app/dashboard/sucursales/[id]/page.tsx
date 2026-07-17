import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAdmin } from "@/lib/auth";

export default async function EditarSucursalPage({ params }: { params: { id: string } }) {
  const isAuthorized = await isAdmin();
  
  if (!isAuthorized) {
    redirect("/dashboard/sucursales?error=unauthorized");
  }

  const branchId = parseInt(params.id, 10);
  
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    redirect("/dashboard/sucursales");
  }

  async function updateSucursal(formData: FormData) {
    "use server";

    const isAuth = await isAdmin();
    if (!isAuth) throw new Error("No autorizado");

    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    await prisma.branch.update({
      where: { id: branchId },
      data: {
        name,
        address,
        city,
        state,
        phone,
        email,
      },
    });

    revalidatePath("/dashboard/sucursales");
    redirect("/dashboard/sucursales");
  }

  async function toggleBranchStatus() {
    "use server";
    
    const isAuth = await isAdmin();
    if (!isAuth) throw new Error("No autorizado");

    await prisma.branch.update({
      where: { id: branchId },
      data: { isActive: !branch?.isActive },
    });

    revalidatePath("/dashboard/sucursales");
    redirect("/dashboard/sucursales");
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/sucursales">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Sucursal</h1>
          <p className="text-muted-foreground mt-2">
            Modifica la ubicación y contacto de la sede
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <form action={updateSucursal} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la Sucursal</label>
                <Input name="name" required defaultValue={branch.name} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección Física</label>
                <Input name="address" defaultValue={branch.address || ""} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ciudad</label>
                  <Input name="city" defaultValue={branch.city || ""} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado / Región</label>
                  <Input name="state" defaultValue={branch.state || ""} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono de Contacto</label>
                  <Input name="phone" type="tel" defaultValue={branch.phone || ""} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo Electrónico (Sede)</label>
                  <Input name="email" type="email" defaultValue={branch.email || ""} />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 items-center">
                <Link href="/dashboard/sucursales">
                   <Button type="button" variant="ghost">Cancelar</Button>
                </Link>
                <Button type="submit">Actualizar Sucursal</Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 border-red-200 dark:border-red-900/30">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Estado de la Sede</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {branch.isActive 
                ? "Al cerrar la sucursal, los usuarios y ventas no podrán ser asignadas a esta sede."
                : "Al reactivarla, la sede volverá a estar disponible en el sistema."}
            </p>
            <form action={toggleBranchStatus}>
              <Button type="submit" variant={branch.isActive ? "destructive" : "default"} className="w-full">
                {branch.isActive ? "Cerrar (Inactivar) Sucursal" : "Reactivar Sucursal"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
