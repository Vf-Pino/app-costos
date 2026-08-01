-- ==========================================
-- SCRIPT DE SEGURIDAD Y POLÍTICAS RLS ESTRICTAS
-- ==========================================
-- Ejecutar en el SQL Editor de Supabase para cerrar las brechas de seguridad.

-- 1. REVOCAR PRIVILEGIOS GLOBALES AL ROL ANON
-- Evita que usuarios no autenticados puedan interactuar con la API (Peligro crítico actual)
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA casa_bistro_analitica FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA casa_bistro_analitica FROM anon;
REVOKE USAGE ON SCHEMA casa_bistro_analitica FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA casa_bistro_analitica REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA casa_bistro_analitica REVOKE ALL ON SEQUENCES FROM anon;

-- Asegurarse de que authenticated y service_role sí tengan acceso
GRANT USAGE ON SCHEMA casa_bistro_analitica TO authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA casa_bistro_analitica TO authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA casa_bistro_analitica TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA casa_bistro_analitica GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA casa_bistro_analitica GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- 2. FUNCIÓN PARA VERIFICAR SI EL USUARIO ES ADMIN
-- Función segura (SECURITY DEFINER) para consultar la tabla de roles internamente
CREATE OR REPLACE FUNCTION casa_bistro_analitica.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM casa_bistro_analitica.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ACTUALIZAR POLÍTICAS RLS (Módulo Nómina)
-- Las políticas de "LECTURA" se mantienen para 'authenticated', pero la "MODIFICACIÓN" se restringe a 'admin'

-- Employees
DROP POLICY IF EXISTS "Usuarios autenticados pueden modificar empleados" ON casa_bistro_analitica.employees;
CREATE POLICY "Solo admin puede modificar empleados"
  ON casa_bistro_analitica.employees FOR ALL TO authenticated 
  USING (casa_bistro_analitica.is_admin());

-- Time Logs
DROP POLICY IF EXISTS "Usuarios autenticados pueden modificar time_logs" ON casa_bistro_analitica.time_logs;
CREATE POLICY "Solo admin puede modificar time_logs"
  ON casa_bistro_analitica.time_logs FOR ALL TO authenticated 
  USING (casa_bistro_analitica.is_admin());

-- Debts and advances
DROP POLICY IF EXISTS "Usuarios autenticados pueden modificar debts" ON casa_bistro_analitica.debts_and_advances;
CREATE POLICY "Solo admin puede modificar debts"
  ON casa_bistro_analitica.debts_and_advances FOR ALL TO authenticated 
  USING (casa_bistro_analitica.is_admin());

-- Payroll Liquidations
DROP POLICY IF EXISTS "Solo insertar liquidaciones" ON casa_bistro_analitica.payroll_liquidations;
CREATE POLICY "Solo admin puede modificar liquidaciones"
  ON casa_bistro_analitica.payroll_liquidations FOR ALL TO authenticated 
  USING (casa_bistro_analitica.is_admin());

-- 4. ACTUALIZAR POLÍTICAS RLS (Módulo Costos e Ingresos)

-- Ingresos diarios
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en ingresos_diarios" ON casa_bistro_analitica.ingresos_diarios;
CREATE POLICY "Usuarios autenticados pueden leer ingresos_diarios"
  ON casa_bistro_analitica.ingresos_diarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo admin puede modificar ingresos_diarios"
  ON casa_bistro_analitica.ingresos_diarios FOR ALL TO authenticated USING (casa_bistro_analitica.is_admin());

-- Egresos costos
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en egresos_costos" ON casa_bistro_analitica.egresos_costos;
CREATE POLICY "Usuarios autenticados pueden leer egresos_costos"
  ON casa_bistro_analitica.egresos_costos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo admin puede modificar egresos_costos"
  ON casa_bistro_analitica.egresos_costos FOR ALL TO authenticated USING (casa_bistro_analitica.is_admin());

-- Proyecciones gastos
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en proyecciones_gastos" ON casa_bistro_analitica.proyecciones_gastos;
CREATE POLICY "Usuarios autenticados pueden leer proyecciones_gastos"
  ON casa_bistro_analitica.proyecciones_gastos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo admin puede modificar proyecciones_gastos"
  ON casa_bistro_analitica.proyecciones_gastos FOR ALL TO authenticated USING (casa_bistro_analitica.is_admin());

-- Metas control
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en metas_control" ON casa_bistro_analitica.metas_control;
CREATE POLICY "Usuarios autenticados pueden leer metas_control"
  ON casa_bistro_analitica.metas_control FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo admin puede modificar metas_control"
  ON casa_bistro_analitica.metas_control FOR ALL TO authenticated USING (casa_bistro_analitica.is_admin());
