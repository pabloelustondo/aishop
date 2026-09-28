# Helpers del reconocimiento en segundo plano

| Helper | Responsabilidad | No hace |
| --- | --- | --- |
| [buildBackgroundRequestBody() — server/src/recognition/background/request-body.js](request-body.js) | Une modelo, contrato, contexto e imagen(es) en el cuerpo JSON. | No ejecuta HTTP ni lee Storage. |
| [interpretBackgroundResponse() — server/src/recognition/background/response-interpreter.js](response-interpreter.js) | Distingue pendiente/terminal, extrae JSON y valida el informe. | No persiste ni certifica la exactitud visual. |

El builder conserva `background: true`, `store: true` y el esquema estricto.
Admite la fotografía original y también las imágenes del consumidor de vídeo
existente; no cambia esos contratos.

El intérprete recibe `extractMessage` y `responseId` del adaptador padre para
reutilizar sus reglas sin duplicarlas ni importar circularmente el adaptador.
Recibe el objeto mutable de diagnósticos de esa llamada; añade estado y duración
de validación. Los errores solo llevan diagnósticos filtrados, no el texto bruto.

[server/src/openai-analyzer.js](../../openai-analyzer.js) sigue siendo la entrada:
`start()` y `retrieve()` delegan aquí; `delete()` y `cancel()` conservan su transporte.
Prueba: `bash scripts/agent-photo-run-tests/adapter-tests.sh`.
