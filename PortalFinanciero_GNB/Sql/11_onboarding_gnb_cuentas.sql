-- ============================================================================
-- 11_onboarding_gnb_cuentas.sql
-- ----------------------------------------------------------------------------
-- Alteraciones para el Onboarding Digital de Banco GNB y Formato de Cuentas.
-- ============================================================================

-- 1. Modificaciones a la tabla USUARIOS_HOMEBANKING
ALTER TABLE USUARIOS_HOMEBANKING
ADD COLUMN IF NOT EXISTS estado_registro VARCHAR(30) DEFAULT 'ACTIVO',
ADD COLUMN IF NOT EXISTS codigo_invitacion VARCHAR(255),
ADD COLUMN IF NOT EXISTS pin_sms VARCHAR(10),
ADD COLUMN IF NOT EXISTS sello_seguridad_id INT,
ADD COLUMN IF NOT EXISTS token_semilla VARCHAR(255);

-- 2. Modificaciones a la tabla DCUENTAAHORRO
ALTER TABLE DCUENTAAHORRO
ADD COLUMN IF NOT EXISTS nro_cuenta VARCHAR(11),
ADD COLUMN IF NOT EXISTS cci VARCHAR(20),
ADD COLUMN IF NOT EXISTS tipo_cuenta VARCHAR(50);

-- Actualizar los registros existentes para que no rompan la vista del front
UPDATE DCUENTAAHORRO
SET tipo_cuenta = 'AHORRO_TRADICIONAL'
WHERE tipo_cuenta IS NULL;

-- 3. Asegurar que los catálogos en DTIPOCUENTAAHORRO soporten AHORRO_ROLANDO, AHORRO_TRADICIONAL, TRANSACCIONAL_CREDITO
-- (Ya insertamos TRANSACCIONAL_CREDITO en 10_DDL_DML, pero nos aseguramos de los otros dos)
INSERT INTO DTIPOCUENTAAHORRO (pktipocuentaahorro, codtipocuentaahorro, destipocuentaahorro, fecultactualizacion)
VALUES 
    (11, 'AR', 'AHORRO_ROLANDO', NOW()),
    (12, 'AT', 'AHORRO_TRADICIONAL', NOW())
ON CONFLICT (pktipocuentaahorro) DO NOTHING;
