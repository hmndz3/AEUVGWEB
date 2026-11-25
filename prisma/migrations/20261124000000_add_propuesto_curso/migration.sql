-- Cursos propuestos por estudiantes.
--
-- La postulación para ser tutor ofrece los cursos del catálogo que administra
-- AEUVG y una opción "Otro" para el curso que no esté en la lista. Ese curso se
-- crea inactivo y marcado como propuesto: no aparece en el formulario ni en el
-- directorio hasta que AEUVG apruebe la postulación o lo active desde el panel.
--
-- El valor por omisión es falso, así que los cursos existentes no cambian.

-- AlterTable
ALTER TABLE "curso" ADD COLUMN "propuesto" BOOLEAN NOT NULL DEFAULT false;
