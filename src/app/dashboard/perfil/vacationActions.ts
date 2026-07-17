"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";

export async function submitVacationRequest(data: {
  startDate: string;
  endDate: string;
  requestedDays: number;
  restDays: number;
  coveringEmployee: string;
  reason: string;
}) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("No autorizado");
  }

  const userId = parseInt(session.sub, 10);

  // Validaciones básicas de integridad
  if (!data.startDate || !data.endDate || data.requestedDays <= 0 || !data.reason) {
    throw new Error("Faltan datos obligatorios o son inválidos.");
  }

  // Crear la solicitud en la base de datos
  await prisma.vacationRequest.create({
    data: {
      employeeId: userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      requestedDays: data.requestedDays,
      restDays: data.restDays || 0,
      coveringEmployee: data.coveringEmployee || null,
      reason: data.reason,
      status: "PENDING",
    },
  });

  // Revalidar rutas relevantes
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/vacaciones");
  
  return { success: true };
}
