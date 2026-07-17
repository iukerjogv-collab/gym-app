// =============================================================================
// GET/PATCH /api/recruitment/candidates/[id]
// Admin-only: Retrieve or advance a candidate through steps 3-5.
// =============================================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { isValidTransition, STATUS_LABELS } from "@/lib/recruitmentUtils";

// ─── GET: Full candidate detail (expediente digital) ────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const candidate = await prisma.recruitmentCandidate.findUnique({
      where: { id: Number(id) },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidato no encontrado" },
        { status: 404 }
      );
    }

    // Fetch branch name
    const branch = await prisma.branch.findUnique({
      where: { id: candidate.targetBranchId },
      select: { name: true },
    });

    // Parse JSON fields for display
    let partAAnswers = null;
    let partBAnswers = null;
    let selectedAnswers = null;
    try {
      if (candidate.partAAnswers) partAAnswers = JSON.parse(candidate.partAAnswers);
    } catch { /* ignore parse errors */ }
    try {
      if (candidate.partBAnswers) partBAnswers = JSON.parse(candidate.partBAnswers);
    } catch { /* ignore parse errors */ }
    try {
      if (candidate.selectedAnswers) selectedAnswers = JSON.parse(candidate.selectedAnswers);
    } catch { /* ignore parse errors */ }

    return NextResponse.json({
      ...candidate,
      branchName: branch?.name || "Desconocida",
      partAAnswers,
      partBAnswers,
      selectedAnswers,
      statusLabel: STATUS_LABELS[candidate.status] || candidate.status,
    });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return NextResponse.json(
      { error: "Error de servidor" },
      { status: 500 }
    );
  }
}

// ─── PATCH: Advance candidate through steps 3-5 ────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const candidate = await prisma.recruitmentCandidate.findUnique({
      where: { id: Number(id) },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidato no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, referencesNotes, panelScore, panelNotes } = body;

    // If status change requested, validate transition
    if (status && status !== candidate.status) {
      if (!isValidTransition(candidate.status, status)) {
        return NextResponse.json(
          {
            error: `Transición inválida: ${STATUS_LABELS[candidate.status]} → ${STATUS_LABELS[status] || status}`,
          },
          { status: 400 }
        );
      }
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;

    // Step 3: References notes
    if (referencesNotes !== undefined) {
      updateData.referencesNotes = referencesNotes;
    }

    // Step 4: Panel score and notes
    if (panelScore !== undefined) {
      const score = Number(panelScore);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json(
          { error: "El puntaje del panel debe ser entre 0 y 100" },
          { status: 400 }
        );
      }
      updateData.panelScore = score;
    }
    if (panelNotes !== undefined) {
      updateData.panelNotes = panelNotes;
    }

    // Step 5: Hired timestamp
    if (status === "CONTRATADO") {
      updateData.hiredAt = new Date();
    }

    // Discard with reason
    if (status === "DESCARTADO") {
      updateData.discardReason = body.discardReason || "DESCARTE_MANUAL";
    }

    const updated = await prisma.recruitmentCandidate.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      candidate: {
        id: updated.id,
        status: updated.status,
        statusLabel: STATUS_LABELS[updated.status] || updated.status,
      },
    });
  } catch (error) {
    console.error("Error updating candidate:", error);
    return NextResponse.json(
      { error: "Error de servidor al actualizar el candidato" },
      { status: 500 }
    );
  }
}
