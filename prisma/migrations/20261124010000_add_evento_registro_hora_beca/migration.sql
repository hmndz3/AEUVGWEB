-- Evento de la actividad de un registro de horas beca.
--
-- El panel registra la actividad eligiendo el evento en el que se apoyó, en
-- lugar de escribirla a mano. La columna es opcional: los registros anteriores,
-- los importados desde Excel y las actividades que no fueron un evento siguen
-- usando solo la descripción, que además guarda el nombre del evento para que
-- el historial del estudiante se lea igual aunque el evento cambie.
--
-- Borrar un evento no borra las horas: el vínculo queda en nulo y la
-- descripción conserva el nombre.

-- AlterTable
ALTER TABLE "registro_hora_beca" ADD COLUMN "id_evento" INTEGER;

-- CreateIndex
CREATE INDEX "registro_hora_beca_id_evento_idx" ON "registro_hora_beca"("id_evento");

-- AddForeignKey
ALTER TABLE "registro_hora_beca" ADD CONSTRAINT "registro_hora_beca_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE SET NULL ON UPDATE CASCADE;
