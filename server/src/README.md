# Código del servidor

Este directorio implementa la recepción de evidencia, el reconocimiento de
productos y la consulta/revisión de resultados de AI Shop.
Actualmente contiene 90 archivos JavaScript al mismo nivel.
Las siguientes agrupaciones describen responsabilidades existentes, no carpetas ya creadas.

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

- [Proceso de /run, paso a paso y con enlaces a funciones](../../docs/guides/server-side-analysis/analysis-run-functions.md).
- [Mapa completo de módulos y destinos propuestos](../../docs/guides/server-side-analysis/source-module-map.md).
- [Propuesta de reorganización y condiciones antes de mover código](../../docs/07-planning/proposals/server-source-modules.md).

No se ha movido código con este índice. La propuesta requiere su propio Plan y
Tasks aprobados; las carpetas futuras tendrán un README específico.
