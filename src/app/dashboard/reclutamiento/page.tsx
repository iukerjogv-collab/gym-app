// =============================================================================
// /dashboard/reclutamiento — Server Component
// Admin recruitment dashboard with funnel visualization.
// =============================================================================

import { Metadata } from "next";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RecruitmentDashClient from "./RecruitmentDashClient";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reclutamiento — Dashboard",
  description: "Panel de reclutamiento y selección de coordinadores de sucursal",
};

export default async function ReclutamientoPage() {
  const session = await getServerSession();
  if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
    redirect("/dashboard");
  }

  // Fetch branches for the filter dropdown
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <RecruitmentDashClient branches={branches} />;
}
