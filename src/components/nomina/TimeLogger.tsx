'use client';

import React, { useState, useEffect, useReducer } from 'react';
import { Play, Square, AlertTriangle, Clock } from 'lucide-react';
import {
  getActiveShifts,
  getActiveEmployees,
  checkIn,
  checkOut,
  ORPHAN_SHIFT_THRESHOLD_HOURS,
} from '@/lib/queries-nomina';
import type { TimeLogWithEmployee } from '@/lib/types/nomina';
import type { Employee } from '@/lib/types/nomina';

export default function TimeLogger() {
  const [activeShifts, setActiveShifts] = useState<TimeLogWithEmployee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hallazgo #3: Reemplazamos `useState(tick)` fantasma por useReducer limpio
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  // Carga inicial de datos desde Supabase
  const loadData = async () => {
    try {
      setError(null);
      const [shifts, employees] = await Promise.all([
        getActiveShifts(),
        getActiveEmployees(),
      ]);
      setActiveShifts(shifts);
      // Filtrar empleados que ya tienen turno activo
      const activeEmployeeIds = new Set(shifts.map((s) => s.employee_id));
      setAvailableEmployees(employees.filter((e) => !activeEmployeeIds.has(e.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reloj que re-renderiza limpiamente cada minuto (Hallazgo #3)
  useEffect(() => {
    const timer = setInterval(forceUpdate, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    if (!selectedEmployee || actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      await checkIn(selectedEmployee);
      setSelectedEmployee('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar entrada');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (shiftId: number) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      await checkOut(shiftId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar salida');
    } finally {
      setActionLoading(false);
    }
  };

  // Hallazgo #8: Constante ORPHAN_SHIFT_THRESHOLD_HOURS viene del módulo de queries
  const getShiftStatus = (checkInIso: string) => {
    const diffMs = Date.now() - new Date(checkInIso).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMinutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const isOrphan = diffHours > ORPHAN_SHIFT_THRESHOLD_HOURS;

    return {
      durationStr: `${Math.floor(diffHours)}h ${diffMinutes}m`,
      isOrphan,
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Cargando turnos activos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-sm text-red-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold mb-0.5">Error</p>
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400 text-lg leading-none">✕</button>
        </div>
      )}

      {/* Check-In Header */}
      <div className="bg-[#090d1f]/40 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 w-full md:w-auto flex-1">
          <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Control de Asistencia
          </h2>
          <p className="text-sm text-slate-400">Selecciona un empleado para iniciar su turno.</p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 w-full md:w-64">
            <select
              className="w-full bg-[#02040a] border border-white/[0.1] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none disabled:opacity-50"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={actionLoading}
            >
              <option value="">-- Seleccione Empleado --</option>
              {availableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={!selectedEmployee || actionLoading}
            className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {actionLoading ? (
              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-emerald-400 group-hover:scale-110 transition-transform" />
            )}
            <span>Entrada</span>
          </button>
        </div>
      </div>

      {/* Active Shifts Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">
          Turnos Activos ({activeShifts.length})
        </h3>

        {activeShifts.length === 0 ? (
          <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-12 text-center">
            <p className="text-slate-500 italic">No hay empleados trabajando en este momento.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeShifts.map((shift) => {
              const status = getShiftStatus(shift.check_in);

              return (
                <div
                  key={shift.id}
                  className={`relative p-5 rounded-3xl border backdrop-blur-md overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${
                    status.isOrphan
                      ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                      : 'bg-[#090d1f]/60 border-white/[0.05] hover:border-indigo-500/30'
                  }`}
                >
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] pointer-events-none transition-colors duration-500 ${status.isOrphan ? 'bg-red-500/20' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'}`} />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-100 text-lg leading-tight">{shift.employee.first_name}</h4>
                        <h4 className="font-medium text-slate-400">{shift.employee.last_name}</h4>
                      </div>

                      {status.isOrphan ? (
                        <span className="flex items-center gap-1 bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider animate-pulse border border-red-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Alerta
                        </span>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-end border-b border-white/[0.05] pb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Entrada</span>
                        <span className="text-sm font-mono text-slate-300">
                          {new Date(shift.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tiempo</span>
                        <span className={`text-xl font-mono font-bold tracking-tight ${status.isOrphan ? 'text-red-400' : 'text-indigo-300'}`}>
                          {status.durationStr}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckOut(shift.id)}
                      disabled={actionLoading}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                        status.isOrphan
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                          : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.05]'
                      }`}
                    >
                      <Square className={`w-4 h-4 ${status.isOrphan ? 'fill-white' : ''}`} />
                      Finalizar Turno
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
