// Tipos del Módulo de Nómina — alineados con esquema casa_bistro_analitica

export interface Employee {
  id: string; // UUID
  first_name: string;
  last_name: string;
  hourly_rate: number;
  is_active: boolean;
  created_at: string; // ISO timestamp
}

export interface TimeLog {
  id: number; // BIGINT
  employee_id: string; // UUID → ref employees.id
  date: string; // YYYY-MM-DD
  check_in: string; // ISO timestamp
  check_out: string | null; // ISO timestamp — null = turno abierto
  total_minutes: number | null; // calculado por trigger de DB
}

// TimeLog con datos del empleado (join)
export interface TimeLogWithEmployee extends TimeLog {
  employee: Pick<Employee, 'first_name' | 'last_name' | 'hourly_rate'>;
}

export interface DebtAdvance {
  id: number; // BIGINT
  employee_id: string; // UUID
  amount: number;
  description: string | null;
  date: string; // YYYY-MM-DD
  status: 'PENDING' | 'DISCOUNTED';
  created_at: string;
}

export interface PayrollLiquidation {
  id: number; // BIGINT
  employee_id: string; // UUID
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  total_minutes_worked: number;
  hourly_rate_applied: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  created_at: string;
}

// Forma de los datos para el preview de liquidación
export interface LiquidationPreviewItem {
  employee: Employee;
  total_minutes_worked: number;
  pending_debts: DebtAdvance[];
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
}

// Periodo quinceal para el selector de liquidación
export interface PayrollPeriod {
  label: string; // "1 al 15 de Junio 2026"
  value: string; // "2026-06-01_2026-06-15"
  start_date: string; // "2026-06-01"
  end_date: string; // "2026-06-15"
}
