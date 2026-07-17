"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";

import { getAnniversaryRange, calculateTotalVacationDays } from "@/lib/vacationUtils";


// Verificar si el usuario actual es administrador o super-administrador
async function checkAdminAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("No autorizado");
  }
  const roleLower = session.role.toLowerCase();
  const isAdminRole = roleLower === "admin" || roleLower === "super-admin";
  if (!isAdminRole) {
    throw new Error("Acceso denegado: Se requieren privilegios de administrador.");
  }
  return session;
}

export async function approveVacationRequest(requestId: number) {
  await checkAdminAuth();

  // 1. Obtener la solicitud
  const request = await prisma.vacationRequest.findUnique({
    where: { id: requestId },
    include: { employee: true },
  });

  if (!request) {
    throw new Error("Solicitud no encontrada.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Esta solicitud ya ha sido resuelta.");
  }

  // 2. Actualizar el estado de la solicitud a APPROVED
  await prisma.vacationRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      resolvedAt: new Date(),
    },
  });

  // 3. Recalcular antigüedad y saldo del empleado para el año de antigüedad cursado actualmente
  const employee = request.employee;
  const anniversary = getAnniversaryRange(employee.fechaIngreso);
  const totalDays = calculateTotalVacationDays(anniversary.years);

  // Obtener la suma total de días tomados (únicamente solicitudes aprobadas dentro del año de antigüedad actual)
  const approvedRequests = await prisma.vacationRequest.findMany({
    where: {
      employeeId: employee.id,
      status: "APPROVED",
      startDate: {
        gte: anniversary.start,
        lt: anniversary.end,
      },
    },
    select: {
      requestedDays: true,
    },
  });

  const usedDays = approvedRequests.reduce((sum, req) => sum + req.requestedDays, 0);
  const remainingDays = totalDays - usedDays;

  // 4. Actualizar o crear el saldo en VacationBalance
  await prisma.vacationBalance.upsert({
    where: { userId: employee.id },
    update: {
      totalDays,
      usedDays,
      remainingDays,
    },
    create: {
      userId: employee.id,
      totalDays,
      usedDays,
      remainingDays,
    },
  });

  // Revalidar las vistas
  revalidatePath("/dashboard/vacaciones");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/usuarios");

  return { success: true };
}

export async function rejectVacationRequest(requestId: number) {
  await checkAdminAuth();

  // 1. Obtener la solicitud
  const request = await prisma.vacationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Solicitud no encontrada.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Esta solicitud ya ha sido resuelta.");
  }

  // 2. Actualizar el estado de la solicitud a REJECTED
  await prisma.vacationRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      resolvedAt: new Date(),
    },
  });

  // Revalidar las vistas
  revalidatePath("/dashboard/vacaciones");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/usuarios");

  return { success: true };
}

export async function createHistoricAdjustment(
  userId: number,
  days: number,
  reason: string
) {
  await checkAdminAuth();

  // 1. Crear la solicitud de vacaciones ya aprobada
  const now = new Date();
  await prisma.vacationRequest.create({
    data: {
      employeeId: userId,
      startDate: now,
      endDate: now,
      requestedDays: days,
      restDays: 0,
      coveringEmployee: "Ajuste Histórico",
      reason: reason || "Ajuste de días tomados previo a la intranet",
      status: "APPROVED",
      resolvedAt: now,
    },
  });

  // 2. Recalcular saldo del empleado para el año de antigüedad cursado actualmente
  const employee = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!employee) {
    throw new Error("Empleado no encontrado.");
  }

  const anniversary = getAnniversaryRange(employee.fechaIngreso);
  const totalDays = calculateTotalVacationDays(anniversary.years);

  // Obtener la suma total de días tomados (únicamente solicitudes aprobadas dentro del año de antigüedad actual)
  const approvedRequests = await prisma.vacationRequest.findMany({
    where: {
      employeeId: userId,
      status: "APPROVED",
      startDate: {
        gte: anniversary.start,
        lt: anniversary.end,
      },
    },
    select: {
      requestedDays: true,
    },
  });

  const usedDays = approvedRequests.reduce((sum, req) => sum + req.requestedDays, 0);
  const remainingDays = totalDays - usedDays;

  // 3. Actualizar o crear saldo en VacationBalance
  await prisma.vacationBalance.upsert({
    where: { userId },
    update: {
      totalDays,
      usedDays,
      remainingDays,
    },
    create: {
      userId,
      totalDays,
      usedDays,
      remainingDays,
    },
  });

  revalidatePath("/dashboard/vacaciones");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/usuarios");

  return { success: true };
}
