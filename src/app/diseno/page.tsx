import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import { Tarjeta, TarjetaTexto, TarjetaTitulo } from "@/components/ui/tarjeta";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import { Encabezado } from "@/components/layout/encabezado";
import { PieDePagina } from "@/components/layout/pie-de-pagina";

const ACENTOS = [
  { nombre: "Primario", clase: "bg-primario" },
  { nombre: "Coral", clase: "bg-coral" },
  { nombre: "Turquesa", clase: "bg-turquesa" },
  { nombre: "Ámbar", clase: "bg-ambar" },
  { nombre: "Magenta", clase: "bg-magenta" },
  { nombre: "Lima", clase: "bg-lima" },
  { nombre: "Cielo", clase: "bg-cielo" },
  { nombre: "Lavanda", clase: "bg-lavanda" },
];

const REGISTROS = [
  {
    fecha: "15 abr 2026",
    actividad: "Apoyo en Feria de Innovación",
    horas: "4.00",
    estado: "acreditada" as const,
  },
  {
    fecha: "22 abr 2026",
    actividad: "Renta de batas",
    horas: "2.50",
    estado: "pendiente" as const,
  },
];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-texto text-2xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export default function PaginaDiseno() {
  return (
    <>
      <Encabezado />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-texto text-4xl font-extrabold tracking-tight sm:text-5xl">
            Sistema de diseño
          </h1>
          <p className="text-texto-suave max-w-2xl">
            Componentes base de la plataforma AEUVG, construidos sobre la paleta derivada del logo.
          </p>
        </div>

        <Seccion titulo="Paleta">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACENTOS.map((color) => (
              <div key={color.nombre} className="flex flex-col gap-2">
                <div className={`h-16 rounded-2xl ${color.clase}`} />
                <span className="text-texto-suave text-xs font-medium">{color.nombre}</span>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Botones">
          <div className="flex flex-wrap items-center gap-3">
            <Boton>Primario</Boton>
            <Boton variante="secundario">Secundario</Boton>
            <Boton variante="contorno">Contorno</Boton>
            <Boton variante="texto">Texto</Boton>
            <Boton variante="destructivo">Destructivo</Boton>
            <Boton cargando>Cargando</Boton>
            <Boton disabled>Deshabilitado</Boton>
          </div>
        </Seccion>

        <Seccion titulo="Campos de formulario">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Carnet universitario"
              name="carnet"
              placeholder="24089"
              ayuda="Se usa para asociar tus horas beca realizadas con AEUVG."
            />
            <Campo
              etiqueta="Correo institucional"
              name="correo"
              type="email"
              defaultValue="estudiante@uvg"
              error="El correo debe pertenecer al dominio de la universidad."
            />
          </div>
        </Seccion>

        <Seccion titulo="Tarjetas">
          <div className="grid gap-4 sm:grid-cols-3">
            <Tarjeta>
              <TarjetaTitulo>Eventos</TarjetaTitulo>
              <TarjetaTexto className="mt-2">
                Consulta las actividades organizadas durante el ciclo.
              </TarjetaTexto>
            </Tarjeta>
            <Tarjeta>
              <TarjetaTitulo>Horas beca</TarjetaTitulo>
              <TarjetaTexto className="mt-2">
                Revisa tus horas realizadas, acreditadas y pendientes.
              </TarjetaTexto>
            </Tarjeta>
            <Tarjeta>
              <TarjetaTitulo>Tutorías</TarjetaTitulo>
              <TarjetaTexto className="mt-2">
                Encuentra tutores disponibles por curso y horario.
              </TarjetaTexto>
            </Tarjeta>
          </div>
        </Seccion>

        <Seccion titulo="Etiquetas de estado">
          <div className="flex flex-wrap gap-3">
            <EtiquetaEstado tono="pendiente">Pendiente</EtiquetaEstado>
            <EtiquetaEstado tono="acreditada">Acreditada</EtiquetaEstado>
            <EtiquetaEstado tono="informativo">Informativo</EtiquetaEstado>
            <EtiquetaEstado tono="neutro">Neutro</EtiquetaEstado>
            <EtiquetaEstado tono="error">Error</EtiquetaEstado>
          </div>
        </Seccion>

        <Seccion titulo="Tablas">
          <Tabla>
            <TablaEncabezado>
              <tr>
                <TablaCeldaEncabezado>Fecha</TablaCeldaEncabezado>
                <TablaCeldaEncabezado>Actividad</TablaCeldaEncabezado>
                <TablaCeldaEncabezado>Horas</TablaCeldaEncabezado>
                <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
              </tr>
            </TablaEncabezado>
            <TablaCuerpo>
              {REGISTROS.map((registro) => (
                <TablaFila key={registro.fecha}>
                  <TablaCelda>{registro.fecha}</TablaCelda>
                  <TablaCelda>{registro.actividad}</TablaCelda>
                  <TablaCelda>{registro.horas}</TablaCelda>
                  <TablaCelda>
                    <EtiquetaEstado tono={registro.estado}>
                      {registro.estado === "acreditada" ? "Acreditada" : "Pendiente"}
                    </EtiquetaEstado>
                  </TablaCelda>
                </TablaFila>
              ))}
            </TablaCuerpo>
          </Tabla>
        </Seccion>

        <Seccion titulo="Mensajes de alerta">
          <div className="flex flex-col gap-3">
            <Alerta tipo="exito" titulo="Cuenta creada">
              Revisa tu correo institucional para verificar la cuenta.
            </Alerta>
            <Alerta tipo="advertencia" titulo="Horas pendientes">
              Tienes registros que AEUVG todavía no ha acreditado.
            </Alerta>
            <Alerta tipo="error" titulo="No se pudo guardar">
              Revisa los campos marcados e intenta de nuevo.
            </Alerta>
            <Alerta tipo="informativo" titulo="Nueva convocatoria">
              Se publicaron oportunidades para realizar horas beca.
            </Alerta>
          </div>
        </Seccion>
      </main>
      <PieDePagina />
    </>
  );
}
