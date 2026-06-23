import { supabase } from './supabase';
import { RubroPrincipal, SubcategoriaMercancia, MetodoPago } from './types';

export interface IngresoDiario {
  id: string;
  fecha: string;
  monto_neto: number;
  metodo_pago: MetodoPago;
  creado_en: string;
}

export interface EgresoCosto {
  id: string;
  fecha: string;
  rubro_principal: RubroPrincipal;
  subcategoria: SubcategoriaMercancia | null;
  proveedor: string | null;
  monto: number;
  creado_en: string;
}

export interface ProyeccionGasto {
  id: string;
  rubro: RubroPrincipal;
  monto_proyectado_mensual: number;
}

export interface MetaControl {
  id: string;
  rubro: RubroPrincipal;
  porcentaje_limite: number;
}

export interface Transaction {
  id: string;
  fecha: string;
  tipo: 'ingreso' | 'egreso';
  rubro_principal: string | RubroPrincipal;
  subcategoria: SubcategoriaMercancia | null;
  proveedor: string | null;
  monto: number;
  metodo_pago?: MetodoPago | null;
  creado_en: string;
}

export interface RubroStatus {
  rubro: RubroPrincipal;
  metaPorcentaje: number;
  realMonto: number;
  teoricoMonto: number;
  realPorcentaje: number;
  esTeorico: boolean;
  semaforo: 'green' | 'red' | 'neutral';
  infoText: string;
}

export interface PAndGData {
  ventaNeta: number;
  ingresosEfectivo: number;
  ingresosTransferencia: number;
  totalCostosReal: number;
  totalCostosCalculados: number;
  utilidadNetaReal: number;
  utilidadNetaCalculada: number;
  utilidadNetaPorcentaje: number;
  rubros: RubroStatus[];
  daysPassed: number;
  totalDays: number;
  dayOfMonth: number;
}

/**
 * Calculates current or selected month metrics
 */
export async function getRealTimeMetrics(year: number, month: number): Promise<PAndGData> {
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

  // Days calculations
  const totalDays = new Date(year, month, 0).getDate();
  const dayOfMonth = isCurrentMonth ? now.getDate() : totalDays;
  const daysPassed = isCurrentMonth ? now.getDate() : totalDays;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

  // Parallel database calls
  const [ingresosRes, egresosRes, metasRes, proyeccionesRes] = await Promise.all([
    supabase.from('ingresos_diarios').select('*').gte('fecha', startDate).lte('fecha', endDate),
    supabase.from('egresos_costos').select('*').gte('fecha', startDate).lte('fecha', endDate),
    supabase.from('metas_control').select('*'),
    supabase.from('proyecciones_gastos').select('*')
  ]);

  if (ingresosRes.error) throw new Error(`Error fetching ingresos: ${ingresosRes.error.message}`);
  if (egresosRes.error) throw new Error(`Error fetching egresos: ${egresosRes.error.message}`);
  if (metasRes.error) throw new Error(`Error fetching metas: ${metasRes.error.message}`);
  if (proyeccionesRes.error) throw new Error(`Error fetching proyecciones: ${proyeccionesRes.error.message}`);

  const ingresos = (ingresosRes.data || []) as IngresoDiario[];
  const egresos = (egresosRes.data || []) as EgresoCosto[];
  const metas = (metasRes.data || []) as MetaControl[];
  const proyecciones = (proyeccionesRes.data || []) as ProyeccionGasto[];

  // Venta Neta Acumulada & Desglose
  const ventaNeta = ingresos.reduce((acc, curr) => acc + Number(curr.monto_neto), 0);
  const ingresosEfectivo = ingresos.filter(i => i.metodo_pago === MetodoPago.Efectivo).reduce((acc, curr) => acc + Number(curr.monto_neto), 0);
  const ingresosTransferencia = ingresos.filter(i => i.metodo_pago === MetodoPago.Transferencia).reduce((acc, curr) => acc + Number(curr.monto_neto), 0);

  // Group egresos by rubro
  const egresosPorRubro: Record<string, number> = {};
  egresos.forEach(e => {
    const rubro = e.rubro_principal;
    egresosPorRubro[rubro] = (egresosPorRubro[rubro] || 0) + Number(e.monto);
  });

  const rubrosValidos: RubroPrincipal[] = [
    RubroPrincipal.Mercancia,
    RubroPrincipal.NominaOperativa,
    RubroPrincipal.NominaAdministrativa,
    RubroPrincipal.Arriendo,
    RubroPrincipal.Servicios,
    RubroPrincipal.Publicidad,
    RubroPrincipal.Mantenimiento,
    RubroPrincipal.Otros
  ];

  const rubros: RubroStatus[] = rubrosValidos.map(rubro => {
    const meta = metas.find(m => m.rubro === rubro);
    const metaPorcentaje = meta ? Number(meta.porcentaje_limite) : 0;
    const realMonto = egresosPorRubro[rubro] || 0;

    let teoricoMonto = realMonto;
    let esTeorico = false;
    let infoText = '';

    // Nomina quincenal smoothing logic
    const isNomina = rubro === RubroPrincipal.NominaOperativa || rubro === RubroPrincipal.NominaAdministrativa;
    if (isNomina && realMonto === 0) {
      const proyeccion = proyecciones.find(p => p.rubro === rubro);
      const montoProyectado = proyeccion ? Number(proyeccion.monto_proyectado_mensual) : 0;
      teoricoMonto = montoProyectado * (daysPassed / totalDays);
      esTeorico = true;
      infoText = `Teórico devengado (Día ${daysPassed}/${totalDays})`;
    }

    // Calculate percentage relative to sales (V_n)
    const realPorcentaje = ventaNeta > 0 ? (teoricoMonto / ventaNeta) * 100 : 0;

    // Traffic light logic
    let semaforo: 'green' | 'red' | 'neutral' = 'green';
    const isFixed = rubro === RubroPrincipal.Arriendo || rubro === RubroPrincipal.Servicios;

    if (isFixed && dayOfMonth < 15) {
      semaforo = 'neutral';
      infoText = 'Evaluación diferida (Días 1-14)';
    } else if (isFixed && dayOfMonth >= 15) {
      // Evaluate against prorated limit: limit * (daysPassed / totalDays)
      const proratedLimit = metaPorcentaje * (daysPassed / totalDays);
      semaforo = realPorcentaje > proratedLimit ? 'red' : 'green';
      infoText = `Pronto pago evaluado (Meta prorrateada: ${proratedLimit.toFixed(2)}%)`;
    } else {
      // For variable expenses or payroll (teorico/real)
      // Check against metaPorcentaje directly
      semaforo = realPorcentaje > metaPorcentaje ? 'red' : 'green';
      if (!infoText) {
        infoText = esTeorico ? 'Nómina proyectada activa' : 'Gasto real registrado';
      }
    }

    return {
      rubro,
      metaPorcentaje,
      realMonto,
      teoricoMonto,
      realPorcentaje,
      esTeorico,
      semaforo,
      infoText
    };
  });

  const totalCostosReal = Object.values(egresosPorRubro).reduce((acc, curr) => acc + curr, 0);
  const totalCostosCalculados = rubros.reduce((acc, curr) => acc + curr.teoricoMonto, 0);

  const utilidadNetaReal = ventaNeta - totalCostosReal;
  const utilidadNetaCalculada = ventaNeta - totalCostosCalculados;
  const utilidadNetaPorcentaje = ventaNeta > 0 ? (utilidadNetaCalculada / ventaNeta) * 100 : 0;

  return {
    ventaNeta,
    ingresosEfectivo,
    ingresosTransferencia,
    totalCostosReal,
    totalCostosCalculados,
    utilidadNetaReal,
    utilidadNetaCalculada,
    utilidadNetaPorcentaje,
    rubros,
    daysPassed,
    totalDays,
    dayOfMonth
  };
}

/**
 * Inserts daily sales data
 */
export async function insertIngreso(fecha: string, monto: number, metodoPago: MetodoPago): Promise<void> {
  const { error } = await supabase
    .from('ingresos_diarios')
    .insert([{ fecha, monto_neto: monto, metodo_pago: metodoPago }]);

  if (error) throw new Error(`Error inserting ingreso: ${error.message}`);
}

/**
 * Inserts an expense record
 */
export async function insertEgreso(
  fecha: string,
  rubro: RubroPrincipal,
  subcategoria: SubcategoriaMercancia | null,
  proveedor: string | null,
  monto: number
): Promise<void> {
  const { error } = await supabase
    .from('egresos_costos')
    .insert([{
      fecha,
      rubro_principal: rubro,
      subcategoria,
      proveedor: proveedor || null,
      monto
    }]);

  if (error) throw new Error(`Error inserting egreso: ${error.message}`);
}

/**
 * Gets the last 5 transactions for the Express Audit component
 */
export async function getRecentTransactions(): Promise<Transaction[]> {
  const [ingresosRes, egresosRes] = await Promise.all([
    supabase.from('ingresos_diarios').select('*').order('creado_en', { ascending: false }).limit(5),
    supabase.from('egresos_costos').select('*').order('creado_en', { ascending: false }).limit(5)
  ]);

  if (ingresosRes.error) throw new Error(ingresosRes.error.message);
  if (egresosRes.error) throw new Error(egresosRes.error.message);

  const ingresos = (ingresosRes.data || []).map((i: IngresoDiario) => ({
    id: i.id,
    fecha: i.fecha,
    tipo: 'ingreso' as const,
    rubro_principal: 'Ingreso Diario',
    subcategoria: null,
    proveedor: null,
    monto: Number(i.monto_neto),
    metodo_pago: i.metodo_pago,
    creado_en: i.creado_en
  }));

  const egresos = (egresosRes.data || []).map((e: EgresoCosto) => ({
    id: e.id,
    fecha: e.fecha,
    tipo: 'egreso' as const,
    rubro_principal: e.rubro_principal,
    subcategoria: e.subcategoria,
    proveedor: e.proveedor,
    monto: Number(e.monto),
    creado_en: e.creado_en
  }));

  // Combine and sort by creado_en desc, slice top 5
  return [...ingresos, ...egresos]
    .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
    .slice(0, 5);
}

/**
 * Deletes a transaction from the database physically
 */
export async function deleteTransaction(id: string, tipo: 'ingreso' | 'egreso'): Promise<void> {
  const table = tipo === 'ingreso' ? 'ingresos_diarios' : 'egresos_costos';
  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) throw new Error(`Error deleting transaction: ${error.message}`);
}

export interface HistoricalComparison {
  rubro: RubroPrincipal;
  monto1: number;
  monto2: number;
  porcentaje1: number;
  porcentaje2: number;
  variacionMonto: number;
  variacionPorcentaje: number;
}

export interface HistoricalComparisonData {
  ventaNeta1: number;
  ventaNeta2: number;
  ventaNetaVariacion: number;
  ventaNetaVariacionPorcentaje: number;
  totalCostos1: number;
  totalCostos2: number;
  totalCostosVariacion: number;
  totalCostosVariacionPorcentaje: number;
  utilidadNeta1: number;
  utilidadNeta2: number;
  utilidadNetaVariacion: number;
  utilidadNetaVariacionPorcentaje: number;
  rubros: HistoricalComparison[];
}

/**
 * Gets comparison between two periods in YYYY-MM format
 */
export async function getHistoricalComparison(period1: string, period2: string): Promise<HistoricalComparisonData> {
  const fetchPeriodData = async (period: string) => {
    const [year, monthStr] = period.split('-');
    const y = parseInt(year);
    const m = parseInt(monthStr);

    const totalDays = new Date(y, m, 0).getDate();
    const startDate = `${y}-${monthStr}-01`;
    const endDate = `${y}-${monthStr}-${String(totalDays).padStart(2, '0')}`;

    const [ingresosRes, egresosRes] = await Promise.all([
      supabase.from('ingresos_diarios').select('monto_neto').gte('fecha', startDate).lte('fecha', endDate),
      supabase.from('egresos_costos').select('rubro_principal, monto').gte('fecha', startDate).lte('fecha', endDate)
    ]);

    if (ingresosRes.error) throw new Error(ingresosRes.error.message);
    if (egresosRes.error) throw new Error(egresosRes.error.message);

    const ventaNeta = (ingresosRes.data || []).reduce((acc, curr) => acc + Number(curr.monto_neto), 0);

    const egresos = egresosRes.data || [];
    const egresosPorRubro: Record<string, number> = {};
    egresos.forEach(e => {
      egresosPorRubro[e.rubro_principal] = (egresosPorRubro[e.rubro_principal] || 0) + Number(e.monto);
    });

    return { ventaNeta, egresosPorRubro };
  };

  const [p1, p2] = await Promise.all([
    fetchPeriodData(period1),
    fetchPeriodData(period2)
  ]);

  const rubrosValidos: RubroPrincipal[] = [
    RubroPrincipal.Mercancia,
    RubroPrincipal.NominaOperativa,
    RubroPrincipal.NominaAdministrativa,
    RubroPrincipal.Arriendo,
    RubroPrincipal.Servicios,
    RubroPrincipal.Publicidad,
    RubroPrincipal.Mantenimiento,
    RubroPrincipal.Otros
  ];

  const rubrosCompare: HistoricalComparison[] = rubrosValidos.map(rubro => {
    const monto1 = p1.egresosPorRubro[rubro] || 0;
    const monto2 = p2.egresosPorRubro[rubro] || 0;

    const porcentaje1 = p1.ventaNeta > 0 ? (monto1 / p1.ventaNeta) * 100 : 0;
    const porcentaje2 = p2.ventaNeta > 0 ? (monto2 / p2.ventaNeta) * 100 : 0;

    const variacionMonto = monto2 - monto1;
    const variacionPorcentaje = porcentaje1 > 0 ? ((porcentaje2 - porcentaje1) / porcentaje1) * 100 : (porcentaje2 > 0 ? 100 : 0);

    return {
      rubro,
      monto1,
      monto2,
      porcentaje1,
      porcentaje2,
      variacionMonto,
      variacionPorcentaje
    };
  });

  const totalCostos1 = Object.values(p1.egresosPorRubro).reduce((acc, curr) => acc + curr, 0);
  const totalCostos2 = Object.values(p2.egresosPorRubro).reduce((acc, curr) => acc + curr, 0);

  const utilidadNeta1 = p1.ventaNeta - totalCostos1;
  const utilidadNeta2 = p2.ventaNeta - totalCostos2;

  const ventaNetaVariacion = p2.ventaNeta - p1.ventaNeta;
  const ventaNetaVariacionPorcentaje = p1.ventaNeta > 0 ? (ventaNetaVariacion / p1.ventaNeta) * 100 : (p2.ventaNeta > 0 ? 100 : 0);

  const totalCostosVariacion = totalCostos2 - totalCostos1;
  const totalCostosVariacionPorcentaje = totalCostos1 > 0 ? (totalCostosVariacion / totalCostos1) * 100 : (totalCostos2 > 0 ? 100 : 0);

  const utilidadNetaVariacion = utilidadNeta2 - utilidadNeta1;
  const utilidadNetaVariacionPorcentaje = Math.abs(utilidadNeta1) > 0 ? (utilidadNetaVariacion / Math.abs(utilidadNeta1)) * 100 : (utilidadNeta2 > 0 ? 100 : 0);

  return {
    ventaNeta1: p1.ventaNeta,
    ventaNeta2: p2.ventaNeta,
    ventaNetaVariacion,
    ventaNetaVariacionPorcentaje,
    totalCostos1,
    totalCostos2,
    totalCostosVariacion,
    totalCostosVariacionPorcentaje,
    utilidadNeta1,
    utilidadNeta2,
    utilidadNetaVariacion,
    utilidadNetaVariacionPorcentaje,
    rubros: rubrosCompare
  };
}
