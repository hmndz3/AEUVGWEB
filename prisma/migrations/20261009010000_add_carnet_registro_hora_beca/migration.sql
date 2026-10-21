-- Carnet, nombre del estudiante y vínculo opcional con la cuenta en los
-- registros de horas beca.
--
-- AEUVG carga las horas de una hoja de cálculo en la que la persona se
-- identifica por carnet, y buena parte de esos carnets todavía no tiene cuenta
-- en la plataforma. Hasta ahora el registro exigía un estudiante, así que no
-- había forma de guardar esas filas. A partir de esta migración el carnet es el
-- dato obligatorio y el vínculo con el estudiante es opcional: se resuelve al
-- guardar y, si el carnet no existe, cuando su dueño crea la cuenta.
--
-- El nombre se conserva en el propio registro porque un carnet sin cuenta no
-- tiene de dónde tomarlo. Cuando el vínculo existe, las pantallas presentan el
-- nombre de la cuenta, que es el verificado.

-- AlterTable
ALTER TABLE "registro_hora_beca" ADD COLUMN "carnet" VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE "registro_hora_beca" ADD COLUMN "nombre_estudiante" VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE "registro_hora_beca" ADD COLUMN "texto_busqueda" TEXT NOT NULL DEFAULT '';
ALTER TABLE "registro_hora_beca" ALTER COLUMN "id_estudiante" DROP NOT NULL;

-- Carga inicial del carnet y del nombre a partir del estudiante al que apuntan
-- los registros ya existentes, que hasta ahora era obligatorio.
UPDATE "registro_hora_beca" AS "registro"
SET "carnet" = "estudiante"."carnet",
    "nombre_estudiante" = "estudiante"."nombre_completo"
FROM "estudiante"
WHERE "estudiante"."id_estudiante" = "registro"."id_estudiante";

-- Carga inicial del texto de búsqueda, con la misma normalización que aplica la
-- aplicación en cada guardado (src/lib/busqueda-texto.ts).
UPDATE "registro_hora_beca"
SET "texto_busqueda" = btrim(
  regexp_replace(
    lower(
      translate(
        coalesce("carnet", '') || ' ' || coalesce("nombre_estudiante", '') || ' ' || coalesce("descripcion_actividad", ''),
        'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ',
        'aeiouunAEIOUUNaeiouAEIOU'
      )
    ),
    '\s+', ' ', 'g'
  )
);

-- El valor predeterminado solo servía para cargar las filas existentes: un
-- registro nuevo tiene que indicar su carnet y su nombre.
ALTER TABLE "registro_hora_beca" ALTER COLUMN "carnet" DROP DEFAULT;
ALTER TABLE "registro_hora_beca" ALTER COLUMN "nombre_estudiante" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "registro_hora_beca_carnet_idx" ON "registro_hora_beca"("carnet");

-- CreateIndex
CREATE INDEX "registro_hora_beca_carnet_estado_idx" ON "registro_hora_beca"("carnet", "estado");

-- CreateIndex
CREATE INDEX "registro_hora_beca_estado_fecha_actividad_idx" ON "registro_hora_beca"("estado", "fecha_actividad");
