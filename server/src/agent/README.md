# Agent: ejecutar y consultar análisis persistentes

Este módulo contiene las piezas extraídas del recorrido de una fotografía ya
guardada. No representa una reorganización completa del servidor.

- [server/src/agent/api/README.md](api/README.md): interpretar la nota JSON de `/run`.
- [server/src/agent/analysis/README.md](analysis/README.md): iniciar y recoger una ejecución.

La entrada HTTP sigue en [server/src/agent-api-handler.js](../agent-api-handler.js).
La composición real sigue en [server/src/firebase-agent-handler.js](../firebase-agent-handler.js)
y [server/src/firebase-agent-background.js](../firebase-agent-background.js).
Autenticación, uploads, cancelación y vídeo no se rediseñan aquí.

[Guía de lectura personal](../../../01-docs/guides/vision-agent-photo-analysis/README.md).
