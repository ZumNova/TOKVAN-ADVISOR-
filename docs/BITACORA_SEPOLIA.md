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

## 002 · TOKVAN Test Token (TKN) — confirmado

- Expediente de prueba: `TOKVAN-SEPOLIA-TKN-001`.
- Factory: el registro 001, reutilizado sin desplegar otro.
- Decimales: 18.
- Supply inicial y máximo: 1.000.000 TKN (1000000000000000000000000 unidades mínimas).
- Emisión adicional: deshabilitada; quema y pausa: habilitadas.
- Administradora y tesorería: A047.
- Contrato: `0x6B7Bf9902CcE9fD0b4b522Bc85a61446662e161A`.
- Transacción: `0xb664266039e3413691f4d33931ee610ca03a2ece41cd5afa868283d387c82841`.
- Bloque: 12077861.
- Hash de emisión: `0xb5b73eaa2e64f033b6291ca95db0142fac90be4df6ccf812d6e24ca57ac276d1`.
- Verificación del 06/11/2026: evento TokenCreated y registro tokenByProject coinciden; símbolo TKN, 18 decimales, supply 1.000.000, saldo de A047 999.990 TKN, pausa desactivada y permiso de pausa activo para A047.
- El usuario confirmó una transferencia de 10 TKN a otra wallet. Las pruebas reales de pausa/reanudación y quema quedan pendientes de sus firmas.

Estos son los parámetros de la emisión confirmada. Modificar el formulario no modifica este token ya desplegado.

## Bitácora operativa en la web

En **Factory ERC-20 → Bitácora de Sepolia**, pulsar **Sincronizar bitácora** con una wallet en Sepolia. La web consulta `ApprovalChanged` y `TokenCreated` del factory desde el bloque 12072858. Registra hashes, bloques, revisores, revocaciones, contratos creados, parámetros de emisión y eventos de quema, pausa y reanudación. El historial confirmado puede reconstruirse desde cualquier navegador usando el mismo factory y descargarse como JSON.

Los pendientes y el formulario preparado se conservan sólo en localStorage. No son confirmaciones on-chain. Las aprobaciones sólo pasan a la bitácora confirmada al existir eventos en bloques; enviar una transacción no equivale a crear un token. Este documento es un registro inicial del repositorio; el historial posterior se consulta en la web/cadena y se exporta.

El caso demo de certificados de carbono conserva sus restricciones; no se eliminan controles para hacerlo pasar por una emisión fungible simple. Para esta prueba usar **Nueva emisión ERC-20 de prueba · TKN**.
