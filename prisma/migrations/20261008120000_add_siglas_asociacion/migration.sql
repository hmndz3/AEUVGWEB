-- Siglas o nombre corto de cada asociación.
--
-- El estudiantado conoce a las asociaciones por sus siglas (AEUVG, AECCTIUVG)
-- más que por su nombre completo, así que la ficha guarda los dos. La columna
-- es opcional porque no todas tienen siglas y las existentes no las registran
-- todavía. La unicidad admite varios nulos, como corresponde en PostgreSQL.
--
-- El texto de búsqueda no se recalcula aquí: ninguna fila tiene siglas todavía,
-- y el servicio de organizaciones lo actualiza al guardar cada ficha.

-- AlterTable
ALTER TABLE "asociacion" ADD COLUMN "siglas" VARCHAR(30);

-- CreateIndex
CREATE UNIQUE INDEX "asociacion_siglas_key" ON "asociacion"("siglas");
