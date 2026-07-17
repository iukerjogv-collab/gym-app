// =============================================================================
// POST /api/recruitment/generate
// Admin-only: Generates a unique recruitment link for a candidate.
// =============================================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // Auth check — admin only
    const session = await getServerSession();
    if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // safe fallback
    }

    const fullName = body?.fullName;
    const email = body?.email;
    const targetBranchId = body?.targetBranchId;
    const position = body?.position || "COORDINADOR";

    // Validation
    if (!fullName?.trim() || !email?.trim() || !targetBranchId) {
      return NextResponse.json(
        { error: "Nombre, correo y sucursal destino son obligatorios" },
        { status: 400 }
      );
    }

    // Validate branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: Number(targetBranchId) },
      select: { id: true, name: true },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "La sucursal especificada no existe" },
        { status: 404 }
      );
    }

    // Generate cryptographic token
    const token = crypto.randomUUID();

    // Create candidate record
    const candidate = await prisma.recruitmentCandidate.create({
      data: {
        token,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        targetBranchId: Number(targetBranchId),
        position: position || "COORDINADOR",
        status: "LINK_ENVIADO",
      },
    });

    // Build public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const publicUrl = `${baseUrl}/join/recruitment/${token}`;

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        token: candidate.token,
        position: candidate.position,
        branchName: branch.name,
      },
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error generating recruitment link:", error);
    return NextResponse.json(
      { error: "Error de servidor al generar el enlace" },
      { status: 500 }
    );
  }
}
