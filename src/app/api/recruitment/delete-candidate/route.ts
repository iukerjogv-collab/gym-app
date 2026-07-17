// =============================================================================
// POST /api/recruitment/delete-candidate
// Admin-only: Deletes a recruitment candidate after verifying admin credentials.
// =============================================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // 1. Auth check: verify current session is admin or super-admin
    const session = await getServerSession();
    if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 2. Parse and validate body parameters
    const body = await request.json();
    const { candidateId, password } = body;

    if (!candidateId || !password) {
      return NextResponse.json(
        { error: "El ID del candidato y la contraseña de administrador son requeridos." },
        { status: 400 }
      );
    }

    // 3. Find the administrator user in the database
    const adminUser = await prisma.user.findUnique({
      where: { id: Number(session.sub) },
      include: { role: true },
    });

    if (
      !adminUser ||
      !adminUser.isActive ||
      (adminUser.role.slug !== "admin" && adminUser.role.slug !== "super-admin")
    ) {
      return NextResponse.json(
        { error: "Administrador no válido o inactivo." },
        { status: 403 }
      );
    }

    // 4. Verify password with bcryptjs
    const isValid = await bcrypt.compare(password, adminUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Contraseña de administrador incorrecta." },
        { status: 401 }
      );
    }

    // 5. Delete candidate records
    await prisma.recruitmentCandidate.delete({
      where: { id: Number(candidateId) },
    });

    return NextResponse.json({
      success: true,
      message: "Candidato eliminado permanentemente con éxito.",
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { error: "Error de servidor al eliminar el candidato." },
      { status: 500 }
    );
  }
}
