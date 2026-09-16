# Mapa de módulos del servidor

## Propósito

El servidor transforma evidencia de una estantería en resultados consultables:
recibe solicitudes, conserva los originales, coordina reconocimiento y permite
leer o revisar los hallazgos. Esas responsabilidades ya existen, pero sus
90 archivos JavaScript están mezclados en `server/src`.

Esta guía propone agruparlos para poder leer un módulo antes de entrar en cada
función. Describe el código local revisado el 2026-09-16; **no afirma que los
movimientos se hayan realizado**. La [propuesta de alcance](../../07-planning/proposals/server-source-modules.md)
requiere un Sprint Plan y Tasks aprobados antes de ejecutar el refactor.
El [índice actual del código](../../../server/src/README.md) permite navegar ahora.

## Estructura propuesta

```text
server/src/
├── README.md
├── firebase.js               # Entrada de Firebase: conserva su ruta
├── start.js                  # Entrada del servidor local original
├── agent/                    # Análisis persistentes del usuario Agent
│   ├── api/
│   ├── analysis/
│   ├── data/
│   └── video/
├── recognition/              # Solicitudes al modelo y contratos de respuesta
│   └── catalog/
├── inspections/              # Flujo de inspección y revisión
│   ├── api/
│   ├── review/
│   └── data/
├── vista/                    # Paquetes del cliente VISTA
│   ├── ingest/
│   ├── validation/
│   ├── data/
│   └── config/
├── admin/                    # Consulta All runs
├── platform/
│   └── firebase/             # Conexión con servicios Firebase
├── media/                    # Validación de imágenes compartida
│   └── jpeg/
├── shared/                   # Primitivas usadas por varios módulos
└── legacy/                   # Servidor original, todavía activo
```

Cada carpeta de módulo y submódulo tendrá su propio `README.md`; se omiten
las repeticiones en el árbol. No son nuevos microservicios ni funciones cloud.

## Cómo se relacionan las responsabilidades

- **Agent** controla el ciclo de vida de una evidencia y sus intentos de análisis.
  Su API recibe la petición; runner, collector y tareas coordinan el trabajo.
  Sus stores conservan estado/evidencia y su módulo de vídeo extrae fotogramas.
- **Recognition** sabe construir e interpretar una solicitud de reconocimiento.
  No debe confundirse con la coordinación de tareas ni con la página del usuario.
- **Inspections** conserva su flujo propio de envío y revisión. Sus registros,
  permisos y evidencia no se unifican con los de Agent por mover carpetas.
- **VISTA** recibe y valida paquetes con manifiesto y artefactos, y ofrece su
  lectura. El catálogo está en reconocimiento porque participa en sus contratos.
- **Admin** ofrece consultas entre propietarios; no es una página para asignar roles.
- **Platform/Firebase** construye y conecta los componentes con Auth, Firestore,
  Storage y tareas. No cambia las regiones ni los identificadores desplegados.
- **Media** agrupa validación de imágenes y primitivas JPEG compartidas.
- **Shared** contiene solo primitivas con consumidores reales en varios módulos.
- **Legacy** sigue ejecutándose desde el servidor local y como ruta de respaldo
  en Firebase. El nombre señala su origen, no permiso para eliminarlo.

## Qué explicará cada README

1. **Propósito:** qué problema resuelve el módulo, en lenguaje de negocio.
2. **Límites:** qué le pertenece y qué delega; flujos vecinos que no son equivalentes.
3. **Entradas:** funciones exportadas importantes y quién las llama.
4. **Recorrido de lectura:** archivos en el orden que ayuda a entender el proceso.
5. **Dependencias y estado:** servicios, contratos y datos que lee/escribe.
6. **Pruebas:** enlaces a pruebas existentes, comando local y límites de la evidencia.

Los nombres visibles de los enlaces incluirán la ruta relativa al repositorio,
por ejemplo `server/src/agent/api/agent-api-handler.js`, además de la función
cuando corresponda. Los destinos se actualizarán al ejecutar los movimientos.
Cada README debe orientar; no copiar todas las funciones ni reemplazar el código.

## Inventario completo: ubicación actual → destino propuesto

Los enlaces de la primera columna abren archivos **existentes**. Los destinos de
la segunda son texto hasta implementar el refactor. Se conservan los nombres
de archivo para separar el cambio de ubicación de una eventual renombración.

### agent/api (3)

Rutas Agent, errores HTTP y validación de las solicitudes de subida.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/agent-api-handler.js](../../../server/src/agent-api-handler.js) | `server/src/agent/api/agent-api-handler.js` |
| [server/src/agent-api-error.js](../../../server/src/agent-api-error.js) | `server/src/agent/api/agent-api-error.js` |
| [server/src/agent-upload-request.js](../../../server/src/agent-upload-request.js) | `server/src/agent/api/agent-upload-request.js` |

### agent/analysis (4)

Inicio, recogida y programación del análisis persistente.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/agent-analysis-runner.js](../../../server/src/agent-analysis-runner.js) | `server/src/agent/analysis/agent-analysis-runner.js` |
| [server/src/agent-analysis-collector.js](../../../server/src/agent-analysis-collector.js) | `server/src/agent/analysis/agent-analysis-collector.js` |
| [server/src/agent-task-enqueuer.js](../../../server/src/agent-task-enqueuer.js) | `server/src/agent/analysis/agent-task-enqueuer.js` |
| [server/src/agent-background-functions.js](../../../server/src/agent-background-functions.js) | `server/src/agent/analysis/agent-background-functions.js` |

### agent/data (3)

Registros Agent, evidencia privada y lectura de recogidas vencidas.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/agent-analysis-store.js](../../../server/src/agent-analysis-store.js) | `server/src/agent/data/agent-analysis-store.js` |
| [server/src/agent-evidence-store.js](../../../server/src/agent-evidence-store.js) | `server/src/agent/data/agent-evidence-store.js` |
| [server/src/agent-due-work-reader.js](../../../server/src/agent-due-work-reader.js) | `server/src/agent/data/agent-due-work-reader.js` |

### agent/video (3)

Validación de vídeo, extracción de fotogramas y despacho del procesamiento.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/agent-video-media.js](../../../server/src/agent-video-media.js) | `server/src/agent/video/agent-video-media.js` |
| [server/src/agent-video-processor.js](../../../server/src/agent-video-processor.js) | `server/src/agent/video/agent-video-processor.js` |
| [server/src/agent-video-task-enqueuer.js](../../../server/src/agent-video-task-enqueuer.js) | `server/src/agent/video/agent-video-task-enqueuer.js` |

### recognition (4)

Prompts, esquemas y adaptadores de reconocimiento; conserva separados los caminos síncrono y background.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/analysis-contracts.js](../../../server/src/analysis-contracts.js) | `server/src/recognition/analysis-contracts.js` |
| [server/src/openai-analyzer.js](../../../server/src/openai-analyzer.js) | `server/src/recognition/openai-analyzer.js` |
| [server/src/inspection-analysis-adapter.js](../../../server/src/inspection-analysis-adapter.js) | `server/src/recognition/inspection-analysis-adapter.js` |
| [server/src/inspection-analysis-request.js](../../../server/src/inspection-analysis-request.js) | `server/src/recognition/inspection-analysis-request.js` |

### recognition/catalog (1)

Carga del catálogo utilizado por el contrato VISTA; no activa por sí sola el catálogo para Agent.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/vista-catalog.js](../../../server/src/vista-catalog.js) | `server/src/recognition/catalog/vista-catalog.js` |

### inspections/api (6)

Solicitudes, autenticación de clientes y coordinación de inspecciones.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/inspection-api-handler.js](../../../server/src/inspection-api-handler.js) | `server/src/inspections/api/inspection-api-handler.js` |
| [server/src/inspection-api-router.js](../../../server/src/inspection-api-router.js) | `server/src/inspections/api/inspection-api-router.js` |
| [server/src/inspection-error-response.js](../../../server/src/inspection-error-response.js) | `server/src/inspections/api/inspection-error-response.js` |
| [server/src/inspection-submission.js](../../../server/src/inspection-submission.js) | `server/src/inspections/api/inspection-submission.js` |
| [server/src/submit-inspection.js](../../../server/src/submit-inspection.js) | `server/src/inspections/api/submit-inspection.js` |
| [server/src/customer-auth.js](../../../server/src/customer-auth.js) | `server/src/inspections/api/customer-auth.js` |

### inspections/review (4)

Consulta y revisión humana de inspecciones, con sus permisos.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/reviewer-api-handler.js](../../../server/src/reviewer-api-handler.js) | `server/src/inspections/review/reviewer-api-handler.js` |
| [server/src/review-input.js](../../../server/src/review-input.js) | `server/src/inspections/review/review-input.js` |
| [server/src/reviewer-auth.js](../../../server/src/reviewer-auth.js) | `server/src/inspections/review/reviewer-auth.js` |
| [server/src/viewer-auth.js](../../../server/src/viewer-auth.js) | `server/src/inspections/review/viewer-auth.js` |

### inspections/data (4)

Evidencia y registros de inspecciones, separados de los registros Agent.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/evidence-reader.js](../../../server/src/evidence-reader.js) | `server/src/inspections/data/evidence-reader.js` |
| [server/src/evidence-store.js](../../../server/src/evidence-store.js) | `server/src/inspections/data/evidence-store.js` |
| [server/src/inspection-record-reader.js](../../../server/src/inspection-record-reader.js) | `server/src/inspections/data/inspection-record-reader.js` |
| [server/src/inspection-record-store.js](../../../server/src/inspection-record-store.js) | `server/src/inspections/data/inspection-record-store.js` |

### vista (4)

Lectura, identidad y errores compartidos del paquete VISTA.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/vista-package-read.js](../../../server/src/vista-package-read.js) | `server/src/vista/vista-package-read.js` |
| [server/src/vista-package-identity.js](../../../server/src/vista-package-identity.js) | `server/src/vista/vista-package-identity.js` |
| [server/src/vista-auth-failure.js](../../../server/src/vista-auth-failure.js) | `server/src/vista/vista-auth-failure.js` |
| [server/src/vista-package-error.js](../../../server/src/vista-package-error.js) | `server/src/vista/vista-package-error.js` |

### vista/ingest (7)

Recepción de paquetes y lectura multipart.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/submit-vista-package.js](../../../server/src/submit-vista-package.js) | `server/src/vista/ingest/submit-vista-package.js` |
| [server/src/vista-package-api-handler.js](../../../server/src/vista-package-api-handler.js) | `server/src/vista/ingest/vista-package-api-handler.js` |
| [server/src/vista-package-request.js](../../../server/src/vista-package-request.js) | `server/src/vista/ingest/vista-package-request.js` |
| [server/src/vista-package-headers.js](../../../server/src/vista-package-headers.js) | `server/src/vista/ingest/vista-package-headers.js` |
| [server/src/vista-package-part-set.js](../../../server/src/vista-package-part-set.js) | `server/src/vista/ingest/vista-package-part-set.js` |
| [server/src/vista-multipart-reader.js](../../../server/src/vista-multipart-reader.js) | `server/src/vista/ingest/vista-multipart-reader.js` |
| [server/src/vista-multipart-bytes.js](../../../server/src/vista-multipart-bytes.js) | `server/src/vista/ingest/vista-multipart-bytes.js` |

### vista/validation (7)

Validación del manifiesto y de artefactos bajo el contrato VISTA, incluido su JPEG.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/vista-artifact-content.js](../../../server/src/vista-artifact-content.js) | `server/src/vista/validation/vista-artifact-content.js` |
| [server/src/vista-artifact-validator.js](../../../server/src/vista-artifact-validator.js) | `server/src/vista/validation/vista-artifact-validator.js` |
| [server/src/vista-manifest-artifacts.js](../../../server/src/vista-manifest-artifacts.js) | `server/src/vista/validation/vista-manifest-artifacts.js` |
| [server/src/vista-manifest-schema.js](../../../server/src/vista-manifest-schema.js) | `server/src/vista/validation/vista-manifest-schema.js` |
| [server/src/vista-manifest-validator.js](../../../server/src/vista-manifest-validator.js) | `server/src/vista/validation/vista-manifest-validator.js` |
| [server/src/vista-jpeg.js](../../../server/src/vista-jpeg.js) | `server/src/vista/validation/vista-jpeg.js` |
| [server/src/vista-jpeg-decoder.js](../../../server/src/vista-jpeg-decoder.js) | `server/src/vista/validation/vista-jpeg-decoder.js` |

### vista/data (9)

Reserva, finalización, recibos y objetos de evidencia del paquete VISTA.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/vista-create-only-object.js](../../../server/src/vista-create-only-object.js) | `server/src/vista/data/vista-create-only-object.js` |
| [server/src/vista-evidence-objects.js](../../../server/src/vista-evidence-objects.js) | `server/src/vista/data/vista-evidence-objects.js` |
| [server/src/vista-evidence-store.js](../../../server/src/vista-evidence-store.js) | `server/src/vista/data/vista-evidence-store.js` |
| [server/src/vista-package-record-ref.js](../../../server/src/vista-package-record-ref.js) | `server/src/vista/data/vista-package-record-ref.js` |
| [server/src/vista-package-record-store.js](../../../server/src/vista-package-record-store.js) | `server/src/vista/data/vista-package-record-store.js` |
| [server/src/vista-package-reservation.js](../../../server/src/vista-package-reservation.js) | `server/src/vista/data/vista-package-reservation.js` |
| [server/src/vista-package-finalization.js](../../../server/src/vista-package-finalization.js) | `server/src/vista/data/vista-package-finalization.js` |
| [server/src/vista-package-receipt.js](../../../server/src/vista-package-receipt.js) | `server/src/vista/data/vista-package-receipt.js` |
| [server/src/vista-package-time.js](../../../server/src/vista-package-time.js) | `server/src/vista/data/vista-package-time.js` |

### vista/config (2)

Límites del paquete y lectura de configuración de arranque.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/vista-package-limits.js](../../../server/src/vista-package-limits.js) | `server/src/vista/config/vista-package-limits.js` |
| [server/src/vista-startup-limits.js](../../../server/src/vista-startup-limits.js) | `server/src/vista/config/vista-startup-limits.js` |

### admin (4)

Lectura All runs y resolución de propietarios; no administración de roles.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/admin-analysis-reader.js](../../../server/src/admin-analysis-reader.js) | `server/src/admin/admin-analysis-reader.js` |
| [server/src/admin-api-handler.js](../../../server/src/admin-api-handler.js) | `server/src/admin/admin-api-handler.js` |
| [server/src/admin-api-error.js](../../../server/src/admin-api-error.js) | `server/src/admin/admin-api-error.js` |
| [server/src/admin-owner-identity.js](../../../server/src/admin-owner-identity.js) | `server/src/admin/admin-owner-identity.js` |

### platform/firebase (12)

Conexión de componentes con Auth, Firestore, Storage, tareas y configuración Firebase.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/firebase-vista-token-verifier.js](../../../server/src/firebase-vista-token-verifier.js) | `server/src/platform/firebase/firebase-vista-token-verifier.js` |
| [server/src/firebase-agent-config.js](../../../server/src/firebase-agent-config.js) | `server/src/platform/firebase/firebase-agent-config.js` |
| [server/src/firebase-vista-package-handler.js](../../../server/src/firebase-vista-package-handler.js) | `server/src/platform/firebase/firebase-vista-package-handler.js` |
| [server/src/firebase-agent-background.js](../../../server/src/firebase-agent-background.js) | `server/src/platform/firebase/firebase-agent-background.js` |
| [server/src/firebase-admin-handler.js](../../../server/src/firebase-admin-handler.js) | `server/src/platform/firebase/firebase-admin-handler.js` |
| [server/src/firebase-inspection-handler.js](../../../server/src/firebase-inspection-handler.js) | `server/src/platform/firebase/firebase-inspection-handler.js` |
| [server/src/firebase-services.js](../../../server/src/firebase-services.js) | `server/src/platform/firebase/firebase-services.js` |
| [server/src/firebase-vista-reservation-diagnostic.js](../../../server/src/firebase-vista-reservation-diagnostic.js) | `server/src/platform/firebase/firebase-vista-reservation-diagnostic.js` |
| [server/src/firebase-agent-video.js](../../../server/src/firebase-agent-video.js) | `server/src/platform/firebase/firebase-agent-video.js` |
| [server/src/firebase-agent-handler.js](../../../server/src/firebase-agent-handler.js) | `server/src/platform/firebase/firebase-agent-handler.js` |
| [server/src/firebase-vista-read-handler.js](../../../server/src/firebase-vista-read-handler.js) | `server/src/platform/firebase/firebase-vista-read-handler.js` |
| [server/src/firebase-api-router.js](../../../server/src/firebase-api-router.js) | `server/src/platform/firebase/firebase-api-router.js` |

### media (1)

Validación compartida de entradas de imagen.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/image-input.js](../../../server/src/image-input.js) | `server/src/media/image-input.js` |

### media/jpeg (5)

Primitivas compartidas para leer estructura, segmentos, tablas y entropía JPEG.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/jpeg-decode-tables.js](../../../server/src/jpeg-decode-tables.js) | `server/src/media/jpeg/jpeg-decode-tables.js` |
| [server/src/jpeg-segment.js](../../../server/src/jpeg-segment.js) | `server/src/media/jpeg/jpeg-segment.js` |
| [server/src/jpeg-decode-frame.js](../../../server/src/jpeg-decode-frame.js) | `server/src/media/jpeg/jpeg-decode-frame.js` |
| [server/src/jpeg-entropy.js](../../../server/src/jpeg-entropy.js) | `server/src/media/jpeg/jpeg-entropy.js` |
| [server/src/jpeg-structure.js](../../../server/src/jpeg-structure.js) | `server/src/media/jpeg/jpeg-structure.js` |

### shared (3)

Errores, respuestas HTTP y diagnósticos usados por más de un módulo; no un cajón de utilidades sin dueño.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/errors.js](../../../server/src/errors.js) | `server/src/shared/errors.js` |
| [server/src/http-json.js](../../../server/src/http-json.js) | `server/src/shared/http-json.js` |
| [server/src/agent-diagnostics.js](../../../server/src/agent-diagnostics.js) | `server/src/shared/agent-diagnostics.js` |

### legacy (2)

Servidor HTTP original y su autenticación por token; sigue activo y no se elimina.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/http-server.js](../../../server/src/http-server.js) | `server/src/legacy/http-server.js` |
| [server/src/client-auth.js](../../../server/src/client-auth.js) | `server/src/legacy/client-auth.js` |

### Entradas estables (2)

Puntos de entrada estables; se conservan sus rutas públicas de arranque.

| Archivo actual | Destino propuesto |
| --- | --- |
| [server/src/firebase.js](../../../server/src/firebase.js) | `server/src/firebase.js` |
| [server/src/start.js](../../../server/src/start.js) | `server/src/start.js` |

## Dependencias que el refactor debe conservar

La estructura propuesta no significa que el código ya tenga dependencias
perfectamente separadas. Estas relaciones existen y necesitan pruebas:

| Relación actual | Tratamiento propuesto |
| --- | --- |
| El adaptador OpenAI y Admin usan `agent-diagnostics.js`. | Ubicarlo en `shared/`, conservando nombre y comportamiento. |
| Admin usa `serializeRecord` del handler Agent y resúmenes de su store. | Conservar y documentar esa dependencia; extraer contratos sería otro cambio. |
| El handler de inspecciones importa `MAX_REQUEST_BYTES` del servidor original. | Ajustar la ruta sin cambiar el límite ni eliminar el servidor. |
| `analysis-contracts.js` importa el catálogo de VISTA. | Mantener esa carga y sus modos; no activar catálogo en Agent incidentalmente. |
| VISTA tiene validación JPEG con errores propios. | Mantenerla en `vista/validation/`; no fusionarla con primitivas compartidas. |

## Rutas que pueden romperse aunque un import compile

- [server/src/vista-catalog.js](../../../server/src/vista-catalog.js) carga
  `server/data/vista-catalog-cerave-ar.json` usando `import.meta.url`.
- [server/src/vista-manifest-schema.js](../../../server/src/vista-manifest-schema.js)
  carga el esquema en `server/contracts/` relativo a su propio archivo.
- [server/src/vista-startup-limits.js](../../../server/src/vista-startup-limits.js)
  lee `server/.env` durante discovery. Cambiar profundidad requiere ajustar esa
  ruta, no mover el archivo de entorno ni copiar sus valores.
- [server/package.json](../../../server/package.json) fija `src/firebase.js`
  como entrada y `src/start.js` en los comandos locales; ambas rutas se conservan.
- Tests, E2E y scripts también importan archivos de `server/src`; hay pruebas
  que inspeccionan el texto fuente, además de ejecutar funciones.
- Los enlaces a funciones de estas guías incluyen rutas y líneas. Deben volver
  a verificarse tras los movimientos; las líneas pueden cambiar al editar imports.

## Estrategia que deberá concretar el Sprint Plan

Primero registrar una línea base local y asignar cada cambio a un componente
aprobado. Los módulos de navegación no sustituyen la propiedad definida en
[la arquitectura de componentes](../../06-solution-design-and-architecture/components/component-architecture.md).

Las tareas deberán ordenar los movimientos y sus consumidores sin dejar el
proyecto con imports rotos entre entregas. Si hace falta una compatibilidad
temporal por reexports, debe figurar explícitamente en el plan, con su retirada.
No resolver un cambio entre componentes llamándolo una sola tarea de “carpetas”.

Después de cada lote, comprobar imports, rutas de recursos y pruebas del
componente. Al terminar, ejecutar la regresión determinista y los flujos de
emulador previstos, actualizar los enlaces y verificar que los 90 archivos
siguen representados exactamente una vez. Documentar los fallos previos.

Quedan fuera cambios de lógica, prompts, catálogo, esquema persistente,
autorización, nombres de funciones, configuración cloud y dependencias npm.
También queda fuera dividir archivos grandes: podrá ser una mejora posterior.

## Estado de esta entrega

Solo se ha preparado documentación y un índice en `server/src/README.md`.
No se ha movido ningún JavaScript, cambiado ningún import ni ejecutado una
prueba que llame al proveedor. No hay despliegue ni aceptación funcional nueva.
