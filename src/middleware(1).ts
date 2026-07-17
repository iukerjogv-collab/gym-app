import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  // Si intentamos ir a dashboard y no hay token, lo mandamos a login
  if (isDashboardPage && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si intentamos ir a login pero ya tenemos token, mandamos a dashboard
  if (isAuthPage && token) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Parse the JWT payload manually (Base64 decode) since we cannot use jsonwebtoken in Edge
  let role = "";
  if (token) {
    try {
      const payloadBase64Url = token.split(".")[1];
      const payloadBase64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = atob(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      role = payload.role || "";
    } catch (e) {
      console.error("Error decoding token in middleware", e);
    }
  }

  // Redirigir el home a login si no hay token o a dashboard si hay
  if (request.nextUrl.pathname === "/") {
    const dest = token ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // RBAC Security Filter: Bloqueo de rutas protegidas
  const pathname = request.nextUrl.pathname;
  const roleLower = role.toLowerCase();

  // Bloqueo de módulos administrativos (Usuarios, Sucursales, Nómina, Reclutamiento, Vacaciones)
  // Restringido para: Coach, Recepción, Mantenimiento y Limpieza
  if (
    pathname.startsWith("/dashboard/usuarios") ||
    pathname.startsWith("/dashboard/sucursales") ||
    pathname.startsWith("/dashboard/nomina") ||
    pathname.startsWith("/dashboard/reclutamiento") ||
    pathname.startsWith("/dashboard/vacaciones")
  ) {
    const adminRestrictedRoles = ["coach", "entrenador", "recepcion", "recepcionista", "mantenimiento", "limpieza", "sabatino"];
    if (adminRestrictedRoles.includes(roleLower)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Bloqueo adicional de Monitor/Asistencia para Limpieza
  // Limpieza SOLO puede ver: Asistencia (propia), Mantenimiento (sus tareas) y Mi Perfil
  if (pathname.startsWith("/dashboard/reportes/asistencia")) {
    const monitorRestrictedRoles = ["coach", "entrenador", "recepcion", "recepcionista", "limpieza", "sabatino"];
    if (monitorRestrictedRoles.includes(roleLower)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
