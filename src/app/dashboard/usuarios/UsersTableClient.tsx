"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Edit2,
  KeyRound,
  Search,
  Filter,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  FileDown,
  FileUp,
  Download,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { resetUserPassword } from "./actions";

// =============================================================================
// Interfaces
// =============================================================================

interface BranchInfo {
  id: number;
  name: string;
}

interface RoleInfo {
  id: number;
  name: string;
  slug: string;
}

interface UserRecord {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  roleId: number;
  branchId: number | null;
  createdAt: string;
  updatedAt: string;
  role: RoleInfo;
  branch: BranchInfo | null;
  startTime: string | null;
  endTime: string | null;
}

interface UsersTableClientProps {
  users: UserRecord[];
  branches: BranchInfo[];
  isSuperAdmin: boolean;
}

// =============================================================================
// Constantes de color por Rol (Dark Mode)
// =============================================================================

const ROLE_COLORS: Record<string, string> = {
  admin:       "bg-purple-500/10 text-purple-400 border-purple-500/20",
  gerente:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  manager:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  recepcion:   "bg-teal-500/10 text-teal-400 border-teal-500/20",
  recepcionista: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  entrenador:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  trainer:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
  limpieza:    "bg-lime-500/10 text-lime-400 border-lime-500/20",
  mantenimiento: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  nutriologo:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const BRANCH_COLORS: Record<string, string> = {
  xilotzingo: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  héroes:     "bg-rose-500/10 text-rose-400 border-rose-500/20",
  heroes:     "bg-rose-500/10 text-rose-400 border-rose-500/20",
  periférico: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  periferico: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

function getRoleClasses(slug: string): string {
  return ROLE_COLORS[slug.toLowerCase()] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

function getBranchClasses(name: string): string {
  const key = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [k, v] of Object.entries(BRANCH_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
}

// =============================================================================
// Componente principal
// =============================================================================

export default function UsersTableClient({ users, branches, isSuperAdmin }: UsersTableClientProps) {
  // ─── State ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ─── Import/Export State ────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    type: "success" | "error";
    message: string;
    details?: string[];
  } | null>(null);

  // ─── Filtrado ──────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let result = users;

    // Filtro por sucursal
    if (branchFilter !== "all") {
      const bId = parseInt(branchFilter, 10);
      result = result.filter((u) => u.branchId === bId);
    }

    // Búsqueda por nombre o email
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, branchFilter, search]);

  // ─── Handlers ──────────────────────────────────────────────────
  function openResetModal(user: UserRecord) {
    setSelectedUser(user);
    setNewPassword("");
    setShowPassword(false);
    setFeedback(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedUser(null);
    setNewPassword("");
    setFeedback(null);
  }

  function handleResetPassword() {
    if (!selectedUser || newPassword.length < 6) {
      setFeedback({ type: "error", msg: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    startTransition(async () => {
      try {
        const result = await resetUserPassword(selectedUser.id, newPassword);
        if (result.success) {
          setFeedback({ type: "success", msg: "Contraseña actualizada correctamente." });
          setNewPassword("");
          setTimeout(closeModal, 1500);
        } else {
          setFeedback({ type: "error", msg: result.error ?? "Error desconocido." });
        }
      } catch {
        setFeedback({ type: "error", msg: "Error de conexión con el servidor." });
      }
    });
  }

  // ─── Import/Export Handlers ─────────────────────────────────────
  async function handleDownloadTemplate() {
    try {
      const res = await fetch("/api/usuarios/template");
      if (!res.ok) throw new Error("Error al descargar la plantilla.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Plantilla_Carga_Masiva_Usuarios.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setUploadResult({ type: "error", message: "Error al descargar la plantilla." });
    }
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/usuarios/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadResult({
          type: "error",
          message: data.error ?? "Error al procesar el archivo.",
          details: data.details ?? [],
        });
      } else {
        setUploadResult({
          type: "success",
          message: data.message,
          details: data.errors?.length > 0 ? data.errors : undefined,
        });
        // Refresh page to show new users
        if (data.created > 0) {
          setTimeout(() => window.location.reload(), 2000);
        }
      }
    } catch {
      setUploadResult({ type: "error", message: "Error de conexión con el servidor." });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/usuarios/export");
      if (!res.ok) throw new Error("Error al exportar.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Exportacion_Usuarios_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setUploadResult({ type: "error", message: "Error al exportar los datos." });
    } finally {
      setExporting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <>
      {/* ═══ Import/Export Toolbar (Super Admin Only) ═══ */}
      {isSuperAdmin && (
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Template */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#252529] bg-[#1a1a1e] text-slate-300 text-sm font-medium hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5 transition-all duration-200"
            >
              <FileDown size={15} className="text-blue-400" />
              Descargar Plantilla
            </button>

            {/* Bulk Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#252529] bg-[#1a1a1e] text-slate-300 text-sm font-medium hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 size={15} className="animate-spin text-emerald-400" />
              ) : (
                <FileUp size={15} className="text-emerald-400" />
              )}
              {uploading ? "Procesando..." : "Carga Masiva"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleBulkUpload}
              className="hidden"
            />

            {/* Export Data */}
            <button
              type="button"
              onClick={handleExportData}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#252529] bg-[#1a1a1e] text-slate-300 text-sm font-medium hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 size={15} className="animate-spin text-amber-400" />
              ) : (
                <Download size={15} className="text-amber-400" />
              )}
              {exporting ? "Exportando..." : "Exportar Datos"}
            </button>
          </div>

          {/* Upload Result Feedback */}
          {uploadResult && (
            <div
              className={`mt-3 rounded-xl border p-4 ${
                uploadResult.type === "success"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-start gap-2">
                {uploadResult.type === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    uploadResult.type === "success" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {uploadResult.message}
                  </p>
                  {uploadResult.details && uploadResult.details.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {uploadResult.details.map((d, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                          <span className="text-slate-600 mt-0.5">•</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setUploadResult(null)}
                  className="text-slate-600 hover:text-slate-400 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Barra de Filtros ═══ */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <Input
            id="search-users"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-[#252529] focus-visible:ring-red-500/30 bg-[#1a1a1e] text-slate-200 placeholder:text-slate-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Branch filter */}
        <div className="relative min-w-[200px]">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <select
            id="filter-branch"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-md border border-[#252529] bg-[#1a1a1e] text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 appearance-none cursor-pointer"
          >
            <option value="all">Todas las Sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {/* custom arrow */}
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
            width="12"
            height="12"
            viewBox="0 0 12 12"
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Result counter */}
        <div className="flex items-center text-xs text-slate-500 whitespace-nowrap self-center">
          {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>

      {/* ═══ Tabla ═══ */}
      <div className="rounded-xl border border-[#252529] bg-[#1a1a1e] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-[#252529] bg-[#121215] text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Correo</th>
                <th className="px-6 py-4 font-medium">Sucursal</th>
                <th className="px-6 py-4 font-medium">Rol / Puesto</th>
                <th className="px-6 py-4 font-medium">Estatus</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252529]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-slate-600" />
                      <p className="font-medium">No se encontraron usuarios</p>
                      <p className="text-xs">Intenta con otros filtros o términos de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#252529]/30 transition-colors group"
                  >
                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#252529] text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center justify-center text-xs font-bold shrink-0 border border-[#333338]">
                          {user.firstName.charAt(0)}
                          {user.lastName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-200">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-slate-400">{user.email}</td>

                    {/* Sucursal */}
                    <td className="px-6 py-4">
                      {user.branch ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBranchClasses(user.branch.name)}`}
                        >
                          {user.branch.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Sin asignar</span>
                      )}
                    </td>

                    {/* Rol */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleClasses(user.role.slug)}`}
                      >
                        {user.role.name}
                      </span>
                    </td>

                    {/* Estatus */}
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/usuarios/${user.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-500/10 text-blue-400"
                            title="Editar expediente"
                          >
                            <Edit2 size={14} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-amber-500/10 text-amber-400"
                          title="Restablecer contraseña"
                          onClick={() => openResetModal(user)}
                        >
                          <KeyRound size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Modal: Restablecer Contraseña ═══ */}
      {modalOpen && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />

          {/* Panel */}
          <div
            className="relative bg-[#1a1a1e] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-0 overflow-hidden animate-scaleIn border border-[#252529]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">
                    Restablecer Contraseña
                  </h3>
                  <p className="text-white/70 text-sm">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-sm text-slate-400 mb-4">
                Ingresa la nueva contraseña temporal para{" "}
                <strong className="text-slate-200">{selectedUser.email}</strong>.
                El usuario deberá cambiarla en su próximo inicio de sesión.
              </p>

              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Nueva Contraseña
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10 border-[#252529] bg-[#121215] text-slate-200 focus-visible:ring-red-500/30 placeholder:text-slate-600"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        newPassword.length >= level * 3
                          ? newPassword.length >= 12
                            ? "bg-green-500"
                            : newPassword.length >= 8
                            ? "bg-yellow-500"
                            : "bg-red-400"
                          : "bg-[#252529]"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div
                  className={`mt-3 text-sm rounded-lg px-3 py-2 ${
                    feedback.type === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {feedback.msg}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeModal}
                className="border-[#252529] text-slate-400 hover:bg-[#252529] hover:text-slate-200"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isPending || newPassword.length < 6}
                className="bg-[#dc2626] hover:bg-red-700 text-white shadow-md shadow-red-500/20 gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    Restablecer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
