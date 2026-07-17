"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  UserCircle,
  Activity,
  Wrench,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Banknote,
  UserPlus,
  Palmtree
} from "lucide-react";
import { logout } from "./actions";
import ShiftAlertBanner from "@/components/ShiftAlertBanner";
import PushRegistration from "@/components/PushRegistration";

interface DashboardLayoutClientProps {
  children: ReactNode;
  userRole: string;
  lateCount?: number;
  openTicketsCount?: number;
}

export default function DashboardLayoutClient({ children, userRole, lateCount = 0, openTicketsCount = 0 }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pathname = usePathname();

  const roleLower = userRole.toLowerCase();
  // Roles operativos que NO ven módulos administrativos (Usuarios, Sucursales, Nómina)
  const isOperativeRole = ["coach", "entrenador", "recepcion", "recepcionista", "mantenimiento", "limpieza", "sabatino"].includes(roleLower);
  // Limpieza: restricción máxima — NO ve Monitor/Asistencia (igual que coach/recepción)
  const isMaxRestricted = ["coach", "entrenador", "recepcion", "recepcionista", "limpieza", "sabatino"].includes(roleLower);
  const isAdmin = roleLower === "admin" || roleLower === "super-admin";

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <>
      <div className="flex h-20 items-center justify-center border-b border-[#252529] px-6 relative">
        <img
          src="/logo-gym.png"
          alt="Training Zone"
          className={`h-10 w-auto opacity-90 transition-all duration-300 ${isCollapsed ? "scale-75" : "scale-100"}`}
        />
      </div>

      <nav className="flex-1 space-y-2 p-4 pt-6 overflow-y-auto overflow-x-hidden">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname === "/dashboard"
            ? "bg-[#2a2a2e] text-white shadow-sm"
            : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
            }`}
        >
          <Clock3 className="h-5 w-5 shrink-0 opacity-80" />
          <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
            Asistencia
          </span>
        </Link>

        {/* Monitor/Asistencia — visible para Admin y Mantenimiento, oculto para Limpieza/Coach/Recepción */}
        {!isMaxRestricted && (
          <Link
            href="/dashboard/reportes/asistencia"
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname?.startsWith("/dashboard/reportes/asistencia")
              ? "bg-[#2a2a2e] text-white shadow-sm"
              : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
              }`}
          >
            <div className="flex items-center gap-3.5">
              <Activity className="h-5 w-5 shrink-0 opacity-80" />
              <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
                Monitor/Asistencia
              </span>
            </div>
            {lateCount > 0 && (
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[#e60000] text-[10px] font-bold text-white shadow-sm ${isCollapsed ? "absolute left-10" : ""}`}>
                {lateCount}
              </span>
            )}
          </Link>
        )}

        {/* Módulos administrativos — exclusivos de Admin/SuperAdmin */}
        {!isOperativeRole && (
          <>
            <Link
              href="/dashboard/usuarios"
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname?.startsWith("/dashboard/usuarios")
                ? "bg-[#2a2a2e] text-white shadow-sm"
                : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
                }`}
            >
              <Users className="h-5 w-5 shrink-0 opacity-80" />
              <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
                Usuarios
              </span>
            </Link>

            <Link
              href="/dashboard/sucursales"
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname?.startsWith("/dashboard/sucursales")
                ? "bg-[#2a2a2e] text-white shadow-sm"
                : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
                }`}
            >
              <Building2 className="h-5 w-5 shrink-0 opacity-80" />
              <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
                Sucursales
              </span>
            </Link>

            <Link
              href="/dashboard/nomina"
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname?.startsWith("/dashboard/nomina")
                ? "bg-[#2a2a2e] text-white shadow-sm"
                : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
                }`}
            >
              <Banknote className="h-5 w-5 shrink-0 opacity-80" />
              <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
                Asistencia y Nómina
              </span>
            </Link>

            <Link
              href="/dashboard/reclutamiento"
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname?.startsWith("/dashboard/reclutamiento")
                ? "bg-[#2a2a2e] text-white shadow-sm"
                : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
                }`}
            >
              <UserPlus className="h-5 w-5 shrink-0 opacity-80" />
              <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
                Reclutamiento
              </span>
            </Link>

            <Link
              href="/dashboard/vacaciones"
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname?.startsWith("/dashboard/vacaciones")
                ? "bg-[#2a2a2e] text-white shadow-sm"
                : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
                }`}
            >
              <Palmtree className="h-5 w-5 shrink-0 opacity-80" />
              <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
                Vacaciones
              </span>
            </Link>
          </>
        )}

        <Link
          href="/dashboard/mantenimiento"
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname?.startsWith("/dashboard/mantenimiento")
            ? "bg-[#2a2a2e] text-white shadow-sm"
            : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
            }`}
        >
          <div className="flex items-center gap-3.5">
            <Wrench className="h-5 w-5 shrink-0 opacity-80" />
            <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
              Levantar Ticket
            </span>
          </div>
          {isAdmin && openTicketsCount > 0 && (
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[#e60000] text-[10px] font-bold text-white shadow-sm ${isCollapsed ? "absolute left-10" : ""}`}>
              {openTicketsCount}
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/perfil"
          className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${pathname === "/dashboard/perfil"
            ? "bg-[#2a2a2e] text-white shadow-sm"
            : "text-slate-400 hover:bg-[#2a2a2e]/50 hover:text-white"
            }`}
        >
          <UserCircle className="h-5 w-5 shrink-0 opacity-80" />
          <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
            Mi Perfil
          </span>
        </Link>
      </nav>

      <div className="border-t border-[#252529] p-4 shrink-0">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 invisible" : "opacity-100"}`}>
            Cerrar Sesión
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-[#121215] md:flex-row flex-col overflow-hidden text-slate-100">
      <PushRegistration />

      <header className="md:hidden flex items-center justify-between h-16 bg-[#1a1a1e] border-b border-[#252529] px-4 shrink-0 z-20 relative">
        <img src="/logo-gym.png" alt="Training Zone" className="h-8 w-auto opacity-90" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* DESKTOP SIDEBAR — Se eliminó overflow-hidden para permitir que el botón flote fuera */}
      <aside className={`hidden ${isCollapsed ? "w-20" : "w-[260px]"} flex-col border-r border-[#252529] bg-[#1a1a1e] md:flex shrink-0 z-30 relative transition-all duration-300 ease-in-out`}>
        <SidebarContent />

        {/* BOTÓN FLOTANTE EN EL LÍMITE */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-10 z-[100] hidden md:flex items-center justify-center h-7 w-7 rounded-full bg-[#2a2a2e] text-slate-400 hover:text-white border border-[#35353a] shadow-xl transition-all"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-3/4 max-w-sm bg-[#1a1a1e] shadow-2xl flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent />
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#121215] relative">
        <ShiftAlertBanner />
        <div className="min-h-full w-full">
          {children}
        </div>
      </main>

    </div>
  );
}