"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import "./exam-guard.css";

// ─── Question / Case Data ───────────────────────────────────────────────────

import { getQuestionsForPosition, PositionType } from "@/lib/positionQuestions";

const PART_B_CASES = [
  { id: "c1", label: "Caso 1 — Crisis de Apertura", text: "Lunes 6:05 AM. La recepcionista no llegó, hay 10 clientes afuera molestos, los baños huelen mal y el POS no tiene conexión. Describe tu plan para las primeras 2 horas." },
  { id: "c2", label: "Caso 2 — Manejo de Personal Conflictivo", text: "Describe una situación real de tu pasado donde lidiaste con un subordinado impuntual o conflictivo. ¿Qué proceso legal/administrativo ejecutaste? (Requiere número o %)" },
  { id: "c3", label: "Caso 3 — Auditoría Mecánica e Infraestructura", text: "¿Cómo estructurabas en tu empleo anterior el inventario de mantenimiento y cómo controlabas que los proveedores no cobraran de más?" },
  { id: "c4", label: "Caso 4 — Cumplimiento de Metas Numéricas", text: "Da un ejemplo real de cómo lograste levantar un indicador a la baja (ventas o renovaciones). Menciona el porcentaje o monto y la estrategia. (Requiere % o signo $)" },
  { id: "c5", label: "Caso 5 — Control de Mermas y Consumos del Staff", text: "Descubres que el personal de la sucursal consume suplementos o bebidas de la nevera de venta registrándolos como \"merma por caducidad\" falsamente. ¿Cómo erradicas esta práctica?" },
  { id: "c6", label: "Caso 6 — Plan de Contingencia por Falta de Agua / Luz", text: "A mitad de la tarde de un martes se corta por completo el suministro de agua en los baños y regaderas de la sucursal. El gimnasio está lleno. ¿Cómo gestionas la crisis con los usuarios y el equipo?" },
  { id: "c7", label: "Caso 7 — Robo Hormiga de Accesorios de Gimnasio", text: "Al hacer inventario de piso notas que faltan 4 topes de barra olímpica, 2 bandas de resistencia y un par de mancuernas ligeras. ¿Qué medidas de control implementas con los entrenadores para detener esto?" },
  { id: "c8", label: "Caso 8 — Baja de Personal Inesperada en Fin de Semana", text: "El sábado por la tarde, el entrenador del turno vespertino te avisa 15 minutos antes que no va a ir a trabajar por una fiesta familiar. Es el único entrenador programado. ¿Cómo resuelves la operación?" },
  { id: "c9", label: "Caso 9 — Descuadre en Venta de Membresías en Efectivo", text: "Durante una auditoría sorpresa, encuentras que una recepcionista cobró una membresía anual en efectivo pero en el sistema la registró como una cortesía mensual. ¿Cómo procedes de inmediato?" },
  { id: "c10", label: "Caso 10 — Estrategia de Retención de Clientes Molestos", text: "El dueño autoriza un ajuste de precios en las membresías de la sucursal. Varios clientes antiguos amenazan con cancelar e irse a la competencia. ¿Cómo capacitas a tu equipo para contenerlos?" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ExamClient({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "active" | "blocked" | "submitted">("loading");
  const [blockReason, setBlockReason] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [position, setPosition] = useState<PositionType>("COORDINADOR");
  const [timeLeft, setTimeLeft] = useState(0);
  const [partA, setPartA] = useState<Record<string, string>>({});
  const [partB, setPartB] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ status: string; message: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0=intro, 1=partA, 2=partB, 3=review
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);
  const hasActivated = useRef(false);

  const { questions: activeQuestions } = getQuestionsForPosition(position);

  // Keep refs updated to prevent stale closures in handleAutoSubmit
  const partARef = useRef(partA);
  const partBRef = useRef(partB);
  
  useEffect(() => {
    partARef.current = partA;
  }, [partA]);

  useEffect(() => {
    partBRef.current = partB;
  }, [partB]);

  // ── Activate exam on mount ──
  useEffect(() => {
    if (hasActivated.current) return;
    hasActivated.current = true;

    fetch(`/api/recruitment/exam/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.blocked) {
          setState("blocked");
          setBlockReason(data.message || "Acceso bloqueado");
        } else if (data.active) {
          setState("active");
          setCandidateName(data.candidateName || "");
          setTimeLeft(data.timeRemainingSeconds || 0);
          setPosition(data.position || "COORDINADOR");
          if (data.started) {
            setExamStarted(true);
            setCurrentStep(1); // Resume directly at Part A
          } else {
            setExamStarted(false);
            setCurrentStep(0);
          }
        } else {
          setState("blocked");
          setBlockReason("Enlace inválido");
        }
      })
      .catch(() => {
        setState("blocked");
        setBlockReason("Error de conexión");
      });
  }, [token]);

  // ── Countdown timer ──
  useEffect(() => {
    if (state !== "active" || !examStarted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, examStarted, timeLeft > 0]);

  // ── Anti-cheat: block copy, paste, right-click, keyboard shortcuts ──
  useEffect(() => {
    if (state !== "active") return;

    const blockContext = (e: MouseEvent) => e.preventDefault();
    const blockClipboard = (e: ClipboardEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" || e.key === "C" || e.key === "a" || e.key === "A" || e.key === "v" || e.key === "V")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      document.removeEventListener("keydown", blockKeys);
    };
  }, [state]);

  // ── Start Exam officially (POST trigger) ──
  const startExam = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/recruitment/exam/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (data.success) {
        setTimeLeft(data.timeRemainingSeconds);
        setExamStarted(true);
        setCurrentStep(1);
      } else {
        alert(data.error || "No se pudo iniciar el examen");
      }
    } catch {
      alert("Error al conectar con el servidor para comenzar el examen.");
    } finally {
      setStarting(false);
    }
  };

  // ── Auto-submit when timer expires ──
  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    await submitExam(partARef.current, partBRef.current, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting]);

  const submitExam = async (
    answersA = partA,
    answersB = partB,
    isTimeoutTrigger = false
  ) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/recruitment/exam/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partA: answersA, partB: answersB, isTimeout: isTimeoutTrigger }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (${res.status})`);
      }

      const data = await res.json();
      setSubmitFailed(false);

      if (isTimeoutTrigger) {
        setSubmitResult({
          status: data.status || "DESCARTADO",
          message: "Tu tiempo de evaluación ha terminado. Muchas gracias por tu participación, tus respuestas han sido guardadas con éxito. Mucha suerte en tu proceso."
        });
      } else {
        setSubmitResult({ status: data.status || "ENVIADO", message: data.message || "Examen enviado." });
      }
      setState("submitted");
    } catch (err: any) {
      console.error("Error submitting exam:", err);
      const errMsg = err?.message || "Error de conexión con el servidor.";
      
      if (isTimeoutTrigger) {
        setSubmitFailed(true);
        setSubmitResult({
          status: "ERROR",
          message: "Tu tiempo de evaluación ha terminado. Sin embargo, no pudimos guardar tus respuestas en el servidor por un problema de conexión."
        });
        setState("submitted");
      } else {
        setSubmitError(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Time formatting ──
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };
  const isUrgent = timeLeft < 120;

  // ── Render states ──

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Cargando examen...</p>
        </div>
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#1a1a1e] rounded-2xl border border-red-500/30 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Acceso Bloqueado</h1>
          <p className="text-slate-400">{blockReason}</p>
        </div>
      </div>
    );
  }

  if (state === "submitted") {
    const isTimeoutMsg = submitResult?.message?.includes("tiempo") || submitResult?.message?.includes("terminado");
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className={`max-w-md w-full bg-[#1a1a1e] rounded-2xl border ${submitFailed ? "border-red-500/30" : isTimeoutMsg ? "border-amber-500/30" : "border-emerald-500/30"} p-8 text-center shadow-2xl`}>
          <div className={`w-16 h-16 ${submitFailed ? "bg-red-500/10" : isTimeoutMsg ? "bg-amber-500/10" : "bg-emerald-500/10"} rounded-full flex items-center justify-center mx-auto mb-5`}>
            {submitFailed ? (
              <svg className="w-8 h-8 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : isTimeoutMsg ? (
              <svg className="w-8 h-8 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h1 className="text-xl font-bold text-white mb-3">
            {submitFailed ? "Error de Conexión" : isTimeoutMsg ? "Evaluación Concluida" : "Examen Enviado"}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-6">
            {submitResult?.message}
          </p>

          {submitFailed && (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-400 text-left">
                <p className="font-semibold mb-1">Tus respuestas están seguras temporalmente en tu navegador.</p>
                <p>Por favor, haz clic en el botón de abajo para intentar guardarlas en el servidor nuevamente. No cierres esta pestaña.</p>
              </div>
              <button
                onClick={() => submitExam(partARef.current, partBRef.current, true)}
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
              >
                {submitting ? "Reintentando..." : "↻ Reintentar Guardar Respuestas"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ACTIVE EXAM ──
  const allPartADone = activeQuestions.every((q) => partA[q.id]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] exam-guard">
      {/* Sticky timer bar */}
      <div className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 border-b transition-colors ${isUrgent && examStarted ? "bg-red-950/80 border-red-500/50" : "bg-[#1a1a1e]/95 border-[#252529]"} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <img src="/logo-gym.png" alt="TZ" className="h-7 w-auto opacity-80 hidden sm:block" />
          <span className="text-sm text-slate-400 truncate max-w-[160px]">{candidateName}</span>
        </div>
        <div className={`font-mono text-lg font-bold tracking-wider ${isUrgent && examStarted ? "text-red-400 animate-pulse" : "text-white"}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Step 0: Intro */}
        {currentStep === 0 && (
          <div className="animate-fadeIn">
            <div className="bg-[#1a1a1e] rounded-2xl border border-[#252529] p-6 sm:p-8 mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Examen de Selección</h1>
              <p className="text-lg text-blue-400 font-medium mb-4">
                {position === "COORDINADOR" && "Coordinador de Sucursal — Training Zone"}
                {position === "ENTRENADOR" && "Entrenador / Instructor de Piso — Training Zone"}
                {position === "RECEPCION" && "Recepcionista de Sucursal — Training Zone"}
                {position === "LIMPIEZA" && "Personal de Limpieza y Mantenimiento — Training Zone"}
              </p>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>Bienvenido/a <span className="text-white font-semibold">{candidateName}</span>. Este examen evalúa tus criterios para el puesto de{" "}
                  <strong>
                    {position === "COORDINADOR" && "Coordinador"}
                    {position === "ENTRENADOR" && "Entrenador"}
                    {position === "RECEPCION" && "Recepción"}
                    {position === "LIMPIEZA" && "Limpieza"}
                  </strong>
                  .
                </p>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200">
                  <p className="font-semibold mb-1">⚠️ Instrucciones importantes:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-200/80">
                    <li>Tienes <strong>{Math.floor(timeLeft / 60)} minutos</strong> para completar el examen</li>
                    <li>El cronómetro comenzará a correr en cuanto hagas clic en {position === "COORDINADOR" ? "'Comenzar Parte A'" : "'Comenzar examen'"}</li>
                    <li>No recargues ni cierres esta página</li>
                    <li>No se permite copiar texto ni usar herramientas externas</li>
                    {position === "COORDINADOR" && <li>Responde con tus propias palabras y experiencia</li>}
                  </ul>
                </div>
                <p className="text-slate-400">
                  {position === "COORDINADOR" ? (
                    <>El examen consta de <strong className="text-white">2 partes</strong>: 10 preguntas de criterio (opción múltiple) y 10 casos prácticos operativos.</>
                  ) : (
                    <>El examen consta de <strong className="text-white">20 preguntas de opción múltiple</strong> de criterio sobre escenarios reales en la sucursal.</>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={startExam}
              disabled={starting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all"
            >
              {starting ? "Iniciando examen..." : position === "COORDINADOR" ? "Comenzar Parte A →" : "Comenzar examen →"}
            </button>
          </div>
        )}

        {/* Step 1: Part A */}
        {currentStep === 1 && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white">
                {position === "COORDINADOR" ? "Parte A — Test de Criterio" : "Evaluación de Criterio"}
              </h2>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{activeQuestions.length} preguntas</span>
            </div>
            {activeQuestions.map((q) => (
              <div key={q.id} className="bg-[#1a1a1e] rounded-2xl border border-[#252529] p-5 sm:p-6 select-none" style={{ userSelect: "none" }} onCopy={(e) => e.preventDefault()}>
                <p className="text-xs text-blue-400 font-medium mb-1">{q.label}</p>
                <p className="text-white font-medium mb-4">{q.text}</p>
                <div className="space-y-2.5">
                  {q.options.map((opt) => (
                    <label key={opt.key} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${partA[q.id] === opt.key ? "border-blue-500 bg-blue-500/10" : "border-[#252529] hover:border-[#353539]"}`}>
                      <input type="radio" name={q.id} value={opt.key} checked={partA[q.id] === opt.key} onChange={() => setPartA((p) => ({ ...p, [q.id]: opt.key }))} className="mt-0.5 accent-blue-500" />
                      <span className="text-sm text-slate-200"><strong className="text-slate-400 mr-1">{opt.key})</strong> {opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setCurrentStep(position === "COORDINADOR" ? 2 : 3)} disabled={!allPartADone} className={`w-full font-semibold py-3.5 rounded-xl transition-all ${allPartADone ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-[#252529] text-slate-500 cursor-not-allowed"}`}>
              {allPartADone ? (position === "COORDINADOR" ? "Continuar a Parte B →" : "Revisar y Enviar →") : "Responde todas las preguntas para continuar"}
            </button>
          </div>
        )}

        {/* Step 2: Part B */}
        {currentStep === 2 && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white">Parte B — Casos Prácticos</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">10 casos</span>
            </div>
            <p className="text-sm text-slate-400 -mt-4 mb-2">Responde con detalle, usando ejemplos concretos y vocabulario operativo.</p>
            {PART_B_CASES.map((c) => (
              <div key={c.id} className="bg-[#1a1a1e] rounded-2xl border border-[#252529] p-5 sm:p-6 select-none" style={{ userSelect: "none" }} onCopy={(e) => e.preventDefault()}>
                <p className="text-xs text-emerald-400 font-medium mb-1">{c.label}</p>
                <p className="text-white font-medium mb-3">{c.text}</p>
                <textarea
                  value={partB[c.id] || ""}
                  onChange={(e) => setPartB((p) => ({ ...p, [c.id]: e.target.value }))}
                  onPaste={(e) => e.preventDefault()}
                  rows={4}
                  maxLength={2000}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full bg-[#0f0f14] border border-[#252529] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-y focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all select-text"
                  style={{ userSelect: "text" }}
                />
                <p className="text-xs text-slate-600 mt-1 text-right">{(partB[c.id] || "").length}/2000</p>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setCurrentStep(1)} className="flex-1 bg-[#252529] hover:bg-[#2a2a2e] text-slate-300 font-semibold py-3.5 rounded-xl transition-all">
                ← Volver a Parte A
              </button>
              <button onClick={() => setCurrentStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all">
                Revisar y Enviar →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="animate-fadeIn space-y-6">
            <h2 className="text-xl font-bold text-white mb-2">Revisión Final</h2>
            <div className="bg-[#1a1a1e] rounded-2xl border border-[#252529] p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-blue-400 mb-3">Respuestas ({Object.keys(partA).length}/{activeQuestions.length})</h3>
              {activeQuestions.map((q) => (
                <div key={q.id} className="flex justify-between items-center py-2 border-b border-[#252529] last:border-0">
                  <span className="text-sm text-slate-300">{q.label}</span>
                  <span className={`text-sm font-mono font-bold ${partA[q.id] ? "text-blue-400" : "text-red-400"}`}>{partA[q.id] || "—"}</span>
                </div>
              ))}
            </div>
            {position === "COORDINADOR" && (
              <div className="bg-[#1a1a1e] rounded-2xl border border-[#252529] p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-emerald-400 mb-3">Parte B — Casos ({PART_B_CASES.filter(c => (partB[c.id] || "").trim().length > 20).length}/10)</h3>
                {PART_B_CASES.map((c) => {
                  const text = partB[c.id] || "";
                  const ok = text.trim().length > 20;
                  return (
                    <div key={c.id} className="flex justify-between items-center py-2 border-b border-[#252529] last:border-0">
                      <span className="text-sm text-slate-300">{c.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{ok ? `${text.length} chars` : "Vacío"}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                ❌ Ocurrió un error al enviar tu examen: {submitError}
              </div>
            )}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200">
              ⚠️ Una vez enviado, no podrás modificar tus respuestas. Asegúrate de que todo esté correcto.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCurrentStep(position === "COORDINADOR" ? 2 : 1)} className="flex-1 bg-[#252529] hover:bg-[#2a2a2e] text-slate-300 font-semibold py-3.5 rounded-xl transition-all">
                ← Volver
              </button>
              <button onClick={() => submitExam(partA, partB, false)} disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50">
                {submitting ? "Enviando..." : "✓ Enviar Examen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
