// =============================================================================
// Gym Management System - Database Seed Script
// Seeds: 6 Roles, 2 Modules, 1 Admin User, Admin Permissions
// Run: npx tsx prisma/seed.ts
// =============================================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

// Parse DATABASE_URL for the adapter
const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace("/", ""),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ---------------------------------------------------------------------------
  // 1. ROLES
  // ---------------------------------------------------------------------------
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
  console.log(`✅ ${roles.length} roles created`);

  // ---------------------------------------------------------------------------
  // 2. MODULES
  // ---------------------------------------------------------------------------
  const modules = [
    {
      name: "Usuarios",
      slug: "usuarios",
      description: "Gestión de empleados, roles y permisos del sistema",
      icon: "Users",
      path: "/dashboard/usuarios",
      sortOrder: 1,
    },
    {
      name: "Sucursales",
      slug: "sucursales",
      description: "Gestión de sedes y ubicaciones del gimnasio",
      icon: "Building2",
      path: "/dashboard/sucursales",
      sortOrder: 2,
    },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { slug: mod.slug },
      update: {},
      create: mod,
    });
  }
  console.log(`✅ ${modules.length} modules created`);

  // ---------------------------------------------------------------------------
  // 3. ADMIN USER
  // ---------------------------------------------------------------------------
  const adminRole = await prisma.role.findUnique({
    where: { slug: "super-admin" },
  });

  if (!adminRole) {
    throw new Error("Super Admin role not found. Roles must be seeded first.");
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@gym.com" },
    update: {},
    create: {
      email: "admin@gym.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Principal",
      phone: null,
      isActive: true,
      roleId: adminRole.id,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // ---------------------------------------------------------------------------
  // 4. ADMIN PERMISSIONS (full access to all modules)
  // ---------------------------------------------------------------------------
  const allModules = await prisma.module.findMany();

  for (const mod of allModules) {
    await prisma.userPermission.upsert({
      where: {
        userId_moduleId: {
          userId: adminUser.id,
          moduleId: mod.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        moduleId: mod.id,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      },
    });
  }
  console.log(
    `✅ Admin permissions assigned for ${allModules.length} modules`
  );

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
