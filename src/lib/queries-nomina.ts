/**
 * queries-nomina.ts
 * Capa de acceso a datos para el Módulo de Nómina.
 * Todas las funciones operan en el esquema casa_bistro_analitica.
 */
import { supabase } from './supabase';
import {
  Employee,
  TimeLog,
  TimeLogWithEmployee,
  DebtAdvance,
  LiquidationPreviewItem,
  PayrollPeriod,
} from './types/nomina';

// ─────────────────────────────────────────────
// CONSTANTES DE NEGOCIO (Hallazgo #8)
// ─────────────────────────────────────────────
/** Umbral en horas para considerar un turno como "huérfano" (sin checkout) */
export const ORPHAN_SHIFT_THRESHOLD_HOURS = 16;

// ─────────────────────────────────────────────
// FORMATEADOR DE MONEDA (Hallazgo #6)
// Instanciado una sola vez a nivel de módulo
// ─────────────────────────────────────────────
export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// ─────────────────────────────────────────────
// EMPLEADOS
// ─────────────────────────────────────────────

/** Obtiene todos los empleados activos */
export async function getActiveEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('first_name');

  if (error) throw new Error(`Error obteniendo empleados: ${error.message}`);
  return data as Employee[];
}

/** Crea un nuevo empleado */
export async function createEmployee(
  first_name: string,
  last_name: string,
  hourly_rate: number
): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert([{ first_name, last_name, hourly_rate }])
    .select()
    .single();

  if (error) throw new Error(`Error creando empleado: ${error.message}`);
  return data as Employee;
}

/** Desactiva (soft-delete) un empleado */
export async function deactivateEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new Error(`Error desactivando empleado: ${error.message}`);
}

// ─────────────────────────────────────────────
// TURNOS (TIME LOGS)
// ─────────────────────────────────────────────

/**
 * Obtiene los turnos activos (sin check_out) con datos del empleado.
 * La restricción de DB garantiza máximo 1 turno abierto por empleado por día.
 */
export async function getActiveShifts(): Promise<TimeLogWithEmployee[]> {
  const { data, error } = await supabase
    .from('time_logs')
    .select(`
      *,
      employee:employees ( first_name, last_name, hourly_rate )
    `)
    .is('check_out', null)
    .order('check_in', { ascending: true });

  if (error) throw new Error(`Error obteniendo turnos activos: ${error.message}`);
  return data as TimeLogWithEmployee[];
}

/**
 * Registra la entrada de un empleado.
 * Si el empleado ya tiene un turno abierto hoy, Supabase retornará un error
 * por la constraint UNIQUE NULLS NOT DISTINCT (employee_id, date, check_out).
 */
export async function checkIn(employee_id: string): Promise<TimeLog> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('time_logs')
    .insert([{
      employee_id,
      date: today,
      check_in: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    // Código 23505 = unique_violation en PostgreSQL
    if (error.code === '23505') {
      throw new Error('Este empleado ya tiene un turno abierto hoy. Cierra el turno actual antes de iniciar uno nuevo.');
    }
    throw new Error(`Error registrando entrada: ${error.message}`);
  }
  return data as TimeLog;
}

/**
 * Registra la salida de un empleado.
 * El trigger de DB calcula automáticamente total_minutes.
 */
export async function checkOut(time_log_id: number): Promise<TimeLog> {
  const { data, error } = await supabase
    .from('time_logs')
    .update({ check_out: new Date().toISOString() })
    .eq('id', time_log_id)
    .select()
    .single();

  if (error) throw new Error(`Error registrando salida: ${error.message}`);
  return data as TimeLog;
}

// ─────────────────────────────────────────────
// DEUDAS Y ADELANTOS
// ─────────────────────────────────────────────

/** Obtiene las deudas pendientes de un empleado */
export async function getPendingDebts(employee_id: string): Promise<DebtAdvance[]> {
  const { data, error } = await supabase
    .from('debts_and_advances')
    .select('*')
    .eq('employee_id', employee_id)
    .eq('status', 'PENDING')
    .order('date', { ascending: true });

  if (error) throw new Error(`Error obteniendo deudas: ${error.message}`);
  return data as DebtAdvance[];
}

// ─────────────────────────────────────────────
// LIQUIDACIÓN QUINCENAL
// ─────────────────────────────────────────────

/**
 * Genera el preview de liquidación para un periodo dado.
 * Lee time_logs y debts_and_advances para todos los empleados activos
 * en el rango de fechas especificado.
 */
export async function getLiquidationPreview(
  start_date: string,
  end_date: string
): Promise<LiquidationPreviewItem[]> {
  // Obtener empleados activos y sus time_logs del periodo en paralelo
  const [employeesRes, timeLogsRes, debtsRes] = await Promise.all([
    supabase.from('employees').select('*').eq('is_active', true).order('first_name'),
    supabase
      .from('time_logs')
      .select('employee_id, total_minutes')
      .gte('date', start_date)
      .lte('date', end_date)
      .not('check_out', 'is', null), // Solo turnos completados
    supabase
      .from('debts_and_advances')
      .select('*')
      .eq('status', 'PENDING'),
  ]);

  if (employeesRes.error) throw new Error(`Error obteniendo empleados: ${employeesRes.error.message}`);
  if (timeLogsRes.error) throw new Error(`Error obteniendo tiempos: ${timeLogsRes.error.message}`);
  if (debtsRes.error) throw new Error(`Error obteniendo deudas: ${debtsRes.error.message}`);

  const employees = employeesRes.data as Employee[];
  const timeLogs = timeLogsRes.data as Pick<TimeLog, 'employee_id' | 'total_minutes'>[];
  const debts = debtsRes.data as DebtAdvance[];

  return employees.map((emp) => {
    const empLogs = timeLogs.filter((t) => t.employee_id === emp.id);
    const total_minutes_worked = empLogs.reduce((sum, t) => sum + (t.total_minutes ?? 0), 0);
    const pending_debts = debts.filter((d) => d.employee_id === emp.id);

    const gross_pay = (total_minutes_worked / 60) * emp.hourly_rate;
    const total_deductions = pending_debts.reduce((sum, d) => sum + d.amount, 0);
    const net_pay = Math.max(0, gross_pay - total_deductions);

    return {
      employee: emp,
      total_minutes_worked,
      pending_debts,
      gross_pay,
      total_deductions,
      net_pay,
    };
  });
}

/**
 * Ejecuta la liquidación quincenal.
 * Crea registros en payroll_liquidations y marca las deudas como DISCOUNTED.
 * Operación en serie (no hay transacciones en Supabase JS SDK fuera de RPC).
 */
export async function executeLiquidation(
  preview: LiquidationPreviewItem[],
  start_date: string,
  end_date: string
): Promise<void> {
  for (const item of preview) {
    // Insertar liquidación
    const { error: liqError } = await supabase.from('payroll_liquidations').insert([{
      employee_id: item.employee.id,
      start_date,
      end_date,
      total_minutes_worked: item.total_minutes_worked,
      hourly_rate_applied: item.employee.hourly_rate,
      gross_pay: item.gross_pay,
      total_deductions: item.total_deductions,
      net_pay: item.net_pay,
    }]);

    if (liqError) throw new Error(`Error liquidando a ${item.employee.first_name}: ${liqError.message}`);

    // Marcar deudas como descontadas
    if (item.pending_debts.length > 0) {
      const debtIds = item.pending_debts.map((d) => d.id);
      const { error: debtError } = await supabase
        .from('debts_and_advances')
        .update({ status: 'DISCOUNTED' })
        .in('id', debtIds);

      if (debtError) throw new Error(`Error actualizando deudas: ${debtError.message}`);
    }
  }
}

// ─────────────────────────────────────────────
// PERIODOS QUINCENALES DINÁMICOS (Hallazgo #11)
// ─────────────────────────────────────────────

/**
 * Genera dinámicamente los últimos N periodos quincenales a partir de hoy.
 * Elimina el hardcodeo de fechas en PayrollLiquidation.
 */
export function generatePayrollPeriods(count: number = 6): PayrollPeriod[] {
  const periods: PayrollPeriod[] = [];
  const now = new Date();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  // Empezar desde el periodo actual y retroceder
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-indexed
  let isFirstHalf = now.getDate() <= 15;

  for (let i = 0; i < count; i++) {
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');

    const start_date = isFirstHalf
      ? `${year}-${pad(month)}-01`
      : `${year}-${pad(month)}-16`;
    const end_date = isFirstHalf
      ? `${year}-${pad(month)}-15`
      : `${year}-${pad(month)}-${lastDayOfMonth}`;
    const label = isFirstHalf
      ? `1 al 15 de ${monthNames[month - 1]} ${year}`
      : `16 al ${lastDayOfMonth} de ${monthNames[month - 1]} ${year}`;

    periods.push({
      label,
      value: `${start_date}_${end_date}`,
      start_date,
      end_date,
    });

    // Retroceder al periodo anterior
    if (isFirstHalf) {
      isFirstHalf = false;
      // Mismo mes, segunda quincena → ya retrocedimos con isFirstHalf
      // En realidad debemos ir al mes anterior, segunda quincena
      month -= 1;
      if (month === 0) { month = 12; year -= 1; }
      isFirstHalf = false; // La segunda quincena del mes anterior
    } else {
      isFirstHalf = true; // Primera quincena del mismo mes
    }
  }

  return periods;
}
