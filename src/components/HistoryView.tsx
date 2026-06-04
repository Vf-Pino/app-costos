'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getHistoricalComparison } from '../lib/queries';
import { 
  History, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet,
  BrainCircuit,
  HelpCircle,
  Layers
} from 'lucide-react';

export default function HistoryView() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Select state (YYYY-MM)
  const [period1, setPeriod1] = useState('');
  const [period2, setPeriod2] = useState('');
  const [validationError, setValidationError] = useState('');

  const shouldFetch = period1 && period2;
  const { data, error: swrError, isValidating, mutate } = useSWR(
    shouldFetch ? ['historicalComparison', period1, period2] : null,
    () => getHistoricalComparison(period1, period2)
  );

  const loading = isValidating && !data;
  const error = validationError || (swrError ? (swrError instanceof Error ? swrError.message : 'Error al obtener los históricos comparativos.') : '');

  // Generate list of months for selection
  const years = [2024, 2025, 2026];
  const months = [
    { value: '01', name: 'Enero' },
    { value: '02', name: 'Febrero' },
    { value: '03', name: 'Marzo' },
    { value: '04', name: 'Abril' },
    { value: '05', name: 'Mayo' },
    { value: '06', name: 'Junio' },
    { value: '07', name: 'Julio' },
    { value: '08', name: 'Agosto' },
    { value: '09', name: 'Septiembre' },
    { value: '10', name: 'Octubre' },
    { value: '11', name: 'Noviembre' },
    { value: '12', name: 'Diciembre' }
  ];

  // Initialize dropdowns
  useEffect(() => {
    // Period 1 default: last month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    setPeriod1(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
    setPeriod2(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  }, [currentYear, currentMonth]);

  const handleCompare = () => {
    if (!period1 || !period2) {
      setValidationError('Por favor selecciona ambos periodos para realizar la comparación.');
      return;
    }
    setValidationError('');
    mutate();
  };

  // Helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const getPeriodLabel = (periodStr: string) => {
    if (!periodStr) return '';
    const [y, m] = periodStr.split('-');
    const monthName = months.find(item => item.value === m)?.name || '';
    return `${monthName} ${y}`;
  };

  // Generate automated diagnostics based on comparison results
  const generateDiagnostics = () => {
    if (!data) return [];
    const diagnostics: { type: 'alert' | 'success' | 'info'; text: string }[] = [];

    // 1. Sales Trend
    if (data.ventaNetaVariacionPorcentaje > 0) {
      diagnostics.push({
        type: 'success',
        text: `Las ventas netas crecieron un ${data.ventaNetaVariacionPorcentaje.toFixed(2)}% respecto a ${getPeriodLabel(period1)}. Esto oxigena el flujo de caja.`
      });
    } else if (data.ventaNetaVariacionPorcentaje < 0) {
      diagnostics.push({
        type: 'alert',
        text: `Alerta: Las ventas disminuyeron un ${Math.abs(data.ventaNetaVariacionPorcentaje).toFixed(2)}%. Se recomienda auditar promociones y días de baja afluencia.`
      });
    }

    // 2. Cost of Mercancia Trend
    const mercancia = data.rubros.find(r => r.rubro === 'Mercancia');
    if (mercancia) {
      const shareDiff = mercancia.porcentaje2 - mercancia.porcentaje1;
      if (shareDiff > 2) {
        diagnostics.push({
          type: 'alert',
          text: `Alerta Crítica: El coste de Mercancía aumentó su participación en ${shareDiff.toFixed(2)} puntos porcentuales (de ${mercancia.porcentaje1.toFixed(2)}% a ${mercancia.porcentaje2.toFixed(2)}%). Revisa el desperdicio o recetas estándar.`
        });
      } else if (shareDiff < -1) {
        diagnostics.push({
          type: 'success',
          text: `Excelente: Eficiencia de materia prima mejorada en ${Math.abs(shareDiff).toFixed(2)} puntos porcentuales en ${getPeriodLabel(period2)}.`
        });
      }
    }

    // 3. Utility Trend
    if (data.utilidadNetaVariacionPorcentaje > 0 && data.utilidadNeta2 > 0) {
      diagnostics.push({
        type: 'success',
        text: `La utilidad neta incrementó un ${data.utilidadNetaVariacionPorcentaje.toFixed(2)}%. Excelente desempeño operacional.`
      });
    } else if (data.utilidadNeta2 < 0) {
      diagnostics.push({
        type: 'alert',
        text: `Atención: Casa Bistro opera bajo pérdidas comerciales en ${getPeriodLabel(period2)}. Margen neto de ${(data.utilidadNeta2 / data.ventaNeta2 * 100).toFixed(2)}%.`
      });
    }

    // 4. Overrun check on limits
    const limits: Record<string, number> = {
      'Mercancia': 35.00, 'Nomina Operativa': 18.00, 'Nomina Administrativa': 7.00,
      'Arriendo': 12.00, 'Servicios': 5.00, 'Publicidad': 5.00, 'Mantenimiento': 1.00, 'Otros': 1.00
    };

    data.rubros.forEach(r => {
      const limit = limits[r.rubro] || 0;
      if (r.porcentaje2 > limit) {
        diagnostics.push({
          type: 'alert',
          text: `El rubro [${r.rubro}] representó un ${r.porcentaje2.toFixed(2)}% en ${getPeriodLabel(period2)}, superando la meta del ${limit.toFixed(2)}%. Requiere auditoría inmediata.`
        });
      }
    });

    if (diagnostics.length === 0) {
      diagnostics.push({
        type: 'info',
        text: 'Estabilidad financiera observada entre ambos periodos. Los costos fijos y variables operan bajo los límites estándar.'
      });
    }

    return diagnostics;
  };

  return (
    <div id="history-view" className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 animate-fade-in">
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-300 shadow-sm mb-3">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Matriz de Desviaciones</span>
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white">Consola Histórica y Comparativa</h1>
        <p className="text-slate-400 text-sm mt-1">Contrasta el desempeño analítico entre dos ciclos mensuales cerrados</p>
      </div>

      {/* Period Selector Panel */}
      <div className="bento-card p-6 border border-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-end gap-6">
          {/* Period 1 */}
          <div className="flex-1 w-full space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="p1-select">
              Periodo Base (Origen)
            </label>
            <select
              id="p1-select"
              value={period1}
              onChange={(e) => setPeriod1(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl glass-input text-white text-sm bg-[#090d1a] border border-white/[0.05] focus:border-indigo-500/50 outline-none"
            >
              {years.map(y => (
                months.map(m => (
                  <option key={`${y}-${m.value}`} value={`${y}-${m.value}`} className="bg-[#090d1a]">
                    {m.name} {y}
                  </option>
                ))
              ))}
            </select>
          </div>

          {/* Icon indicator */}
          <div className="hidden sm:flex items-center justify-center p-3 text-indigo-400 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Period 2 */}
          <div className="flex-1 w-full space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="p2-select">
              Periodo Destino (Comparación)
            </label>
            <select
              id="p2-select"
              value={period2}
              onChange={(e) => setPeriod2(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl glass-input text-white text-sm bg-[#090d1a] border border-white/[0.05] focus:border-indigo-500/50 outline-none"
            >
              {years.map(y => (
                months.map(m => (
                  <option key={`${y}-${m.value}`} value={`${y}-${m.value}`} className="bg-[#090d1a]">
                    {m.name} {y}
                  </option>
                ))
              ))}
            </select>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleCompare}
            disabled={isValidating}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 shadow-lg shadow-indigo-500/10"
          >
            {isValidating ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <History className="w-4.5 h-4.5" />
                <span>Comparar Ciclos</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/15 text-red-200 text-xs font-semibold animate-fade-in">
            {error}
          </div>
        )}
      </div>

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Calculando variaciones de costos...</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-8 animate-fade-in">
          {/* Executive Variation Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sales Variation */}
            <div className="bento-card p-6 border border-white/[0.03] group hover:border-indigo-500/20">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Crecimiento de Ventas</span>
              <h3 className="text-3xl font-black text-white mt-3 text-gradient-primary">
                {data.ventaNeta2 > 0 ? (data.ventaNetaVariacionPorcentaje >= 0 ? '+' : '') : ''}
                {data.ventaNetaVariacionPorcentaje.toFixed(2)}%
              </h3>
              <div className="flex items-center gap-2 mt-3.5 text-xs">
                {data.ventaNetaVariacion >= 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-4 h-4" />
                    {formatCurrency(data.ventaNetaVariacion)}
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-0.5">
                    <TrendingDown className="w-4 h-4" />
                    {formatCurrency(data.ventaNetaVariacion)}
                  </span>
                )}
                <span className="text-slate-500 font-medium">absoluto</span>
              </div>
            </div>

            {/* Cost Variation */}
            <div className="bento-card p-6 border border-white/[0.03] group hover:border-pink-500/20">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Variación de Costos</span>
              <h3 className="text-3xl font-black text-white mt-3">
                {data.totalCostosVariacionPorcentaje >= 0 ? '+' : ''}
                {data.totalCostosVariacionPorcentaje.toFixed(2)}%
              </h3>
              <div className="flex items-center gap-2 mt-3.5 text-xs">
                {data.totalCostosVariacion >= 0 ? (
                  <span className="text-red-400 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-4 h-4" />
                    {formatCurrency(data.totalCostosVariacion)}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <TrendingDown className="w-4 h-4" />
                    {formatCurrency(data.totalCostosVariacion)}
                  </span>
                )}
                <span className="text-slate-500 font-medium">absoluto</span>
              </div>
            </div>

            {/* Utility Variation */}
            <div className={`bento-card p-6 border group ${
              data.utilidadNeta2 >= 0 ? 'hover:border-emerald-500/20' : 'hover:border-red-500/20'
            }`}>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Variación Utilidad Neta</span>
              <h3 className={`text-3xl font-black mt-3 ${data.utilidadNeta2 >= 0 ? 'text-gradient-emerald' : 'text-gradient-red'}`}>
                {data.utilidadNetaVariacionPorcentaje >= 0 ? '+' : ''}
                {data.utilidadNetaVariacionPorcentaje.toFixed(2)}%
              </h3>
              <div className="flex items-center gap-2 mt-3.5 text-xs">
                {data.utilidadNetaVariacion >= 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-4 h-4" />
                    {formatCurrency(data.utilidadNetaVariacion)}
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-0.5">
                    <TrendingDown className="w-4 h-4" />
                    {formatCurrency(data.utilidadNetaVariacion)}
                  </span>
                )}
                <span className="text-slate-500 font-medium">absoluto</span>
              </div>
            </div>
          </div>

          {/* Automated Diagnostics Panel */}
          <div className="bento-card p-6 border border-white/[0.03] bg-white/[0.005] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-2.5 mb-5">
              <BrainCircuit className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h2 className="text-lg font-extrabold text-white">Diagnósticos de Gestión Automatizados</h2>
            </div>
            
            <div className="space-y-3.5">
              {generateDiagnostics().map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-3.5 p-4 rounded-2xl border text-xs leading-relaxed font-semibold ${
                    item.type === 'success' 
                      ? 'bg-emerald-500/5 text-emerald-300 border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.02)]' 
                      : item.type === 'alert'
                        ? 'bg-red-500/5 text-red-300 border-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.02)]'
                        : 'bg-slate-800/10 text-slate-300 border-white/[0.03]'
                  }`}
                >
                  {item.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                  {item.type === 'alert' && <AlertCircle className="w-4.5 h-4.5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />}
                  {item.type === 'info' && <HelpCircle className="w-4.5 h-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparative Matrix Table */}
          <div className="bento-card overflow-hidden border border-white/[0.03]">
            <div className="p-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-white">Matriz Comparativa de Costos</h2>
                <p className="text-xs text-slate-400 mt-0.5">Análisis de participación y desviación rubro por rubro</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20 font-bold shadow-md">
                <FileSpreadsheet className="w-4 h-4" />
                <span>P&G Comparado</span>
              </div>
            </div>

            {/* Premium Mobile-Adapted Rows List / Unified Table */}
            <div className="divide-y divide-white/[0.03] bg-white/[0.005]">
              {/* Venta Neta Row (Highlights first) */}
              <div className="p-6 bg-slate-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 font-bold">
                <div className="flex-1">
                  <h4 className="font-extrabold text-slate-100 text-sm tracking-wide">Venta Neta Acumulada</h4>
                  <div className="text-[10px] text-indigo-300 uppercase tracking-widest mt-1">Facturación total</div>
                </div>

                {/* Relative visual bars for comparing Venta Neta values */}
                <div className="flex-1 max-w-[200px] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Tendencia absoluta:</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900/60 overflow-hidden relative border border-white/[0.02]">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                        data.ventaNetaVariacion >= 0 ? 'from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'from-red-500 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      }`}
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 text-sm">
                  <div className="text-left md:text-right">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Base</span>
                    <span className="font-bold text-slate-400 block">{formatCurrency(data.ventaNeta1)}</span>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Destino</span>
                    <span className="font-extrabold text-white block">{formatCurrency(data.ventaNeta2)}</span>
                  </div>
                  <div className="text-right min-w-[130px]">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                      data.ventaNetaVariacionPorcentaje >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {data.ventaNetaVariacionPorcentaje >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {data.ventaNetaVariacionPorcentaje.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Rubros Breakdown */}
              {data.rubros.map((r, index) => {
                // Calculate side-by-side relative horizontal bars
                const maxVal = Math.max(r.monto1, r.monto2);
                const width1 = maxVal > 0 ? (r.monto1 / maxVal) * 100 : 0;
                const width2 = maxVal > 0 ? (r.monto2 / maxVal) * 100 : 0;
                const costIncreased = r.variacionMonto > 0;

                return (
                  <div 
                    key={index} 
                    className="p-6 transition-all duration-300 hover:bg-white/[0.015] flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex-1">
                      <h4 className="font-extrabold text-slate-200 text-sm tracking-wide">{r.rubro}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>Part Base: {r.porcentaje1.toFixed(1)}%</span>
                        <span>&bull;</span>
                        <span>Part Destino: {r.porcentaje2.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Relative horizontal side-by-side comparative bars */}
                    <div className="flex-1 max-w-[200px] space-y-2">
                      <div className="w-full space-y-1">
                        {/* Bar 1 (Period 1) */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-slate-500 w-3">B:</span>
                          <div className="flex-1 bg-slate-900/60 h-1.5 rounded-full overflow-hidden border border-white/[0.01]">
                            <div 
                              className="h-full bg-slate-500 transition-all duration-700" 
                              style={{ width: `${width1}%` }}
                            ></div>
                          </div>
                        </div>
                        {/* Bar 2 (Period 2) */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-slate-500 w-3">D:</span>
                          <div className="flex-1 bg-slate-900/60 h-1.5 rounded-full overflow-hidden border border-white/[0.01]">
                            <div 
                              className={`h-full transition-all duration-700 rounded-full ${
                                costIncreased 
                                  ? 'bg-gradient-to-r from-red-500 to-rose-400' 
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              }`} 
                              style={{ width: `${width2}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 text-sm">
                      <div className="text-left md:text-right">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Base</span>
                        <span className="font-semibold text-slate-400 block">{formatCurrency(r.monto1)}</span>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Destino</span>
                        <span className="font-bold text-slate-200 block">{formatCurrency(r.monto2)}</span>
                      </div>
                      <div className="text-right min-w-[130px]">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                          r.variacionMonto <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {r.variacionMonto <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          {Math.abs(r.variacionPorcentaje).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Utilidad Neta Row */}
              <div className="p-6 bg-slate-900/20 flex flex-col md:flex-row md:items-center justify-between gap-6 font-bold border-t border-white/[0.03]">
                <div className="flex-1">
                  <h4 className="font-extrabold text-slate-100 text-sm tracking-wide">Utilidad Neta del Ejercicio</h4>
                  <div className="text-[10px] text-emerald-400 uppercase tracking-widest mt-1">Excedente neto final</div>
                </div>

                {/* Relative visual bars for Utility comparison */}
                <div className="flex-1 max-w-[200px] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Rendimiento neto:</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900/60 overflow-hidden relative border border-white/[0.02]">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                        data.utilidadNetaVariacion >= 0 ? 'from-emerald-500 to-teal-450 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'from-red-500 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      }`}
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 text-sm">
                  <div className="text-left md:text-right">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Base</span>
                    <span className="font-bold text-slate-400 block">{formatCurrency(data.utilidadNeta1)}</span>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Destino</span>
                    <span className="font-extrabold text-white block">{formatCurrency(data.utilidadNeta2)}</span>
                  </div>
                  <div className="text-right min-w-[130px]">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                      data.utilidadNetaVariacionPorcentaje >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {data.utilidadNetaVariacionPorcentaje >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {data.utilidadNetaVariacionPorcentaje.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
