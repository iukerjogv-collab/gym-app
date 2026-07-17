import { ReactNode } from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  
  if (!session) {
    redirect("/login");
  }

  let lateCount = 0;
  let openTicketsCount = 0;

  if (session.role === "admin" || session.role === "super-admin") {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    [lateCount, openTicketsCount] = await Promise.all([
      prisma.attendance.count({
        where: {
          isLate: true,
          checkIn: { gte: startOfDay, lte: endOfDay }
        }
      }),
      prisma.maintenanceTicket.count({
        where: { status: { not: "CLOSED" } }
      }),
    ]);
  }

  return (
    <DashboardLayoutClient userRole={session.role} lateCount={lateCount} openTicketsCount={openTicketsCount}>
      {children}
    </DashboardLayoutClient>
  );
}
