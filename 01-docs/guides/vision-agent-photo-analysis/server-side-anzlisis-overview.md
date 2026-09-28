# Archivos del recorrido de una fotografía guardada

Lo esencial: **el endpoint inicia el análisis; otro proceso del servidor recoge y guarda el resultado.** No hace falta mantener el navegador abierto.

## 1. Cómo funciona el proceso

1. **Autoriza la solicitud.** Verifica el token Firebase y el permiso `agent: true`. El usuario solo puede analizar sus propios registros.
2. **Valida el contexto y el estado.** Lee el `context` opcional, rechaza una ejecución simultánea y exige contexto para volver a analizar una fotografía ya analizada.
3. **Registra una ejecución.** Crea un `runId`, añade una entrada al historial y cambia el estado a `analyzing`.
4. **Lee la fotografía de Cloud Storage.** Reutiliza los bytes guardados; no necesita otra subida.
5. **Envía la solicitud al modelo.** Combina fotografía, prompt `areaScan`, contexto opcional y esquema JSON. Inicia una respuesta en segundo plano, guarda su identificador y programa una tarea de recogida. El endpoint devuelve el registro, normalmente todavía `analyzing`.
6. **Recoge el resultado.** Un worker consulta al proveedor. Si sigue trabajando, programa otra consulta; si termina, valida y guarda el informe o el fallo. Después intenta eliminar la respuesta del proveedor.

Una repetición con `context` es **una nueva solicitud al modelo con la misma fotografía**. No se envía automáticamente toda la conversación ni el informe anterior.

## 2. Los archivos centrales del análisis

Estos son los primeros que conviene leer. Antes, consulta [el diagrama](photo-sequence.md).
Los nuevos helpers pequeños son [server/src/agent/api/run-context.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent/api/run-context.js),
[server/src/recognition/background/request-body.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/recognition/background/request-body.js) y
[server/src/recognition/background/response-interpreter.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/recognition/background/response-interpreter.js).
Las rutas originales del runner y collector son fachadas de compatibilidad.

| Archivo | Responsabilidad |
|---|---|
| [server/src/agent-api-handler.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-handler.js:398) | Implementa `/run`: lee el contexto, llama al runner y devuelve la respuesta HTTP. También contiene autorización y selección de rutas. |
| [server/src/agent/analysis/agent-analysis-runner.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent/analysis/agent-analysis-runner.js:87) | **Orquesta el inicio completo:** registra la ejecución, lee la imagen, inicia el proveedor, guarda su ID y programa la recogida. |
| [server/src/analysis-contracts.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/analysis-contracts.js:128) | **Define qué pedimos al modelo:** prompt `areaScan`, estructura JSON del informe y validación de su contenido. |
| [server/src/openai-analyzer.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/openai-analyzer.js:214) | **Implementa las llamadas al proveedor.** Para esta ruta se usa `createOpenAIBackgroundAnalyzer`, no el analizador síncrono que también existe en el archivo. |
| [server/src/agent-evidence-store.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-evidence-store.js:142) | Recupera la fotografía original y sus metadatos de Cloud Storage. |
| [server/src/agent-analysis-store.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-analysis-store.js:468) | Guarda estados, historial, `runId`, ID del proveedor e informe en Firestore. Sus transacciones impiden que una ejecución antigua sobrescriba otra. |
| [server/src/agent/analysis/agent-analysis-collector.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent/analysis/agent-analysis-collector.js:13) | Recoge la respuesta en segundo plano, reprograma consultas pendientes y guarda el resultado terminal. |

## 3. Entrada HTTP, autenticación y conexión de componentes

| Archivo | Responsabilidad |
|---|---|
| [server/src/firebase.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/firebase.js) | Declara la función HTTP `api`, el worker `collectAgentAnalysis` y el programador `reconcileAgentAnalyses`. Proporciona configuración del modelo y acceso al secreto. |
| [server/src/firebase-api-router.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/firebase-api-router.js) | Envía las rutas `/v1/agent/...` al manejador Agent. |
| [server/src/firebase-agent-handler.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/firebase-agent-handler.js) | Conecta el manejador HTTP con runner, proveedor, almacenamiento y cola. |
| [server/src/firebase-services.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/firebase-services.js) | Construye las conexiones reales a Firebase Auth, Firestore y Storage. |
| [server/src/firebase-vista-token-verifier.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/firebase-vista-token-verifier.js) | Verifica el token, incluida su revocación. Aunque tenga “vista” en el nombre, Agent también lo reutiliza. |

## 4. Trabajo en segundo plano y recuperación

| Archivo | Responsabilidad |
|---|---|
| [server/src/agent-task-enqueuer.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-task-enqueuer.js) | Programa tareas privadas de recogida en Cloud Tasks, con identificadores para evitar duplicados. |
| [server/src/firebase-agent-background.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/firebase-agent-background.js) | Construye el collector y el reconciliador con sus servicios reales. |
| [server/src/agent-background-functions.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-background-functions.js) | Valida el mensaje de la tarea y ejecuta la recogida. También implementa el reenvío de trabajo pendiente. |
| [server/src/agent-due-work-reader.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-due-work-reader.js) | Busca en Firestore ejecuciones cuya recogida ya debería realizarse. |

## 5. Archivos auxiliares

| Archivo | Responsabilidad |
|---|---|
| [server/src/agent-diagnostics.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-diagnostics.js) | Eventos, tiempos, métricas y filtrado de datos sensibles en diagnósticos. |
| [server/src/firebase-agent-config.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/firebase-agent-config.js) | Configuración compartida, identificación de versión e instancia y tratamiento del entorno emulador. |
| [server/src/agent-api-error.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-api-error.js) | Traduce errores Agent a códigos y respuestas HTTP. |
| [server/src/errors.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/errors.js) | Tipos de error compartidos, incluido `ProviderError`. |
| [server/src/http-json.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/http-json.js) | Envía respuestas JSON. |
| [server/src/agent-upload-request.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/agent-upload-request.js) | Aporta el límite compartido de contexto: 500 caracteres. Su lector multipart **no se ejecuta en `/run`**. |

Hay también una dependencia indirecta: [server/src/vista-catalog.js](/Users/paboelustodo/-PROJECTS/aishop/server/src/vista-catalog.js) carga [server/data/vista-catalog-cerave-ar.json](/Users/paboelustodo/-PROJECTS/aishop/server/data/vista-catalog-cerave-ar.json) para otros contratos del módulo compartido. **Eso no significa que este `/run` use ese catálogo:** para fotografías selecciona `areaScan`, sin restricción de catálogo.

La configuración de despliegue está en [firebase.json](/Users/paboelustodo/-PROJECTS/aishop/firebase.json), los índices necesarios en [firestore.indexes.json](/Users/paboelustodo/-PROJECTS/aishop/firestore.indexes.json), y el runtime y dependencias en [server/package.json](/Users/paboelustodo/-PROJECTS/aishop/server/package.json) y [server/package-lock.json](/Users/paboelustodo/-PROJECTS/aishop/server/package-lock.json).

## 6. Pruebas principales

En [server/test](/Users/paboelustodo/-PROJECTS/aishop/server/test) están las pruebas correspondientes:

- `agent-api-handler.test.js`
- `agent-analysis-runner.test.js`
- `analysis` persistencia: `agent-analysis-store.test.js`
- `agent-evidence-store.test.js`
- `openai-analyzer.test.js`
- `agent-analysis-collector.test.js`
- `agent-task-enqueuer.test.js`
- `agent-background-functions.test.js`
- `agent-due-work-reader.test.js`
- `firebase-api-router.test.js`
- `firebase-vista-token-verifier.test.js`
- `agent-diagnostics.test.js`
- `firebase-agent-config.test.js`
- `firebase-hosting-agent.test.js`

Resultados observados y límites: [evidencia de Sprint 015](../../10-review-and-release/sprint-015-agent-photo-run/README.md).

**Para entender la implementación sin perdernos en infraestructura, empezaría por tres archivos: `agent-analysis-runner.js` → `analysis-contracts.js` → `openai-analyzer.js`.** Ahí vemos cómo se prepara la solicitud, qué le pedimos al modelo y cómo lo llamamos.
