"use client";

import { useState } from "react";
import { registerAttendance } from "./attendanceActions";
import { MapPin, LogIn, LogOut, CheckCircle, Navigation, Loader2, AlertTriangle, X } from "lucide-react";
import LiveClock from "@/components/LiveClock";

interface Props {
  branchLat: number | null;
  branchLng: number | null;
  hasActiveCheckIn: boolean; // Estado verificado en la BD al renderizar la página (persiste tras cierre de sesión)
  checkInTime: string | null; // ISO timestamp de la entrada activa (para cálculo de jornada incompleta)
}

// Fórmula de Haversine para distancias ultra precisas usando JS Nativo.
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radio esférico tierra
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const deltaP = p2 - p1;
  const deltaLon = lon2 - lon1;
  const deltaLambda = (deltaLon * Math.PI) / 180;
  const a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) * Math.cos(p2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Duración estándar de jornada laboral en horas
const STANDARD_SHIFT_HOURS = 8;

export default function AttendanceAction({ branchLat, branchLng, hasActiveCheckIn, checkInTime }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  // El estado inicial viene de la BD (Server Component) → sobrevive cierres de sesión
  const [isCheckedIn, setIsCheckedIn] = useState(hasActiveCheckIn);

  // Modal de confirmación para salida con jornada incompleta
  const [showEarlyCheckoutModal, setShowEarlyCheckoutModal] = useState(false);
  const [pendingGeoData, setPendingGeoData] = useState<{
    latitude: number;
    longitude: number;
    dist: number;
  } | null>(null);

  // Ejecuta la llamada al server action (compartida entre flujo normal y confirmación)
  const executeCheckout = async (latitude: number, longitude: number, dist: number) => {
    const res = await registerAttendance(latitude, longitude, Math.round(dist));

    if (res.success) {
      setSuccess(true);
      setSuccessMsg(
        res.newState
          ? "¡Entrada registrada exitosamente!"
          : "¡Salida correcta, fin de turno!"
      );
      setIsCheckedIn(res.newState ?? false);

      // Desvanecer el éxito tras 4 segundos interactivos.
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setErrorMsg(res.error || "Falla de conectividad.");
    }
    setLoading(false);
  };

  const handleAction = () => {
    if (!branchLat || !branchLng) {
      setErrorMsg("Error: Tu Sucursal Base no tiene coordenadas satelitales registradas.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    if (!navigator.geolocation) {
      setErrorMsg("Tu navegador no soporta Geoposicionamiento.");
      setLoading(false);
      return;
    }

    // High accuracy parameter es vital en móviles para lograr triangulación de 100m.
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const dist = getDistanceInMeters(latitude, longitude, branchLat, branchLng);

        // REGLA ESTRICTA DE GEOFENCE: 100 Metros (solo aplica en entrada)
        if (dist > 100 && !isCheckedIn) {
          setErrorMsg(`Fuera de rango: Estás a ${Math.round(dist)} metros. Acércate a la sucursal para marcar entrada.`);
          setLoading(false);
          return; // Abortar inserción
        }

        // ── ALERTA DE JORNADA INCOMPLETA (> 1h, < 8h) ──────────────────────
        // Si es una salida y la jornada no se ha completado, pedir confirmación
        // antes de enviar la petición al servidor.
        if (isCheckedIn && checkInTime) {
          const elapsedMs = Date.now() - new Date(checkInTime).getTime();
          const elapsedHours = elapsedMs / (1000 * 60 * 60);

          // Si han pasado más de 1 hora pero menos de la jornada estándar,
          // interceptar con modal de confirmación
          if (elapsedHours >= 1 && elapsedHours < STANDARD_SHIFT_HOURS) {
            setPendingGeoData({ latitude, longitude, dist });
            setShowEarlyCheckoutModal(true);
            setLoading(false);
            return;
          }
        }
        // ────────────────────────────────────────────────────────────────────

        // Si se verifica el rango (o es una salida), llamar Server Action y DB.
        await executeCheckout(latitude, longitude, dist);
      },
      () => {
        // PERMISOS CANCELADOS
        setErrorMsg("Permiso Denegado. Activa el GPS de tu equipo en Configuración para procesar tu asistencia.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Confirmar salida anticipada desde el modal
  const handleConfirmEarlyCheckout = async () => {
    if (!pendingGeoData) return;
    setShowEarlyCheckoutModal(false);
    setLoading(true);
    await executeCheckout(pendingGeoData.latitude, pendingGeoData.longitude, pendingGeoData.dist);
    setPendingGeoData(null);
  };

  // Cancelar salida anticipada desde el modal
  const handleCancelEarlyCheckout = () => {
    setShowEarlyCheckoutModal(false);
    setPendingGeoData(null);
  };

  return (
    <div className="bg-[#1a1a1e] p-6 rounded-2xl border border-[#252529] shadow-xl flex flex-col items-center justify-center">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="font-extrabold text-slate-100 text-lg lg:text-xl tracking-tight flex items-center gap-2">
          <Navigation size={20} className="text-[#dc2626]" /> Reloj Checador (GPS)
        </h3>
        <div className={`px-2 py-1 rounded text-xs font-bold ${isCheckedIn ? 'bg-emerald-100 text-emerald-400' : 'bg-[#252529] text-slate-400'}`}>
          {isCheckedIn ? 'EN TURNO' : 'INACTIVO'}
        </div>
      </div>

      {/* ──────────── RELOJ DINÁMICO DE SEGURIDAD ──────────── */}
      <div className="w-full border-t border-b border-[#252529] my-3">
        <LiveClock />
      </div>

      {errorMsg && (
        <div className="text-red-400 bg-red-500/10 border border-red-200 p-3 rounded-lg mb-4 text-sm font-semibold w-full text-center">
          {errorMsg}
        </div>
      )}

      {success && (
        <div className="text-emerald-700 bg-emerald-500/10 border border-emerald-200 p-3 rounded-lg mb-4 text-sm font-bold flex items-center justify-center gap-2 w-full">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Corporate Button Logic */}
      <button
        onClick={handleAction}
        disabled={loading}
        aria-busy={loading}
        className={`w-full py-8 lg:py-10 rounded-2xl font-black text-xl flex flex-col items-center justify-center gap-3 text-white shadow-xl transition-all duration-300 active:scale-95 ${
          loading
            ? "bg-slate-700 cursor-not-allowed shadow-none opacity-80"
            : isCheckedIn
              ? "bg-slate-700 hover:bg-slate-600 hover:shadow-slate-500/20"
              : "bg-[#dc2626] hover:bg-red-700 hover:shadow-red-500/30"
        }`}
      >
        {loading ? (
          <span className="flex flex-col items-center gap-2">
            <Loader2 size={36} className="animate-spin" />
            <span className="text-base font-bold tracking-wide text-slate-300 animate-pulse">
              {isCheckedIn ? "Registrando Salida..." : "Registrando Entrada..."}
            </span>
            <span className="text-xs font-medium text-slate-400">Por favor espera, no cierres la app</span>
          </span>
        ) : isCheckedIn ? (
          <><LogOut size={36} strokeWidth={2.5} /> MARCAR SALIDA</>
        ) : (
          <><LogIn size={36} strokeWidth={2.5} /> MARCAR ENTRADA</>
        )}
      </button>

      <div className="text-xs text-slate-500 mt-6 font-medium flex items-center gap-1.5 bg-[#252529]/30 px-3 py-1.5 rounded-full border border-[#252529]">
        <MapPin size={12} /> Sistema Validado por Perímetro Geográfico (±100m)
      </div>

      {/* ── MODAL DE CONFIRMACIÓN: JORNADA INCOMPLETA ── */}
      {showEarlyCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#1a1a1e] border border-[#252529] rounded-2xl overflow-hidden shadow-2xl animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#252529] p-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Jornada Incompleta
              </h3>
              <button
                onClick={handleCancelEarlyCheckout}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-300 leading-relaxed">
                ¿Seguro que quieres checar salida? <strong className="text-amber-400">Aún no ha terminado tu jornada de trabajo.</strong>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelEarlyCheckout}
                  className="flex-1 bg-[#121215] hover:bg-[#222] border border-[#252529] text-slate-300 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmEarlyCheckout}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center text-sm shadow-md shadow-amber-950/20"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
