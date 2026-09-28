# Qué recibe el modelo y qué comprobamos al volver

El reconocimiento no lo hace un bucle local que busca productos. El runner lee
el JPEG original y pide al adaptador una respuesta estructurada. El modelo
observa la imagen; el servidor valida la estructura y conserva el resultado.

## La entrada, pieza por pieza

[buildBackgroundRequestBody() — server/src/recognition/background/request-body.js:5](/Users/paboelustodo/-PROJECTS/aishop/server/src/recognition/background/request-body.js:5)
construye el cuerpo sin llamadas de red:

| Campo | Procedencia y significado |
| --- | --- |
| `model` | Configuración del servidor; el endpoint no permite elegirlo. |
| `background: true`, `store: true` | Solicita trabajo recuperable mediante una referencia del proveedor. |
| Primer `input_text` | Instrucción exacta del contrato `areaScan`. |
| Segundo `input_text`, opcional | `Additional instruction from the person requesting this analysis: …` más la nota recortada. |
| `input_image` | Bytes originales en URL `data:image/jpeg;base64,…`, con `detail: auto`. |
| `text.format` | JSON Schema estricto del informe, con su nombre de contrato. |

El runner elige `areaScan` para JPEG aunque el método genérico `start()` tenga
otro modo por defecto. El contexto no reemplaza el prompt base.
Una refinación manda la misma imagen y la nueva nota: **no manda el informe
anterior ni una conversación**. Tampoco selecciona productos de un catálogo.

## Prompt y contrato

[ANALYSIS_CONTRACTS.areaScan — server/src/analysis-contracts.js:128](/Users/paboelustodo/-PROJECTS/aishop/server/src/analysis-contracts.js:128)
define las instrucciones de reconocimiento y conteo de frentes visibles.
No se cambiaron en Sprint 015. El informe contiene:

- `summary`: descripción general.
- `identifiedProducts[]`: `name`, `count`, `visibleEvidence[]`, `confidence`.
- `uncertainItems[]`: `description` y `reason`.

No inferir stock oculto es una instrucción al modelo, no algo que el esquema
pueda demostrar. Un JSON válido todavía puede identificar o contar mal.

## Transporte e interpretación son cosas distintas

[start() — server/src/openai-analyzer.js:305](/Users/paboelustodo/-PROJECTS/aishop/server/src/openai-analyzer.js:305)
usa `request()` para enviar el cuerpo. Ese adaptador conserva autenticación del
proveedor, límite de tiempo por llamada, errores HTTP y diagnósticos filtrados.
El flujo background no envía `max_output_tokens`; el camino síncrono de otros
consumidores sí tiene su propio límite. No confundir ambas fábricas.

[interpretBackgroundResponse() — server/src/recognition/background/response-interpreter.js:6](/Users/paboelustodo/-PROJECTS/aishop/server/src/recognition/background/response-interpreter.js:6)
se usa tanto en `start()` como en `retrieve()`:

1. Reconoce `queued`/`in_progress` y exige una referencia válida.
2. Rechaza respuestas incompletas, fallidas, canceladas o negativas del modelo.
3. Si terminó, extrae el texto, analiza JSON y llama a
   [assertValidReport() — server/src/analysis-contracts.js:187](/Users/paboelustodo/-PROJECTS/aishop/server/src/analysis-contracts.js:187).
4. Devuelve el informe al collector; **todavía no lo guarda**.

El collector primero asienta el resultado en Firestore y después intenta
eliminar la respuesta externa. La limpieza no elimina el JPEG ni el historial local.

Prueba reproducible sin proveedor real: `bash scripts/agent-photo-run-tests/adapter-tests.sh`.
Las respuestas simuladas verifican el contrato, no la calidad de reconocimiento.
