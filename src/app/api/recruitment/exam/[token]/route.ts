// =============================================================================
// GET/POST /api/recruitment/exam/[token]
// Public endpoints for the candidate exam flow.
// GET  — Activates timer on first visit, returns exam data or blocked status.
// POST — Receives answers, evaluates with threshold scoring, sets final status.
// =============================================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  EXAM_DURATION_MINUTES,
  evaluateFullExam,
} from "@/lib/recruitmentUtils";
import { getQuestionsForPosition } from "@/lib/positionQuestions";

// ─── GET: Candidate opens the exam link ─────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const candidate = await prisma.recruitmentCandidate.findUnique({
      where: { token },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Enlace inválido o no encontrado" },
        { status: 404 }
      );
    }

    // ── Already discarded or completed ──
    if (candidate.status === "DESCARTADO") {
      return NextResponse.json(
        { blocked: true, reason: "DESCARTADO", message: "Este examen ha sido descartado." },
        { status: 403 }
      );
    }

    if (["FILTRO_APROBADO", "REFERENCIAS", "PANEL_DIRECTIVO", "CONTRATADO"].includes(candidate.status)) {
      return NextResponse.json(
        { blocked: true, reason: "COMPLETADO", message: "Este examen ya fue completado." },
        { status: 403 }
      );
    }

    // ── First visit: welcome/instructions (LINK_ENVIADO) ──
    // Do NOT start the timer or set startedAt/expiresAt in DB yet
    if (candidate.status === "LINK_ENVIADO") {
      return NextResponse.json({
        active: true,
        started: false,
        candidateName: candidate.fullName,
        position: candidate.position,
        timeRemainingSeconds: EXAM_DURATION_MINUTES * 60,
      });
    }

    // ── Returning visit while EN_PROCESO: check if timer expired ──
    if (candidate.status === "EN_PROCESO") {
      const nowMs = Date.now();
      const rawStartedAt = candidate.startedAt;
      let startedAtMs = rawStartedAt ? new Date(rawStartedAt).getTime() : 0;
      if (isNaN(startedAtMs)) {
        startedAtMs = 0;
      }

      const elapsedMs = nowMs - startedAtMs;
      const limitMs = EXAM_DURATION_MINUTES * 60 * 1000;
      const remainingMs = limitMs - elapsedMs;
      
      let timeRemainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

      if (timeRemainingSeconds <= 0 || elapsedMs > limitMs || startedAtMs === 0) {
        timeRemainingSeconds = 0;
        // Timer expired — auto-discard
        await prisma.recruitmentCandidate.update({
          where: { id: candidate.id },
          data: {
            status: "DESCARTADO",
            discardReason: "Tiempo expirado/Abandono",
          },
        });

        return NextResponse.json(
          { blocked: true, reason: "TIEMPO_EXPIRADO", message: "El tiempo del examen ha expirado." },
          { status: 403 }
        );
      }

      // Still active — return remaining time
      return NextResponse.json({
        active: true,
        started: true,
        candidateName: candidate.fullName,
        position: candidate.position,
        timeRemainingSeconds,
        startedAt: candidate.startedAt!.toISOString(),
        expiresAt: new Date(startedAtMs + limitMs).toISOString(),
      });
    }

    // Fallback
    return NextResponse.json(
      { error: "Estado desconocido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in exam GET:", error);
    return NextResponse.json(
      { error: "Error de servidor" },
      { status: 500 }
    );
  }
}

// ─── POST: Candidate submits exam answers or starts the exam ──────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const candidate = await prisma.recruitmentCandidate.findUnique({
      where: { token },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Enlace inválido" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // ── Handle start trigger ──
    if (body?.action === "start") {
      if (candidate.status !== "LINK_ENVIADO" && candidate.status !== "EN_PROCESO") {
        return NextResponse.json(
          { error: "No se puede iniciar el examen en este estado" },
          { status: 400 }
        );
      }

      const nowMs = Date.now();
      const now = new Date(nowMs);
      const limitMs = EXAM_DURATION_MINUTES * 60 * 1000;

      if (candidate.status === "LINK_ENVIADO") {
        const expiresAt = new Date(nowMs + limitMs);

        await prisma.recruitmentCandidate.update({
          where: { id: candidate.id },
          data: {
            status: "EN_PROCESO",
            startedAt: now,
            expiresAt,
          },
        });

        return NextResponse.json({
          success: true,
          started: true,
          timeRemainingSeconds: EXAM_DURATION_MINUTES * 60,
          startedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        });
      }

      // If already EN_PROCESO (re-opening after start)
      const rawStartedAt = candidate.startedAt;
      let startedAtMs = rawStartedAt ? new Date(rawStartedAt).getTime() : 0;
      if (isNaN(startedAtMs)) {
        startedAtMs = 0;
      }
      const elapsedMs = nowMs - startedAtMs;
      const remainingMs = limitMs - elapsedMs;
      const timeRemainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

      return NextResponse.json({
        success: true,
        started: true,
        timeRemainingSeconds,
        startedAt: candidate.startedAt?.toISOString(),
        expiresAt: candidate.expiresAt?.toISOString(),
      });
    }

    // Accept answers from EN_PROCESO or recently-timeout-discarded candidates.
    // This prevents the race condition where the dashboard sweep or expire cron
    // flips status to DESCARTADO milliseconds before the client's auto-submit arrives.
    const discardReasonLower = (candidate.discardReason || "").toLowerCase();
    const isTimedOutDiscard =
      candidate.status === "DESCARTADO" &&
      (discardReasonLower.includes("tiempo") || discardReasonLower.includes("expire") || discardReasonLower.includes("expirado") || discardReasonLower.includes("timeout")) &&
      !candidate.completedAt;

    if (candidate.status !== "EN_PROCESO" && !isTimedOutDiscard) {
      return NextResponse.json(
        { error: "Este examen ya no acepta respuestas", status: candidate.status },
        { status: 403 }
      );
    }

    // Parse answers with safe fallback to empty objects
    const partA = body.partA || {};
    const partB = body.partB || {};

    // Evaluate the complete exam with threshold scoring
    const result = evaluateFullExam(partA, partB, candidate.position);

    // Create an ordered array of user's selected answers mapped to the questions in order
    const questionsList = getQuestionsForPosition(candidate.position as any).questions;
    const selectedAnswersArray = questionsList.map((q) => partA[q.id] || "");

    // ── Persist results (mandatory fields) ──
    await prisma.recruitmentCandidate.update({
      where: { id: candidate.id },
      data: {
        status: result.finalStatus,
        completedAt: new Date(),
        partAAnswers: JSON.stringify(partA),
        partAScore: result.partA.score,
        partBAnswers: JSON.stringify(partB),
        partBScore: result.partB.score,
        selectedAnswers: JSON.stringify(selectedAnswersArray),
        discardReason: result.discardReason,
      },
    });

    return NextResponse.json({
      success: true,
      status: result.finalStatus,
      partAScore: result.partA.score,
      partBScore: result.partB.score,
      message:
        result.finalStatus === "FILTRO_APROBADO"
          ? "¡Examen completado exitosamente! Tu perfil será evaluado por nuestro equipo."
          : "Gracias por completar el examen. Nos pondremos en contacto contigo.",
    });
  } catch (error) {
    console.error("Error in exam POST:", error);
    return NextResponse.json(
      { error: "Error de servidor al procesar el examen" },
      { status: 500 }
    );
  }
}
