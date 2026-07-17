import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import * as XLSX from "xlsx";

// =============================================================================
// GET /api/usuarios/template — Descargar Plantilla Excel (Machote Vacío)
// Columnas: Nombre, Apellidos, Correo, Teléfono, Sucursal, Rol,
//           Sueldo Base, Fecha Ingreso, RFC, CURP, NSS
// =============================================================================

export async function GET() {
  // ── Auth guard: super-admin only ──
  const session = await getServerSession();
  if (!session || session.role !== "super-admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // ── Build empty template with headers + example row ──
  const headers = [
    "Nombre",
    "Apellidos",
    "Correo",
    "Teléfono",
    "Sucursal",
    "Rol",
    "Sueldo Base",
    "Fecha Ingreso",
    "RFC",
    "CURP",
    "NSS",
  ];

  const exampleRow = [
    "Juan",
    "Pérez García",
    "juan@gym.com",
    "6141234567",
    "Heroes",
    "Recepcionista",
    "5000",
    "2026-01-15",
    "PEGJ900101XXX",
    "PEGJ900101HCHRRN00",
    "12345678901",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

  // Column widths for readability
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
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="Plantilla_Carga_Masiva_Usuarios.xlsx"',
    },
  });
}
