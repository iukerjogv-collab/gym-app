// =============================================================================
// /join/recruitment/[token] — Server Component
// Public exam page. Validates token, activates timer via API, renders exam UI.
// =============================================================================

import { Metadata } from "next";
import ExamClient from "./ExamClient";

export const metadata: Metadata = {
  title: "Examen de Selección — Training Zone",
  description: "Examen de evaluación para candidatos a Coordinador de Sucursal",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function RecruitmentExamPage({ params }: PageProps) {
  const { token } = await params;

  return <ExamClient token={token} />;
}
