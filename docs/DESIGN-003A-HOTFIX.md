# DESIGN-003A-HOTFIX

## Objetivo

Recuperar generación real de una imagen PNG mediante OpenAI Images sin modificar la entrada oficial del ecosistema.

Flujo:

ELAN IA → Orchestrator → Design Engine → OpenAI Images → PNG → DesignResult → ELAN IA.

## Implementación

- Adapter real `OpenAIImageAdapter`.
- Modelo configurable mediante `OPENAI_IMAGE_MODEL`.
- Timeout configurable mediante `DESIGN_IMAGE_TIMEOUT_MS`.
- Prompt técnico sin precios y sin modificación de medidas confirmadas.
- Estado `NEEDS_INFORMATION` antes de consumir generación cuando faltan datos críticos.
- Almacenamiento temporal externo al repositorio.
- Asset identificado mediante UUID opaco.
- API interna `GET /internal/assets/:assetId`.
- QA estructural mínimo; no se afirma inspección visual profunda.
- `clientReady=true` únicamente con un PNG válido y QA aprobado.

## Variables requeridas

```text
OPENAI_API_KEY
OPENAI_IMAGE_MODEL=gpt-image-2
DESIGN_OUTPUT_DIR=/var/lib/elankav/design-engine/renders
DESIGN_PUBLIC_BASE_URL=https://orchestrator.elankav.com/api/design-assets
DESIGN_IMAGE_TIMEOUT_MS=120000
```

`OPENAI_API_KEY` no debe almacenarse en Git ni imprimirse en logs.

## Contrato del asset

```json
{
  "id": "uuid",
  "type": "IMAGE",
  "mimeType": "image/png",
  "platform": "ELANVISUAL",
  "url": "https://orchestrator.elankav.com/api/design-assets/uuid",
  "provider": "openai",
  "model": "configurable"
}
```

## Seguridad

- No se usan nombres enviados por clientes para rutas.
- No se permite traversal.
- No se listan directorios.
- No se revelan rutas internas.
- No existe fallback silencioso que simule una imagen.
- ELAN IA continúa siendo la única fuente autorizada.
- Conversación directa con el cliente continúa prohibida.

## QA

La suite usa mocks; no realiza llamadas pagadas.

Validación requerida en VPS:

```bash
npm run check
npm test
git diff --check
```

Solo después de aprobar la suite se autoriza una única generación real.
