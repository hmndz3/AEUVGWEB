# Solicitud de información institucional a AEUVG

**Tarea:** AEUVG-40 — Solicitar a AEUVG la información institucional y las fotografías de la junta directiva y los integrantes.
**Historia de usuario:** HU-06 — Landing page y página sobre AEUVG.

La página «Sobre AEUVG» está construida y lee su contenido desde la base de datos. Lo que falta es el contenido real: mientras no se reciba, la página muestra estados vacíos en lugar de texto de relleno.

Este documento es la solicitud que se traslada a la Junta Directiva.

## 1. Textos institucionales

Se necesita el texto aprobado por la asociación para cada campo. El modelo de datos admite los siguientes:

| Campo                   | Uso en la página                           | Extensión sugerida      |
| ----------------------- | ------------------------------------------ | ----------------------- |
| Descripción             | Párrafo de presentación bajo el encabezado | 400 a 600 caracteres    |
| Misión                  | Bloque destacado de misión                 | 200 a 400 caracteres    |
| Visión                  | Bloque destacado de visión                 | 200 a 400 caracteres    |
| Correo                  | Bloque de contacto                         | Dirección institucional |
| Información de contacto | Bloque de contacto (ubicación, horario)    | Texto libre breve       |

> **Pendiente de decisión.** El documento de definición del proyecto menciona una sección de **objetivos**, pero el modelo de datos no tiene un campo para ellos. Hay dos caminos: incluirlos dentro de la descripción, o agregar un campo propio en una migración posterior. Conviene resolverlo con AEUVG antes del Sprint 3.

## 2. Junta Directiva e integrantes

Por cada persona se requiere:

- Nombre completo.
- Cargo dentro de la asociación.
- Periodo (por ejemplo, «2026-2027»).
- Fotografía, con las condiciones de abajo.

La plataforma **no almacena** la carrera ni el correo individual de cada integrante, por lo que no es necesario recabarlos. Si AEUVG considera que deben mostrarse, es un cambio de modelo que debe solicitarse por aparte.

Las personas sin fotografía se muestran con sus iniciales sobre un fondo de color, de modo que la falta de una foto no bloquea la publicación.

## 3. Condiciones de las fotografías

- Formato JPG o PNG.
- Preferentemente cuadradas, de al menos 600 × 600 píxeles.
- Rostro centrado, ya que se recortan en círculo.
- Peso máximo de 2 MB por archivo.
- Nombre de archivo con el nombre de la persona, para poder asociarlas sin ambigüedad.

**Autorización de uso.** Cada persona debe autorizar la publicación de su fotografía y su nombre en un sitio de acceso público. Se solicita a la Junta Directiva recabar esa autorización antes de entregar las imágenes.

## 4. Redes sociales

Se requiere la lista de cuentas oficiales de AEUVG, indicando plataforma y dirección completa. Solo se publican las cuentas que la asociación confirme como oficiales.

## 5. Estado

| Elemento                         | Estado    |
| -------------------------------- | --------- |
| Solicitud trasladada a AEUVG     | Enviada   |
| Textos institucionales recibidos | Pendiente |
| Fotografías recibidas            | Pendiente |
| Autorizaciones de uso de imagen  | Pendiente |
| Redes sociales confirmadas       | Pendiente |

Al recibir la información se carga en la base de datos y la página la muestra sin necesidad de cambiar código.
