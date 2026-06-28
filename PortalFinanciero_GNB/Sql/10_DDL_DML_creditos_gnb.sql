-- ============================================================
-- BANCO ANDINO / GNB - SCRIPT DE MEJORAS CREDITO DIGITAL
-- Agrega soporte para evaluación (DTI, Score), Cloudinary, firma OTP, 
-- cuenta transaccional y parametrización global (Superadmin).
-- ============================================================

-- 1. ALTERACIONES A LA TABLA DE SOLICITUD Y FOPERACIONES
-- Agregar las columnas para el flujo del Maker y validaciones de seguridad
ALTER TABLE dsolicitud 
ADD COLUMN IF NOT EXISTS archivo_sustento_path VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS score_pd NUMERIC(5,2) NULL,
ADD COLUMN IF NOT EXISTS dti_ratio NUMERIC(5,2) NULL,
ADD COLUMN IF NOT EXISTS comentarios_analista TEXT NULL,
ADD COLUMN IF NOT EXISTS otp_codigo VARCHAR(10) NULL,
ADD COLUMN IF NOT EXISTS cuenta_transaccional_asociada VARCHAR(20) NULL;

ALTER TABLE foperaciones
ADD COLUMN IF NOT EXISTS glosa_operacion VARCHAR(255) NULL;


-- 2. TABLA DE PARAMETRIZACION GLOBAL (dparametros_credito)
-- Controlado exclusivamente por el rol SUPERADMIN
CREATE TABLE IF NOT EXISTS dparametros_credito (
    pkparametro         SERIAL          PRIMARY KEY,
    monto_min_pen       NUMERIC(14,2)   NOT NULL,
    monto_max_pen       NUMERIC(14,2)   NOT NULL,
    monto_min_usd       NUMERIC(14,2)   NOT NULL,
    monto_max_usd       NUMERIC(14,2)   NOT NULL,
    tea_min             NUMERIC(5,2)    NOT NULL,
    tea_max             NUMERIC(5,2)    NOT NULL,
    fecultactualizacion TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Insertar valores iniciales (Default: S/ 1500 - 80000, $500 - 25000, TEA 13.00% - 36.00%)
INSERT INTO dparametros_credito (monto_min_pen, monto_max_pen, monto_min_usd, monto_max_usd, tea_min, tea_max)
SELECT 1500.00, 80000.00, 500.00, 25000.00, 13.00, 36.00
WHERE NOT EXISTS (SELECT 1 FROM dparametros_credito);


-- 3. CATALOGO DE CUENTAS DE AHORRO Y ESTADOS
-- Insertar tipo de cuenta 'TRANSACCIONAL_CREDITO' si no existe
INSERT INTO dtipocuentaahorro (codtipocuentaahorro, destipocuentaahorro)
SELECT 'TC', 'TRANSACCIONAL_CREDITO'
WHERE NOT EXISTS (
    SELECT 1 FROM dtipocuentaahorro WHERE codtipocuentaahorro = 'TC'
);

-- Asegurar estados requeridos por el flujo
INSERT INTO dsolicitudestado (codsolicitudestado, dessolicitudestado) VALUES
('EV', 'EVALUADA_PENDIENTE_FIRMA'),
('EF', 'ESPERANDO_FIRMA_CLIENTE'),
('AL', 'APROBADO_LISTO_DESEMBOLSO')
ON CONFLICT (codsolicitudestado) DO NOTHING;
