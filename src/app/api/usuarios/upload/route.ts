import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";

// =============================================================================
// POST /api/usuarios/upload — Carga Masiva de Usuarios desde Excel
// Validates branch names against the catalog before inserting.
// =============================================================================

interface RowData {
  Nombre?: string;
  Apellidos?: string;
  Correo?: string;
  "Teléfono"?: string;
  Sucursal?: string;
  Rol?: string;
  "Sueldo Base"?: string | number;
  "Fecha Ingreso"?: string | number;
  RFC?: string;
  CURP?: string;
  NSS?: string;
}

export async function POST(request: NextRequest) {
  // ── Auth guard: super-admin only ──
  const session = await getServerSession();
  if (!session || session.role !== "super-admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // ── Read uploaded file ──
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó un archivo." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];

    if (!ws) {
      return NextResponse.json(
        { error: "El archivo Excel está vacío o no tiene hojas." },
        { status: 400 }
      );
    }

    const rows: RowData[] = XLSX.utils.sheet_to_json(ws);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "El archivo no contiene registros de datos." },
        { status: 400 }
      );
    }

    // ── Load catalogs from DB ──
    const branchesDb = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const rolesDb = await prisma.role.findMany({
      select: { id: true, name: true, slug: true },
    });

    // Build lookup maps (case-insensitive, accent-stripped)
    const normalize = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const branchMap = new Map<string, number>();
    for (const b of branchesDb) {
      branchMap.set(normalize(b.name), b.id);
    }

    const roleMap = new Map<string, number>();
    for (const r of rolesDb) {
      roleMap.set(normalize(r.name), r.id);
      roleMap.set(normalize(r.slug), r.id);
    }

    // ── Validate & build create operations ──
    const errors: string[] = [];
    const creates: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      roleId: number;
      branchId: number | null;
      sueldoBase: number;
      fechaIngreso: Date;
      rfc: string;
      curp: string;
      nss: string;
    }[] = [];

    // Default password (hashed once for all new users)
    const defaultPasswordHash = await bcrypt.hash("Gym2026!", 12);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (header is row 1)

      const nombre = row.Nombre?.toString().trim() ?? "";
      const apellidos = row.Apellidos?.toString().trim() ?? "";
      const correo = row.Correo?.toString().trim() ?? "";

      // Required fields validation
      if (!nombre || !apellidos || !correo) {
        errors.push(
          `Fila ${rowNum}: Nombre, Apellidos y Correo son obligatorios.`
        );
        continue;
      }

      // Branch validation
      const sucursalRaw = row.Sucursal?.toString().trim() ?? "";
      let branchId: number | null = null;
      if (sucursalRaw) {
        const branchIdLookup = branchMap.get(normalize(sucursalRaw));
        if (!branchIdLookup) {
          errors.push(
            `Fila ${rowNum}: La sucursal "${sucursalRaw}" no coincide con el catálogo.`
          );
          continue;
        }
        branchId = branchIdLookup;
      }

      // Role validation
      const rolRaw = row.Rol?.toString().trim() ?? "";
      let roleId: number | null = null;
      if (rolRaw) {
        const roleIdLookup = roleMap.get(normalize(rolRaw));
        if (!roleIdLookup) {
          errors.push(
            `Fila ${rowNum}: El rol "${rolRaw}" no coincide con el catálogo.`
          );
          continue;
        }
        roleId = roleIdLookup;
      }

      if (!roleId) {
        errors.push(`Fila ${rowNum}: El campo Rol es obligatorio.`);
        continue;
      }

      // Sueldo Base
      const sueldoRaw = row["Sueldo Base"];
      const sueldoBase =
        typeof sueldoRaw === "number"
          ? sueldoRaw
          : parseFloat(sueldoRaw?.toString() ?? "0") || 0;

      // Fecha Ingreso
      let fechaIngreso = new Date();
      const fechaRaw = row["Fecha Ingreso"];
      if (fechaRaw) {
        if (typeof fechaRaw === "number") {
          // Excel serial date number
          fechaIngreso = new Date((fechaRaw - 25569) * 86400000);
        } else {
          const parsed = new Date(fechaRaw.toString());
          if (!isNaN(parsed.getTime())) {
            fechaIngreso = parsed;
          }
        }
      }

      creates.push({
        email: correo,
        password: defaultPasswordHash,
        firstName: nombre,
        lastName: apellidos,
        phone: row["Teléfono"]?.toString().trim() ?? "",
        roleId,
        branchId,
        sueldoBase,
        fechaIngreso,
        rfc: row.RFC?.toString().trim().toUpperCase() ?? "",
        curp: row.CURP?.toString().trim().toUpperCase() ?? "",
        nss: row.NSS?.toString().trim() ?? "",
      });
    }

    // If there are validation errors, return them all
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Errores de validación encontrados.",
          details: errors,
          totalRows: rows.length,
          validRows: creates.length,
        },
        { status: 422 }
      );
    }

    // ── Bulk insert (one by one to handle unique constraint errors) ──
    let created = 0;
    const insertErrors: string[] = [];

    for (const data of creates) {
      try {
        await prisma.user.create({ data });
        created++;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error desconocido";
        if (msg.includes("Unique")) {
          insertErrors.push(
            `"${data.email}" ya existe en el sistema.`
          );
        } else {
          insertErrors.push(
            `Error al crear "${data.firstName} ${data.lastName}": ${msg}`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      created,
      total: rows.length,
      errors: insertErrors,
      message: `Se registraron ${created} de ${rows.length} usuarios exitosamente.${
        insertErrors.length > 0
          ? ` ${insertErrors.length} registro(s) con error.`
          : ""
      }`,
    });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el archivo." },
      { status: 500 }
    );
  }
}
