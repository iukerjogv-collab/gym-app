import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, CalendarClock } from "lucide-react";
import LeaveActions from "./LeaveActions";
import UsersTableClient from "./UsersTableClient";

// =============================================================================
// Interfaces explícitas (TypeScript estricto)
// =============================================================================

interface LeaveRequestWithUser {
  id: number;
  userId: number;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

// =============================================================================
// Página principal: Directorio de Usuarios + Solicitudes RRHH
// =============================================================================

export default async function UsuariosPage() {
  // ── Auth ──
  const session = await getServerSession();
  if (!session) redirect("/login");

  const isSuperAdmin = session.role === "super-admin";

  // Consulta optimizada: select explícito
  const usersRaw = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      curp: true,
      sueldoBase: true,
      fechaIngreso: true,
      isActive: true,
      roleId: true,
      branchId: true,
      createdAt: true,
      updatedAt: true,
      startTime: true,
      endTime: true,
      role: true,
      branch: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serializar fechas → JSON-safe para el client component
  const users = usersRaw.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    curp: u.curp,
    sueldoBase: u.sueldoBase,
    fechaIngreso: u.fechaIngreso.toISOString(),
    isActive: u.isActive,
    roleId: u.roleId,
    branchId: u.branchId,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    startTime: u.startTime ?? null,
    endTime: u.endTime ?? null,
    role: {
      id: u.role.id,
      name: u.role.name,
      slug: u.role.slug,
    },
    branch: u.branch ? { id: u.branch.id, name: u.branch.name } : null,
  }));

  // Lista de sucursales para el filtro
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const pendingLeaves: LeaveRequestWithUser[] =
    (await prisma.leaveRequest.findMany({
      where: { status: "Pending" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    })) as LeaveRequestWithUser[];

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Usuarios / Staff</h1>
          <p className="text-slate-500 mt-2">
            Gestión de cuentas y accesos del personal
          </p>
        </div>
        <Link href="/dashboard/usuarios/nuevo">
          <Button className="gap-2 bg-[#dc2626] hover:bg-red-700 text-white shadow-md shadow-red-500/20">
            <UserPlus size={16} />
            Crear Usuario
          </Button>
        </Link>
      </div>

      {/* ─── Solicitudes Pendientes de RRHH ───────────────────────── */}
      {pendingLeaves.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <CalendarClock size={20} className="text-yellow-500" /> Solicitudes Pendientes de RRHH
          </h2>
          <div className="rounded-xl border border-yellow-500/20 bg-[#1a1a1e] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#252529] bg-[#121215] text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Empleado</th>
                    <th className="px-6 py-4 font-medium">Tipo</th>
                    <th className="px-6 py-4 font-medium">Fechas</th>
                    <th className="px-6 py-4 font-medium">Motivo</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252529]">
                  {pendingLeaves.map((leave: LeaveRequestWithUser) => (
                    <tr key={leave.id} className="hover:bg-[#252529]/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-200">
                        {leave.user.firstName} {leave.user.lastName}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-300">
                        {leave.type === "Vacation"
                          ? "Vacaciones"
                          : leave.type === "Permission"
                          ? "Permiso"
                          : "Incapacidad"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-300">
                        {leave.startDate.toLocaleDateString("es-MX")} a{" "}
                        {leave.endDate.toLocaleDateString("es-MX")}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <LeaveActions id={leave.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Directorio Activo ────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-200">Directorio Activo</h2>
      </div>

      {/* Client component con filtros, búsqueda y modal */}
      <UsersTableClient users={users} branches={branches} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
