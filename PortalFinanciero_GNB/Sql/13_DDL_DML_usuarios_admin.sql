-- =========================================================================================
-- TABLA: dusuarios_admin
-- DESCRIPCIÓN: Almacena los perfiles administrativos (empleados) del Core Bancario.
-- =========================================================================================

CREATE TABLE IF NOT EXISTS dusuarios_admin (
    pkusuario       SERIAL          PRIMARY KEY,
    username        VARCHAR(50)     NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,  -- bcrypt
    role            VARCHAR(30)     NOT NULL,  -- MAKER, CHECKER_1, CHECKER_2, COMITE, SUPERADMIN
    nombre          VARCHAR(100)    NOT NULL,
    activo          CHAR(1)         NOT NULL DEFAULT 'S',
    fecultactualizacion TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- =========================================================================================
-- DML: Insertar usuarios de prueba (La contraseña para todos será 'demo1234')
-- El hash de 'demo1234' generado por passlib.hash.bcrypt es:
-- $2b$12$6/Yd0yL1x6Y7N4P3g/q8qO0Kz5Vw4DqQhM1rL.sW5E7eU/XkG9x9m
-- =========================================================================================

INSERT INTO dusuarios_admin (username, password_hash, role, nombre) VALUES
('maker01', '$2b$12$6/Yd0yL1x6Y7N4P3g/q8qO0Kz5Vw4DqQhM1rL.sW5E7eU/XkG9x9m', 'MAKER', 'Asesor Maker Uno'),
('checker1_01', '$2b$12$6/Yd0yL1x6Y7N4P3g/q8qO0Kz5Vw4DqQhM1rL.sW5E7eU/XkG9x9m', 'CHECKER_1', 'Gerente Riesgos Uno'),
('checker2_01', '$2b$12$6/Yd0yL1x6Y7N4P3g/q8qO0Kz5Vw4DqQhM1rL.sW5E7eU/XkG9x9m', 'CHECKER_2', 'Mesa Control Uno'),
('comite01', '$2b$12$6/Yd0yL1x6Y7N4P3g/q8qO0Kz5Vw4DqQhM1rL.sW5E7eU/XkG9x9m', 'COMITE', 'Miembro Comité Uno'),
('superadmin01', '$2b$12$6/Yd0yL1x6Y7N4P3g/q8qO0Kz5Vw4DqQhM1rL.sW5E7eU/XkG9x9m', 'SUPERADMIN', 'Super Administrador')
ON CONFLICT (username) DO NOTHING;
