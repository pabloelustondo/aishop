# Del endpoint `/run` al informe: recorrido por funciones

Ámbito: `POST /v1/agent/analyses/{id}/run` para una fotografía JPEG ya guardada.
Código consultado el 2026-09-16, con HEAD `40186a9`; no se verificó el despliegue en vivo.

**GPT reconoce los productos; AI Shop prepara la solicitud, controla la ejecución y guarda el resultado.**
El endpoint inicia el análisis; otro proceso del servidor recoge el resultado.
Una vez iniciado y registrado el trabajo, no hace falta mantener el navegador abierto.

## Cómo seguir los enlaces

Cada enlace muestra la función y la ruta relativa del archivo, con su número de línea.
Por ejemplo: `handleAgentAPI() — server/src/agent-api-handler.js:518`.
Al hacer clic se abre el archivo local en la línea de definición.
Los enlaces están preparados para este checkout en `/Users/paboelustodo/-PROJECTS/aishop`.
Los números de línea son una referencia del código consultado y pueden cambiar con futuras ediciones.
`runner`, `analysisStore`, `evidenceStore`, `analyzer` y `taskEnqueuer` son objetos del servidor;
los nombres de sus métodos que aparecen aquí son los reales, no pseudocódigo.

## Fase 1 — La petición `/run`

| Paso del proceso | Función que lo ejecuta | Qué hace |
|---|---|---|
| **1. Recibir la petición** | [handleAgentAPI() — server/src/agent-api-handler.js:518](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-handler.js:518) → [route() — server/src/agent-api-handler.js:469](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-handler.js:469) | Reconoce la ruta y selecciona la operación `run`. |
| **2. Autorizar al usuario** | [ownerKeyFor() — server/src/agent-api-handler.js:168](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-handler.js:168) | Verifica el token y el permiso `agent: true`; determina el propietario. El usuario no elige otro propietario. |
| **3. Leer la instrucción adicional** | [run() — server/src/agent-api-handler.js:422](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-handler.js:422) → [readContext() — server/src/agent-api-handler.js:116](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-handler.js:116) | Lee y valida `context`; después llama a `runner.run()`. |
| **4. Coordinar el análisis** | [runner.run() — server/src/agent-analysis-runner.js:112](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-runner.js:112) | Dirige los pasos siguientes de esta fase. No es la misma función `run()` del manejador HTTP. |
| **5. Registrar el inicio** | [analysisStore.markAnalyzing() — server/src/agent-analysis-store.js:468](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:468) → [transition() — server/src/agent-analysis-store.js:223](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:223) | Valida el estado, crea un `runId`, añade una ejecución al historial y guarda `analyzing` mediante una transacción. |
| **6. Recuperar la fotografía** | [analysisStore.read() — server/src/agent-analysis-store.js:645](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:645) y [evidenceStore.readSource() — server/src/agent-evidence-store.js:142](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-evidence-store.js:142) | Lee el registro de Firestore y descarga los bytes originales de Cloud Storage. No requiere subir la fotografía otra vez. |
| **7. Iniciar el reconocimiento** | [analyzer.start() — server/src/openai-analyzer.js:334](/Users/paboelustodo/-PROJECTS/aishop/server/src/openai-analyzer.js:334) → [request() — server/src/openai-analyzer.js:241](/Users/paboelustodo/-PROJECTS/aishop/server/src/openai-analyzer.js:241) → `fetch()` | Construye foto + prompt + contexto + esquema JSON. Envía la solicitud a OpenAI con `background: true` y `store: true`. |
| **8. Guardar la referencia al trabajo** | [analysisStore.markProviderStarted() — server/src/agent-analysis-store.js:513](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:513) | Guarda el `responseId` del proveedor, lo vincula a la ejecución vigente y registra cuándo recogerlo. |
| **9. Programar la recogida** | [taskEnqueuer.enqueue() — server/src/agent-task-enqueuer.js:58](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-task-enqueuer.js:58) | Crea una tarea privada en Cloud Tasks. La tarea recogerá el resultado; no vuelve a iniciar el reconocimiento. |
| **10. Responder al cliente** | [analysisStore.read() — server/src/agent-analysis-store.js:645](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:645) → [sendJson() — server/src/http-json.js:3](/Users/paboelustodo/-PROJECTS/aishop/server/src/http-json.js:3) | El runner devuelve el registro; el manejador HTTP responde con 200, normalmente todavía `analyzing`. |

**Aquí termina la petición HTTP. El reconocimiento puede seguir ejecutándose.**
La secuencia describe el camino normal: una respuesta HTTP 200 no equivale a informe terminado.

## Fase 2 — El servidor recoge el resultado

Cloud Tasks invoca [collectAgentAnalysis — server/src/firebase.js:89](/Users/paboelustodo/-PROJECTS/aishop/server/src/firebase.js:89).
El manejador construido por [createAgentCollectionTaskHandler() — server/src/agent-background-functions.js:12](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-background-functions.js:12)
valida el mensaje con [readCollectionTaskPayload() — server/src/agent-background-functions.js:3](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-background-functions.js:3)
y llama a `collector.collect()`.

| Paso del proceso | Función que lo ejecuta | Qué hace |
|---|---|---|
| **11. Coordinar la recogida** | [collector.collect() — server/src/agent-analysis-collector.js:55](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-collector.js:55) | Ejecuta una consulta y decide si esperar, guardar el informe o registrar un fallo. |
| **12. Comprobar que corresponde procesarla** | [analysisStore.claimCollection() — server/src/agent-analysis-store.js:565](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:565) | Comprueba ejecución vigente, estado, vencimiento y bloqueo temporal; evita recogidas simultáneas o de ejecuciones antiguas. |
| **13. Consultar al proveedor** | [analyzer.retrieve() — server/src/openai-analyzer.js:363](/Users/paboelustodo/-PROJECTS/aishop/server/src/openai-analyzer.js:363) → [request() — server/src/openai-analyzer.js:241](/Users/paboelustodo/-PROJECTS/aishop/server/src/openai-analyzer.js:241) | Consulta la respuesta identificada por el `responseId` guardado. No envía una nueva fotografía para analizar. |
| **14a. Si todavía está pendiente** | [analysisStore.rescheduleCollection() — server/src/agent-analysis-store.js:601](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:601) → [enqueueScheduled() — server/src/agent-analysis-collector.js:43](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-collector.js:43) → [taskEnqueuer.enqueue() — server/src/agent-task-enqueuer.js:58](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-task-enqueuer.js:58) | Programa otra tarea y termina la invocación actual. No mantiene un proceso esperando en un bucle. |
| **14b. Si terminó** | [interpret() — server/src/openai-analyzer.js:300](/Users/paboelustodo/-PROJECTS/aishop/server/src/openai-analyzer.js:300) → [assertValidReport() — server/src/analysis-contracts.js:187](/Users/paboelustodo/-PROJECTS/aishop/server/src/analysis-contracts.js:187) | Dentro de `retrieve()`, extrae el JSON y valida su estructura y valores antes de devolver el informe al collector. No comprueba visualmente que los conteos sean correctos. |
| **15. Guardar el informe** | [analysisStore.markAnalyzed() — server/src/agent-analysis-store.js:624](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:624) | Persiste el informe, cierra la ejecución del historial y cambia el estado a `analyzed`. |
| **16. Limpiar la respuesta externa** | [cleanup() — server/src/agent-analysis-collector.js:33](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-collector.js:33) → [analyzer.delete() / remove() — server/src/openai-analyzer.js:370](/Users/paboelustodo/-PROJECTS/aishop/server/src/openai-analyzer.js:370) | Intenta eliminar la respuesta del proveedor después de guardarla. `remove()` se expone como el método `delete`; un fallo de limpieza no invalida el informe guardado. |

`interpret()` también se utiliza al iniciar la respuesta, no solamente al recuperarla.
Las consultas pendientes se programan con un intervalo de 15 segundos; no es una garantía de latencia exacta.

## ¿Dónde están las instrucciones de reconocimiento?

No son una función: están en [ANALYSIS_CONTRACTS.areaScan — server/src/analysis-contracts.js:128](/Users/paboelustodo/-PROJECTS/aishop/server/src/analysis-contracts.js:128).
El runner selecciona este modo para las fotografías y `analyzer.start()` toma del contrato:

- `instruction`: qué identificar y cómo contar los frentes visibles, sin inferir stock oculto.
- `schema`: qué estructura JSON debe tener el informe.
- `schemaName`: el nombre con que se presenta el esquema al proveedor.

El [esquema del informe — server/src/analysis-contracts.js:33](/Users/paboelustodo/-PROJECTS/aishop/server/src/analysis-contracts.js:33) exige
`summary`, `identifiedProducts` y `uncertainItems`. Cada producto lleva
`name`, `count`, `visibleEvidence` y `confidence`.
El contexto opcional del usuario se agrega como una instrucción adicional.
Una nueva ejecución usa la misma imagen y el contexto de esa ejecución;
no incluye automáticamente el informe anterior ni una conversación completa.
Este recorrido no ejecuta YOLO ni restringe los resultados al catálogo compartido por Pablo.

## Consulta posterior y situaciones que no deben confundirse

- **Leer no analiza:** `GET /v1/agent/analyses/{id}` usa [read() — server/src/agent-api-handler.js:455](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-handler.js:455) → [analysisStore.read() — server/src/agent-analysis-store.js:645](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:645). Devuelve el estado y el informe guardados; no llama al modelo.
- **Repetir es otra ejecución:** sobre un registro `analyzed`, `markAnalyzing()` exige un contexto no vacío. Un registro ya `analyzing` rechaza otro inicio. `readContext()` limita el texto a 500 caracteres.
- **Un fallo terminal también se guarda:** [analysisStore.markFailed() — server/src/agent-analysis-store.js:636](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:636) persiste el motivo. Un inicio de proveedor ambiguo por timeout o red puede quedar `analyzing`; no se reinicia automáticamente porque podría duplicar una solicitud facturable.
- **La recuperación tiene un alcance:** [createAgentReconciler() — server/src/agent-background-functions.js:19](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-background-functions.js:19) vuelve a programar recogidas vencidas con una referencia al proveedor ya guardada. No recupera por sí solo un inicio cuyo identificador nunca se guardó.

## La idea central

**`runner.run()` coordina → `analyzer.start()` pide reconocer → `collector.collect()` recoge y guarda.**

Para modificar qué se reconoce o cómo se cuenta, comenzar por el contrato `areaScan`.
Para cambiar cómo se envía la solicitud, revisar `analyzer.start()`.
Para estudiar persistencia, concurrencia y recuperación, seguir después el runner, el store y el collector.

Referencia complementaria: [inventario de archivos y responsabilidades](server-side-anzlisis-overview.md).
Este documento es una explicación del código, no una prueba de calidad del reconocimiento ni de aceptación en vivo.
