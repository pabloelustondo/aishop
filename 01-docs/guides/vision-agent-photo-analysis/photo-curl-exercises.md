# Cuatro ejercicios pequeños sobre un JPEG guardado

Estos scripts observan el contrato HTTP sin depender de la página web. No suben
archivos ni eligen modelo. `/run` y la refinación crean trabajo nuevo; las dos
lecturas no llaman al proveedor. Haz cada ejercicio por separado.

## Preparar la sesión

Desde la raíz del repositorio, usa Bash. En esa misma sesión establece `BASE`,
`TOKEN` y `ANALYSIS_ID`. `BASE` termina en la raíz de la API, no en `/v1`, sin `/`
final. El ID debe pertenecer a un JPEG ya guardado por ese usuario.

```bash
bash
BASE='http://127.0.0.1:15001/demo-aishop-e2e/northamerica-northeast2/api'
ANALYSIS_ID='ID_DEL_JPEG_YA_GUARDADO'
```

La URL es solo un ejemplo local: necesita un emulador/configuración de prueba
en ese puerto. Obtén `TOKEN` mediante el inicio de sesión de ese mismo entorno,
con `agent: true`; un token de nube no equivale a un token del emulador.
No guardes tokens en scripts, documentación, capturas ni historial del shell.
Los scripts no incluyen un destino de nube ni cargan `.env.local`.

Un emulador sin un proveedor simulado no garantiza un análisis exitoso.
Para probar todo automáticamente sin gasto usa el ejercicio E2E de abajo.
Estos ejemplos no autorizan llamadas pagadas; un futuro uso en nube requiere
una decisión explícita de entorno y gasto, aunque el script admita esa URL.

## 1. Iniciar

```bash
source scripts/agent-photo-run-tests/run-photo.sh
```

Envía `POST /v1/agent/analyses/{id}/run`, sin cuerpo. Espera HTTP 200 y
normalmente `analyzing`. No es todavía un informe ni debe repetirse en bucle.
Un registro ya analizado requiere la refinación del ejercicio 4.

## 2. Consultar estado

```bash
source scripts/agent-photo-run-tests/read-status.sh
```

Envía `GET /v1/agent/analyses/{id}`. Mira `status`, `failureReason`, `runCount`
y `error`. Puede seguir `analyzing`; la lectura no impulsa la recogida.

## 3. Leer informe

```bash
source scripts/agent-photo-run-tests/read-report.sh
```

Es **el mismo endpoint GET**, con otra selección de campos. No existe aquí un
endpoint `/report`. Solo interpreta el informe como resultado del run vigente
cuando `status` sea `analyzed`; durante una refinación puede conservar el anterior.

## 4. Refinar

```bash
CONTEXT='Cuenta solamente los productos del estante inferior.'
source scripts/agent-photo-run-tests/refine-photo.sh
```

Envía JSON `{ "context": "…" }` al mismo POST `/run`. Espera un run nuevo
y vuelve a los ejercicios 2 y 3. No repitas automáticamente ante 502/504:
el proveedor puede haber recibido el inicio. Consulta primero el estado.

## Cómo sabemos que los scripts funcionan

`bash scripts/agent-photo-run-tests/curl-fixture-tests.sh` ejecuta estos cuatro
scripts contra un servidor HTTP local simulado, con credenciales ficticias.
Comprueba método, ruta, JSON, autorización y errores visibles, sin probar Firebase.
`bash scripts/agent-photo-run-tests/photo-e2e.sh` prueba además la composición
real con Auth/Firestore/Storage emulados y proveedor/cola simulados.

Los scripts muestran `httpStatus` incluso ante 4xx/5xx; una salida del shell con
código cero **no** declara aprobado el endpoint. Inspecciona el JSON.
Resultados reales, no ejemplos inventados: [evidencia de validación](../../10-review-and-release/sprint-015-agent-photo-run/README.md).
