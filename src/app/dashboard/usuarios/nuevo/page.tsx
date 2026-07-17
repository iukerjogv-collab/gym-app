import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import bcrypt from "bcryptjs";
import Link from "next/link";
import { ArrowLeft, Save, User, CreditCard, Briefcase, Building2 } from "lucide-react";

// =============================================================================
// Interfaces explícitas (TypeScript estricto)
// =============================================================================

interface Role {
  id: number;
  name: string;
  slug: string;
}

interface Branch {
  id: number;
  name: string;
  isActive: boolean;
}

interface UserCreateData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: number;
  phone: string;
  rfc: string;
  curp: string;
  nss: string;
  sueldoBase: number;
  fechaIngreso: Date;
  branchId: number | null;
}

// =============================================================================
// Página: Alta de nuevo empleado (espejo de la Ficha Maestra)
// =============================================================================

export default async function CrearUsuarioPage() {
  const roles: Role[] = await prisma.role.findMany() as Role[];
  const branches: Branch[] = await prisma.branch.findMany({ orderBy: { name: "asc" } }) as Branch[];

  // ─── Server Action: Crear usuario ──────────────────────────────────
  async function createUsuario(formData: FormData): Promise<void> {
    "use server";

    const email: string = formData.get("email") as string;
    const password: string = formData.get("password") as string;
    const firstName: string = formData.get("firstName") as string;
    const lastName: string = formData.get("lastName") as string;
    const roleId: number = parseInt(formData.get("roleId") as string, 10);
    const phone: string = formData.get("phone") as string;

    // Campos de Nómina / RH
    const rfc: string = (formData.get("rfc") as string) || "";
    const curp: string = (formData.get("curp") as string) || "";
    const nss: string = (formData.get("nss") as string) || "";
    const sueldoBaseStr: string = formData.get("sueldoBase") as string;
    const sueldoBase: number = sueldoBaseStr ? parseFloat(sueldoBaseStr) : 0;
    const fechaIngresoStr: string = formData.get("fechaIngreso") as string;
    const fechaIngreso: Date = fechaIngresoStr ? new Date(fechaIngresoStr) : new Date();
    const branchIdStr: string = formData.get("branchId") as string;
    const branchId: number | null = branchIdStr ? parseInt(branchIdStr, 10) : null;

    const hashedPassword: string = await bcrypt.hash(password, 12);

    const createData: UserCreateData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId,
      phone,
      rfc,
      curp,
      nss,
      sueldoBase,
      fechaIngreso,
      branchId,
    };

    await prisma.user.create({ data: createData });

    revalidatePath("/dashboard/usuarios");
    redirect("/dashboard/usuarios");
  }

  // ─── Fecha de hoy para defaultValue ────────────────────────────────
  const todayISO: string = new Date().toISOString().split("T")[0];

  // Clases reutilizables
  const inputDark = "border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600";
  const selectDark = "flex h-10 w-full rounded-md border border-[#252529] bg-[#121215] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 appearance-none";

  return (
    <div className="p-8 min-h-full">
      {/* ─── Encabezado ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/usuarios">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#252529] bg-[#1a1a1e] text-slate-400 hover:bg-[#252529] hover:text-slate-200">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Alta de Empleado</h1>
          <p className="text-slate-500 mt-1">
            Registra a un nuevo miembro del staff con todos sus datos de RH
          </p>
        </div>
      </div>

      {/* ─── Formulario Principal ────────────────────────────────────── */}
      <div className="max-w-4xl rounded-xl border border-[#252529] bg-[#1a1a1e] shadow-xl overflow-hidden">
        <form action={createUsuario} className="p-0">

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
                <label htmlFor="firstName" className="text-sm font-medium text-slate-400">Nombre(s) <span className="text-red-500">*</span></label>
                <Input id="firstName" name="firstName" required placeholder="Juan" className={inputDark} />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-slate-400">Apellidos <span className="text-red-500">*</span></label>
                <Input id="lastName" name="lastName" required placeholder="Pérez García" className={inputDark} />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-400">Correo Electrónico <span className="text-red-500">*</span></label>
                <Input id="email" name="email" type="email" required placeholder="juan@gym.com" className={inputDark} />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-400">Contraseña Inicial <span className="text-red-500">*</span></label>
                <Input id="password" name="password" type="password" required placeholder="Mínimo 6 caracteres" className={inputDark} />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-400">Teléfono Móvil / Fijo</label>
                <Input id="phone" name="phone" type="tel" placeholder="(614) 123-4567" className={inputDark} />
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
                <Input id="rfc" name="rfc" placeholder="XXXX000000XXX" maxLength={13} className={`${inputDark} uppercase tracking-wider font-mono`} />
              </div>
              <div className="space-y-2">
                <label htmlFor="curp" className="text-sm font-medium text-slate-400">CURP</label>
                <Input id="curp" name="curp" placeholder="XXXX000000XXXXXX00" maxLength={18} className={`${inputDark} uppercase tracking-wider font-mono`} />
              </div>
              <div className="space-y-2">
                <label htmlFor="nss" className="text-sm font-medium text-slate-400">Número de Seguro Social (NSS)</label>
                <Input id="nss" name="nss" placeholder="00000000000" maxLength={11} className={`${inputDark} tracking-wider font-mono`} />
              </div>
              <div className="space-y-2">
                <label htmlFor="sueldoBase" className="text-sm font-medium text-slate-400">Sueldo Base Quincenal ($)</label>
                <Input id="sueldoBase" name="sueldoBase" type="number" step="0.01" defaultValue={0} placeholder="0.00" className={inputDark} />
              </div>
              <div className="space-y-2">
                <label htmlFor="fechaIngreso" className="text-sm font-medium text-slate-400">Fecha de Ingreso</label>
                <Input id="fechaIngreso" name="fechaIngreso" type="date" defaultValue={todayISO} className={inputDark} />
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
                <label htmlFor="roleId" className="text-sm font-medium text-slate-400">Rol en el Sistema <span className="text-red-500">*</span></label>
                <select
                  id="roleId"
                  name="roleId"
                  required
                  className={selectDark}
                >
                  <option value="" className="bg-[#121215] text-slate-400">Selecciona un rol...</option>
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

          {/* ─── Footer con Acciones ──────────────────────────── */}
          <div className="p-6 flex items-center justify-end gap-4 bg-[#121215] border-t border-[#252529]">
            <Link href="/dashboard/usuarios">
              <Button type="button" variant="outline" className="border-[#252529] bg-transparent text-slate-400 hover:bg-[#252529] hover:text-slate-200">Cancelar</Button>
            </Link>
            <Button type="submit" className="gap-2 bg-[#dc2626] hover:bg-red-700 text-white shadow-md shadow-red-500/20">
              <Save size={16} /> Dar de Alta al Empleado
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
