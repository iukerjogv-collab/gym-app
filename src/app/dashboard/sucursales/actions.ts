"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSucursal(formData: FormData) {
  const idStr = formData.get("id") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  
  const horarioLunesViernes = formData.get("horarioLunesViernes") as string | null;
  const horarioSabado = formData.get("horarioSabado") as string | null;
  const horarioDomingo = formData.get("horarioDomingo") as string | null;
  
  const totalMaquinas = parseInt(formData.get("totalMaquinas") as string || "0", 10);
  
  const latStr = formData.get("latitud") as string;
  const lngStr = formData.get("longitud") as string;
  const latitud = latStr ? parseFloat(latStr) : null;
  const longitud = lngStr ? parseFloat(lngStr) : null;

  const specialClosuresStr = formData.get("specialClosures") as string;
  let closuresData = [];
  if (specialClosuresStr) {
    try {
      closuresData = JSON.parse(specialClosuresStr).map((c: any) => ({
        fecha: new Date(c.fecha),
        motivo: c.motivo,
      }));
    } catch (e) {
      console.error("Error parsing closures", e);
    }
  }

  const data = {
    name,
    address,
    city,
    state,
    phone,
    email,
    horarioLunesViernes,
    horarioSabado,
    horarioDomingo,
    totalMaquinas,
    latitud,
    longitud,
  };

  if (idStr) {
    // Edit existing branch
    await prisma.branch.update({
      where: { id: parseInt(idStr, 10) },
      data: {
        ...data,
        specialClosures: {
          deleteMany: {}, // Clean slate
          create: closuresData,
        }
      },
    });
  } else {
    // Create new branch
    await prisma.branch.create({
      data: {
        ...data,
        specialClosures: {
          create: closuresData,
        }
      },
    });
  }

  revalidatePath("/dashboard/sucursales");
}

export async function deleteSucursal(id: number) {
  await prisma.branch.delete({
    where: { id },
  });
  revalidatePath("/dashboard/sucursales");
}
