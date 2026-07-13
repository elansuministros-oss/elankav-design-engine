# QA — DESIGN-001A

## Comandos obligatorios

```bash
npm run check
npm test
git diff --check
```

## Cobertura

- solicitud válida;
- solicitud sin plataforma;
- medidas confirmadas;
- medidas estimadas;
- perfil inexistente;
- perfiles duplicados;
- perfiles versionados;
- resultado estructurado;
- separación entre plataformas;
- límite de propuestas;
- autorización administrativa;
- adapter no configurado;
- rutas inválidas;
- prohibición de conversación directa;
- ausencia de secretos;
- ausencia de renders;
- proveedores externos deshabilitados.

## Resultado certificado

```text
tests 28
pass 28
fail 0
```

## Condición de cierre

DESIGN-001A no puede fusionarse si existe error sintáctico, prueba fallida, secreto detectado, archivo estructural vacío, proveedor externo activo, conexión productiva o render almacenado en Git.
