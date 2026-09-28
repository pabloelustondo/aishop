# Vision Agent Photo Analysis

Guía para entender el reconocimiento de una fotografía ya guardada mediante
`POST /v1/agent/analyses/{id}/run`, antes de leer los archivos completos.

[Sprint 015](../../07-planning/sprints/sprint-015-agent-photo-run-refactor/01-sprint-plan.md)
profundiza solo en este recorrido para la revisión personal de Pablo.
La reorganización global de 90 archivos queda diferida; no es alcance de este sprint.

## Lectura recomendada

1. [Propósito y diagramas de secuencia](photo-sequence.md): una petición breve y recogida posterior.
2. [Funciones reales, paso a paso](analysis-run-functions.md): enlaces al código en su línea.
3. [Qué recibe el modelo y cómo validamos la respuesta](photo-recognition.md).
4. [Estados, identidad, errores y límites de recuperación](photo-state-and-errors.md).
5. [Ejercicios individuales con curl](photo-curl-exercises.md): foto guardada, inicio, refinación y lectura.
6. [Inventario completo de dependencias de este recorrido](server-side-anzlisis-overview.md).

El [índice del código actual](../../../server/src/README.md) agrupa las entradas
por responsabilidad. Solo `agent/api/`, `agent/analysis/` y `recognition/background/`
contienen las extracciones de este sprint; cada carpeta tiene su README.
El [mapa global](source-module-map.md) sigue siendo una propuesta diferida.

El recorrido distingue el inicio HTTP del trabajo posterior en segundo plano.
Los enlaces a funciones abren archivos locales de este proyecto en su línea correspondiente.
Esta documentación describe el código, no certifica exactitud de reconocimiento.
Consulta [pruebas observadas y brechas](../../10-review-and-release/sprint-015-agent-photo-run/README.md).
