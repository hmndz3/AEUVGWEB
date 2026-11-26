-- CreateEnum
CREATE TYPE "tipo_articulo_bata" AS ENUM ('bata_azul', 'bata_blanca', 'lentes');

-- CreateEnum
CREATE TYPE "talla_bata" AS ENUM ('S', 'M', 'L', 'XL');

-- CreateEnum
CREATE TYPE "estado_prestamo_bata" AS ENUM ('prestado', 'devuelto');

-- CreateEnum
CREATE TYPE "estado_comprobante_turno" AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- CreateTable
CREATE TABLE "turno_voluntariado" (
    "id_turno" SERIAL NOT NULL,
    "dia_semana" "dia_semana" NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,
    "cupo" INTEGER NOT NULL DEFAULT 2,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turno_voluntariado_pkey" PRIMARY KEY ("id_turno")
);

-- CreateTable
CREATE TABLE "postulacion_voluntario" (
    "id_postulacion" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "revisada_por" INTEGER,
    "estado" "estado_postulacion" NOT NULL DEFAULT 'pendiente',
    "comentario_solicitante" TEXT,
    "comentario_revision" TEXT,
    "fecha_postulacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_revision" TIMESTAMPTZ(3),

    CONSTRAINT "postulacion_voluntario_pkey" PRIMARY KEY ("id_postulacion")
);

-- CreateTable
CREATE TABLE "turno_postulacion" (
    "id_turno_postulacion" SERIAL NOT NULL,
    "id_postulacion" INTEGER NOT NULL,
    "id_turno" INTEGER NOT NULL,

    CONSTRAINT "turno_postulacion_pkey" PRIMARY KEY ("id_turno_postulacion")
);

-- CreateTable
CREATE TABLE "asignacion_voluntario" (
    "id_asignacion" SERIAL NOT NULL,
    "id_turno" INTEGER NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "asignada_por" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_asignacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignacion_voluntario_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "articulo_inventario" (
    "id_articulo" SERIAL NOT NULL,
    "tipo" "tipo_articulo_bata" NOT NULL,
    "talla" "talla_bata",
    "cantidad_total" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "articulo_inventario_pkey" PRIMARY KEY ("id_articulo")
);

-- CreateTable
CREATE TABLE "prestamo_bata" (
    "id_prestamo" SERIAL NOT NULL,
    "registrado_por" INTEGER NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "apellido" VARCHAR(120) NOT NULL,
    "carnet" VARCHAR(20) NOT NULL,
    "correo" VARCHAR(254),
    "telefono" VARCHAR(30),
    "estado" "estado_prestamo_bata" NOT NULL DEFAULT 'prestado',
    "fecha_prestamo" DATE NOT NULL,
    "hora_salida" TIME(0) NOT NULL,
    "hora_entrega_estimada" TIME(0),
    "fecha_devolucion" TIMESTAMPTZ(3),
    "comentarios" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "prestamo_bata_pkey" PRIMARY KEY ("id_prestamo")
);

-- CreateTable
CREATE TABLE "articulo_prestado" (
    "id_articulo_prestado" SERIAL NOT NULL,
    "id_prestamo" INTEGER NOT NULL,
    "id_articulo" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "articulo_prestado_pkey" PRIMARY KEY ("id_articulo_prestado")
);

-- CreateTable
CREATE TABLE "lista_negra_bata" (
    "id_lista_negra" SERIAL NOT NULL,
    "registrado_por" INTEGER NOT NULL,
    "fecha" DATE,
    "nombre" VARCHAR(120) NOT NULL,
    "apellido" VARCHAR(120),
    "correo" VARCHAR(254),
    "carnet" VARCHAR(20),
    "telefono" VARCHAR(30),
    "justificacion" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_negra_bata_pkey" PRIMARY KEY ("id_lista_negra")
);

-- CreateTable
CREATE TABLE "comprobante_turno" (
    "id_comprobante" SERIAL NOT NULL,
    "id_turno" INTEGER NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "revisado_por" INTEGER,
    "id_registro_hora" INTEGER,
    "fecha" DATE NOT NULL,
    "hora_entrada" TIME(0) NOT NULL,
    "hora_salida" TIME(0) NOT NULL,
    "estado" "estado_comprobante_turno" NOT NULL DEFAULT 'pendiente',
    "comentario_voluntario" TEXT,
    "comentario_revision" TEXT,
    "fecha_envio" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_revision" TIMESTAMPTZ(3),

    CONSTRAINT "comprobante_turno_pkey" PRIMARY KEY ("id_comprobante")
);

-- CreateIndex
CREATE INDEX "turno_voluntariado_activo_dia_idx" ON "turno_voluntariado"("activo", "dia_semana", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "turno_voluntariado_dia_horas_key" ON "turno_voluntariado"("dia_semana", "hora_inicio", "hora_fin");

-- CreateIndex
CREATE INDEX "postulacion_voluntario_id_estudiante_idx" ON "postulacion_voluntario"("id_estudiante");

-- CreateIndex
CREATE INDEX "postulacion_voluntario_estado_idx" ON "postulacion_voluntario"("estado");

-- CreateIndex
CREATE INDEX "postulacion_voluntario_fecha_idx" ON "postulacion_voluntario"("fecha_postulacion");

-- CreateIndex
CREATE INDEX "postulacion_voluntario_revisada_por_idx" ON "postulacion_voluntario"("revisada_por");

-- CreateIndex
CREATE INDEX "turno_postulacion_id_turno_idx" ON "turno_postulacion"("id_turno");

-- CreateIndex
CREATE UNIQUE INDEX "turno_postulacion_postulacion_turno_key" ON "turno_postulacion"("id_postulacion", "id_turno");

-- CreateIndex
CREATE INDEX "asignacion_voluntario_id_estudiante_idx" ON "asignacion_voluntario"("id_estudiante");

-- CreateIndex
CREATE INDEX "asignacion_voluntario_turno_activo_idx" ON "asignacion_voluntario"("id_turno", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "asignacion_voluntario_turno_estudiante_key" ON "asignacion_voluntario"("id_turno", "id_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "articulo_inventario_tipo_talla_key" ON "articulo_inventario"("tipo", "talla");

-- CreateIndex
CREATE INDEX "prestamo_bata_estado_idx" ON "prestamo_bata"("estado");

-- CreateIndex
CREATE INDEX "prestamo_bata_carnet_idx" ON "prestamo_bata"("carnet");

-- CreateIndex
CREATE INDEX "prestamo_bata_fecha_idx" ON "prestamo_bata"("fecha_prestamo");

-- CreateIndex
CREATE INDEX "articulo_prestado_id_prestamo_idx" ON "articulo_prestado"("id_prestamo");

-- CreateIndex
CREATE INDEX "articulo_prestado_id_articulo_idx" ON "articulo_prestado"("id_articulo");

-- CreateIndex
CREATE INDEX "lista_negra_bata_carnet_idx" ON "lista_negra_bata"("carnet");

-- CreateIndex
CREATE INDEX "lista_negra_bata_fecha_idx" ON "lista_negra_bata"("fecha_creacion");

-- CreateIndex
CREATE UNIQUE INDEX "comprobante_turno_registro_hora_key" ON "comprobante_turno"("id_registro_hora");

-- CreateIndex
CREATE INDEX "comprobante_turno_id_estudiante_idx" ON "comprobante_turno"("id_estudiante");

-- CreateIndex
CREATE INDEX "comprobante_turno_estado_idx" ON "comprobante_turno"("estado");

-- CreateIndex
CREATE INDEX "comprobante_turno_id_turno_idx" ON "comprobante_turno"("id_turno");

-- CreateIndex
CREATE INDEX "comprobante_turno_fecha_idx" ON "comprobante_turno"("fecha");

-- AddForeignKey
ALTER TABLE "postulacion_voluntario" ADD CONSTRAINT "postulacion_voluntario_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulacion_voluntario" ADD CONSTRAINT "postulacion_voluntario_revisada_por_fkey" FOREIGN KEY ("revisada_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_postulacion" ADD CONSTRAINT "turno_postulacion_id_postulacion_fkey" FOREIGN KEY ("id_postulacion") REFERENCES "postulacion_voluntario"("id_postulacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_postulacion" ADD CONSTRAINT "turno_postulacion_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno_voluntariado"("id_turno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_voluntario" ADD CONSTRAINT "asignacion_voluntario_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno_voluntariado"("id_turno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_voluntario" ADD CONSTRAINT "asignacion_voluntario_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_voluntario" ADD CONSTRAINT "asignacion_voluntario_asignada_por_fkey" FOREIGN KEY ("asignada_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo_bata" ADD CONSTRAINT "prestamo_bata_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_prestado" ADD CONSTRAINT "articulo_prestado_id_prestamo_fkey" FOREIGN KEY ("id_prestamo") REFERENCES "prestamo_bata"("id_prestamo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulo_prestado" ADD CONSTRAINT "articulo_prestado_id_articulo_fkey" FOREIGN KEY ("id_articulo") REFERENCES "articulo_inventario"("id_articulo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_negra_bata" ADD CONSTRAINT "lista_negra_bata_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobante_turno" ADD CONSTRAINT "comprobante_turno_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno_voluntariado"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobante_turno" ADD CONSTRAINT "comprobante_turno_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "estudiante"("id_estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobante_turno" ADD CONSTRAINT "comprobante_turno_revisado_por_fkey" FOREIGN KEY ("revisado_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobante_turno" ADD CONSTRAINT "comprobante_turno_id_registro_hora_fkey" FOREIGN KEY ("id_registro_hora") REFERENCES "registro_hora_beca"("id_registro_hora") ON DELETE SET NULL ON UPDATE CASCADE;
