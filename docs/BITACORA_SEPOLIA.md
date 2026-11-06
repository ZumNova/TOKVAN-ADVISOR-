# Bitácora TOKVAN — Sepolia

Red: Sepolia, chain ID 11155111. Estándar actual: ERC-20.

## 001 · Factory ERC-20 v1 — confirmado

- Contrato: `0x56C8f5CcBb52B9A7c3577fc797Cf1BB6c42028fd`
- Transacción: `0xd686e15a22b1f52803dc72ade56a90ba70dfae232ec9d729ec2e79cad2da4cf4`
- Bloque: 12072858.
- Fecha del bloque: 2026-11-05 23:55:00 UTC (20:55:00 de Argentina).
- Desplegado por: `0x521125be95c5679539aB07582F55F0040975A047`.
- Verificación: receipt exitoso; bytecode de creación y argumentos coinciden con la compilación local; los cuatro roles fueron leídos del contrato.
- [Ver transacción](https://sepolia.etherscan.io/tx/0xd686e15a22b1f52803dc72ade56a90ba70dfae232ec9d729ec2e79cad2da4cf4).

| Rol | Wallet |
| --- | --- |
| Técnico | `0x521125be95c5679539aB07582F55F0040975A047` |
| Compliance | `0xeFcA0FAFd073A7B5EBb044A83fA449A79835FB24` |
| Directorio | `0x275fF48842eaf6dFE32B6Cc51713f6CF63841E8D` |
| Operador | `0xF3aAD2304F711ad5f400Ad322442D67DeD3E8A25` |

## 002 · TOKVAN Test Token (TKN) — preparado, pendiente de firmas

- Expediente de prueba: `TOKVAN-SEPOLIA-TKN-001`.
- Factory: el registro 001, reutilizado sin desplegar otro.
- Decimales: 18.
- Supply inicial y máximo: 1.000.000 TKN (1000000000000000000000000 unidades mínimas).
- Emisión adicional: deshabilitada; quema y pausa: habilitadas.
- Administradora y tesorería: A047.
- No existe una dirección o transacción de creación confirmada registrada en este documento todavía.

Estos son los valores precargados para revisar en la web. Si se modifican, prevalece la configuración aprobada on-chain y se requiere un nuevo hash de revisión.

## Bitácora operativa en la web

En **Factory ERC-20 → Bitácora de Sepolia**, pulsar **Sincronizar bitácora** con una wallet en Sepolia. La web consulta `ApprovalChanged` y `TokenCreated` del factory desde el bloque 12072858. Registra hashes, bloques, revisores, revocaciones, contratos creados y parámetros de emisión. El historial confirmado puede reconstruirse desde cualquier navegador usando el mismo factory y descargarse como JSON.

Los pendientes y el formulario preparado se conservan sólo en localStorage. No son confirmaciones on-chain. Las aprobaciones sólo pasan a la bitácora confirmada al existir eventos en bloques; enviar una transacción no equivale a crear un token. Este documento es un registro inicial del repositorio; el historial posterior se consulta en la web/cadena y se exporta.

El caso demo de certificados de carbono conserva sus restricciones; no se eliminan controles para hacerlo pasar por una emisión fungible simple. Para esta prueba usar **Nueva emisión ERC-20 de prueba · TKN**.
