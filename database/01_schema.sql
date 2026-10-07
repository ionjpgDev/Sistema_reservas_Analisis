-- =========================================================
-- SISTEMA DE RESERVAS DE CANCHAS DEPORTIVAS
-- =========================================================

-- ---------- Generalización USUARIO -> CLIENTE / ADMINISTRADOR / EMPLEADO ----------
CREATE TABLE usuario (
    id_usuario           SERIAL PRIMARY KEY,
    nombre               VARCHAR(80)  NOT NULL,
    apellido_paterno     VARCHAR(80)  NOT NULL,
    apellido_materno     VARCHAR(80),
    correo               VARCHAR(150) NOT NULL UNIQUE,
    telefono             VARCHAR(20),
    contrasena           VARCHAR(255) NOT NULL,
    fecha_registro       TIMESTAMP    NOT NULL DEFAULT now(),
    estado_cuenta        VARCHAR(20)  NOT NULL DEFAULT 'activo',
    token_recuperacion   VARCHAR(255),
    fecha_expiracion_token TIMESTAMP
);

CREATE TABLE cliente (
    id_cliente      INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    fecha_nacimiento DATE,
    ci_nit          VARCHAR(20),
    calle           VARCHAR(120),
    zona            VARCHAR(80),
    ciudad          VARCHAR(80)
);

CREATE TABLE administrador (
    id_administrador      INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    nivel_acceso          VARCHAR(50),
    fecha_asignacion_cargo DATE
);

CREATE TABLE empleado (
    id_empleado        INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    fecha_contratacion DATE,
    cargo              VARCHAR(50),
    turno              VARCHAR(20)
);

-- ---------- CANCHA ----------
CREATE TABLE cancha (
    id_cancha       SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    disciplina      VARCHAR(50),
    capacidad       INTEGER,
    precio_hora     NUMERIC(10,2) NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'disponible',
    ubicacion       VARCHAR(150),
    largo           NUMERIC(6,2),
    ancho           NUMERIC(6,2),
    hora_apertura   TIME,
    hora_cierre     TIME
);

-- ---------- UTILIDAD ----------
CREATE TABLE utilidad (
    id_utilidad SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    estado      VARCHAR(20) NOT NULL DEFAULT 'activo'
);

-- ---------- SERVICIO ----------
CREATE TABLE servicio (
    id_servicio      SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    tipo_servicio    VARCHAR(50),
    precio_referencia NUMERIC(10,2),
    estado           VARCHAR(20) NOT NULL DEFAULT 'activo'
);

-- ---------- EVENTO ----------
CREATE TABLE evento (
    id_evento          SERIAL PRIMARY KEY,
    nombre_evento      VARCHAR(150) NOT NULL,
    descripcion        TEXT,
    fecha_evento       DATE NOT NULL,
    hora_inicio        TIME NOT NULL,
    hora_fin           TIME NOT NULL,
    cupo_maximo        INTEGER,
    tipo_evento        VARCHAR(50),
    motivo_cancelacion TEXT,
    fecha_cancelacion  TIMESTAMP,
    estado             VARCHAR(20) NOT NULL DEFAULT 'programado',
    id_administrador   INTEGER NOT NULL REFERENCES administrador(id_administrador),
    fecha_creacion     TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- RESERVA ----------
CREATE TABLE reserva (
    id_reserva      SERIAL PRIMARY KEY,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT now(),
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_reserva   DATE NOT NULL,
    canal_reserva   VARCHAR(20) NOT NULL,
    hora_inicio     TIME NOT NULL,
    hora_fin        TIME NOT NULL,
    id_cliente      INTEGER NOT NULL REFERENCES cliente(id_cliente),
    id_cancha       INTEGER NOT NULL REFERENCES cancha(id_cancha),
    id_empleado     INTEGER REFERENCES empleado(id_empleado),
    fecha_gestion   TIMESTAMP,
    observaciones   TEXT
);

-- ---------- PAGO ----------
CREATE TABLE pago (
    id_pago             SERIAL PRIMARY KEY,
    monto               NUMERIC(10,2) NOT NULL,
    metodo_pago         VARCHAR(20) NOT NULL,
    fecha_pago          TIMESTAMP NOT NULL DEFAULT now(),
    tipo_registro       VARCHAR(20) NOT NULL,
    referencia_pasarela VARCHAR(100),
    nro_comprobante     VARCHAR(50),
    comprobante_url     TEXT,
    detalle_adicionales JSONB NOT NULL DEFAULT '[]'::jsonb,
    motivo_rechazo      TEXT,
    estado              VARCHAR(30) NOT NULL DEFAULT 'pagado',
    id_reserva          INTEGER NOT NULL REFERENCES reserva(id_reserva)
);

-- =========================================================
-- TABLAS INTERMEDIAS (relaciones N:M)
-- =========================================================

CREATE TABLE reserva_utilidad (
    id_reserva  INTEGER NOT NULL REFERENCES reserva(id_reserva),
    id_utilidad INTEGER NOT NULL REFERENCES utilidad(id_utilidad),
    PRIMARY KEY (id_reserva, id_utilidad)
);

CREATE TABLE administra (
    id_administrador INTEGER NOT NULL REFERENCES administrador(id_administrador),
    id_cancha        INTEGER NOT NULL REFERENCES cancha(id_cancha),
    fecha_asignacion DATE,
    PRIMARY KEY (id_administrador, id_cancha)
);

CREATE TABLE controla (
    id_empleado    INTEGER NOT NULL REFERENCES empleado(id_empleado),
    id_cancha      INTEGER NOT NULL REFERENCES cancha(id_cancha),
    turno_asignado VARCHAR(20),
    PRIMARY KEY (id_empleado, id_cancha)
);

CREATE TABLE supervisa (
    id_administrador INTEGER NOT NULL REFERENCES administrador(id_administrador),
    id_empleado      INTEGER NOT NULL REFERENCES empleado(id_empleado),
    PRIMARY KEY (id_administrador, id_empleado)
);

CREATE TABLE evento_servicio (
    id_evento        INTEGER NOT NULL REFERENCES evento(id_evento),
    id_servicio      INTEGER NOT NULL REFERENCES servicio(id_servicio),
    costo_contratado NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (id_evento, id_servicio)
);

CREATE TABLE evento_cancha (
    id_evento INTEGER NOT NULL REFERENCES evento(id_evento),
    id_cancha INTEGER NOT NULL REFERENCES cancha(id_cancha),
    PRIMARY KEY (id_evento, id_cancha)
);

CREATE TABLE inscripcion (
    id_inscripcion    SERIAL PRIMARY KEY,
    id_cliente        INTEGER NOT NULL REFERENCES cliente(id_cliente),
    id_evento         INTEGER NOT NULL REFERENCES evento(id_evento),
    fecha_inscripcion TIMESTAMP NOT NULL DEFAULT now(),
    estado            VARCHAR(20) NOT NULL DEFAULT 'confirmada',
    fecha_cancelacion TIMESTAMP,
    UNIQUE (id_cliente, id_evento)
);

