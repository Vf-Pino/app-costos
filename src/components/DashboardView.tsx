'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getRealTimeMetrics } from '../lib/queries';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw,
  TrendingDown,
  Lock,
  CalendarDays,
  Activity,
  Layers
} from 'lucide-react';

export default function DashboardView() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data, error: swrError, isValidating, mutate } = useSWR(
    ['realTimeMetrics', currentYear, currentMonth],
    () => getRealTimeMetrics(currentYear, currentMonth)
  );

  const loading = !data && !swrError;
  const error = swrError ? (swrError instanceof Error ? swrError.message : 'Error al obtener las métricas de costos.') : '';
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

  const fetchMetrics = () => mutate();

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh] animate-fade-in">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">Sincronizando umbrales analíticos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="max-w-md p-8 rounded-3xl glass-panel-glow border border-red-500/20 text-center shadow-2xl relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-red-500/10 rounded-full blur-xl"></div>
          <ShieldAlert className="w-14 h-14 text-red-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-xl font-black text-red-200">Error de Conexión</h3>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed font-medium">{error}</p>
          <button
            onClick={fetchMetrics}
            className="mt-6 w-full py-3 rounded-2xl bg-red-600/25 border border-red-500/35 text-red-200 text-sm font-bold hover:bg-red-600/35 active:scale-95 transition-all cursor-pointer"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div id="dashboard-view" className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 animate-fade-in">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-300 shadow-sm">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cierre Fiscal Gastronómico</span>
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Actualizado: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mt-2 capitalize tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {currentMonthName}
          </h1>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={isValidating}
          className="self-start sm:self-center flex items-center gap-2.5 px-5 py-3 rounded-2xl glass-button text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-400 ${isValidating ? 'animate-spin' : ''}`} />
          <span>Actualizar Métricas</span>
        </button>
      </div>

      {/* Main KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Venta Neta */}
        <div className="bento-card bento-card-indigo p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/15 transition-all duration-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Ventas Netas Totales</span>
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md group-hover:scale-110 transition-all duration-300">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none text-gradient-primary mb-4">
              {formatCurrency(data.ventaNeta)}
            </h3>
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-300">
              <div className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-3 py-2 rounded-lg border border-white/[0.05]">
                <span className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-emerald-400"/> Efectivo</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(data.ingresosEfectivo)}</span>
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-3 py-2 rounded-lg border border-white/[0.05]">
                <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-indigo-400"/> Transferencia</span>
                <span className="text-indigo-400 font-bold">{formatCurrency(data.ingresosTransferencia)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Costos Totales */}
        <div className="bento-card p-6 relative overflow-hidden group hover:border-pink-500/20 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7),_0_0_30px_rgba(236,72,153,0.08)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/15 transition-all duration-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Costos Totales Acumulados</span>
            <div className="p-3.5 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-md group-hover:scale-110 transition-all duration-300">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
              {formatCurrency(data.totalCostosCalculados)}
            </h3>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <span className="font-semibold">Monto real registrado:</span>
              <span className="text-pink-400 font-bold">{formatCurrency(data.totalCostosReal)}</span>
            </p>
          </div>
        </div>

        {/* Utilidad Neta Real */}
        <div className={`bento-card p-6 relative overflow-hidden group border ${
          data.utilidadNetaCalculada >= 0 
            ? 'bento-card-emerald border-emerald-500/10' 
            : 'bento-card-red border-red-500/10'
        }`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-all duration-500 ${
            data.utilidadNetaCalculada >= 0 ? 'bg-emerald-500/10 group-hover:bg-emerald-500/15' : 'bg-red-500/10 group-hover:bg-red-500/15'
          }`}></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Utilidad Neta</span>
            <div className={`p-3.5 rounded-2xl border shadow-md group-hover:scale-110 transition-all duration-300 ${
              data.utilidadNetaCalculada >= 0 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
            }`}>
              {data.utilidadNetaCalculada >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-8">
            <h3 className={`text-3xl md:text-4xl font-black tracking-tight leading-none ${
              data.utilidadNetaCalculada >= 0 ? 'text-gradient-emerald' : 'text-gradient-red'
            }`}>
              {formatCurrency(data.utilidadNetaCalculada)}
            </h3>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Margen neto operativo:</span>
              <span className={`font-extrabold ${data.utilidadNetaCalculada >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.utilidadNetaPorcentaje.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Grid/Table Container */}
      <div className="bento-card overflow-hidden border border-white/[0.03]">
        {/* Section Header */}
        <div className="p-6 border-b border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01]">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Panel de Semáforos Gastronómicos</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Comparación continua del consumo diario frente a los límites ideales</p>
          </div>
          <div className="self-start sm:self-center flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-2xl text-xs text-indigo-300 font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>Día de control: {data.dayOfMonth} / {data.totalDays}</span>
          </div>
        </div>

        {/* Premium List Item Layout (Responsive & Unified) */}
        <div className="divide-y divide-white/[0.03] bg-white/[0.005]">
          {data.rubros.map((r, index) => {
            const badgeColors = {
              green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]',
              red: 'bg-red-500/10 text-red-300 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
              neutral: 'bg-slate-800/30 text-slate-400 border-slate-700/30'
            };

            const progressColors = {
              green: 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]',
              red: 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.35)]',
              neutral: 'bg-gradient-to-r from-slate-600 to-slate-500'
            };

            const progressWidth = Math.min(100, r.metaPorcentaje > 0 ? (r.realPorcentaje / r.metaPorcentaje) * 100 : 0);

            return (
              <div 
                key={index} 
                className="p-6 transition-all duration-300 hover:bg-white/[0.015] flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative"
              >
                {/* Left accent indicator line based on semaphore status */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${
                  r.semaforo === 'green' ? 'bg-emerald-500' : r.semaforo === 'red' ? 'bg-red-500' : 'bg-slate-600'
                }`}></div>

                {/* Left Side: Rubro Info */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-100 text-base tracking-wide">{r.rubro}</h4>
                    {r.esTeorico && (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-400 bg-amber-400/5 border border-amber-400/10 px-2.5 py-0.5 rounded-lg shadow-sm">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
                        <span>Devengado teórico activo</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1.5">
                    {r.semaforo === 'neutral' ? (
                      <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-indigo-400/70 flex-shrink-0" />
                    )}
                    <span>{r.infoText}</span>
                  </div>
                </div>

                {/* Middle: Progress Meter & Targets */}
                <div className="flex-1 max-w-md w-full space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <span>Participación:</span> 
                      <span className="font-bold text-slate-200">{r.realPorcentaje.toFixed(2)}%</span>
                    </span>
                    <span className="text-slate-400 font-semibold">
                      Límite Meta: <span className="font-extrabold text-indigo-300">{r.metaPorcentaje.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-900/60 h-2.5 rounded-full overflow-hidden border border-white/[0.02]">
                    <div 
                      className={`h-full ${progressColors[r.semaforo]} transition-all duration-700`}
                      style={{ width: `${progressWidth}%` }}
                    ></div>
                  </div>
                </div>

                {/* Right Side: Totals & Status badge */}
                <div className="flex flex-row sm:items-center justify-between lg:justify-end gap-6 min-w-[220px]">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Acumulado</span>
                    <span className="text-base font-extrabold text-slate-200 mt-0.5 block">{formatCurrency(r.teoricoMonto)}</span>
                    {r.esTeorico && r.realMonto > 0 && (
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Real: {formatCurrency(r.realMonto)}
                      </span>
                    )}
                  </div>

                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-extrabold uppercase tracking-wider ${badgeColors[r.semaforo]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      r.semaforo === 'green' ? 'bg-emerald-400' : r.semaforo === 'red' ? 'bg-red-400' : 'bg-slate-400'
                    } ${r.semaforo === 'red' ? 'animate-pulse-ring' : ''}`}></span>
                    <span>
                      {r.semaforo === 'green' ? 'Saludable' : r.semaforo === 'red' ? 'Excedido' : 'Diferido'}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
