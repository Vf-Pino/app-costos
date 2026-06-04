-- =========================================================================
-- TABLA DE ROLES Y PERMISOS PARA CASA BISTRO
-- =========================================================================

-- 1. Crear la tabla de roles
CREATE TABLE IF NOT EXISTS casa_bistro_analitica.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role varchar(20) NOT NULL CHECK (role IN ('admin', 'empleado')),
  creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- 2. Habilitar RLS
ALTER TABLE casa_bistro_analitica.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Crear política de lectura (cada usuario puede ver su propio rol)
DROP POLICY IF EXISTS "Usuarios pueden leer su propio rol" ON casa_bistro_analitica.user_roles;
CREATE POLICY "Usuarios pueden leer su propio rol"
  ON casa_bistro_analitica.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================================
-- ASIGNACIÓN AUTOMÁTICA DEL ROL ADMIN A USUARIOS EXISTENTES
-- =========================================================================
-- Esto buscará cualquier usuario actual en Supabase (tu cuenta) y le asignará
-- el rol de 'admin' automáticamente para que no pierdas acceso.

INSERT INTO casa_bistro_analitica.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Conceder permisos de uso a la API de Supabase
GRANT ALL PRIVILEGES ON TABLE casa_bistro_analitica.user_roles TO anon, authenticated, service_role;
