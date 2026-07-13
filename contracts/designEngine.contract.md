# Design Engine Contract

## Entrada autorizada

El único origen autorizado es `ELAN_IA`.

El Design Engine:

- no conversa directamente con clientes;
- no entrega texto conversacional final;
- no recibe solicitudes directas desde proveedores externos;
- no usa UI como fuente oficial;
- no accede a Supabase productivo durante DESIGN-001A.

## Flujo contractual

```text
ELAN IA
  ↓
DesignRequest
  ↓
Services
  ↓
DesignEngine
  ↓
DesignResult
  ↓
ELAN IA
```

## Contratos obligatorios

- `DesignRequest`
- `DesignProfile`
- `DesignResult`
- `QaResult`
- `PlatformBrandProfile`
- `ProposalAuthorization`

## Reglas

1. No inferir medidas de fabricación desde fotografías.
2. No mezclar plataformas, logos ni datos comerciales.
3. No guardar renders ni secretos en Git.
4. No incluir precios dentro de prompts.
5. No entregar resultados sin QA.
6. No permitir una cuarta propuesta sin autorización administrativa.
7. No conectar proveedores reales durante DESIGN-001A.
8. Los adapters deben permanecer desacoplados.
9. Los resultados deben volver estructurados a ELAN IA.
10. `elanIaResult.conversational` siempre debe ser `false`.

## Errores mínimos

- `INVALID_DESIGN_REQUEST`
- `INVALID_ENTRY_SOURCE`
- `DIRECT_CLIENT_CONVERSATION_FORBIDDEN`
- `PLATFORM_REQUIRED`
- `PROFILE_NOT_FOUND`
- `PROPOSAL_LIMIT_REACHED`
- `ADMIN_AUTHORIZATION_REQUIRED`
- `ADAPTER_NOT_CONFIGURED`
- `INVALID_ROUTE`
