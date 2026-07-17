"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// =============================================================================
// Leave Request Actions
// =============================================================================

export async function approveLeaveRequest(id: number) {
  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "Approved" },
  });
  revalidatePath("/dashboard/usuarios");
}

export async function rejectLeaveRequest(id: number) {
  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "Rejected" },
  });
  revalidatePath("/dashboard/usuarios");
}

// =============================================================================
// Restablecer Contraseña (Admin)
// =============================================================================

interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

export async function resetUserPassword(
  userId: number,
  newPassword: string
): Promise<ResetPasswordResult> {
  try {
    // Validación de seguridad básica
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
      };
    }

    // Hash con bcrypt (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    revalidatePath("/dashboard/usuarios");
    return { success: true };
  } catch (error) {
    console.error("[resetUserPassword] Error:", error);
    return {
      success: false,
      error: "Error al actualizar la contraseña. Intenta de nuevo.",
    };
  }
}

// =============================================================================
// Actualizar Horario Base de Usuario (fallback)
// =============================================================================

export async function updateUserSchedule(userId: number, startTime: string, endTime: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { startTime, endTime },
    });
    
    revalidatePath("/dashboard/usuarios");
    revalidatePath("/dashboard/reportes");
    return { success: true };
  } catch (error) {
    console.error("[updateUserSchedule] Error:", error);
    return { success: false, error: "Error al actualizar horario." };
  }
}



