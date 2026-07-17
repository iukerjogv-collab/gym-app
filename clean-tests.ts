import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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
  try {
    // 1. Buscar los candidatos de prueba que contienen "juan" (case-insensitive en MariaDB por defecto)
    const testCandidates = await prisma.recruitmentCandidate.findMany({
      where: {
        fullName: {
          contains: "juan",
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (testCandidates.length === 0) {
      console.log("No se encontraron candidatos de prueba con el nombre 'juan'.");
      return;
    }

    console.log("Candidatos de prueba encontrados para eliminar:");
    console.table(testCandidates);

    // 2. Proceder a la eliminación
    const deleteResult = await prisma.recruitmentCandidate.deleteMany({
      where: {
        fullName: {
          contains: "juan",
        },
      },
    });

    console.log(`\n¡Éxito! Se han eliminado correctamente ${deleteResult.count} candidato(s) de prueba.`);
  } catch (err) {
    console.error("Error al limpiar la base de datos:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
