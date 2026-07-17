import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import VacationAdminClient from "./VacationAdminClient";
import { getAnniversaryRange, calculateTotalVacationDays } from "@/lib/vacationUtils";


export default async function VacacionesAdminPage() {
  // 1. Validar autenticación de administrador a nivel de ruta
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const roleLower = session.role.toLowerCase();
  const isAdminRole = roleLower === "admin" || roleLower === "super-admin";
  if (!isAdminRole) {
    redirect("/dashboard");
  }

  // 2. Cargar sucursales para el filtro
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 3. Cargar todos los empleados con sus solicitudes e información de balance
  const employeesRaw = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fechaIngreso: true,
      branchId: true,
      isActive: true,
      role: {
        select: { name: true },
      },
      vacationRequests: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          requestedDays: true,
          restDays: true,
          coveringEmployee: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { firstName: "asc" },
  });

  // Procesar y calcular saldos en tiempo real de forma segura (con candado de reset anual)
  const employees = employeesRaw.map((emp) => {
    const anniversary = getAnniversaryRange(emp.fechaIngreso);
    const totalDays = calculateTotalVacationDays(anniversary.years);
    
    // Suma de días aprobados dentro del año de antigüedad actual
    const approvedRequestsRaw = emp.vacationRequests
      .filter((r) => r.status === "APPROVED" && r.startDate >= anniversary.start && r.startDate < anniversary.end);
      
    const approvedDays = approvedRequestsRaw.reduce((sum, r) => sum + r.requestedDays, 0);
    const remainingDays = totalDays - approvedDays;

    const approvedRequests = approvedRequestsRaw.map((r) => ({
      id: r.id,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      requestedDays: r.requestedDays,
      restDays: r.restDays,
      coveringEmployee: r.coveringEmployee,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      puesto: emp.role.name,
      fechaIngreso: emp.fechaIngreso.toISOString(),
      branchId: emp.branchId,
      isActive: emp.isActive,
      totalDays,
      usedDays: approvedDays,
      remainingDays,
      approvedRequests,
    };
  });

  // 4. Cargar solicitudes pendientes (PENDING) para el contenedor de notificaciones
  const pendingRequestsRaw = await prisma.vacationRequest.findMany({
    where: { status: "PENDING" },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          branch: {
            select: { name: true },
          },
          role: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const pendingRequests = pendingRequestsRaw.map((req) => ({
    id: req.id,
    employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
    employeeId: req.employee.id,
    puesto: req.employee.role.name,
    branchName: req.employee.branch?.name || "Sin Sucursal",
    startDate: req.startDate.toISOString(),
    endDate: req.endDate.toISOString(),
    requestedDays: req.requestedDays,
    restDays: req.restDays,
    coveringEmployee: req.coveringEmployee,
    reason: req.reason,
    createdAt: req.createdAt.toISOString(),
  }));

  return (
    <div className="p-8 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Control de Vacaciones</h1>
        <p className="text-slate-500 mt-2">
          Panel de administración y control de saldos del personal de Training Zone
        </p>
      </div>

      <VacationAdminClient
        initialEmployees={employees}
        initialPendingRequests={pendingRequests}
        branches={branches}
      />
    </div>
  );
}
