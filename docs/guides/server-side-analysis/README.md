# Análisis del lado del servidor

Guía para entender el reconocimiento de una fotografía ya guardada mediante
`POST /v1/agent/analyses/{id}/run`, antes de leer los archivos completos.

[Sprint 015](../../07-planning/sprints/sprint-015-agent-photo-run-refactor/01-sprint-plan.md)
propone profundizar solo en este recorrido para la revisión personal de Pablo.
La reorganización global de 90 archivos queda diferida; no es alcance de este sprint.

## Lectura recomendada

1. [Recorrido paso a paso y funciones del código](analysis-run-functions.md).
2. [Inventario de archivos y responsabilidades](server-side-anzlisis-overview.md).
3. [Mapa completo y propuesta de organización de server/src](source-module-map.md).

El [índice del código actual](../../../server/src/README.md) agrupa las entradas
por responsabilidad. La estructura de subcarpetas es una propuesta, no un cambio ya implementado.

El recorrido distingue el inicio HTTP del trabajo posterior en segundo plano.
Los enlaces a funciones abren archivos locales de este proyecto en su línea correspondiente.
Esta documentación describe el código; no constituye una prueba ni una nueva implementación.
