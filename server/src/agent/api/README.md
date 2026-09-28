# Entrada de `/run`: interpretar contexto

[readContext() — server/src/agent/api/run-context.js](run-context.js) convierte
`request.rawBody` en una nota recortada o `null`; no autentica ni llama al modelo.

- Entrada vacía, `{}`, `context: null` o texto en blanco → `null`.
- JSON inválido, arrays, valores de contexto no textuales o excesivos → `context_invalid`.
- Límite del cuerpo: 8 KiB; nota: 500 caracteres según el límite compartido de
  [server/src/agent-upload-request.js](../../agent-upload-request.js).
- Solo valida el cuerpo; decidir si una ejecución requiere nota corresponde al store.

El handler conserva autorización, dispatch y conversión a HTTP 400:
[server/src/agent-api-handler.js](../../agent-api-handler.js).
El lector de reservas de vídeo conserva su límite original en ese archivo.

Prueba desde la raíz: `bash scripts/agent-photo-run-tests/handler-tests.sh`.
