-- 1. Modificar cliente
ALTER TABLE dcliente 
ADD COLUMN IF NOT EXISTS fecha_ingreso_laboral DATE NULL,
ADD COLUMN IF NOT EXISTS tipo_trabajador CHAR(1) NULL;

-- Asignar valores por defecto para pruebas
UPDATE dcliente SET tipo_trabajador = 'D', fecha_ingreso_laboral = '2020-01-15' WHERE pkcliente % 2 = 0;
UPDATE dcliente SET tipo_trabajador = 'I', fecha_ingreso_laboral = '2019-11-20' WHERE pkcliente % 2 = 1;

-- 2. Crear y poblar sbs_central_riesgo
CREATE TABLE IF NOT EXISTS sbs_central_riesgo (
    dni VARCHAR(20) PRIMARY KEY,
    semaforo INT NOT NULL
);

INSERT INTO sbs_central_riesgo (dni, semaforo) VALUES
('DNI00001', 0),
('DNI00002', 1),
('DNI00003', 2),
('DNI00004', 3),
('DNI00005', 4)
ON CONFLICT (dni) DO UPDATE SET semaforo = EXCLUDED.semaforo;

-- 3. Modificar solicitud para rastro de firmas
ALTER TABLE dsolicitud 
ADD COLUMN IF NOT EXISTS firma_checker1_fecha TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS firma_checker1_user VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS firma_checker2_fecha TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS firma_checker2_user VARCHAR(100) NULL;

-- 4. Nuevo estado
INSERT INTO dsolicitudestado (codsolicitudestado, dessolicitudestado) VALUES
('FC', 'PENDIENTE_FIRMA_COMITE')
ON CONFLICT (codsolicitudestado) DO NOTHING;
