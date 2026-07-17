import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const roles = [
      { name: "Super Administrador", slug: "super-admin" },
      { name: "Administrador", slug: "admin" },
      { name: "Mantenimiento", slug: "mantenimiento" },
      { name: "Recepción", slug: "recepcion" },
      { name: "Coach", slug: "coach" },
      { name: "Limpieza", slug: "limpieza" },
      { name: "Sabatino", slug: "sabatino" },
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { slug: role.slug },
        update: {},
        create: role,
      });
    }

    const adminRole = await prisma.role.findUnique({
      where: { slug: "super-admin" },
    });

    if (!adminRole) throw new Error("Could not create role.");

    const hashedPassword = await bcrypt.hash("admin123", 12);

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@gym.com" },
      update: {},
      create: {
        email: "admin@gym.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "Principal",
        isActive: true,
        roleId: adminRole.id,
      },
    });

    return NextResponse.json({
      message: "Database seeded successfully!",
      user: adminUser.email,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
