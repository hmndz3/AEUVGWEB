# Sistema de diseño — Página Web AEUVG

**Historia de usuario:** HU-03 — Sistema de diseño y prototipos de las pantallas principales.
**Sprint:** 1 — Fundamentos del sistema

## 1. Identidad

La paleta se deriva del logo de AEUVG: figuras humanas de colores distintos formando un círculo, que representa la unión de las asociaciones estudiantiles en una sola organización.

Ningún color del logo domina sobre los demás, por lo que en lugar de elegir uno como color de marca se tomó el **violeta como color de acción** —el que mejor se lee como elemento interactivo sin recurrir al azul corporativo— y los tonos restantes se reparten como acentos por toda la interfaz y entre las categorías de eventos.

El logo oficial se encuentra en [`public/logo-aeuvg.png`](../../public/logo-aeuvg.png).

## 2. Paleta

Los valores están definidos como variables de Tailwind en [`src/app/globals.css`](../../src/app/globals.css).

### Acción

| Token             | Valor     | Uso                                      |
| ----------------- | --------- | ---------------------------------------- |
| `primario`        | `#6D4AFF` | Botones principales, enlaces, navegación |
| `primario-fuerte` | `#5A35E8` | Estado hover del color de acción         |
| `primario-suave`  | `#EDE8FF` | Fondos de realce y estados seleccionados |

### Acentos

| Token      | Valor     |
| ---------- | --------- |
| `coral`    | `#FF5E5B` |
| `turquesa` | `#00C9A7` |
| `ambar`    | `#FFB627` |
| `magenta`  | `#FF4FA3` |
| `lima`     | `#7BC950` |
| `cielo`    | `#3EC1FF` |
| `lavanda`  | `#B98AFF` |

Cada una de las ocho categorías de eventos cargadas en los catálogos usa uno de estos acentos, almacenado en el campo `color` de la tabla `categoria_evento`.

### Neutros

Son cálidos de forma deliberada. El fondo crema en lugar de blanco puro es lo que más contribuye a que la interfaz no se sienta clínica.

| Token              | Valor     | Uso                         |
| ------------------ | --------- | --------------------------- |
| `fondo`            | `#FFF8F3` | Fondo de página             |
| `superficie`       | `#FFFFFF` | Tarjetas y paneles          |
| `superficie-suave` | `#F7F1EA` | Secciones alternas          |
| `borde`            | `#EBE2D8` | Bordes y separadores        |
| `texto`            | `#1C162B` | Texto principal             |
| `texto-suave`      | `#6E6580` | Texto secundario y de apoyo |

### Estados

| Token         | Valor     | Uso en el sistema              |
| ------------- | --------- | ------------------------------ |
| `exito`       | `#15B67A` | Confirmaciones                 |
| `advertencia` | `#FFA31A` | Horas beca en estado pendiente |
| `error`       | `#F5455C` | Errores de validación          |
| `informativo` | `#3EA8FF` | Mensajes informativos          |

Las horas beca acreditadas se representan en turquesa y las pendientes en ámbar.

## 3. Tipografía

**Plus Jakarta Sans**, cargada desde Google Fonts en el layout de la aplicación. Es geométrica y de aspecto amable, con soporte completo de acentos y ñ.

| Estilo            | Tamaño | Peso | Interlineado |
| ----------------- | ------ | ---- | ------------ |
| Titular principal | 40 px  | 800  | 48 px        |
| Titular móvil     | 30 px  | 800  | 38 px        |
| Título de sección | 32 px  | 700  | 40 px        |
| Subtítulo         | 22 px  | 700  | 30 px        |
| Cuerpo            | 16 px  | 400  | 26 px        |
| Cuerpo pequeño    | 13 px  | 400  | 20 px        |
| Etiqueta          | 14 px  | 700  | 20 px        |

## 4. Forma

- Radio de campos de formulario: `1rem`.
- Radio de tarjetas: `1.25rem`.
- Botones y etiquetas de estado: radio completo.
- Sombras suaves y teñidas del color del elemento, nunca sombras grises neutras.

## 5. Puntos de corte

Se usan los de Tailwind sin modificar, priorizando la vista móvil:

| Nombre | Ancho mínimo | Uso               |
| ------ | ------------ | ----------------- |
| base   | 0            | Teléfono          |
| `sm`   | 640 px       | Teléfono grande   |
| `md`   | 768 px       | Tableta           |
| `lg`   | 1024 px      | Escritorio        |
| `xl`   | 1280 px      | Escritorio amplio |

El ancho máximo de contenido es de 1280 px.

## 6. Prototipos

Los prototipos de las pantallas principales se encuentran en dos formatos:

- [`pantallas/`](./pantallas) — imágenes de cada pantalla, para revisión y presentación.
- [`referencia/`](./referencia) — el marcado HTML de cada pantalla, como referencia de estructura y espaciado durante la implementación.

Las pantallas cubiertas son: página principal, sobre AEUVG, crear cuenta, iniciar sesión, recuperar y restablecer contraseña, confirmación de correo, listado y detalle de eventos, perfil del estudiante en sus distintas pestañas, y el panel administrativo con su resumen y la gestión de horas beca.

> Las imágenes de `pantallas/` provienen de la primera generación y conservan la paleta azul inicial. El marcado de `referencia/` ya está corregido con la paleta definitiva y el logo oficial; es la fuente válida para la implementación.

Los prototipos son una referencia de estructura, no una especificación cerrada: la implementación se realiza con componentes propios del proyecto y puede ajustar detalles de composición.
