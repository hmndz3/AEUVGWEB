"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CargaImagen } from "@/components/admin/carga-imagen";
import { Alerta } from "@/components/ui/alerta";
import { Avatar } from "@/components/ui/avatar";
import { Boton } from "@/components/ui/boton";

/**
 * Fotografía de perfil del estudiante.
 *
 * Es opcional: sin ella se siguen viendo las iniciales, igual que siempre. Se
 * guarda al subirla y no al enviar un formulario, porque es el único dato de
 * esta tarjeta y un botón de guardar aparte solo agregaría un paso.
 *
 * La foto se ve en el perfil, en el menú de la cuenta y, si la persona es
 * tutor, en su ficha del directorio público. La tarjeta lo dice: quien la sube
 * tiene que saber dónde va a aparecer.
 */
export function FotoPerfil({
  nombre,
  fotoUrl: fotoInicial,
  esTutor,
}: {
  nombre: string;
  fotoUrl: string | null;
  esTutor: boolean;
}) {
  const router = useRouter();
  const [fotoUrl, setFotoUrl] = useState(fotoInicial);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(valor: string | null) {
    setGuardando(true);
    setMensaje(null);

    try {
      const respuesta = await fetch("/api/perfil/foto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fotoUrl: valor ?? "" }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setMensaje({
          tipo: "error",
          texto: cuerpo.mensaje ?? "No se pudo guardar la fotografía.",
        });
        return;
      }

      setFotoUrl(valor);
      setMensaje({
        tipo: "exito",
        texto: valor ? "Tu fotografía quedó guardada." : "Quitaste tu fotografía.",
      });
      router.refresh();
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="border-borde bg-superficie flex flex-col gap-4 rounded-[1.25rem] border p-5">
      <div>
        <h2 className="text-texto text-lg font-bold">Mi fotografía</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Es opcional. Sin ella se siguen viendo tus iniciales. Se ve en tu perfil y en el menú de
          tu cuenta
          {esTutor ? ", y en tu ficha del directorio de tutores, que es pública" : ""}.
        </p>
      </div>

      {mensaje && (
        <Alerta tipo={mensaje.tipo === "exito" ? "exito" : "error"}>{mensaje.texto}</Alerta>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Avatar nombre={nombre} fotoUrl={fotoUrl} tamano="size-20 text-xl" />

        <div className="flex flex-wrap items-center gap-3">
          <CargaImagen
            valor=""
            onCambio={(url) => url && guardar(url)}
            onError={(texto) => setMensaje(texto ? { tipo: "error", texto } : null)}
            destino="/api/imagenes/subir"
            etiqueta={fotoUrl ? "Cambiar fotografía" : "Subir fotografía"}
            descripcion="Vista previa de tu fotografía de perfil"
          />

          {fotoUrl && (
            <Boton
              type="button"
              variante="texto"
              tamano="sm"
              cargando={guardando}
              onClick={() => guardar(null)}
            >
              Quitar
            </Boton>
          )}
        </div>
      </div>
    </div>
  );
}
