-- AlterTable
ALTER TABLE "evento" ADD COLUMN "texto_busqueda" TEXT NOT NULL DEFAULT '';

-- Carga inicial de la columna para los eventos ya existentes. La aplicación la
-- recalcula en cada creación y edición; aquí se replica la misma normalización
-- en SQL para no dejar eventos antiguos fuera del buscador.
UPDATE "evento"
SET "texto_busqueda" = lower(
  translate(
    coalesce("nombre", '') || ' ' || coalesce("descripcion", '') || ' ' || coalesce("ubicacion", ''),
    'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ',
    'aeiounAEIOUNaeiouAEIOU'
  )
);
