-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "estado_usuario" AS ENUM ('activo', 'bloqueado', 'pendiente');

-- CreateEnum
CREATE TYPE "tipo_actividad" AS ENUM ('academica', 'recreativa', 'voluntariado', 'otro');

-- CreateEnum
CREATE TYPE "estado_evento" AS ENUM ('borrador', 'publicado', 'cancelado', 'finalizado');

-- CreateEnum
CREATE TYPE "estado_hora_beca" AS ENUM ('pendiente', 'acreditada');

-- CreateEnum
CREATE TYPE "estado_oportunidad" AS ENUM ('borrador', 'publicada', 'cerrada', 'cancelada', 'finalizada');

-- CreateEnum
CREATE TYPE "estado_inscripcion" AS ENUM ('pendiente', 'aceptada', 'rechazada', 'cancelada', 'asistio');

-- CreateEnum
CREATE TYPE "estado_importacion" AS ENUM ('procesando', 'completada', 'parcial', 'fallida');

-- CreateEnum
CREATE TYPE "estado_postulacion" AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- CreateEnum
CREATE TYPE "estado_tutor" AS ENUM ('activo', 'inactivo', 'suspendido');

-- CreateEnum
CREATE TYPE "estado_tutoria" AS ENUM ('programada', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "modalidad_tutoria" AS ENUM ('presencial', 'virtual', 'ambas');

-- CreateEnum
CREATE TYPE "dia_semana" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');

-- CreateTable
CREATE TABLE "facultad" (
    "id_facultad" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "facultad_pkey" PRIMARY KEY ("id_facultad")
);

-- CreateTable
CREATE TABLE "carrera" (
    "id_carrera" SERIAL NOT NULL,
    "id_facultad" INTEGER NOT NULL,
    "nombre" VARCHAR(160) NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "carrera_pkey" PRIMARY KEY ("id_carrera")
);

-- CreateTable
CREATE TABLE "estudiante" (
    "id_estudiante" SERIAL NOT NULL,
    "id_carrera" INTEGER NOT NULL,
    "carnet" VARCHAR(20) NOT NULL,
    "nombre_completo" VARCHAR(200) NOT NULL,
    "correo_uvg" VARCHAR(254) NOT NULL,
    "telefono" VARCHAR(30),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "estudiante_pkey" PRIMARY KEY ("id_estudiante")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "correo" VARCHAR(254) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "estado" "estado_usuario" NOT NULL DEFAULT 'pendiente',
    "correo_verificado" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_acceso" TIMESTAMPTZ(3),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "usuario_rol" (
    "id_usuario_rol" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_rol_pkey" PRIMARY KEY ("id_usuario_rol")
);

-- CreateTable
CREATE TABLE "asociacion" (
    "id_asociacion" SERIAL NOT NULL,
    "nombre" VARCHAR(160) NOT NULL,
    "descripcion" TEXT,
    "mision" TEXT,
    "vision" TEXT,
    "informacion_contacto" TEXT,
    "correo" VARCHAR(254),
    "imagen_url" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "asociacion_pkey" PRIMARY KEY ("id_asociacion")
);

-- CreateTable
CREATE TABLE "integrante_asociacion" (
    "id_integrante" SERIAL NOT NULL,
    "id_asociacion" INTEGER NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "cargo" VARCHAR(120) NOT NULL,
    "periodo" VARCHAR(50) NOT NULL,
    "foto_url" VARCHAR(500),
    "orden_visualizacion" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "integrante_asociacion_pkey" PRIMARY KEY ("id_integrante")
);

-- CreateTable
CREATE TABLE "club" (
    "id_club" SERIAL NOT NULL,
    "nombre" VARCHAR(160) NOT NULL,
    "descripcion" TEXT,
    "actividades" TEXT,
    "informacion_contacto" TEXT,
    "correo" VARCHAR(254),
    "imagen_url" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id_club")
);

-- CreateTable
CREATE TABLE "red_social" (
    "id_red_social" SERIAL NOT NULL,
    "id_asociacion" INTEGER,
    "id_club" INTEGER,
    "plataforma" VARCHAR(50) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "red_social_pkey" PRIMARY KEY ("id_red_social")
);

-- CreateTable
CREATE TABLE "categoria_evento" (
    "id_categoria_evento" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "color" VARCHAR(20),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_evento_pkey" PRIMARY KEY ("id_categoria_evento")
);

-- CreateTable
CREATE TABLE "evento" (
    "id_evento" SERIAL NOT NULL,
    "id_categoria_evento" INTEGER NOT NULL,
    "creado_por" INTEGER NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMPTZ(3) NOT NULL,
    "fecha_fin" TIMESTAMPTZ(3) NOT NULL,
    "ubicacion" VARCHAR(255) NOT NULL,
    "imagen_url" VARCHAR(500),
    "tipo_actividad" "tipo_actividad" NOT NULL,
    "informacion_adicional" TEXT,
    "cupo" INTEGER,
    "estado" "estado_evento" NOT NULL DEFAULT 'borrador',
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "organizador_evento" (
    "id_organizador_evento" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_asociacion" INTEGER,
    "id_club" INTEGER,
    "unidad_uvg" VARCHAR(160),
    "organizador_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organizador_evento_pkey" PRIMARY KEY ("id_organizador_evento")
);

-- CreateTable
CREATE TABLE "evento_guardado" (
    "id_evento_guardado" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "fecha_guardado" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_guardado_pkey" PRIMARY KEY ("id_evento_guardado")
);

-- CreateTable
CREATE TABLE "oportunidad_hora_beca" (
    "id_oportunidad" SERIAL NOT NULL,
    "creado_por" INTEGER NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,
    "lugar" VARCHAR(255) NOT NULL,
    "cantidad_personas" INTEGER NOT NULL,
    "estado" "estado_oportunidad" NOT NULL DEFAULT 'borrador',
    "informacion_adicional" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "oportunidad_hora_beca_pkey" PRIMARY KEY ("id_oportunidad")
);

-- CreateTable
CREATE TABLE "inscripcion_oportunidad" (
    "id_inscripcion" SERIAL NOT NULL,
    "id_oportunidad" INTEGER NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "estado" "estado_inscripcion" NOT NULL DEFAULT 'pendiente',
    "fecha_inscripcion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "inscripcion_oportunidad_pkey" PRIMARY KEY ("id_inscripcion")
);

-- CreateTable
CREATE TABLE "importacion_horas" (
    "id_importacion" SERIAL NOT NULL,
    "realizada_por" INTEGER NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "fecha_importacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_filas" INTEGER NOT NULL DEFAULT 0,
    "filas_exitosas" INTEGER NOT NULL DEFAULT 0,
    "filas_fallidas" INTEGER NOT NULL DEFAULT 0,
    "estado" "estado_importacion" NOT NULL DEFAULT 'procesando',
    "detalle_errores" JSONB,

    CONSTRAINT "importacion_horas_pkey" PRIMARY KEY ("id_importacion")
);

-- CreateTable
CREATE TABLE "registro_hora_beca" (
    "id_registro_hora" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_oportunidad" INTEGER,
    "id_importacion" INTEGER,
    "creado_por" INTEGER NOT NULL,
    "acreditado_por" INTEGER,
    "fecha_actividad" DATE NOT NULL,
    "horario_apoyo" VARCHAR(120) NOT NULL,
    "descripcion_actividad" TEXT NOT NULL,
    "cantidad_horas" DECIMAL(6,2) NOT NULL,
    "estado" "estado_hora_beca" NOT NULL DEFAULT 'pendiente',
    "fecha_acreditacion" TIMESTAMPTZ(3),
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "registro_hora_beca_pkey" PRIMARY KEY ("id_registro_hora")
);

-- CreateTable
CREATE TABLE "curso" (
    "id_curso" SERIAL NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(160) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "postulacion_tutor" (
    "id_postulacion" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "revisada_por" INTEGER,
    "estado" "estado_postulacion" NOT NULL DEFAULT 'pendiente',
    "comentario_solicitante" TEXT,
    "comentario_revision" TEXT,
    "fecha_postulacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_revision" TIMESTAMPTZ(3),

    CONSTRAINT "postulacion_tutor_pkey" PRIMARY KEY ("id_postulacion")
);

-- CreateTable
CREATE TABLE "curso_postulacion" (
    "id_curso_postulacion" SERIAL NOT NULL,
    "id_postulacion" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "nota_obtenida" DECIMAL(6,2),
    "comprobante_url" VARCHAR(500) NOT NULL,

    CONSTRAINT "curso_postulacion_pkey" PRIMARY KEY ("id_curso_postulacion")
);

-- CreateTable
CREATE TABLE "tutor" (
    "id_tutor" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "descripcion" TEXT,
    "informacion_contacto" TEXT,
    "estado" "estado_tutor" NOT NULL DEFAULT 'activo',
    "fecha_aprobacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tutor_pkey" PRIMARY KEY ("id_tutor")
);

-- CreateTable
CREATE TABLE "tutor_curso" (
    "id_tutor_curso" SERIAL NOT NULL,
    "id_tutor" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tutor_curso_pkey" PRIMARY KEY ("id_tutor_curso")
);

-- CreateTable
CREATE TABLE "disponibilidad_tutor" (
    "id_disponibilidad" SERIAL NOT NULL,
    "id_tutor" INTEGER NOT NULL,
    "dia_semana" "dia_semana" NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,
    "modalidad" "modalidad_tutoria" NOT NULL,
    "ubicacion_enlace" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "disponibilidad_tutor_pkey" PRIMARY KEY ("id_disponibilidad")
);

-- CreateTable
CREATE TABLE "tutoria" (
    "id_tutoria" SERIAL NOT NULL,
    "id_tutor" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMPTZ(3) NOT NULL,
    "fecha_fin" TIMESTAMPTZ(3) NOT NULL,
    "modalidad" "modalidad_tutoria" NOT NULL,
    "ubicacion_enlace" VARCHAR(500),
    "estado" "estado_tutoria" NOT NULL DEFAULT 'programada',
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tutoria_pkey" PRIMARY KEY ("id_tutoria")
);

-- CreateTable
CREATE TABLE "interes_usuario" (
    "id_interes_usuario" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo_interes" VARCHAR(50) NOT NULL,
    "id_referencia" INTEGER NOT NULL,
    "nivel_interes" INTEGER NOT NULL DEFAULT 1,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interes_usuario_pkey" PRIMARY KEY ("id_interes_usuario")
);

-- CreateTable
CREATE TABLE "interaccion_usuario" (
    "id_interaccion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo_entidad" VARCHAR(50) NOT NULL,
    "id_entidad" INTEGER NOT NULL,
    "tipo_interaccion" VARCHAR(50) NOT NULL,
    "fecha_interaccion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaccion_usuario_pkey" PRIMARY KEY ("id_interaccion")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id_notificacion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "titulo" VARCHAR(160) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "url_destino" VARCHAR(500),
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_lectura" TIMESTAMPTZ(3),

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

-- AddCheckConstraint
ALTER TABLE "evento"
ADD CONSTRAINT "evento_fechas_check"
CHECK ("fecha_fin" >= "fecha_inicio");

-- AddCheckConstraint
ALTER TABLE "evento"
ADD CONSTRAINT "evento_cupo_check"
CHECK ("cupo" IS NULL OR "cupo" >= 0);

-- AddCheckConstraint
ALTER TABLE "oportunidad_hora_beca"
ADD CONSTRAINT "oportunidad_cantidad_personas_check"
CHECK ("cantidad_personas" > 0);

-- AddCheckConstraint
ALTER TABLE "oportunidad_hora_beca"
ADD CONSTRAINT "oportunidad_horas_check"
CHECK ("hora_fin" > "hora_inicio");

-- AddCheckConstraint
ALTER TABLE "registro_hora_beca"
ADD CONSTRAINT "registro_hora_beca_cantidad_check"
CHECK ("cantidad_horas" > 0);

-- AddCheckConstraint
ALTER TABLE "registro_hora_beca"
ADD CONSTRAINT "registro_hora_beca_acreditacion_check"
CHECK (
    ("estado" = 'acreditada' AND "fecha_acreditacion" IS NOT NULL AND "acreditado_por" IS NOT NULL)
    OR
    ("estado" = 'pendiente' AND "fecha_acreditacion" IS NULL AND "acreditado_por" IS NULL)
);

-- AddCheckConstraint
ALTER TABLE "importacion_horas"
ADD CONSTRAINT "importacion_horas_cantidades_check"
CHECK ("total_filas" >= 0 AND "filas_exitosas" >= 0 AND "filas_fallidas" >= 0);

-- AddCheckConstraint
ALTER TABLE "importacion_horas"
ADD CONSTRAINT "importacion_horas_suma_filas_check"
CHECK ("filas_exitosas" + "filas_fallidas" <= "total_filas");

-- AddCheckConstraint
ALTER TABLE "curso_postulacion"
ADD CONSTRAINT "curso_postulacion_nota_check"
CHECK ("nota_obtenida" IS NULL OR "nota_obtenida" >= 0);

-- AddCheckConstraint
ALTER TABLE "disponibilidad_tutor"
ADD CONSTRAINT "disponibilidad_tutor_horas_check"
CHECK ("hora_fin" > "hora_inicio");

-- AddCheckConstraint
ALTER TABLE "tutoria"
ADD CONSTRAINT "tutoria_fechas_check"
CHECK ("fecha_fin" > "fecha_inicio");

-- AddCheckConstraint
ALTER TABLE "red_social"
ADD CONSTRAINT "red_social_propietario_check"
CHECK (num_nonnulls("id_asociacion", "id_club") = 1);

-- AddCheckConstraint
ALTER TABLE "organizador_evento"
ADD CONSTRAINT "organizador_evento_tipo_check"
CHECK (num_nonnulls("id_asociacion", "id_club", "unidad_uvg") = 1);

-- AddCheckConstraint
ALTER TABLE "notificacion"
ADD CONSTRAINT "notificacion_lectura_check"
CHECK (NOT "leida" OR "fecha_lectura" IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "facultad_nombre_key" ON "facultad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "facultad_codigo_key" ON "facultad"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "carrera_codigo_key" ON "carrera"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "carrera_facultad_nombre_key" ON "carrera"("id_facultad", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estudiante_carnet_key" ON "estudiante"("carnet");

-- CreateIndex
CREATE UNIQUE INDEX "estudiante_correo_uvg_key" ON "estudiante"("correo_uvg");

-- CreateIndex
CREATE INDEX "estudiante_id_carrera_idx" ON "estudiante"("id_carrera");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_id_estudiante_key" ON "usuario"("id_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE INDEX "usuario_estado_idx" ON "usuario"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE INDEX "usuario_rol_id_rol_idx" ON "usuario_rol"("id_rol");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_rol_usuario_rol_key" ON "usuario_rol"("id_usuario", "id_rol");

-- CreateIndex
CREATE UNIQUE INDEX "asociacion_nombre_key" ON "asociacion"("nombre");

-- CreateIndex
CREATE INDEX "integrante_asociacion_id_asociacion_idx" ON "integrante_asociacion"("id_asociacion");

-- CreateIndex
CREATE UNIQUE INDEX "club_nombre_key" ON "club"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "red_social_asociacion_plataforma_url_key" ON "red_social"("id_asociacion", "plataforma", "url");

-- CreateIndex
CREATE UNIQUE INDEX "red_social_club_plataforma_url_key" ON "red_social"("id_club", "plataforma", "url");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_evento_nombre_key" ON "categoria_evento"("nombre");

-- CreateIndex
CREATE INDEX "evento_fecha_inicio_idx" ON "evento"("fecha_inicio");

-- CreateIndex
CREATE INDEX "evento_estado_idx" ON "evento"("estado");

-- CreateIndex
CREATE INDEX "evento_id_categoria_idx" ON "evento"("id_categoria_evento");

-- CreateIndex
CREATE INDEX "evento_estado_fecha_inicio_idx" ON "evento"("estado", "fecha_inicio");

-- CreateIndex
CREATE INDEX "evento_creado_por_idx" ON "evento"("creado_por");

-- CreateIndex
CREATE INDEX "organizador_evento_id_asociacion_idx" ON "organizador_evento"("id_asociacion");

-- CreateIndex
CREATE INDEX "organizador_evento_id_club_idx" ON "organizador_evento"("id_club");

-- CreateIndex
CREATE UNIQUE INDEX "organizador_evento_asociacion_key" ON "organizador_evento"("id_evento", "id_asociacion");

-- CreateIndex
CREATE UNIQUE INDEX "organizador_evento_club_key" ON "organizador_evento"("id_evento", "id_club");

-- CreateIndex
CREATE UNIQUE INDEX "organizador_evento_unidad_key" ON "organizador_evento"("id_evento", "unidad_uvg");

-- CreateIndex
CREATE INDEX "evento_guardado_id_evento_idx" ON "evento_guardado"("id_evento");

-- CreateIndex
CREATE UNIQUE INDEX "evento_guardado_usuario_evento_key" ON "evento_guardado"("id_usuario", "id_evento");

-- CreateIndex
CREATE INDEX "oportunidad_hora_beca_fecha_idx" ON "oportunidad_hora_beca"("fecha");

-- CreateIndex
CREATE INDEX "oportunidad_hora_beca_estado_idx" ON "oportunidad_hora_beca"("estado");

-- CreateIndex
CREATE INDEX "oportunidad_hora_beca_estado_fecha_idx" ON "oportunidad_hora_beca"("estado", "fecha");

-- CreateIndex
CREATE INDEX "oportunidad_hora_beca_creado_por_idx" ON "oportunidad_hora_beca"("creado_por");

-- CreateIndex
CREATE INDEX "inscripcion_oportunidad_id_estudiante_idx" ON "inscripcion_oportunidad"("id_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "inscripcion_oportunidad_estudiante_key" ON "inscripcion_oportunidad"("id_oportunidad", "id_estudiante");

-- CreateIndex
CREATE INDEX "importacion_horas_fecha_idx" ON "importacion_horas"("fecha_importacion");

-- CreateIndex
CREATE INDEX "importacion_horas_estado_idx" ON "importacion_horas"("estado");

-- CreateIndex
CREATE INDEX "importacion_horas_realizada_por_idx" ON "importacion_horas"("realizada_por");

-- CreateIndex
CREATE INDEX "registro_hora_beca_id_estudiante_idx" ON "registro_hora_beca"("id_estudiante");

-- CreateIndex
CREATE INDEX "registro_hora_beca_estado_idx" ON "registro_hora_beca"("estado");

-- CreateIndex
CREATE INDEX "registro_hora_beca_fecha_actividad_idx" ON "registro_hora_beca"("fecha_actividad");

-- CreateIndex
CREATE INDEX "registro_hora_beca_estudiante_estado_idx" ON "registro_hora_beca"("id_estudiante", "estado");

-- CreateIndex
CREATE INDEX "registro_hora_beca_id_oportunidad_idx" ON "registro_hora_beca"("id_oportunidad");

-- CreateIndex
CREATE INDEX "registro_hora_beca_id_importacion_idx" ON "registro_hora_beca"("id_importacion");

-- CreateIndex
CREATE INDEX "registro_hora_beca_creado_por_idx" ON "registro_hora_beca"("creado_por");

-- CreateIndex
CREATE INDEX "registro_hora_beca_acreditado_por_idx" ON "registro_hora_beca"("acreditado_por");

-- CreateIndex
CREATE UNIQUE INDEX "curso_codigo_key" ON "curso"("codigo");

-- CreateIndex
CREATE INDEX "postulacion_tutor_id_estudiante_idx" ON "postulacion_tutor"("id_estudiante");

-- CreateIndex
CREATE INDEX "postulacion_tutor_estado_idx" ON "postulacion_tutor"("estado");

-- CreateIndex
CREATE INDEX "postulacion_tutor_fecha_idx" ON "postulacion_tutor"("fecha_postulacion");

-- CreateIndex
CREATE INDEX "postulacion_tutor_revisada_por_idx" ON "postulacion_tutor"("revisada_por");

-- CreateIndex
CREATE INDEX "curso_postulacion_id_curso_idx" ON "curso_postulacion"("id_curso");

-- CreateIndex
CREATE UNIQUE INDEX "curso_postulacion_postulacion_curso_key" ON "curso_postulacion"("id_postulacion", "id_curso");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_id_estudiante_key" ON "tutor"("id_estudiante");

-- CreateIndex
CREATE INDEX "tutor_curso_id_curso_idx" ON "tutor_curso"("id_curso");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_curso_tutor_curso_key" ON "tutor_curso"("id_tutor", "id_curso");

-- CreateIndex
CREATE INDEX "disponibilidad_tutor_id_tutor_idx" ON "disponibilidad_tutor"("id_tutor");

-- CreateIndex
CREATE INDEX "disponibilidad_tutor_dia_semana_idx" ON "disponibilidad_tutor"("dia_semana");

-- CreateIndex
CREATE INDEX "tutoria_id_tutor_idx" ON "tutoria"("id_tutor");

-- CreateIndex
CREATE INDEX "tutoria_id_estudiante_idx" ON "tutoria"("id_estudiante");

-- CreateIndex
CREATE INDEX "tutoria_id_curso_idx" ON "tutoria"("id_curso");

-- CreateIndex
CREATE INDEX "tutoria_estado_idx" ON "tutoria"("estado");

-- CreateIndex
CREATE INDEX "tutoria_fecha_inicio_idx" ON "tutoria"("fecha_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "interes_usuario_tipo_referencia_key" ON "interes_usuario"("id_usuario", "tipo_interes", "id_referencia");

-- CreateIndex
CREATE INDEX "interaccion_usuario_id_usuario_idx" ON "interaccion_usuario"("id_usuario");

-- CreateIndex
CREATE INDEX "interaccion_usuario_tipo_entidad_idx" ON "interaccion_usuario"("tipo_entidad");

-- CreateIndex
CREATE INDEX "interaccion_usuario_fecha_idx" ON "interaccion_usuario"("fecha_interaccion");

-- CreateIndex
CREATE INDEX "notificacion_leida_idx" ON "notificacion"("leida");

-- CreateIndex
CREATE INDEX "notificacion_fecha_envio_idx" ON "notificacion"("fecha_envio");

-- CreateIndex
CREATE INDEX "notificacion_usuario_leida_fecha_idx" ON "notificacion"("id_usuario", "leida", "fecha_envio");

-- AddForeignKey
ALTER TABLE "carrera" ADD CONSTRAINT "carrera_id_facultad_fkey" FOREIGN KEY ("id_facultad") REFERENCES "facultad"("id_facultad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudiante" ADD CONSTRAINT "estudiante_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id_carrera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_rol" ADD CONSTRAINT "usuario_rol_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_rol" ADD CONSTRAINT "usuario_rol_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrante_asociacion" ADD CONSTRAINT "integrante_asociacion_id_asociacion_fkey" FOREIGN KEY ("id_asociacion") REFERENCES "asociacion"("id_asociacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "red_social" ADD CONSTRAINT "red_social_id_asociacion_fkey" FOREIGN KEY ("id_asociacion") REFERENCES "asociacion"("id_asociacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "red_social" ADD CONSTRAINT "red_social_id_club_fkey" FOREIGN KEY ("id_club") REFERENCES "club"("id_club") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_categoria_evento_fkey" FOREIGN KEY ("id_categoria_evento") REFERENCES "categoria_evento"("id_categoria_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizador_evento" ADD CONSTRAINT "organizador_evento_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizador_evento" ADD CONSTRAINT "organizador_evento_id_asociacion_fkey" FOREIGN KEY ("id_asociacion") REFERENCES "asociacion"("id_asociacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizador_evento" ADD CONSTRAINT "organizador_evento_id_club_fkey" FOREIGN KEY ("id_club") REFERENCES "club"("id_club") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_guardado" ADD CONSTRAINT "evento_guardado_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_guardado" ADD CONSTRAINT "evento_guardado_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidad_hora_beca" ADD CONSTRAINT "oportunidad_hora_beca_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion_oportunidad" ADD CONSTRAINT "inscripcion_oportunidad_id_oportunidad_fkey" FOREIGN KEY ("id_oportunidad") REFERENCES "oportunidad_hora_beca"("id_oportunidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion_oportunidad" ADD CONSTRAINT "inscripcion_oportunidad_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacion_horas" ADD CONSTRAINT "importacion_horas_realizada_por_fkey" FOREIGN KEY ("realizada_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_hora_beca" ADD CONSTRAINT "registro_hora_beca_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_hora_beca" ADD CONSTRAINT "registro_hora_beca_id_oportunidad_fkey" FOREIGN KEY ("id_oportunidad") REFERENCES "oportunidad_hora_beca"("id_oportunidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_hora_beca" ADD CONSTRAINT "registro_hora_beca_id_importacion_fkey" FOREIGN KEY ("id_importacion") REFERENCES "importacion_horas"("id_importacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_hora_beca" ADD CONSTRAINT "registro_hora_beca_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_hora_beca" ADD CONSTRAINT "registro_hora_beca_acreditado_por_fkey" FOREIGN KEY ("acreditado_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulacion_tutor" ADD CONSTRAINT "postulacion_tutor_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulacion_tutor" ADD CONSTRAINT "postulacion_tutor_revisada_por_fkey" FOREIGN KEY ("revisada_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_postulacion" ADD CONSTRAINT "curso_postulacion_id_postulacion_fkey" FOREIGN KEY ("id_postulacion") REFERENCES "postulacion_tutor"("id_postulacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_postulacion" ADD CONSTRAINT "curso_postulacion_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor" ADD CONSTRAINT "tutor_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_curso" ADD CONSTRAINT "tutor_curso_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "tutor"("id_tutor") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_curso" ADD CONSTRAINT "tutor_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_tutor" ADD CONSTRAINT "disponibilidad_tutor_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "tutor"("id_tutor") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "tutor"("id_tutor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interes_usuario" ADD CONSTRAINT "interes_usuario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaccion_usuario" ADD CONSTRAINT "interaccion_usuario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
