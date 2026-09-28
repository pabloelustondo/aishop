# Pruebas pequeñas del recorrido JPEG `/run`

Ejecutar desde la raíz del repositorio. Cada comando tiene una sola finalidad;
ninguno carga una clave real del proveedor ni publica cambios.

## Contratos de componentes

Ejecuta cada archivo con `bash scripts/agent-photo-run-tests/<archivo>.sh`.

| Archivo | Comprueba |
| --- | --- |
| `evidence-store-tests.sh` | Bytes, propietario y errores de lectura del original. |
| `record-store-tests.sh` | Estado, historial, reservas, leases e identidades. |
| `adapter-tests.sh` | Cuerpo exacto y respuestas simuladas del proveedor, también consumidores compartidos. |
| `handler-tests.sh` | Entrada HTTP, contexto, autenticación y errores. |
| `runner-tests.sh` | Orden del inicio y compatibilidad de exportaciones. |
| `collector-tests.sh` | Recogida, reprogramación y asentamiento antes de limpieza. |
| `curl-fixture-tests.sh` | Los cuatro scripts manuales contra HTTP local simulado. |
| `static-checks.sh` | Enlaces, sintaxis, exportaciones y límites del refactor frente a `14be18b`. |
| `server-tests.sh` | Suite completa de tests de servidor. |

## Composición emulada

- `photo-e2e.sh`: recorrido focalizado, Auth/Firestore/Storage reales emulados,
  proveedor y entrega de tareas simulados; no necesita secreto real.
- `server-e2e.sh`: gate general existente, con sus puertos habituales.
- `server-e2e-isolated.sh`: el mismo gate general con puertos alternativos.

Requieren Firebase CLI, Java y dependencias instaladas. No correr los dos
ejercicios aislados simultáneamente: comparten los mismos puertos de prueba.
La configuración alternativa no modifica el despliegue `firebase.json`.
El gate general conserva su mecanismo existente de sustitución/restauración
temporal de secretos con placeholders; el ejercicio focalizado no lo necesita.

## Peticiones manuales, una por vez

`run-photo.sh`, `refine-photo.sh`, `read-status.sh`, `read-report.sh` se usan
con `source` en Bash para leer `BASE`, `TOKEN`, `ANALYSIS_ID` y, al refinar,
`CONTEXT` de esa sesión. No hace falta exportar esas variables.

[Instrucciones y resultados esperados](../../01-docs/guides/vision-agent-photo-analysis/photo-curl-exercises.md).
[Resultados observados y fallo previo del gate general](../../01-docs/10-review-and-release/sprint-015-agent-photo-run/README.md).
