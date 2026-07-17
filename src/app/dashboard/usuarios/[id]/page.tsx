import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle, User, Briefcase, Building2, CreditCard, ShieldCheck } from "lucide-react";
import bcrypt from "bcryptjs";
import { isAdmin } from "@/lib/auth";

// =============================================================================
// Interfaces explícitas (TypeScript estricto)
// =============================================================================

interface Role {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Branch {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

interface UserWithRelations {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  rfc: string | null;
  curp: string | null;
  nss: string | null;
  sueldoBase: number;
  fechaIngreso: Date;
  isActive: boolean;
  roleId: number;
  branchId: number | null;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  branch: Branch | null;
}

interface UserUpdateData {
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  phone: string;
  rfc: string;
  nss: string;
  curp: string;
  sueldoBase: number;
  branchId: number | null;
  fechaIngreso?: Date;
  password?: string;
}

interface ModuleData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// =============================================================================
// Ficha Maestra de RH — Vista única de empleado
// =============================================================================

export default async function FichaMaestraRHPage({ params }: PageProps) {
  const isAuthorized: boolean = await isAdmin();

  if (!isAuthorized) {
    redirect("/dashboard/usuarios?error=unauthorized");
  }

  const { id } = await params;
  const userId: number = parseInt(id, 10);

  const user: UserWithRelations | null = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, branch: true },
  }) as UserWithRelations | null;

  if (!user) {
    redirect("/dashboard/usuarios");
  }

  const roles: Role[] = await prisma.role.findMany() as Role[];
  const branches: Branch[] = await prisma.branch.findMany({ orderBy: { name: "asc" } }) as Branch[];
  const modules: ModuleData[] = await prisma.module.findMany({ 
    where: { isActive: true }, 
    orderBy: { sortOrder: "asc" } 
  }) as ModuleData[];

  // ─── Server Action: Actualizar Ficha Maestra ────────────────────────
  async function updateUsuario(formData: FormData): Promise<void> {
    "use server";

    const isAuth: boolean = await isAdmin();
    if (!isAuth) throw new Error("No autorizado");

    const email: string = formData.get("email") as string;
    const firstName: string = formData.get("firstName") as string;
    const lastName: string = formData.get("lastName") as string;
    const roleId: number = parseInt(formData.get("roleId") as string, 10);
    const phone: string = formData.get("phone") as string;
    const password: string = formData.get("password") as string;

    // Campos de Nómina / RH
    const rfc: string = formData.get("rfc") as string;
    const nss: string = formData.get("nss") as string;
    const curp: string = formData.get("curp") as string;
    const sueldoBaseStr: string = formData.get("sueldoBase") as string;
    const sueldoBase: number = sueldoBaseStr ? parseFloat(sueldoBaseStr) : 0;
    const branchIdStr: string = formData.get("branchId") as string;
    const branchId: number | null = branchIdStr ? parseInt(branchIdStr, 10) : null;
    const fechaIngresoStr: string = formData.get("fechaIngreso") as string;
    const fechaIngreso: Date | undefined = fechaIngresoStr ? new Date(fechaIngresoStr) : undefined;

    const updateData: UserUpdateData = {
      email,
      firstName,
      lastName,
      roleId,
      phone,
      rfc,
      nss,
      curp,
      sueldoBase,
      branchId,
      ...(fechaIngreso && { fechaIngreso }),
    };

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/dashboard/usuarios");
    redirect("/dashboard/usuarios");
  }

  // ─── Server Action: Dar de baja / Reingresar ───────────────────────
  async function toggleUserStatus(): Promise<void> {
    "use server";

    const isAuth: boolean = await isAdmin();
    if (!isAuth) throw new Error("No autorizado");

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user?.isActive },
    });

    revalidatePath("/dashboard/usuarios");
    redirect("/dashboard/usuarios");
  }

  // ─── Cálculos para badges ──────────────────────────────────────────
  const antigüedad: string = (() => {
    const diff = Date.now() - new Date(user.fechaIngreso).getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    if (years > 0) return `${years} año${years > 1 ? "s" : ""}, ${months} mes${months !== 1 ? "es" : ""}`;
    return `${months} mes${months !== 1 ? "es" : ""}`;
  })();

  // Clases reutilizables para inputs dark mode
  const inputDark = "border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600";
  const selectDark = "flex h-10 w-full rounded-md border border-[#252529] bg-[#121215] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 appearance-none";

  return (
    <div className="p-8 min-h-full">
      {/* ─── Encabezado ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/usuarios">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#252529] bg-[#1a1a1e] text-slate-400 hover:bg-[#252529] hover:text-slate-200">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Ficha Maestra de RH</h1>
            <p className="text-slate-500 mt-1">
              {user.firstName} {user.lastName} — {user.role.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 bg-[#1a1a1e] px-3 py-1.5 rounded-full border border-[#252529]">
            Antigüedad: {antigüedad}
          </span>
          <span className={`text-sm font-semibold px-4 py-2 rounded-full border ${user.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            {user.isActive ? "● Activo" : "● Inactivo"}
          </span>
        </div>
      </div>

      {/* ─── Grid Principal ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ═══ Columna Principal (3/4) ═══ */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-[#252529] bg-[#1a1a1e] shadow-xl overflow-hidden">
            <form action={updateUsuario} className="p-0">

              {/* ─── Sección 1: Datos Personales y Sesión ─────────────── */}
              <div className="p-6 border-b border-[#252529] bg-[#121215]">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <User size={16} className="text-blue-400" />
                  </div>
                  <h2 className="text-base font-bold text-slate-100">Información Personal y Sesión</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-slate-400">Nombre(s)</label>
                    <Input id="firstName" name="firstName" required defaultValue={user.firstName} className={inputDark} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-slate-400">Apellidos</label>
                    <Input id="lastName" name="lastName" required defaultValue={user.lastName} className={inputDark} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-400">Correo Electrónico</label>
                    <Input id="email" name="email" type="email" required defaultValue={user.email} className={inputDark} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-400">Nueva Contraseña</label>
                    <Input id="password" name="password" type="password" placeholder="Solo si deseas cambiarla..." className={inputDark} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-slate-400">Teléfono Móvil / Fijo</label>
                    <Input id="phone" name="phone" type="tel" defaultValue={user.phone || ""} className={inputDark} />
                  </div>
                </div>
              </div>

              {/* ─── Sección 2: Datos de RH / Nómina ────────────────── */}
              <div className="p-6 border-b border-[#252529]">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CreditCard size={16} className="text-emerald-400" />
                  </div>
                  <h2 className="text-base font-bold text-slate-100">Datos de Recursos Humanos (Nómina)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="rfc" className="text-sm font-medium text-slate-400">RFC</label>
                    <Input id="rfc" name="rfc" defaultValue={user.rfc || ""} placeholder="XXXX000000XXX" maxLength={13} className={`${inputDark} uppercase tracking-wider font-mono`} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="curp" className="text-sm font-medium text-slate-400">CURP</label>
                    <Input id="curp" name="curp" defaultValue={user.curp || ""} placeholder="XXXX000000XXXXXX00" maxLength={18} className={`${inputDark} uppercase tracking-wider font-mono`} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="nss" className="text-sm font-medium text-slate-400">Número de Seguro Social (NSS)</label>
                    <Input id="nss" name="nss" defaultValue={user.nss || ""} placeholder="00000000000" maxLength={11} className={`${inputDark} tracking-wider font-mono`} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="sueldoBase" className="text-sm font-medium text-slate-400">Sueldo Base Quincenal ($)</label>
                    <Input id="sueldoBase" name="sueldoBase" type="number" step="0.01" defaultValue={user.sueldoBase} className={inputDark} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fechaIngreso" className="text-sm font-medium text-slate-400">Fecha de Ingreso</label>
                    <Input id="fechaIngreso" name="fechaIngreso" type="date" defaultValue={user.fechaIngreso.toISOString().split("T")[0]} className={inputDark} />
                  </div>
                </div>
              </div>

              {/* ─── Sección 3: Puesto y Sucursal ──────────────────── */}
              <div className="p-6 border-b border-[#252529] bg-[#121215]">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Briefcase size={16} className="text-purple-400" />
                  </div>
                  <h2 className="text-base font-bold text-slate-100">Asignación de Puesto y Área</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="roleId" className="text-sm font-medium text-slate-400">Rol en el Sistema</label>
                    <select
                      id="roleId"
                      name="roleId"
                      required
                      defaultValue={user.roleId}
                      className={selectDark}
                    >
                      {roles.map((r: Role) => (
                        <option key={r.id} value={r.id} className="bg-[#121215] text-slate-200">{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="branchId" className="text-sm font-medium text-slate-400">
                      <Building2 size={14} className="inline mr-1 -mt-0.5" />
                      Sucursal Base (Opcional)
                    </label>
                    <select
                      id="branchId"
                      name="branchId"
                      defaultValue={user.branchId || ""}
                      className={selectDark}
                    >
                      <option value="" className="bg-[#121215] text-slate-200">Sin Asignar (Sede Central / Global)</option>
                      {branches.map((b: Branch) => (
                        <option key={b.id} value={b.id} className="bg-[#121215] text-slate-200">{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ─── Sección 4: Permisos Especiales ──────────────────── */}
              <div className="p-6 border-b border-[#252529]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <ShieldCheck size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Permisos Especiales (Sobreescritura)</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Habilita accesos extra que típicamente no pertenecen al rol base de este empleado. 
                      (El bloqueo por Rol seguirá siendo la capa principal de seguridad).
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map((mod) => (
                    <label 
                      key={mod.id} 
                      className="flex items-start justify-between p-4 rounded-xl border border-[#252529] bg-[#121215] cursor-pointer hover:bg-[#252529]/50 transition-colors"
                    >
                      <div className="pr-4">
                        <span className="font-bold text-slate-200 block text-sm">{mod.name}</span>
                        <span className="text-xs text-slate-500">{mod.description || `Módulo de ${mod.name}`}</span>
                      </div>
                      
                      <div className="relative inline-flex items-center cursor-pointer mt-1">
                        <input type="checkbox" name={`permission_${mod.id}`} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[#252529] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#dc2626] peer-checked:after:bg-white"></div>
                      </div>
                    </label>
                  ))}
                  
                  {modules.length === 0 && (
                    <div className="col-span-full py-4 text-center text-sm font-medium text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      ⚠ No hay módulos registrados en el sistema para sobreescribir.
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Footer con Acciones ──────────────────────────── */}
              <div className="p-6 flex items-center justify-end gap-4 bg-[#121215] border-t border-[#252529]">
                <Link href="/dashboard/usuarios">
                  <Button type="button" variant="outline" className="border-[#252529] bg-transparent text-slate-400 hover:bg-[#252529] hover:text-slate-200">Cancelar</Button>
                </Link>
                <Button type="submit" className="gap-2 bg-[#dc2626] hover:bg-red-700 text-white shadow-md shadow-red-500/20">
                  <Save size={16} /> Guardar Ficha Maestra
                </Button>
              </div>

            </form>
          </div>
        </div>

        {/* ═══ Columna Lateral (1/4) — Zona de Riesgo ═══ */}
        <div className="lg:col-span-1 space-y-6">
          {/* ─── Zona de Riesgo ───────────────────────────────────── */}
          <div className="rounded-xl border border-red-500/20 bg-[#1a1a1e] shadow-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-500" size={22} />
              <h3 className="text-base font-bold text-red-400">Zona de Riesgo</h3>
            </div>

            <p className="text-sm text-slate-400 mb-6 font-medium">
              {user.isActive
                ? "Al dar de baja al empleado, perderá inmediatamente el acceso al sistema operativo y POS."
                : "Al reingresar al empleado, recuperará el nivel de acceso asignado en la Ficha Maestra."}
            </p>
            <form action={toggleUserStatus}>
              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold border transition-all active:scale-95 ${
                  user.isActive
                    ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                {user.isActive ? "Dar de Baja al Empleado" : "Reingresar al Empleado"}
              </button>
            </form>
          </div>

          {/* ─── Resumen rápido ─────────────────────────────────── */}
          <div className="rounded-xl border border-[#252529] bg-[#1a1a1e] shadow-xl p-6">
            <h3 className="text-sm font-bold text-slate-100 mb-4">Resumen Rápido</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-[#252529]">
                <dt className="text-slate-500">Sucursal</dt>
                <dd className="font-medium text-slate-200">{user.branch?.name || "Global"}</dd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#252529]">
                <dt className="text-slate-500">Rol</dt>
                <dd className="font-medium text-slate-200">{user.role.name}</dd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#252529]">
                <dt className="text-slate-500">RFC</dt>
                <dd className="font-mono text-xs text-slate-200">{user.rfc || "—"}</dd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#252529]">
                <dt className="text-slate-500">NSS</dt>
                <dd className="font-mono text-xs text-slate-200">{user.nss || "—"}</dd>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <dt className="text-slate-500">Sueldo</dt>
                <dd className="font-semibold text-emerald-400">
                  ${user.sueldoBase.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
