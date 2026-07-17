"use server";

import prisma from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth";

// =============================================================================
// Tipado de Resultados
// =============================================================================
export interface TicketItem {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  adminComment: string | null;
  branchName: string;
  reportedByName: string;
  resolvedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ActionResponse {
  success: boolean;
  error?: string;
}

interface GetTicketsResponse {
  success: boolean;
  data?: TicketItem[];
  error?: string;
}

// =============================================================================
// Helper: Obtener usuario completo desde la sesión JWT
// =============================================================================
async function getAuthenticatedUser() {
  const session = await getServerSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.sub, 10) },
    select: {
      id: true,
      branchId: true,
      role: { select: { slug: true } },
    },
  });

  return user;
}

// =============================================================================
// Server Action: Crear Ticket de Mantenimiento
// -----------------------------------------------------------------------------
// SEGURIDAD:
//   - branchId se toma del perfil del usuario autenticado (NO del frontend).
//   - reportedById se toma del id del usuario autenticado (NO del frontend).
//   - Un coach de Xilotzingo jamás podrá inyectar un branchId de Héroes.
//   - Si el usuario no tiene sucursal asignada, se rechaza la operación.
// =============================================================================
export async function createTicket(
  title: string,
  description: string,
  priority: string = "MEDIUM"
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Sesión no válida. Inicia sesión de nuevo." };
  }

  if (!user.branchId) {
    return {
      success: false,
      error: "No tienes una sucursal asignada. Contacta al administrador.",
    };
  }

  // Validar prioridad contra valores permitidos
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];
  const safePriority = validPriorities.includes(priority.toUpperCase())
    ? priority.toUpperCase()
    : "MEDIUM";

  try {
    await prisma.maintenanceTicket.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        priority: safePriority,
        status: "OPEN",
        branchId: user.branchId,       // Blindado: viene de la DB, no del cliente
        reportedById: user.id,          // Blindado: viene de la DB, no del cliente
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al crear ticket de mantenimiento:", error);
    return { success: false, error: "Error interno al crear el ticket." };
  }
}

// =============================================================================
// Server Action: Obtener Tickets de Mantenimiento
// -----------------------------------------------------------------------------
// SEGURIDAD:
//   - ADMIN / SUPER-ADMIN: Ve TODOS los tickets. Filtro opcional por branchId
//     y por fecha.
//   - STAFF / Cualquier otro rol: Ve SOLO los tickets de SU sucursal.
//     Si no tiene sucursal asignada, ve lista vacía (no puede filtrar nada).
//     El branchId del frontend se IGNORA — siempre se usa el de su perfil.
// FILTROS:
//   - selectedDate (ISO string): filtra tickets creados ese día (00:00–23:59).
//   - filterBranchId (number):   filtra por sucursal (solo admin).
// =============================================================================
export async function getTickets(
  selectedDateISO?: string,
  filterBranchId?: number
): Promise<GetTicketsResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Sesión no válida." };
  }

  const isUserAdmin = user.role.slug === "admin" || user.role.slug === "super-admin";

  try {
    const whereCondition: import("@prisma/client").Prisma.MaintenanceTicketWhereInput = {};

    // ── Filtro de fecha ───────────────────────────────────────────
    if (selectedDateISO) {
      const parsed = new Date(selectedDateISO);
      const startOfDay = new Date(parsed);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsed);
      endOfDay.setHours(23, 59, 59, 999);

      whereCondition.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // ── Filtro de sucursal (según rol) ────────────────────────────
    if (isUserAdmin) {
      // Admin: opcionalmente filtra por sucursal
      if (filterBranchId) {
        whereCondition.branchId = filterBranchId;
      }
    } else {
      // Staff: forzamos filtro a su propia sucursal (sin excepciones)
      if (!user.branchId) {
        return { success: true, data: [] };
      }
      whereCondition.branchId = user.branchId;
    }

    const tickets = await prisma.maintenanceTicket.findMany({
      where: whereCondition,
      include: {
        branch: {
          select: { name: true },
        },
        reportedBy: {
          select: { firstName: true, lastName: true },
        },
        resolvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data: TicketItem[] = tickets.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      adminComment: t.adminComment,
      branchName: t.branch.name,
      reportedByName: `${t.reportedBy.firstName} ${t.reportedBy.lastName}`,
      resolvedByName: t.resolvedBy
        ? `${t.resolvedBy.firstName} ${t.resolvedBy.lastName}`
        : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    return { success: false, error: "Error interno al consultar los tickets." };
  }
}

// =============================================================================
// Server Action: Resolver Ticket (Solo Admin)
// -----------------------------------------------------------------------------
// SEGURIDAD:
//   - Solo ADMIN / SUPER-ADMIN puede resolver tickets.
//   - Se registra quién resolvió (resolvedById) desde la sesión.
//   - El status se fuerza a "CLOSED" — no se acepta del frontend.
// =============================================================================
export async function resolveTicket(
  ticketId: number,
  adminComment: string
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Sesión no válida." };
  }

  const isUserAdmin = user.role.slug === "admin" || user.role.slug === "super-admin";
  if (!isUserAdmin) {
    return { success: false, error: "Solo los administradores pueden resolver tickets." };
  }

  try {
    // Verificar que el ticket exista y no esté ya cerrado
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
      select: { status: true },
    });

    if (!ticket) {
      return { success: false, error: "El ticket no existe." };
    }

    if (ticket.status === "CLOSED") {
      return { success: false, error: "Este ticket ya fue resuelto anteriormente." };
    }

    await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status: "CLOSED",
        adminComment: adminComment.trim() || null,
        resolvedById: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al resolver ticket:", error);
    return { success: false, error: "Error interno al resolver el ticket." };
  }
}

// =============================================================================
// Server Action: Obtener rol del usuario actual
// -----------------------------------------------------------------------------
// Usado por el cliente para mostrar/ocultar columnas según el rol.
// =============================================================================
export async function getUserRole(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return user.role.slug;
}

// =============================================================================
// Server Action: Obtener Sucursales para Filtro (Solo Admin)
// -----------------------------------------------------------------------------
// Retorna la lista de sucursales activas (id + nombre) para poblar el
// selector de sucursal en la barra de filtros del monitor de tickets.
// Solo accesible para roles ADMIN / SUPER-ADMIN.
// =============================================================================
export async function getBranchesForFilter(): Promise<{ id: number; name: string }[]> {
  const user = await getAuthenticatedUser();
  if (!user) return [];

  const isUserAdmin = user.role.slug === "admin" || user.role.slug === "super-admin";
  if (!isUserAdmin) return [];

  try {
    return await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    return [];
  }
}
