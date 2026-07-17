"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";

export async function submitLeaveRequest(formData: FormData) {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const userId = parseInt(session.sub, 10);
  const type = formData.get("type") as string;
  const reason = formData.get("reason") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  await prisma.leaveRequest.create({
    data: {
      userId,
      type,
      reason,
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr),
      status: "Pending",
    },
  });

  revalidatePath("/dashboard/perfil");
}
