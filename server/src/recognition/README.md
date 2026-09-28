# Reconocimiento: preparar e interpretar

AI Shop entrega evidencia e instrucciones al proveedor, y comprueba que la
respuesta tiene la forma requerida. La identificación visual la realiza el modelo.

[server/src/recognition/background/README.md](background/README.md) explica los
dos helpers del flujo en segundo plano: petición y respuesta.

El adaptador público, HTTP, credenciales, tiempos límite y controles del proveedor
siguen en [server/src/openai-analyzer.js](../openai-analyzer.js).
El prompt y los esquemas siguen en [server/src/analysis-contracts.js](../analysis-contracts.js).
El analizador síncrono para otros consumidores no se mueve ni se modifica.

[Cómo se reconoce la fotografía](../../../01-docs/guides/vision-agent-photo-analysis/photo-recognition.md).
