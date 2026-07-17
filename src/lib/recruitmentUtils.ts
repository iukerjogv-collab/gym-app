// =============================================================================
// Recruitment Exam Engine  v2.0
// Strict threshold-based scoring (≥ 8/10) for both Part A and Part B.
// No red-flag auto-discard — only cumulative score matters.
// =============================================================================

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

/** Exam duration in minutes (server-side enforced) */
export const EXAM_DURATION_MINUTES = 25;

/** Minimum passing score for each part (out of 10) */
export const PASSING_THRESHOLD = 8;

// ─── PART A: MULTIPLE CHOICE ANSWER KEY (10 questions, 1 pt each) ───────────

import { getQuestionsForPosition, PositionType } from "./positionQuestions";

export interface PartAResult {
  score: number;
  maxScore: number;
  passed: boolean;
  details: Record<string, { selected: string; correct: string; isCorrect: boolean }>;
}

/**
 * Evaluates Part A answers against the answer key.
 * Each correct answer = 1 point. Pass threshold = 8/10 for COORDINADOR, 16/20 for others.
 */
export function evaluatePartA(answers: Record<string, string>, position: string = "COORDINADOR"): PartAResult {
  const { answerKey } = getQuestionsForPosition(position as PositionType);
  let score = 0;
  const maxScore = Object.keys(answerKey).length;
  const details: PartAResult["details"] = {};
  const threshold = position === "COORDINADOR" ? 8 : 16;

  for (const [qId, config] of Object.entries(answerKey)) {
    const selected = (answers[qId] || "").toUpperCase().trim();
    const isCorrect = selected === config.correct;

    if (isCorrect) {
      score += 1;
    }

    details[qId] = {
      selected,
      correct: config.correct,
      isCorrect,
    };
  }

  return { score, maxScore, passed: score >= threshold, details };
}


// ─── PART B: OPEN CASE KEYWORD DEFINITIONS (10 cases, 1 pt each) ───────────
// Each case awards 1 point if the candidate's answer contains ≥ 2 keywords.

interface CaseKeywords {
  label: string;
  keywords: string[];
}

export const PART_B_KEYWORDS: Record<string, CaseKeywords> = {
  c1: {
    label: "Crisis de Apertura",
    keywords: ["abrir", "apertura", "acceso", "limpiar", "soporte", "reiniciar"],
  },
  c2: {
    label: "Manejo de Personal Conflictivo",
    keywords: ["acta", "administrativa", "reglamento", "recursos humanos", "baja", "despido"],
  },
  c3: {
    label: "Auditoría Mecánica e Infraestructura",
    keywords: ["bitácora", "excel", "checklist", "reporte", "cotización", "proveedor"],
  },
  c4: {
    label: "Cumplimiento de Metas Numéricas",
    keywords: ["meta", "monto", "seguimiento", "estrategia", "llamadas", "ingresos"],
  },
  c5: {
    label: "Control de Mermas y Consumos del Staff",
    keywords: ["auditoria", "inventario", "merma", "cámara", "sanción", "conteo"],
  },
  c6: {
    label: "Plan de Contingencia por Falta de Agua / Luz",
    keywords: ["notificar", "pipa", "cisterna", "personal", "comunicado", "clausurar"],
  },
  c7: {
    label: "Robo Hormiga de Accesorios de Gimnasio",
    keywords: ["responsiva", "inventario", "guardia", "entrega", "firmar", "turno"],
  },
  c8: {
    label: "Baja de Personal Inesperada en Fin de Semana",
    keywords: ["cubrir", "guardia", "relevo", "asumir", "sucursal", "rol"],
  },
  c9: {
    label: "Descuadre en Venta de Membresías en Efectivo",
    keywords: ["fraude", "recibo", "corte", "baja", "evidencia", "notificar"],
  },
  c10: {
    label: "Estrategia de Retención de Clientes Molestos",
    keywords: ["beneficios", "atención", "argumento", "servicio", "fidelización", "retener"],
  },
};

/** Minimum keywords a candidate must mention per case to earn the point */
const MIN_KEYWORDS_PER_CASE = 2;

export interface PartBCaseDetail {
  label: string;
  matchedCount: number;
  totalKeywords: number;
  matchedKeywords: string[];
  pointAwarded: boolean;
}

export interface PartBResult {
  /** Cumulative score (0-10) — one point per case with ≥ 2 keyword matches */
  score: number;
  maxScore: number;
  passed: boolean;
  /** Per-case breakdown */
  details: Record<string, PartBCaseDetail>;
}

/**
 * Evaluates Part B open-case answers by counting keyword matches.
 * Awards 1 point per case if ≥ 2 keywords are detected.
 * Pass threshold = 8/10.
 */
export function evaluatePartB(answers: Record<string, string>): PartBResult {
  const details: PartBResult["details"] = {};
  const maxScore = Object.keys(PART_B_KEYWORDS).length; // 10
  let score = 0;

  for (const [caseId, { keywords, label }] of Object.entries(PART_B_KEYWORDS)) {
    const text = (answers[caseId] || "").toLowerCase();
    const matchedKeywords: string[] = [];

    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      }
    }

    // Extra case-specific requirements
    let extraCheckPassed = true;
    if (caseId === "c2") {
      // Caso 2: Requiere número o %
      extraCheckPassed = /\d+/.test(text) || text.includes("%");
    } else if (caseId === "c4") {
      // Caso 4: Requiere % o signo $
      extraCheckPassed = text.includes("%") || text.includes("$");
    }

    const pointAwarded = matchedKeywords.length >= MIN_KEYWORDS_PER_CASE && extraCheckPassed;
    if (pointAwarded) {
      score += 1;
    }

    details[caseId] = {
      label,
      matchedCount: matchedKeywords.length,
      totalKeywords: keywords.length,
      matchedKeywords,
      pointAwarded,
    };
  }

  return { score, maxScore, passed: score >= PASSING_THRESHOLD, details };
}

// ─── FULL EXAM EVALUATION ───────────────────────────────────────────────────

export interface ExamResult {
  partA: PartAResult;
  partB: PartBResult;
  finalStatus: "DESCARTADO" | "FILTRO_APROBADO";
  discardReason: string | null;
}

/**
 * Evaluates the complete exam (Part A + Part B) using strict thresholds:
 * 1. Part A < 8  → DESCARTADO ("No acreditó Test de Criterio")
 * 2. Part B < 8  → DESCARTADO ("Bajo Score Operativo")
 * 3. Both ≥ 8    → FILTRO_APROBADO
 */
export function evaluateFullExam(
  partAAnswers: Record<string, string>,
  partBAnswers: Record<string, string>,
  position: string = "COORDINADOR"
): ExamResult {
  const partA = evaluatePartA(partAAnswers, position);
  
  let partB: PartBResult;
  if (position === "COORDINADOR") {
    partB = evaluatePartB(partBAnswers);
  } else {
    partB = {
      score: 0,
      maxScore: 0,
      passed: true,
      details: {},
    };
  }

  let finalStatus: "DESCARTADO" | "FILTRO_APROBADO" = "FILTRO_APROBADO";
  let discardReason: string | null = null;

  if (!partA.passed) {
    finalStatus = "DESCARTADO";
    discardReason = "No acreditó Test de Criterio";
  } else if (!partB.passed) {
    finalStatus = "DESCARTADO";
    discardReason = "Bajo Score Operativo";
  }

  return { partA, partB, finalStatus, discardReason };
}

// ─── STATUS TRANSITION VALIDATION ───────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  LINK_ENVIADO: ["EN_PROCESO", "DESCARTADO"],
  EN_PROCESO: ["DESCARTADO", "FILTRO_APROBADO"],
  FILTRO_APROBADO: ["REFERENCIAS", "DESCARTADO"],
  REFERENCIAS: ["PANEL_DIRECTIVO", "DESCARTADO"],
  PANEL_DIRECTIVO: ["CONTRATADO", "DESCARTADO"],
  CONTRATADO: [],
  DESCARTADO: [],
};

/**
 * Checks if a status transition is valid in the hiring funnel.
 */
export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * All possible statuses for display/filtering
 */
export const ALL_STATUSES = [
  "LINK_ENVIADO",
  "EN_PROCESO",
  "DESCARTADO",
  "FILTRO_APROBADO",
  "REFERENCIAS",
  "PANEL_DIRECTIVO",
  "CONTRATADO",
] as const;

export type CandidateStatus = (typeof ALL_STATUSES)[number];

/**
 * Human-readable labels for statuses (Spanish)
 */
export const STATUS_LABELS: Record<string, string> = {
  LINK_ENVIADO: "Link Enviado",
  EN_PROCESO: "En Proceso",
  DESCARTADO: "Descartado",
  FILTRO_APROBADO: "Filtro Aprobado",
  REFERENCIAS: "Referencias",
  PANEL_DIRECTIVO: "Panel Directivo",
  CONTRATADO: "Contratado",
};
