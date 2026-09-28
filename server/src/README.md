# Código del servidor

Este directorio implementa la recepción de evidencia, el reconocimiento de
productos y la consulta/revisión de resultados de AI Shop.
Sprint 015 separa únicamente el recorrido `/run` de una fotografía ya guardada.
El resto del servidor permanece en sus rutas existentes.

## Módulos extraídos

- [server/src/agent/api/README.md](agent/api/README.md): lectura del contexto JSON.
- [server/src/agent/analysis/README.md](agent/analysis/README.md): runner y collector.
- [server/src/recognition/background/README.md](recognition/background/README.md): cuerpo de petición e interpretación.

Las entradas antiguas del runner/collector reexportan las mismas funciones.
Stores, prompt/esquema, configuración y composición Firebase no se trasladan.

## Por dónde empezar

| Área | Responsabilidad | Primer archivo |
| --- | --- | --- |
| Arranque Firebase | Publica las funciones y conecta las rutas. | [server/src/firebase.js](firebase.js) |
| Arranque local | Inicia el servidor HTTP original; no sustituye todas las funciones Firebase. | [server/src/start.js](start.js) |
| Agent | Coordina análisis persistentes de fotografías y vídeos. | [server/src/agent-analysis-runner.js](agent-analysis-runner.js) |
| Reconocimiento | Construye solicitudes al modelo e interpreta sus respuestas. | [server/src/openai-analyzer.js](openai-analyzer.js) |
| Inspecciones | Recibe evidencia y coordina análisis/registros para inspecciones. | [server/src/submit-inspection.js](submit-inspection.js) |
| Paquetes VISTA | Recibe manifiestos y artefactos del cliente VISTA. | [server/src/submit-vista-package.js](submit-vista-package.js) |
| Administración | Consulta análisis entre propietarios con autorización administrativa. | [server/src/admin-api-handler.js](admin-api-handler.js) |
| Composición Firebase | Selecciona el manejador según la ruta HTTP. | [server/src/firebase-api-router.js](firebase-api-router.js) |
| Imágenes | Valida la entrada antes de procesarla. | [server/src/image-input.js](image-input.js) |

Los stores conservan evidencia y estado; los runners y collectors coordinan el
trabajo. Los archivos `firebase-*` conectan estas piezas con servicios concretos.
El catálogo de VISTA no implica que todos los modos de reconocimiento usen catálogo.

## Guías

- [Proceso de /run, paso a paso y con enlaces a funciones](../../01-docs/guides/vision-agent-photo-analysis/analysis-run-functions.md).
- [Mapa completo de módulos y destinos propuestos](../../01-docs/guides/vision-agent-photo-analysis/source-module-map.md).
- [Propuesta de reorganización y condiciones antes de mover código](../../01-docs/07-planning/proposals/server-source-modules.md).

La reorganización global sigue diferida; este índice no autoriza mover otras áreas.
