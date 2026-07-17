"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Link2,
  Copy,
  Check,
  Search,
  Building2,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  PhoneCall,
  Award,
  Briefcase,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  X,
  Trash2
} from "lucide-react";
import { CandidateStatus, STATUS_LABELS, PART_B_KEYWORDS } from "@/lib/recruitmentUtils";
import { getQuestionsForPosition } from "@/lib/positionQuestions";

interface Branch {
  id: number;
  name: string;
}

interface Candidate {
  id: number;
  token: string;
  fullName: string;
  email: string;
  targetBranchId: number;
  branchName: string;
  status: CandidateStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  partAScore: number;
  partBScore: number;
  discardReason: string | null;
  panelScore: number | null;
  hiredAt: string | null;
  position: string;
}

interface RecruitmentDashClientProps {
  branches: Branch[];
}

export default function RecruitmentDashClient({ branches }: RecruitmentDashClientProps) {
  // Candidate data & states
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [funnelCounts, setFunnelCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Generator Modal states
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [targetBranch, setTargetBranch] = useState("");
  const [targetPosition, setTargetPosition] = useState("COORDINADOR");
  const [generatedLink, setGeneratedLink] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Expediente Modal states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"examen" | "referencias" | "panel" | "onboarding">("examen");
  const [savingStep, setSavingStep] = useState(false);

  // Internals for Step 3, 4, 5
  const [refNotes, setRefNotes] = useState("");
  const [pScore, setPScore] = useState<number>(80);
  const [pNotes, setPNotes] = useState("");

  // Deletion states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCandidates = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/recruitment/candidates");
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
        setFunnelCounts(data.funnelCounts || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCandidates();

    // Auto-refresh candidate status if there are any EN_PROCESO candidates
    const interval = setInterval(() => {
      fetchCandidates(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName || !candidateEmail || !targetBranch) return;

    setGenLoading(true);
    try {
      const res = await fetch("/api/recruitment/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: candidateName,
          email: candidateEmail,
          targetBranchId: targetBranch,
          position: targetPosition,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Construct public URL using current browser origin
        const dynamicUrl = `${window.location.origin}/join/recruitment/${data.candidate.token}`;
        setGeneratedLink(dynamicUrl);
        fetchCandidates(true);
      } else {
        const err = await res.json();
        alert(err.error || "Error al generar enlace");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setGenLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExpediente = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setDetailLoading(true);
    setActiveTab("examen");
    try {
      const res = await fetch(`/api/recruitment/candidates/${candidate.id}`);
      if (res.ok) {
        const data = await res.json();
        setCandidateDetail(data);
        setRefNotes(data.referencesNotes || "");
        setPScore(data.panelScore || 80);
        setPNotes(data.panelNotes || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStep = async (nextStatus: string) => {
    if (!selectedCandidate) return;
    setSavingStep(true);

    const payload: any = { status: nextStatus };
    if (nextStatus === "REFERENCIAS") {
      payload.referencesNotes = refNotes;
    } else if (nextStatus === "PANEL_DIRECTIVO") {
      payload.panelScore = pScore;
      payload.panelNotes = pNotes;
    }

    try {
      const res = await fetch(`/api/recruitment/candidates/${selectedCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Refetch full detail and candidate list
        const resDetail = await fetch(`/api/recruitment/candidates/${selectedCandidate.id}`);
        if (resDetail.ok) {
          const freshDetail = await resDetail.json();
          setCandidateDetail(freshDetail);
        }
        await fetchCandidates(true);
      } else {
        const err = await res.json();
        alert(err.error || "Error al actualizar estado");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setSavingStep(false);
    }
  };

  const handleDiscard = async () => {
    if (!selectedCandidate) return;
    if (!confirm("¿Está seguro de descartar permanentemente a este candidato?")) return;

    setSavingStep(true);
    try {
      const res = await fetch(`/api/recruitment/candidates/${selectedCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DESCARTADO",
          discardReason: "FILTRO_ADMIN_MANUAL",
        }),
      });

      if (res.ok) {
        setSelectedCandidate(null);
        await fetchCandidates(true);
      } else {
        const err = await res.json();
        alert(err.error || "Error al descartar");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setSavingStep(false);
    }
  };

  const handleOpenDeleteModal = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setAdminPassword("");
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateToDelete || !adminPassword.trim()) return;

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/recruitment/delete-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidateToDelete.id,
          password: adminPassword,
        }),
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        setCandidateToDelete(null);
        setAdminPassword("");
        await fetchCandidates(true);
      } else {
        const err = await res.json();
        alert(err.error || "Error al eliminar candidato");
      }
    } catch (err) {
      alert("Error de conexión al intentar eliminar");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Funnel calculations & filters
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.fullName.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = selectedBranch === "all" || c.targetBranchId === Number(selectedBranch);
    const matchesPosition = selectedPosition === "all" || c.position === selectedPosition;
    const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;
    return matchesSearch && matchesBranch && matchesPosition && matchesStatus;
  });

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case "LINK_ENVIADO":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      case "EN_PROCESO":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse";
      case "DESCARTADO":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "FILTRO_APROBADO":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "REFERENCIAS":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "PANEL_DIRECTIVO":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "CONTRATADO":
        return "bg-teal-500 text-teal-950 font-bold border border-teal-600";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#252529] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-red-500" />
            Reclutamiento y Selección
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Embudo de contratación psicométrico y conductual para personal operativo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCandidates(true)}
            className="p-2.5 rounded-xl border border-[#252529] bg-[#1a1a1e] text-slate-400 hover:text-white transition-all"
            title="Refrescar datos"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin text-red-500" : ""}`} />
          </button>
          <button
            onClick={() => {
              setGeneratedLink("");
              setCandidateName("");
              setCandidateEmail("");
              setTargetBranch("");
              setTargetPosition("COORDINADOR");
              setIsGenModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 text-sm font-semibold transition-all shadow-md shadow-red-950/20"
          >
            <Plus className="h-5 w-5" />
            Generar Enlace Único
          </button>
        </div>
      </div>

      {/* Live Funnel Counter Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {(["LINK_ENVIADO", "EN_PROCESO", "FILTRO_APROBADO", "REFERENCIAS", "PANEL_DIRECTIVO", "CONTRATADO", "DESCARTADO"] as CandidateStatus[]).map((status) => (
          <div
            key={status}
            onClick={() => setSelectedStatus(selectedStatus === status ? "all" : status)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === status
                ? "bg-[#222] border-red-500/50 scale-[1.02] shadow-md shadow-red-950/20"
                : "bg-[#1a1a1e] border-[#252529] hover:border-slate-700"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-medium truncate">{STATUS_LABELS[status]}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                status === "DESCARTADO" ? "bg-rose-500/10 text-rose-400" :
                status === "CONTRATADO" ? "bg-teal-500/15 text-teal-400" :
                status === "EN_PROCESO" ? "bg-amber-500/10 text-amber-400 animate-pulse" :
                "bg-blue-500/10 text-blue-400"
              }`}>
                {funnelCounts[status] || 0}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-[#1a1a1e] border border-[#252529] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121215] border border-[#252529] rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-2 bg-[#121215] border border-[#252529] rounded-xl px-3 py-2 w-full sm:w-auto">
            <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none w-full cursor-pointer"
            >
              <option value="all">Todas las Sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#121215] border border-[#252529] rounded-xl px-3 py-2 w-full sm:w-auto">
            <User className="h-4 w-4 text-slate-500 shrink-0" />
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none w-full cursor-pointer"
            >
              <option value="all">Todos los Puestos</option>
              <option value="COORDINADOR">Coordinador de Sucursal</option>
              <option value="ENTRENADOR">Entrenador / Instructor</option>
              <option value="RECEPCION">Recepción</option>
              <option value="LIMPIEZA">Limpieza y Mantenimiento</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#121215] border border-[#252529] rounded-xl px-3 py-2 w-full sm:w-auto">
            <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none w-full cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#1a1a1e] border border-[#252529] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Cargando candidatos...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <AlertTriangle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm">No se encontraron candidatos con los criterios seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#252529] bg-[#121215]/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Candidato</th>
                  <th className="py-4 px-6">Puesto</th>
                  <th className="py-4 px-6">Sucursal Destino</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Psicométrico (Part A)</th>
                  <th className="py-4 px-6 text-center">Casos (Part B)</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252529] text-slate-300 text-sm">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1f1f24] transition-all">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#121215] border border-[#252529] flex items-center justify-center text-slate-300 font-bold shrink-0">
                          {c.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{c.fullName}</div>
                          <div className="text-xs text-slate-500">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-300">
                      {c.position === "COORDINADOR" ? "Coordinador" : c.position === "ENTRENADOR" ? "Entrenador" : c.position === "RECEPCION" ? "Recepción" : "Limpieza"}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-300">
                      {c.branchName}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(c.status)}`}>
                        {c.status === "EN_PROCESO" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {c.startedAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-semibold ${c.position === "COORDINADOR" ? (c.partAScore >= 8 ? "text-emerald-400" : "text-rose-400") : (c.partAScore >= 16 ? "text-emerald-400" : "text-rose-400")}`}>
                            {c.partAScore} / {c.position === "COORDINADOR" ? "10" : "20"} pts
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {c.position === "COORDINADOR" ? (c.partAScore >= 8 ? "Aprobado" : "Reprobado") : (c.partAScore >= 16 ? "Aprobado" : "Reprobado")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">Examen no iniciado</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {c.position === "COORDINADOR" ? (
                        c.startedAt ? (
                          c.completedAt || ["DESCARTADO", "FILTRO_APROBADO", "REFERENCIAS", "PANEL_DIRECTIVO", "CONTRATADO"].includes(c.status) ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`font-semibold ${c.partBScore >= 8 ? "text-emerald-400" : "text-rose-400"}`}>
                                {c.partBScore} / 10 pts
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {c.partBScore >= 8 ? "Aprobado" : "Reprobado"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-500 text-xs animate-pulse">En Proceso...</span>
                          )
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )
                      ) : (
                        <span className="text-slate-600 text-xs" title="No aplica para este puesto">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status !== "LINK_ENVIADO" && c.status !== "EN_PROCESO" ? (
                          <button
                            onClick={() => handleOpenExpediente(c)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#252529] bg-[#121215] px-3.5 py-1.5 text-xs font-semibold text-blue-400 hover:bg-[#222] transition-all cursor-pointer"
                          >
                            <Eye className="h-4.5 w-4.5" />
                            Expediente
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs mr-2">Esperando examen</span>
                        )}
                        <button
                          onClick={() => handleOpenDeleteModal(c)}
                          className="p-2 rounded-xl border border-[#252529] bg-[#121215] text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
                          title="Eliminar candidato permanentemente"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GENERATOR MODAL */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#1a1a1e] border border-[#252529] rounded-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-[#252529] p-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Link2 className="h-5 w-5 text-red-500" />
                Generar Enlace de Postulación
              </h3>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!generatedLink ? (
                <form onSubmit={handleGenerateLink} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Candidato</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full bg-[#121215] border border-[#252529] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-red-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      placeholder="candidato@correo.com"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full bg-[#121215] border border-[#252529] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-red-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sucursal Destino</label>
                    <select
                      required
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full bg-[#121215] border border-[#252529] rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none cursor-pointer focus:border-red-500"
                    >
                      <option value="">Selecciona Sucursal...</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Puesto</label>
                    <select
                      required
                      value={targetPosition}
                      onChange={(e) => setTargetPosition(e.target.value)}
                      className="w-full bg-[#121215] border border-[#252529] rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none cursor-pointer focus:border-red-500"
                    >
                      <option value="COORDINADOR">Coordinador de Sucursal</option>
                      <option value="ENTRENADOR">Entrenador / Instructor</option>
                      <option value="RECEPCION">Recepción</option>
                      <option value="LIMPIEZA">Limpieza y Mantenimiento</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={genLoading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-2"
                  >
                    {genLoading ? "Generando..." : "Crear Enlace Criptográfico"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">¡Enlace Generado Exitosamente!</h4>
                    <p className="text-xs text-slate-400 mt-1">Copia y envía este enlace privado al candidato.</p>
                  </div>

                  <div className="bg-[#121215] border border-[#252529] rounded-xl p-3 flex items-center justify-between gap-3 max-w-full overflow-hidden">
                    <span className="text-xs text-slate-400 font-mono truncate select-all">{generatedLink}</span>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shrink-0 cursor-pointer"
                      title="Copiar enlace"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPEDIENTE DIGITAL MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl h-[90vh] bg-[#1a1a1e] border border-[#252529] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#252529] p-5 shrink-0 bg-[#121215]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                  {selectedCandidate.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCandidate.fullName}</h3>
                  <div className="text-xs text-slate-400 mt-1">
                    {selectedCandidate.email} • <strong className="text-white">{selectedCandidate.position === "COORDINADOR" ? "Coordinador" : selectedCandidate.position === "ENTRENADOR" ? "Entrenador" : selectedCandidate.position === "RECEPCION" ? "Recepción" : "Limpieza"}</strong> • Sucursal {selectedCandidate.branchName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(selectedCandidate.status)}`}>
                  {STATUS_LABELS[selectedCandidate.status]}
                </span>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              {/* Left Column: Navigation Tabs & Status */}
              <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-[#252529] pb-4 md:pb-0 md:pr-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Fases del Proceso</h4>

                <button
                  onClick={() => setActiveTab("examen")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                    activeTab === "examen" ? "bg-red-500/10 text-red-500" : "text-slate-400 hover:bg-[#222]"
                  }`}
                >
                  <Award className="h-4.5 w-4.5" />
                  Paso 1 y 2: Examen
                </button>

                <button
                  onClick={() => setActiveTab("referencias")}
                  disabled={selectedCandidate.status === "DESCARTADO"}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                    activeTab === "referencias" ? "bg-red-500/10 text-red-500" : "text-slate-400 hover:bg-[#222]"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <PhoneCall className="h-4.5 w-4.5" />
                  Paso 3: Referencias
                </button>

                <button
                  onClick={() => setActiveTab("panel")}
                  disabled={selectedCandidate.status === "DESCARTADO" || ["FILTRO_APROBADO"].includes(selectedCandidate.status)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                    activeTab === "panel" ? "bg-red-500/10 text-red-500" : "text-slate-400 hover:bg-[#222]"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <Award className="h-4.5 w-4.5" />
                  Paso 4: Panel Directivo
                </button>

                <button
                  onClick={() => setActiveTab("onboarding")}
                  disabled={selectedCandidate.status === "DESCARTADO" || ["FILTRO_APROBADO", "REFERENCIAS"].includes(selectedCandidate.status)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                    activeTab === "onboarding" ? "bg-red-500/10 text-red-500" : "text-slate-400 hover:bg-[#222]"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <Briefcase className="h-4.5 w-4.5" />
                  Paso 5: Contratación
                </button>

                <div className="mt-auto pt-6 border-t border-[#252529] px-2 flex flex-col gap-2">
                  {selectedCandidate.status !== "DESCARTADO" && selectedCandidate.status !== "CONTRATADO" && (
                    <button
                      onClick={handleDiscard}
                      className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold py-2 rounded-xl text-xs hover:bg-rose-500 hover:text-white transition-all"
                    >
                      Descartar Candidato
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Tab Contents */}
              <div className="flex-1 min-w-0">
                {detailLoading ? (
                  <div className="py-20 text-center">
                    <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-500 text-xs">Cargando expediente...</p>
                  </div>
                ) : !candidateDetail ? (
                  <p className="text-slate-500 text-sm">Error al cargar datos.</p>
                ) : (
                  <div className="space-y-6">
                    {/* Tab: Examen */}
                    {activeTab === "examen" && (
                      <div className="space-y-6">
                        <div className="bg-[#121215] border border-[#252529] rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <span className="text-xs text-slate-500 font-medium">Test de Criterio (Parte A)</span>
                            <h4 className={`text-xl font-bold ${candidateDetail.position === "COORDINADOR" ? (candidateDetail.partAScore >= 8 ? "text-emerald-400" : "text-rose-400") : (candidateDetail.partAScore >= 16 ? "text-emerald-400" : "text-rose-400")}`}>
                              {candidateDetail.partAScore} / {candidateDetail.position === "COORDINADOR" ? "10" : "20"} Puntos
                            </h4>
                            <span className="text-[10px] text-slate-500">
                              {candidateDetail.position === "COORDINADOR" ? (candidateDetail.partAScore >= 8 ? "Aprobado (≥ 8/10)" : "No acreditó (< 8/10)") : (candidateDetail.partAScore >= 16 ? "Aprobado (≥ 16/20)" : "No acreditó (< 16/20)")}
                            </span>
                          </div>
                          {candidateDetail.position === "COORDINADOR" && (
                            <div>
                              <span className="text-xs text-slate-500 font-medium">Casos Prácticos (Parte B)</span>
                              <h4 className={`text-xl font-bold ${candidateDetail.partBScore >= 8 ? "text-emerald-400" : "text-rose-400"}`}>
                                {candidateDetail.partBScore} / 10 Puntos
                              </h4>
                              <span className="text-[10px] text-slate-500">
                                {candidateDetail.partBScore >= 8 ? "Aprobado (≥ 8/10)" : "No acreditó (< 8/10)"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Part A Details (Interactive Visual Audit with Safe Fallbacks) */}
                        {(() => {
                          try {
                            const { questions, answerKey } = getQuestionsForPosition(candidateDetail.position as any || "COORDINADOR");
                            
                            const getCandidateAnswer = (qId: string, idx: number) => {
                              if (!candidateDetail) return "";
                              if (candidateDetail.selectedAnswers && Array.isArray(candidateDetail.selectedAnswers)) {
                                return candidateDetail.selectedAnswers[idx] || "";
                              }
                              if (candidateDetail.selectedAnswers && typeof candidateDetail.selectedAnswers === "object") {
                                return candidateDetail.selectedAnswers[qId] || "";
                              }
                              if (candidateDetail.partAAnswers && typeof candidateDetail.partAAnswers === "object") {
                                return candidateDetail.partAAnswers[qId] || "";
                              }
                              return "";
                            };

                            const hasAnswers = questions && questions.some((q, idx) => getCandidateAnswer(q.id, idx));

                            if (!hasAnswers || !candidateDetail.selectedAnswers) {
                              // If there are no answers or if selectedAnswers is not present (legacy candidate),
                              // render the clean old summary list as fallback!
                              if (candidateDetail.partAAnswers && typeof candidateDetail.partAAnswers === "object" && Object.keys(candidateDetail.partAAnswers).length > 0) {
                                return (
                                  <div className="space-y-3 animate-fadeIn">
                                    <h5 className="text-sm font-bold text-slate-300 border-b border-[#252529] pb-2">Respuestas Test de Criterio (Historial)</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {Object.entries(candidateDetail.partAAnswers).map(([qKey, ans]) => (
                                        <div key={qKey} className="bg-[#121215] border border-[#252529] p-3 rounded-xl flex items-center justify-between">
                                          <div>
                                            <div className="text-xs text-slate-400 font-semibold">{qKey.toUpperCase()}</div>
                                            <div className="text-sm text-slate-200 font-medium mt-1">
                                              Respuesta seleccionada: <strong className="text-blue-400">{String(ans)}</strong>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="bg-[#121215] border border-[#252529] p-6 rounded-2xl text-center text-slate-500">
                                  <AlertTriangle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                  <p className="text-sm">No hay respuestas registradas para este candidato.</p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-4 animate-fadeIn">
                                <h5 className="text-sm font-bold text-slate-300 border-b border-[#252529] pb-2 flex items-center gap-2">
                                  <Award className="h-4.5 w-4.5 text-red-500" />
                                  Auditoría de Respuestas — Test de Criterio ({questions.length} preguntas)
                                </h5>

                                <div className="space-y-4">
                                  {questions.map((q, idx) => {
                                    const selectedOptKey = getCandidateAnswer(q.id, idx);
                                    const correctOptKey = answerKey[q.id]?.correct || "";
                                    const isCorrect = selectedOptKey === correctOptKey;

                                    return (
                                      <div
                                        key={q.id}
                                        className={`p-5 rounded-2xl border transition-all ${
                                          isCorrect
                                            ? "bg-emerald-500/5 border-emerald-500/20"
                                            : selectedOptKey
                                            ? "bg-rose-500/5 border-rose-500/20"
                                            : "bg-[#121215] border-[#252529]"
                                        }`}
                                      >
                                        {/* Header de la Pregunta */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            {idx + 1}. {q.label}
                                          </span>
                                          {selectedOptKey ? (
                                            <span
                                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                                isCorrect
                                                  ? "bg-emerald-500/10 text-emerald-400"
                                                  : "bg-rose-500/10 text-rose-400"
                                              }`}
                                            >
                                              {isCorrect ? (
                                                <>
                                                  <CheckCircle2 className="h-3.5 w-3.5" /> Correcta
                                                </>
                                              ) : (
                                                <>
                                                  <XCircle className="h-3.5 w-3.5" /> Incorrecta
                                                </>
                                              )}
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-500/10 text-slate-400">
                                              Sin responder
                                            </span>
                                          )}
                                        </div>

                                        {/* Enunciado de la Pregunta */}
                                        <p className="text-white text-sm font-medium mb-4 leading-relaxed">
                                          {q.text}
                                        </p>

                                        {/* Opciones */}
                                        <div className="grid grid-cols-1 gap-2.5">
                                          {q.options.map((opt) => {
                                            const isSelected = selectedOptKey === opt.key;
                                            const isCorrectOption = correctOptKey === opt.key;

                                            let optionStyle = "border-[#252529] bg-[#0f0f12] text-slate-300";
                                            if (isSelected) {
                                              optionStyle = isCorrect
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium"
                                                : "border-rose-500 bg-rose-500/10 text-rose-400 font-medium";
                                            } else if (isCorrectOption) {
                                              optionStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-300/90";
                                            }

                                            return (
                                              <div
                                                key={opt.key}
                                                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed transition-all ${optionStyle}`}
                                              >
                                                <div
                                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                                    isSelected
                                                      ? isCorrect
                                                        ? "bg-emerald-500 text-emerald-950"
                                                        : "bg-rose-500 text-rose-950"
                                                      : isCorrectOption
                                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                      : "bg-[#1a1a1f] border border-[#252529] text-slate-500"
                                                  }`}
                                                >
                                                  {opt.key}
                                                </div>
                                                <div className="flex-1">
                                                  <span>{opt.text}</span>
                                                  {isSelected && (
                                                    <span className="text-[10px] block mt-1 uppercase font-bold tracking-wider opacity-85">
                                                      {isCorrect ? "Selección del Aspirante (Correcta)" : "Selección del Aspirante (Incorrecta)"}
                                                    </span>
                                                  )}
                                                  {!isSelected && isCorrectOption && selectedOptKey && (
                                                    <span className="text-[10px] block mt-1 uppercase font-bold tracking-wider opacity-85 text-emerald-500">
                                                      Respuesta Correcta Esperada
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          } catch (err) {
                            console.error("Error rendering interactive candidate exam answers:", err);
                            return (
                              <div className="bg-[#121215] border border-rose-500/20 p-6 rounded-2xl text-center text-slate-400">
                                <AlertTriangle className="h-8 w-8 text-rose-500/60 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-rose-400">Error al procesar el cuestionario interactivo.</p>
                                <p className="text-xs text-slate-500 mt-1">Por favor verifica si el puesto del candidato es válido.</p>
                              </div>
                            );
                          }
                        })()}

                        {/* Part B Details */}
                        {candidateDetail.position === "COORDINADOR" && (
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold text-slate-300 border-b border-[#252529] pb-2">Casos Prácticos Abiertos (Palabras Clave)</h5>
                          <div className="space-y-4">
                            {Object.entries(PART_B_KEYWORDS).map(([cKey, cVal]) => {
                              const answer = candidateDetail.partBAnswers?.[cKey] || "";
                              const normalizedAns = answer.toLowerCase();
                              const matchedKeywords = cVal.keywords.filter((kw) => {
                                if (kw === "número/cifra") {
                                  return /\d+/.test(normalizedAns);
                                }
                                return normalizedAns.includes(kw.toLowerCase());
                              });
                              const pointAwarded = matchedKeywords.length >= 2;

                              return (
                                <div key={cKey} className="bg-[#121215] border border-[#252529] p-4 rounded-2xl space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-red-400 font-bold uppercase">
                                      {cKey.toUpperCase()} - {cVal.label}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                      pointAwarded ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                    }`}>
                                      {pointAwarded ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                      {pointAwarded ? "1 Punto (Acreditado)" : "0 Puntos (No acreditado)"}
                                    </span>
                                  </div>
                                  {answer ? (
                                    <>
                                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-serif bg-[#0f0f14] p-3.5 rounded-xl border border-[#222]">
                                        {answer}
                                      </p>
                                      <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-1.5 items-center">
                                        <span className="font-semibold text-slate-400">Coincidencias ({matchedKeywords.length}):</span>
                                        {matchedKeywords.length > 0 ? (
                                          matchedKeywords.map((kw) => (
                                            <span key={kw} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
                                              {kw}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="italic text-slate-600">Ninguna palabra clave detectada</span>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-sm text-slate-600 italic">Caso práctico no respondido.</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Referencias */}
                    {activeTab === "referencias" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-lg font-bold text-white">Paso 3: Referencias Profesionales</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            Llama a los últimos 2 jefes directos del candidato y documenta sus respuestas detalladamente (ética, puntualidad, manejo de personal y motivos de salida).
                          </p>
                        </div>

                        <textarea
                          placeholder="Introduce las notas de las llamadas aquí..."
                          value={refNotes}
                          onChange={(e) => setRefNotes(e.target.value)}
                          rows={10}
                          className="w-full bg-[#121215] border border-[#252529] rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-red-500 placeholder-slate-600 resize-y transition-all"
                        />

                        {candidateDetail.status === "FILTRO_APROBADO" ? (
                          <button
                            onClick={() => handleUpdateStep("REFERENCIAS")}
                            disabled={savingStep || !refNotes.trim()}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                          >
                            {savingStep ? "Guardando..." : "✓ Guardar Referencias y Avanzar a Paso 4"}
                          </button>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm">
                            ✓ Notas de referencias guardadas correctamente.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Panel */}
                    {activeTab === "panel" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-lg font-bold text-white">Paso 4: Entrevista con Panel Directivo</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            Sección para que los directivos califiquen cara a cara cotejando las respuestas del examen y asignen un puntaje final.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-300">Calificación del Panel</span>
                            <span className="font-mono text-red-500 font-bold">{pScore} / 100</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={pScore}
                            onChange={(e) => setPScore(Number(e.target.value))}
                            className="w-full h-2 bg-[#121215] rounded-lg appearance-none cursor-pointer accent-red-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notas de la Entrevista</label>
                          <textarea
                            placeholder="Comentarios de directores sobre la veracidad, desplante y aptitudes del candidato..."
                            value={pNotes}
                            onChange={(e) => setPNotes(e.target.value)}
                            rows={6}
                            className="w-full bg-[#121215] border border-[#252529] rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-red-500 placeholder-slate-600 resize-y transition-all"
                          />
                        </div>

                        {candidateDetail.status === "REFERENCIAS" ? (
                          <button
                            onClick={() => handleUpdateStep("PANEL_DIRECTIVO")}
                            disabled={savingStep || !pNotes.trim()}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                          >
                            {savingStep ? "Guardando..." : "✓ Completar Entrevista y Avanzar a Paso 5"}
                          </button>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm">
                            ✓ Entrevista del Panel completada. Calificación asignada: <strong className="text-white font-bold">{candidateDetail.panelScore} / 100</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Onboarding */}
                    {activeTab === "onboarding" && (
                      <div className="space-y-5 text-center py-6">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                          <Briefcase className="h-8 w-8" />
                        </div>
                        <div className="max-w-md mx-auto space-y-2">
                          <h4 className="text-lg font-bold text-white">Paso 5: Contratación y Onboarding</h4>
                          <p className="text-sm text-slate-400">
                            Al hacer clic en el botón, el candidato cambiará permanentemente su estado a <strong>CONTRATADO</strong>. Esto iniciará el checklist de prueba de 30 días.
                          </p>
                        </div>

                        {candidateDetail.status === "PANEL_DIRECTIVO" ? (
                          <button
                            onClick={() => handleUpdateStep("CONTRATADO")}
                            disabled={savingStep}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-red-950/20"
                          >
                            {savingStep ? "Contratando..." : "✓ Confirmar Contratación"}
                          </button>
                        ) : (
                          <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-xl text-teal-400 text-sm font-semibold max-w-sm mx-auto">
                            🎉 ¡Candidato Contratado e Incorporado!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CANDIDATE CONFIRMATION MODAL WITH PASSWORD */}
      {isDeleteModalOpen && candidateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1a1a1e] border border-[#252529] rounded-2xl overflow-hidden shadow-2xl animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#252529] p-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Confirmar Eliminación
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleDeleteCandidate} className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-300 leading-relaxed">
                  ¿Estás seguro de eliminar permanentemente a <strong className="text-white font-semibold">{candidateToDelete.fullName}</strong>? Esta acción no se puede deshacer.
                </p>
                <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 p-3 rounded-xl leading-relaxed">
                  <strong>Atención:</strong> Se borrarán todos los datos psicométricos, respuestas del examen, notas internas y el expediente completo de este candidato de forma irreversible.
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  required
                  placeholder="Introduce tu contraseña para confirmar..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#121215] border border-[#252529] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 bg-[#121215] hover:bg-[#222] border border-[#252529] text-slate-300 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || !adminPassword.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center text-sm shadow-md shadow-rose-950/20"
                >
                  {deleteLoading ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
