// =============================================================================
// POST /api/recruitment/expire
// Internal/Cron endpoint: Auto-discards candidates whose exam timer expired.
// Finds all EN_PROCESO candidates with expiresAt < now() and marks DESCARTADO.
// =============================================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const now = new Date();

    // Find expired candidates
    const expired = await prisma.recruitmentCandidate.findMany({
      where: {
        status: "EN_PROCESO",
        expiresAt: { lt: now },
      },
      select: { id: true, fullName: true },
    });

    if (expired.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay candidatos expirados",
        count: 0,
      });
    }

    // Batch update to DESCARTADO
    const expiredIds = expired.map((c) => c.id);

    await prisma.recruitmentCandidate.updateMany({
      where: { id: { in: expiredIds } },
      data: {
        status: "DESCARTADO",
        discardReason: "TIEMPO_EXPIRADO",
      },
    });

    console.log(`[Recruitment Expire] Discarded ${expired.length} expired candidates:`,
      expired.map((c) => `${c.id}-${c.fullName}`).join(", ")
    );

    return NextResponse.json({
      success: true,
      message: `${expired.length} candidato(s) descartado(s) por tiempo expirado`,
      count: expired.length,
      candidates: expired,
    });
  } catch (error) {
    console.error("Error expiring candidates:", error);
    return NextResponse.json(
      { error: "Error de servidor al expirar candidatos" },
      { status: 500 }
    );
  }
}
