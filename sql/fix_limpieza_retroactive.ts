// =============================================================================
// Script de Corrección Retroactiva: Limpieza — is_late = 0 para check-ins < 09:01
// Ejecutar con: npx tsx sql/fix_limpieza_retroactive.ts
// =============================================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const parsed = new URL(url);
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace("/", ""),
  });

  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

const prisma = createPrismaClient();

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CORRECCIÓN RETROACTIVA — Limpieza: Ventana 09:00 AM");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Paso 1: Preview — Ver registros que serán afectados ──
  console.log("📋 PASO 1: Preview de registros a corregir...\n");

  const preview: Array<Record<string, unknown>> = await prisma.$queryRaw`
    SELECT 
      a.id AS attendance_id,
      u.first_name,
      u.last_name,
      r.slug AS role_slug,
      a.check_in,
      DATE_FORMAT(CONVERT_TZ(a.check_in, '+00:00', '-06:00'), '%Y-%m-%d %H:%i') AS checkin_hora_mx,
      DAYOFWEEK(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) AS dia_semana,
      a.is_late
    FROM attendances a
    JOIN users u ON u.id = a.user_id
    JOIN roles r ON r.id = u.role_id
    WHERE r.slug = 'limpieza'
      AND a.is_late = 1
      AND (HOUR(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) * 60 + MINUTE(CONVERT_TZ(a.check_in, '+00:00', '-06:00'))) < 541
      AND DAYOFWEEK(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) NOT IN (1, 7)
    ORDER BY a.check_in DESC
  `;

  if (preview.length === 0) {
    console.log("✅ No hay registros que corregir. Todos los check-ins de limpieza ya están correctos.\n");
    await prisma.$disconnect();
    return;
  }

  console.log(`⚠️  Se encontraron ${preview.length} registro(s) para corregir:\n`);
  console.table(preview.map((r) => ({
    ID: r.attendance_id,
    Empleado: `${r.first_name} ${r.last_name}`,
    Rol: r.role_slug,
    "Check-in (MX)": r.checkin_hora_mx,
    "Día Semana": r.dia_semana,
    "is_late (actual)": r.is_late,
  })));

  // ── Paso 2: Ejecutar corrección ──
  console.log("\n🔧 PASO 2: Ejecutando UPDATE...\n");

  const affectedRows = await prisma.$executeRaw`
    UPDATE attendances a
    JOIN users u ON u.id = a.user_id
    JOIN roles r ON r.id = u.role_id
    SET a.is_late = 0
    WHERE r.slug = 'limpieza'
      AND a.is_late = 1
      AND (HOUR(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) * 60 + MINUTE(CONVERT_TZ(a.check_in, '+00:00', '-06:00'))) < 541
      AND DAYOFWEEK(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) NOT IN (1, 7)
  `;

  console.log(`✅ CORRECCIÓN COMPLETADA: ${affectedRows} fila(s) actualizada(s).`);
  console.log(`   → Cada registro corregido elimina un descuento de $10.00 MXN en nómina.`);
  console.log(`   → Ahorro total restaurado: $${Number(affectedRows) * 10}.00 MXN\n`);

  // ── Paso 3: Verificación post-corrección ──
  console.log("🔍 PASO 3: Verificación post-corrección...\n");

  const remaining: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM attendances a
    JOIN users u ON u.id = a.user_id
    JOIN roles r ON r.id = u.role_id
    WHERE r.slug = 'limpieza'
      AND a.is_late = 1
      AND (HOUR(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) * 60 + MINUTE(CONVERT_TZ(a.check_in, '+00:00', '-06:00'))) < 541
      AND DAYOFWEEK(CONVERT_TZ(a.check_in, '+00:00', '-06:00')) NOT IN (1, 7)
  `;

  const remainingCount = Number(remaining[0]?.count ?? 0);

  if (remainingCount === 0) {
    console.log("✅ VERIFICACIÓN EXITOSA: 0 registros incorrectos restantes.");
    console.log("   La base de datos está lista para deploy.\n");
  } else {
    console.log(`⚠️  ALERTA: Aún quedan ${remainingCount} registros sin corregir. Revisar manualmente.\n`);
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  FIN DE CORRECCIÓN RETROACTIVA");
  console.log("═══════════════════════════════════════════════════════════");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Error durante la corrección:", e);
  await prisma.$disconnect();
  process.exit(1);
});
