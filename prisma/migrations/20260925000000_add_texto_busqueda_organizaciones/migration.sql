-- AlterTable
ALTER TABLE "asociacion" ADD COLUMN "texto_busqueda" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "club" ADD COLUMN "texto_busqueda" TEXT NOT NULL DEFAULT '';

-- Carga inicial de la columna para los registros ya existentes. La aplicación la
-- recalcula en cada creación y edición; aquí se replica la misma normalización
-- en SQL para no dejar fuera del buscador a lo que ya estaba cargado.
UPDATE "asociacion"
SET "texto_busqueda" = lower(
  translate(
    coalesce("nombre", '') || ' ' || coalesce("descripcion", '') || ' ' || coalesce("mision", ''),
    'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ',
    'aeiounAEIOUNaeiouAEIOU'
  )
);

UPDATE "club"
SET "texto_busqueda" = lower(
  translate(
    coalesce("nombre", '') || ' ' || coalesce("descripcion", '') || ' ' || coalesce("actividades", ''),
    'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ',
    'aeiounAEIOUNaeiouAEIOU'
  )
);

-- CreateIndex
CREATE INDEX "asociacion_activo_nombre_idx" ON "asociacion"("activo", "nombre");

-- CreateIndex
CREATE INDEX "club_activo_nombre_idx" ON "club"("activo", "nombre");
