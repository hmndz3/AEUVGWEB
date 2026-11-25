import assert from "node:assert/strict";
import test from "node:test";

import { interpretarRemitente, obtenerProveedorCorreo } from "../src/lib/correo/proveedor-correo";

const VARIABLES = ["EMAIL_PROVIDER", "BREVO_API_KEY", "RESEND_API_KEY", "EMAIL_FROM"] as const;

/** Ejecuta la prueba con las variables indicadas y restaura las originales. */
async function conEntorno(
  valores: Partial<Record<(typeof VARIABLES)[number], string>>,
  prueba: () => Promise<void> | void
) {
  const originales = Object.fromEntries(VARIABLES.map((nombre) => [nombre, process.env[nombre]]));

  for (const nombre of VARIABLES) {
    if (valores[nombre] === undefined) delete process.env[nombre];
    else process.env[nombre] = valores[nombre];
  }

  try {
    await prueba();
  } finally {
    for (const nombre of VARIABLES) {
      if (originales[nombre] === undefined) delete process.env[nombre];
      else process.env[nombre] = originales[nombre];
    }
  }
}

const CORREO = {
  destinatario: "estudiante@uvg.edu.gt",
  asunto: "Verifica tu correo",
  texto: "Enlace",
  html: "<p>Enlace</p>",
};

test("el remitente con nombre se separa en nombre y dirección", () => {
  assert.deepEqual(interpretarRemitente("AEUVG <aeuvg.web@gmail.com>"), {
    name: "AEUVG",
    email: "aeuvg.web@gmail.com",
  });
  assert.deepEqual(interpretarRemitente('"Asociación General" <a@b.com>'), {
    name: "Asociación General",
    email: "a@b.com",
  });
});

test("un remitente sin nombre usa AEUVG como nombre", () => {
  assert.deepEqual(interpretarRemitente(" aeuvg.web@gmail.com "), {
    name: "AEUVG",
    email: "aeuvg.web@gmail.com",
  });
});

test("sin proveedor configurado el error lo nombra", async () => {
  await conEntorno({}, () => {
    assert.throws(() => obtenerProveedorCorreo(), /EMAIL_PROVIDER/);
  });
});

test("Brevo exige su clave y el remitente", async () => {
  await conEntorno({ EMAIL_PROVIDER: "brevo", EMAIL_FROM: "AEUVG <a@b.com>" }, () => {
    assert.throws(() => obtenerProveedorCorreo(), /BREVO_API_KEY/);
  });
});

test("Brevo envía por su API con la clave en la cabecera", async () => {
  const fetchOriginal = globalThis.fetch;
  const llamadas: { url: string; init: RequestInit }[] = [];

  globalThis.fetch = (async (url: string, init: RequestInit) => {
    llamadas.push({ url, init });
    return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
  }) as typeof fetch;

  try {
    await conEntorno(
      {
        EMAIL_PROVIDER: "Brevo",
        BREVO_API_KEY: "clave-de-prueba",
        EMAIL_FROM: "AEUVG <aeuvg.web@gmail.com>",
      },
      async () => {
        await obtenerProveedorCorreo().enviar(CORREO);
      }
    );
  } finally {
    globalThis.fetch = fetchOriginal;
  }

  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].url, "https://api.brevo.com/v3/smtp/email");
  assert.equal((llamadas[0].init.headers as Record<string, string>)["api-key"], "clave-de-prueba");

  const cuerpo = JSON.parse(String(llamadas[0].init.body));
  assert.deepEqual(cuerpo.sender, { name: "AEUVG", email: "aeuvg.web@gmail.com" });
  assert.deepEqual(cuerpo.to, [{ email: "estudiante@uvg.edu.gt" }]);
  assert.equal(cuerpo.subject, "Verifica tu correo");
  assert.equal(cuerpo.htmlContent, "<p>Enlace</p>");
  assert.equal(cuerpo.textContent, "Enlace");
});

test("un rechazo de Brevo informa el código sin datos del destinatario", async () => {
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = (async () => new Response("{}", { status: 401 })) as typeof fetch;

  try {
    await conEntorno(
      { EMAIL_PROVIDER: "brevo", BREVO_API_KEY: "mala", EMAIL_FROM: "a@b.com" },
      async () => {
        await assert.rejects(obtenerProveedorCorreo().enviar(CORREO), (error: Error) => {
          assert.match(error.message, /HTTP 401/);
          assert.doesNotMatch(error.message, /estudiante@uvg\.edu\.gt/);
          return true;
        });
      }
    );
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});
