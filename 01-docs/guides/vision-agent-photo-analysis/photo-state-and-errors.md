# Evidencia, estado e identidad de una ejecución

## Dos almacenes con trabajos distintos

[readSource() — server/src/agent-evidence-store.js:142](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-evidence-store.js:142)
descarga los bytes originales de `agent/analyses/{ownerKey}/{analysisId}/source`,
lee su tipo MIME y calcula SHA-256. Valida las identidades antes de acceder al
bucket y convierte fallos de lectura en `AgentEvidenceUnavailableError`.
No transforma la fotografía ni elige otro propietario.

[createAgentAnalysisStore() — server/src/agent-analysis-store.js:176](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:176)
conserva en Firestore descriptores, estado, ejecuciones e informes, no bytes.
Ambos stores permanecen en sus archivos originales, sin cambios ejecutables.

| Identificador/campo | Para qué sirve |
| --- | --- |
| `ownerKey` | Hash SHA-256 del UID autenticado; lo calcula el servidor, no el cliente. |
| `analysisId` | Registro y fotografía estables; se conserva al refinar. |
| `runId` | Identidad nueva para cada reconocimiento; evita que un resultado viejo cierre otro run. |
| `runNumber` | Número de la ejecución dentro del historial, no identidad de concurrencia. |
| `attemptId` | Identidad compartida con el ciclo de vídeo; en este recorrido JPEG es `null`. El mensaje de tarea igualmente incluye el campo. |
| `providerResponseId` / `providerRunId` | Enlace privado entre respuesta externa y ejecución; no aparece en la respuesta pública. |
| `collectionDueAt` | Próximo momento previsto de consulta al proveedor. |
| `collectionLeaseUntil` | Bloqueo temporal para evitar recogidas simultáneas. |
| `context` | Nota de esa ejecución, conservada en su historial. |

## Transiciones del recorrido JPEG

| Estado antes de `/run` | Regla y resultado |
| --- | --- |
| `uploaded` | Contexto opcional; reserva un run y pasa a `analyzing`. |
| `failed` | Permite nueva ejecución; contexto opcional. |
| `analyzed` | Exige contexto no vacío; es una refinación. |
| `analyzing` | Rechaza otro inicio con 409, sin gastar otra llamada. |

El máximo actual es 25 runs por análisis. `markAnalyzing()` crea el run dentro
de una transacción y conserva el informe anterior mientras se ejecuta la
refinación. Un asentamiento exitoso actualiza registro e historial; un fallo
terminal deja el informe superior en `null`, conservando los runs anteriores.

`claimCollection()` comprueba estado, run, intento, referencia al proveedor,
vencimiento y lease. El lease actual dura 30 segundos; la reprogramación apunta
a 15 segundos después. Son controles de coordinación, no tiempos de respuesta garantizados.
El estado y las identidades vuelven a comprobarse al asentar el resultado.

## Dónde pueden aparecer errores

| Situación | Respuesta/efecto existente |
| --- | --- |
| Sin token válido / sin claim literal `agent: true` | 401 `unauthorized` / 403 `forbidden`. |
| JSON/nota inválidos / refinación sin nota | 400 `context_invalid` / `context_required`. |
| ID inexistente para ese propietario | 404 `analysis_not_found`; no revela datos de otros. |
| Estado incompatible / 25 runs alcanzados | 409 `analysis_state_invalid` / `analysis_run_limit`. |
| JPEG inaccesible | 503 `storage_unavailable`; el runner intenta asentar el fallo. |
| Proveedor rechaza / timeout de inicio | 502 `provider_failed` / 504 `provider_timeout`. |
| Fallo inesperado | 500 `unexpected_server_error`, sin detalle privado. |

Mapa HTTP exacto: [server/src/agent-api-error.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-error.js).
Clasificación del handler: [toAgentError() — server/src/agent-api-handler.js:93](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-handler.js:93).
El cuerpo de error incluye una referencia `requestId` para correlacionar diagnósticos.

## Límites de la recuperación

Un inicio que pierde la conexión puede haber sido aceptado por el proveedor.
No se vuelve a enviar automáticamente: podría duplicar trabajo facturable.
Si no se consigue guardar el ID externo, el reconciliador no puede inventarlo.
Un `retryable: true` en HTTP **no es permiso para iniciar otro reconocimiento a ciegas**.

Si el ID y vencimiento sí están guardados pero falla la cola, el registro permanece
`analyzing`. [createAgentReconciler() — server/src/agent-background-functions.js:19](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-background-functions.js:19)
consulta trabajo vencido y reintenta el despacho. Durante la recogida, errores
de red/timeout se reprograman; fallos terminales se asientan antes de limpiar.
El código de este refactor conserva esos límites; no promete entrega exactamente una vez.
