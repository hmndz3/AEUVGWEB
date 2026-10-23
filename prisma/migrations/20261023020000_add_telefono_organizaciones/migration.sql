-- Teléfono de contacto de asociaciones y clubes.
--
-- Hasta ahora el contacto era un correo opcional y un campo libre de texto para
-- la oficina o el horario. AEUVG pidió separar el teléfono, porque es tan
-- habitual como el correo y meterlo en el texto libre impedía presentarlo como
-- enlace o compararlo entre fichas.
--
-- La columna es opcional en la base y la regla de "al menos uno de los dos" se
-- aplica en el servicio: un registro histórico que solo tenga correo sigue
-- siendo válido, y obligarlo en la tabla habría roto las fichas ya cargadas.

-- AlterTable
ALTER TABLE "asociacion" ADD COLUMN "telefono" VARCHAR(30);

-- AlterTable
ALTER TABLE "club" ADD COLUMN "telefono" VARCHAR(30);
