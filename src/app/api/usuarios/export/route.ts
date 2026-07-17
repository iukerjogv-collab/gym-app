import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

// =============================================================================
// GET /api/usuarios/export — Exportar Datos de Todos los Usuarios a Excel
// Incluye datos de RRHH y Nómina completos.
// =============================================================================

export async function GET() {
  // ── Auth guard: super-admin only ──
  const session = await getServerSession();
  if (!session || session.role !== "super-admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // ── Fetch all users with relations ──
  const users = await prisma.user.findMany({
    include: {
      role: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: [{ branch: { name: "asc" } }, { firstName: "asc" }],
  });

  // ── Build rows ──
  const data = users.map((u) => ({
    Nombre: u.firstName,
    Apellidos: u.lastName,
    Correo: u.email,
    "Teléfono": u.phone ?? "",
    Sucursal: u.branch?.name ?? "Sin asignar",
    Rol: u.role.name,
    "Sueldo Base": u.sueldoBase,
    "Fecha Ingreso": u.fechaIngreso.toISOString().split("T")[0],
    RFC: u.rfc ?? "",
    CURP: u.curp ?? "",
    NSS: u.nss ?? "",
    Estatus: u.isActive ? "Activo" : "Inactivo",
    "Horario Entrada": u.startTime ?? "",
    "Horario Salida": u.endTime ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  ws["!cols"] = [
    { wch: 18 }, // Nombre
    { wch: 22 }, // Apellidos
    { wch: 28 }, // Correo
    { wch: 15 }, // Teléfono
    { wch: 18 }, // Sucursal
    { wch: 18 }, // Rol
    { wch: 14 }, // Sueldo Base
    { wch: 16 }, // Fecha Ingreso
    { wch: 16 }, // RFC
    { wch: 22 }, // CURP
    { wch: 14 }, // NSS
    { wch: 10 }, // Estatus
    { wch: 16 }, // Horario Entrada
    { wch: 16 }, // Horario Salida
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Usuarios");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Exportacion_Usuarios_${today}.xlsx"`,
    },
  });
}
