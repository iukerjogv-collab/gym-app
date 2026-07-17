"use client";

import { useEffect, useState, useCallback } from "react";
import { getAttendanceReport, getBranchesReportFilter, AttendanceReportItem } from "../actions";
import { RefreshCw, UserCheck, AlertCircle, Building2, CalendarIcon, Download, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

export default function AttendanceTableClient() {
  const [data, setData] = useState<AttendanceReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ── Fechas como strings YYYY-MM-DD (zona local del navegador) ──
  const todayStr = new Date().toLocaleDateString('en-CA'); // "2026-04-19"
  const [selectedDateFrom, setSelectedDateFrom] = useState<string>(todayStr);
  const [selectedDateTo, setSelectedDateTo] = useState<string>(todayStr);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [onlyLates, setOnlyLates] = useState<boolean>(false);

  const filteredData = onlyLates ? data.filter(d => d.isLate) : data;

  const fetchData = useCallback(async (dateFrom: string, dateTo: string, branchIdToFetch: string) => {
    setLoading(true);
    setErrorMsg("");

    const parsedBranchId = branchIdToFetch !== "all" ? parseInt(branchIdToFetch, 10) : undefined;
    const res = await getAttendanceReport(dateFrom, dateTo, parsedBranchId);
    if (res.success && res.data) {
      setData(res.data);
      setLastUpdate(new Date());
    } else {
      setErrorMsg(res.error || "Ocurrió un error al consultar las asistencias.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchBranchesFilter = async () => {
      const bData = await getBranchesReportFilter();
      setBranches(bData);
    };
    fetchBranchesFilter();
  }, []);

  useEffect(() => {
    fetchData(selectedDateFrom, selectedDateTo, selectedBranchId);
  }, [fetchData, selectedDateFrom, selectedDateTo, selectedBranchId]);

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return;
    
    const excelData = filteredData.map(item => {
      let totalHoras = "Pendiente";
      if (item.checkOut) {
        const diffMs = new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        totalHoras = `${diffHrs.toString().padStart(2, '0')}h ${diffMins.toString().padStart(2, '0')}m`;
      }
      return {
        "Nombre": item.userName,
        "Sucursal": item.branchName,
        "Fecha": item.fecha,
        "Hora Límite": item.deadlineTime,
        "Hora Entrada": formatTime(item.checkIn),
        "Hora Salida": item.checkOut ? formatTime(item.checkOut) : "--:--",
        "Total Horas": totalHoras,
        "Estatus": item.isLate ? "RETARDO" : "A TIEMPO",
        "Minutos de Retardo": item.delayMinutes
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");
    
    const fileName = `Reporte_Asistencias_${format(new Date(selectedDateFrom + "T12:00:00"), "dd-MM-yyyy")}_al_${format(new Date(selectedDateTo + "T12:00:00"), "dd-MM-yyyy")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1e] rounded-xl shadow-xl border border-[#252529] overflow-hidden">

      {/* Header Premium Dark */}
      <div className="bg-[#121215] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#252529]">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" size={22} /> Reporte de Asistencias
            <span className="ml-2 inline-flex items-center justify-center bg-[#252529] text-slate-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#333338]">
              {filteredData.length} {filteredData.length === 1 ? 'Registro' : 'Registros'}
            </span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Vista global de entradas registradas para la fecha seleccionada.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">

          <Select value={selectedBranchId} onValueChange={(val) => setSelectedBranchId(val)}>
            <SelectTrigger className="h-10 w-full sm:w-[200px] bg-[#1a1a1e] text-slate-200 border-[#252529] hover:bg-[#252529] focus:ring-red-500">
              <SelectValue placeholder="Todas las Sucursales" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1e] text-slate-200 border-[#252529]">
              <SelectItem value="all">Todas las Sucursales</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "h-10 w-full sm:w-[130px] justify-start text-left font-normal bg-[#1a1a1e] text-slate-200 border-[#252529] hover:bg-[#252529] hover:text-white",
                    !selectedDateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDateFrom ? format(new Date(selectedDateFrom + "T12:00:00"), "dd/MM/yyyy") : "Desde"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-[#1a1a1e] border-[#252529] z-[60]"
                align="center"
                side="bottom"
                sideOffset={12}
                avoidCollisions
                collisionPadding={20}
              >
                <Calendar
                  mode="single"
                  selected={selectedDateFrom ? new Date(selectedDateFrom + "T12:00:00") : undefined}
                  onSelect={(date) => date && setSelectedDateFrom(date.toLocaleDateString('en-CA'))}
                  initialFocus
                  className="bg-[#1a1a1e] text-slate-200"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "h-10 w-full sm:w-[130px] justify-start text-left font-normal bg-[#1a1a1e] text-slate-200 border-[#252529] hover:bg-[#252529] hover:text-white",
                    !selectedDateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDateTo ? format(new Date(selectedDateTo + "T12:00:00"), "dd/MM/yyyy") : "Hasta"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-[#1a1a1e] border-[#252529] z-[60]"
                align="center"
                side="bottom"
                sideOffset={12}
                avoidCollisions
                collisionPadding={20}
              >
                <Calendar
                  mode="single"
                  selected={selectedDateTo ? new Date(selectedDateTo + "T12:00:00") : undefined}
                  onSelect={(date) => date && setSelectedDateTo(date.toLocaleDateString('en-CA'))}
                  initialFocus
                  className="bg-[#1a1a1e] text-slate-200"
                />
              </PopoverContent>
            </Popover>
          </div>

          <button
            onClick={() => setOnlyLates(!onlyLates)}
            className={cn(
              "h-10 flex w-full sm:w-auto items-center justify-center gap-2 px-4 rounded-lg transition-colors border text-sm font-semibold active:scale-95",
              onlyLates 
                ? "bg-red-500/10 text-red-500 border-red-500/50" 
                : "bg-[#1a1a1e] text-slate-400 border-[#252529] hover:bg-[#252529] hover:text-slate-200"
            )}
          >
            <AlertCircle size={16} />
            <span className="hidden sm:inline">Solo Retardos</span>
          </button>

          <button
            onClick={() => fetchData(selectedDateFrom, selectedDateTo, selectedBranchId)}
            disabled={loading}
            className={`h-10 flex w-full sm:w-auto items-center justify-center gap-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <button
            onClick={exportToExcel}
            className="h-10 flex w-full sm:w-auto items-center justify-center gap-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-semibold active:scale-95"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Alertas de error */}
      {errorMsg && (
        <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 font-medium text-sm">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Grid Table Container */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="text-xs text-slate-500 uppercase bg-[#121215] border-b border-[#252529]">
            <tr>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider">Empleado</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Sucursal</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Fecha</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Hora Límite</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Entrada</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Salida</th>
              <th scope="col" className="px-6 py-4 font-bold tracking-wider text-right">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252529] bg-[#1a1a1e]">
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-500 font-medium">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-red-500/40" size={24} />
                  Sincronizando registros...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-500 font-medium italic">
                  No se encontraron asistencias para los criterios seleccionados.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-[#252529]/30 transition-colors">

                  {/* Celda: Empleado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#252529] text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center justify-center font-bold text-sm border border-[#333338]">
                        {row.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-semibold text-slate-200">{row.userName}</div>
                    </div>
                  </td>

                  {/* Celda: Sucursal */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/5 border border-blue-500/10 text-blue-400 text-xs font-bold">
                      <Building2 size={12} /> {row.branchName}
                    </div>
                  </td>

                  {/* Celda: Fecha */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#252529] border border-[#333338] text-slate-300 text-xs font-semibold">
                      <CalendarIcon size={12} /> {row.fecha}
                    </div>
                  </td>

                  {/* Celda: Hora Límite */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs font-bold">
                      <Clock size={12} /> {row.deadlineTime}
                    </div>
                  </td>

                  {/* Celda: Entrada */}
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-slate-100">
                    {formatTime(row.checkIn)}
                  </td>

                  {/* Celda: Salida */}
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-slate-100">
                    {row.checkOut ? (
                      formatTime(row.checkOut)
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-slate-500" title="En Turno">
                        <span>--:--</span>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                        </span>
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest hidden sm:inline-block">En Turno</span>
                      </div>
                    )}
                  </td>

                  {/* Celda: Estatus */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {row.isLate ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        RETARDO (+{row.delayMinutes} min)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                        A TIEMPO
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}