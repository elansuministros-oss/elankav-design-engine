# ELANKAV Design Engine

Motor creativo desacoplado del ecosistema ELANKAV.

## Estado

- Movimiento: `DESIGN-001A`
- Versión: `0.1.0`
- Entrada única: `ELAN_IA`
- Proveedores externos: deshabilitados
- Generación real: deshabilitada
- Supabase productivo: deshabilitado
- Producción: sin conexión

## Regla principal

ELAN IA es la única capa autorizada para conversar con clientes. El Design Engine recibe solicitudes estructuradas, ejecuta planificación y QA, y devuelve resultados estructurados para ELAN IA.

```text
ELAN IA
  ↓
DesignRequest
  ↓
Services
  ↓
DesignEngine
  ↓
Adapters
  ↓
DesignResult + QA
  ↓
ELAN IA
```

## Arquitectura

```text
Adapter → Service → Engine
```

## Contratos mínimos

- `DesignRequest`
- `DesignProfile`
- `DesignResult`
- `QaResult`
- `PlatformBrandProfile`
- `ProposalAuthorization`

## Reglas permanentes

- No conversar directamente con clientes.
- No guardar renders ni secretos en Git.
- No usar localStorage como fuente oficial.
- No incluir precios dentro de prompts.
- No inferir medidas de fabricación desde fotografías.
- No mezclar branding entre plataformas.
- No entregar resultados sin QA.
- No permitir una cuarta propuesta sin autorización administrativa.
- No conectar proveedores reales durante DESIGN-001A.

## Validación

```bash
npm run check
npm test
git diff --check
```

Resultado certificado:

```text
28 tests
28 pass
0 fail
```

## Exclusiones

Esta fase no incluye generación real de imágenes, video, voz, Canva, Supabase productivo, despliegue, modificaciones de ELANVISUAL o ELAN IA, proveedores pagados ni publicación en Meta.
