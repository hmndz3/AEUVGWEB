"use client";

import { useState } from "react";

import { FormularioPerfil } from "@/components/perfil/formulario-perfil";
import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import type { FacultadDisponible, PerfilEstudiante } from "@/lib/perfil/consultas-perfil";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-texto-suave text-xs font-bold tracking-wide uppercase">{etiqueta}</dt>
      <dd className="text-texto mt-1 text-sm leading-relaxed break-words">{valor}</dd>
    </div>
  );
}

/**
 * Datos de la cuenta, con la edición en el mismo lugar.
 *
 * Los datos se leen y, con "Editar datos", el formulario los reemplaza en la
 * misma tarjeta: antes la edición vivía en una tarjeta aparte al final del
 * perfil y obligaba a buscarla lejos de lo que se quería corregir.
 */
export function DatosCuenta({
  perfil,
  facultades,
}: {
  perfil: PerfilEstudiante;
  facultades: FacultadDisponible[];
}) {
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  return (
    <section className="bg-superficie-suave rounded-[1.25rem] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-texto text-lg font-bold">Datos de la cuenta</h2>
        {!editando && (
          <Boton
            type="button"
            variante="contorno"
            tamano="sm"
            onClick={() => {
              setGuardado(false);
              setEditando(true);
            }}
          >
            Editar datos
          </Boton>
        )}
      </div>

      {guardado && !editando && (
        <div className="mt-4">
          <Alerta tipo="exito">Tus datos se guardaron.</Alerta>
        </div>
      )}

      {editando ? (
        <FormularioPerfil
          telefono={perfil.telefono}
          idFacultad={perfil.idFacultad}
          idCarrera={perfil.idCarrera}
          facultades={facultades}
          onCancelar={() => setEditando(false)}
          onGuardado={() => {
            setEditando(false);
            setGuardado(true);
          }}
        />
      ) : (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Carnet" valor={perfil.carnet} />
          <Dato etiqueta="Correo institucional" valor={perfil.correoUvg} />
          <Dato etiqueta="Facultad" valor={perfil.facultad} />
          <Dato etiqueta="Carrera" valor={perfil.carrera} />
          <Dato etiqueta="Teléfono" valor={perfil.telefono ?? "Sin registrar"} />
        </dl>
      )}

      <p className="text-texto-suave mt-5 text-xs leading-relaxed">
        Puedes actualizar tu teléfono, tu facultad y tu carrera. El nombre, el carnet y el correo
        institucional identifican tu cuenta y con ellos se asocian tus registros de horas beca; si
        alguno está incorrecto, escribe a AEUVG para que lo corrija.
      </p>
    </section>
  );
}
