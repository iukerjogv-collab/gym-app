// =============================================================================
// GET /api/recruitment/candidates
// Admin-only: Lists all recruitment candidates with funnel counts.
// Supports filtering by ?branchId=X and ?status=Y
// =============================================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { ALL_STATUSES, EXAM_DURATION_MINUTES } from "@/lib/recruitmentUtils";

export async function GET(request: Request) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // ── Continue with normal query ───────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    // Build dynamic filter
    const where: Record<string, unknown> = {};
    if (branchId) where.targetBranchId = Number(branchId);
    if (status) where.status = status;

    // Fetch candidates
    const candidates = await prisma.recruitmentCandidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        fullName: true,
        email: true,
        position: true,
        targetBranchId: true,
        status: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        expiresAt: true,
        partAScore: true,
        partBScore: true,
        discardReason: true,
        panelScore: true,
        hiredAt: true,
      },
    });

    // ── Auto-discard sweep on query results using strict milliseconds ────
    const expiredIdsToUpdate: number[] = [];
    const limitMs = EXAM_DURATION_MINUTES * 60 * 1000;
    const nowMs = Date.now();

    for (const c of candidates) {
      if (c.status === "EN_PROCESO" && c.startedAt) {
        const rawStartedAt = c.startedAt;
        let startedAtMs = rawStartedAt ? new Date(rawStartedAt).getTime() : 0;
        if (isNaN(startedAtMs)) {
          startedAtMs = 0;
        }
        
        const elapsedMs = nowMs - startedAtMs;
        const remainingMs = limitMs - elapsedMs;

        if (remainingMs <= 0 || elapsedMs > limitMs || startedAtMs === 0) {
          expiredIdsToUpdate.push(c.id);
          c.status = "DESCARTADO";
          c.discardReason = "Tiempo expirado/Abandono";
        }
      }
    }

    if (expiredIdsToUpdate.length > 0) {
      await prisma.recruitmentCandidate.updateMany({
        where: { id: { in: expiredIdsToUpdate } },
        data: {
          status: "DESCARTADO",
          discardReason: "Tiempo expirado/Abandono",
        },
      });
      console.log(`[Candidates GET] Auto-descartados en memoria y base de datos ${expiredIdsToUpdate.length} candidato(s) por tiempo expirado`);
    }

    // Fetch branch names for display
    const branchIds = [...new Set(candidates.map((c) => c.targetBranchId))];
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    });
    const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));

    // Build funnel counts
    const funnelCounts: Record<string, number> = {};
    for (const s of ALL_STATUSES) {
      funnelCounts[s] = 0;
    }
    for (const c of candidates) {
      funnelCounts[c.status] = (funnelCounts[c.status] || 0) + 1;
    }

    // Enrich candidates with branch name
    const enriched = candidates.map((c) => ({
      ...c,
      branchName: branchMap[c.targetBranchId] || "Desconocida",
    }));

    return NextResponse.json({
      candidates: enriched,
      funnelCounts,
      total: candidates.length,
    });
  } catch (error) {
    console.error("Error listing candidates:", error);
    return NextResponse.json(
      { error: "Error de servidor" },
      { status: 500 }
    );
  }
}
