# Arquitectura — ELANKAV Design Engine

## Flujo autorizado

```text
ELAN IA
  ↓
DesignRequestService
  ↓
ProposalLimitService
  ↓
DesignPlannerService
  ↓
ProfileRegistry
  ↓
PlatformBrandingService
  ↓
PromptBuilderService
  ↓
RenderService
  ↓
VisualQaService
  ↓
DesignResult
  ↓
ELAN IA
```

## Capas

### Engine

Coordina servicios y devuelve resultados estructurados. No conversa con clientes.

### Services

Aplican reglas sobre solicitudes, medidas, perfiles, propuestas, branding, prompts, render, video y QA.

### Adapters

Encapsulan proveedores externos. Durante DESIGN-001A permanecen sin configuración real.

### Profiles

Definen reglas técnicas versionadas y no contienen renders, secretos ni precios como fuente oficial.

### Schemas

Formalizan solicitudes, perfiles, resultados, QA, branding y autorizaciones.

## Separación de plataformas

Nunca deben mezclarse logos, marcas de agua, datos comerciales, sitios web, paletas, tipografías o assets.

## Medidas

Estados autorizados:

- `CONFIRMED`
- `ESTIMATED`
- `MISSING`

Las medidas estimadas no pueden convertirse automáticamente en medidas de fabricación.

## Persistencia

Supabase será la fuente oficial futura. Durante DESIGN-001A no hay conexión productiva, no se usa localStorage, no se guardan renders y no se almacenan secretos.
