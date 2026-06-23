'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, CheckCircle2, DollarSign, Receipt, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import {
  getLiquidationPreview,
  executeLiquidation,
  generatePayrollPeriods,
  currencyFormatter,
} from '@/lib/queries-nomina';
import type { LiquidationPreviewItem, PayrollPeriod } from '@/lib/types/nomina';

// ─── Formateo de moneda (Hallazgo #6: constante de módulo, no en cada render) ─
// currencyFormatter ya viene exportado desde queries-nomina.ts

// ─── Modal de Confirmación (Hallazgo #2: reemplaza window.confirm) ───────────
function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  isProcessing,
  totalPayroll,
  period,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  totalPayroll: number;
  period: string;
}) {
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#090d1f] border border-white/[0.12] rounded-3xl shadow-[0_8px_80px_rgba(0,0,0,0.8)] w-full max-w-sm p-8 relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Confirmar Liquidación</h3>
          <p className="text-sm text-slate-400 mb-1">Periodo: <span className="text-slate-200 font-semibold">{period}</span></p>
          <p className="text-sm text-slate-400 mb-5">
            Total a pagar: <span className="text-indigo-400 font-bold text-base">{currencyFormatter.format(totalPayroll)}</span>
          </p>
          <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
            ⚠️ Esta acción es <strong>irreversible</strong>. Se guardará el historial y se descontarán todas las deudas pendientes.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-transparent border border-white/[0.1] text-slate-300 rounded-xl hover:bg-white/[0.05] font-semibold text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar y Liquidar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PayrollLiquidation() {
  // Hallazgo #11: Periodos generados dinámicamente — inicializamos directamente
  const [periods] = useState<PayrollPeriod[]>(() => generatePayrollPeriods(6));
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(
    () => generatePayrollPeriods(6)[0] ?? null
  );
  const [preview, setPreview] = useState<LiquidationPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiquidating, setIsLiquidating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Cargar preview cuando cambia el periodo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!selectedPeriod) return;
    loadPreview(selectedPeriod.start_date, selectedPeriod.end_date);
  }, [selectedPeriod]);


  const loadPreview = async (start_date: string, end_date: string) => {
    setLoading(true);
    setError(null);
    setIsDone(false);
    try {
      const data = await getLiquidationPreview(start_date, end_date);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos de liquidación');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    const period = periods.find((p) => p.value === value) ?? null;
    setSelectedPeriod(period);
  };

  const handleConfirmLiquidation = async () => {
    if (!selectedPeriod || isLiquidating) return;
    setIsLiquidating(true);
    setError(null);
    try {
      await executeLiquidation(preview, selectedPeriod.start_date, selectedPeriod.end_date);
      setShowConfirm(false);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error ejecutando liquidación');
      setShowConfirm(false);
    } finally {
      setIsLiquidating(false);
    }
  };

  // Hallazgo #6: currencyFormatter.format() en lugar de new Intl.NumberFormat() cada render
  const formatCurrency = (amount: number) => currencyFormatter.format(amount);

  const totalPayroll = preview.reduce((sum, item) => sum + item.net_pay, 0);

  return (
    <div className="space-y-8">
      {/* Header y filtro de periodo */}
      <div className="bg-[#090d1f]/40 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3 tracking-tight">
            <Calculator className="w-6 h-6 text-violet-400" />
            Liquidación Quincenal
          </h2>
          <p className="text-sm text-slate-400 mt-1">Calcula la nómina, aplica deducciones y congela el reporte.</p>
        </div>

        <div className="relative z-10 w-full md:w-auto bg-[#02040a]/50 p-2 rounded-2xl border border-white/[0.05] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Periodo</label>
          <select
            value={selectedPeriod?.value ?? ''}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="bg-transparent text-slate-200 w-full sm:w-auto font-semibold px-3 py-2 sm:border-l border-white/[0.1] focus:outline-none focus:ring-0 appearance-none cursor-pointer"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value} className="bg-[#090d1f]">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      {/* Contenido principal */}
      {isDone ? (
        <div className="animate-in zoom-in-95 duration-500 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-50" />
          <CheckCircle2 className="w-20 h-20 text-emerald-400 mb-6 relative z-10" />
          <h3 className="text-3xl font-black text-white tracking-tight mb-2 relative z-10">¡Quincena Liquidada!</h3>
          <p className="text-slate-400 max-w-md relative z-10">
            El historial ha sido guardado de forma inmutable. Total procesado:{' '}
            <span className="text-emerald-400 font-bold">{formatCurrency(totalPayroll)}</span>
          </p>
          <button
            onClick={() => loadPreview(selectedPeriod!.start_date, selectedPeriod!.end_date)}
            className="mt-8 px-6 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white rounded-xl font-semibold transition-colors relative z-10"
          >
            Ver Otro Periodo
          </button>
        </div>
      ) : loading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Calculando liquidación...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {preview.length === 0 && (
            <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-12 text-center">
              <p className="text-slate-500 italic">No hay empleados activos con horas registradas en este periodo.</p>
            </div>
          )}

          {preview.map((item) => {
            const hours = Math.floor(item.total_minutes_worked / 60);
            const minutes = item.total_minutes_worked % 60;

            return (
              <div key={item.employee.id} className="bg-[#02040a]/50 border border-white/[0.05] rounded-3xl overflow-hidden hover:border-violet-500/30 transition-colors duration-500">
                {/* Cabecera del empleado */}
                <div className="bg-white/[0.02] px-6 py-4 border-b border-white/[0.05] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold border border-violet-500/30">
                      {item.employee.first_name[0]}{item.employee.last_name[0]}
                    </div>
                    <h3 className="font-bold text-slate-200 text-lg tracking-tight">
                      {item.employee.first_name} {item.employee.last_name}
                    </h3>
                  </div>
                  <span className="text-sm font-mono text-slate-400 bg-white/[0.05] px-3 py-1 rounded-full border border-white/[0.05]">
                    Tarifa: <span className="text-emerald-400">{formatCurrency(item.employee.hourly_rate)}/h</span>
                  </span>
                </div>

                {/* Desglose */}
                <div className="p-6 grid md:grid-cols-3 gap-6">
                  {/* Tiempo */}
                  <div className="space-y-1 relative">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Tiempo Trabajado
                    </p>
                    <p className="text-3xl font-light text-slate-200 tracking-tight">
                      {hours}h <span className="text-xl text-slate-400">{minutes}m</span>
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-2 pt-2 border-t border-white/[0.05]">
                      Total: {item.total_minutes_worked} minutos
                    </p>
                  </div>

                  {/* Deducciones */}
                  <div className="space-y-1 relative md:border-l md:border-white/[0.05] md:pl-6">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Deducciones
                    </p>
                    {item.pending_debts.length > 0 ? (
                      <ul className="text-sm text-red-400 space-y-2">
                        {item.pending_debts.map((d) => (
                          <li key={d.id} className="flex justify-between items-center bg-red-500/5 px-2 py-1.5 rounded-lg border border-red-500/10">
                            <span className="truncate pr-2" title={d.description ?? ''}>{d.description}</span>
                            <span className="font-mono font-medium">-{formatCurrency(d.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="h-16 flex items-center">
                        <p className="text-sm text-emerald-400/60 italic flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Sin deudas pendientes
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-br from-indigo-500/10 to-violet-600/10 border border-indigo-500/20 p-5 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/20 rounded-full blur-[20px]" />
                    <div className="flex justify-between text-xs text-indigo-300 font-medium mb-1.5">
                      <span className="uppercase tracking-wider">Bruto</span>
                      <span className="font-mono">{formatCurrency(item.gross_pay)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-red-400/80 font-medium mb-3 border-b border-indigo-500/20 pb-3">
                      <span className="uppercase tracking-wider">Deducido</span>
                      <span className="font-mono">-{formatCurrency(item.total_deductions)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-black text-indigo-200 uppercase tracking-widest flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-indigo-400" /> Neto
                      </span>
                      <span className="text-2xl font-bold text-white tracking-tight">{formatCurrency(item.net_pay)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Footer de acción */}
          {preview.length > 0 && (
            <div className="mt-10 flex flex-col items-stretch sm:items-end gap-3 p-6 bg-gradient-to-r from-indigo-900/20 to-transparent border-t border-indigo-500/20 rounded-b-3xl">
              <div className="text-right mb-2">
                <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">Total Nómina a Pagar</p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  {formatCurrency(totalPayroll)}
                </p>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isLiquidating}
                className="relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-4 rounded-xl font-bold shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all disabled:opacity-70 flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                <Receipt className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Liquidar Quincena y Congelar</span>
              </button>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mt-1">
                Esta acción es irreversible en el historial
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación (Hallazgo #2: reemplaza window.confirm) */}
      <ConfirmModal
        isOpen={showConfirm}
        onConfirm={handleConfirmLiquidation}
        onCancel={() => setShowConfirm(false)}
        isProcessing={isLiquidating}
        totalPayroll={totalPayroll}
        period={selectedPeriod?.label ?? ''}
      />
    </div>
  );
}
