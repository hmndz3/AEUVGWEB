-- CreateEnum
CREATE TYPE "estado_horas_tutoria" AS ENUM ('sin_enviar', 'pendiente', 'aceptadas', 'rechazadas');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "estado_tutoria" ADD VALUE 'aceptada';
ALTER TYPE "estado_tutoria" ADD VALUE 'rechazada';

-- AlterTable
ALTER TABLE "tutoria" ADD COLUMN     "comentario_revision_horas" TEXT,
ADD COLUMN     "comentario_tutor" TEXT,
ADD COLUMN     "estado_horas" "estado_horas_tutoria" NOT NULL DEFAULT 'sin_enviar',
ADD COLUMN     "fecha_marca_estudiante" TIMESTAMPTZ(3),
ADD COLUMN     "fecha_marca_tutor" TIMESTAMPTZ(3),
ADD COLUMN     "fecha_respuesta_tutor" TIMESTAMPTZ(3),
ADD COLUMN     "fecha_revision_horas" TIMESTAMPTZ(3),
ADD COLUMN     "horas_revisadas_por" INTEGER,
ADD COLUMN     "id_registro_hora" INTEGER,
ADD COLUMN     "prueba_estudiante_url" VARCHAR(500),
ADD COLUMN     "prueba_fin_url" VARCHAR(500),
ADD COLUMN     "prueba_inicio_url" VARCHAR(500);

-- CreateIndex
CREATE UNIQUE INDEX "tutoria_id_registro_hora_key" ON "tutoria"("id_registro_hora");

-- CreateIndex
CREATE INDEX "tutoria_estado_horas_idx" ON "tutoria"("estado_horas");

-- CreateIndex
CREATE INDEX "tutoria_horas_revisadas_por_idx" ON "tutoria"("horas_revisadas_por");

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_horas_revisadas_por_fkey" FOREIGN KEY ("horas_revisadas_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_id_registro_hora_fkey" FOREIGN KEY ("id_registro_hora") REFERENCES "registro_hora_beca"("id_registro_hora") ON DELETE SET NULL ON UPDATE CASCADE;

