# Orquestación: iniciar ahora, recoger después

Estas funciones coordinan colaboradores; no contienen el prompt ni deciden
qué producto aparece en la fotografía.

| Archivo | Entrada y salida | Orden importante |
| --- | --- | --- |
| [server/src/agent/analysis/agent-analysis-runner.js](agent-analysis-runner.js) | `run({ownerKey, analysisId, context})` → registro persistido. | Reservar → leer JPEG → iniciar proveedor → guardar referencia → encolar. |
| [server/src/agent/analysis/agent-analysis-collector.js](agent-analysis-collector.js) | `collect({ownerKey, analysisId, runId, attemptId})` → pendiente, asentado o descartado. | Obtener lease → consultar proveedor → persistir → limpiar respuesta externa. |

Las fábricas reciben stores, adaptador y cola por inyección. Producción los conecta
en `firebase-agent-handler.js` y `firebase-agent-background.js`; los tests pueden
simular esos bordes. `createRunMemorySampler()` conserva su exportación.

Los antiguos [server/src/agent-analysis-runner.js](../../agent-analysis-runner.js)
y [server/src/agent-analysis-collector.js](../../agent-analysis-collector.js)
reexportan las mismas funciones: no hay dos implementaciones.

Un inicio ambiguo no se repite automáticamente. Una entrega antigua no consulta
al proveedor si el store rechaza la identidad/lease. Un fallo al eliminar la
respuesta externa no deshace el informe ya guardado.
Las ramas compartidas de vídeo se conservaron; esta guía sigue solo JPEG.

Pruebas: `bash scripts/agent-photo-run-tests/runner-tests.sh` y, por separado,
`bash scripts/agent-photo-run-tests/collector-tests.sh`.
[Estados y errores](../../../../01-docs/guides/vision-agent-photo-analysis/photo-state-and-errors.md).
