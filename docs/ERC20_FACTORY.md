# Factory ERC-20 v1

## Flujo implementado

1. Configurar la emisión en **Factory ERC-20**, desde un expediente compatible o una emisión de prueba.
2. Descargar el archivo de revisión: contiene parámetros exactos, hash, chain ID, factory y calldata de aprobación, revocación y creación.
3. Técnica, Compliance y Directorio verifican los mismos parámetros y cada cuenta envía `setApproval(digest, true)` al factory.
4. La cuenta operadora simula `createToken(projectId, config)` con `eth_call`, revisa gas y envía la transacción.
5. Confirmar el receipt y leer `TokenCreated` / `tokenByProject`. Sólo entonces existe el token.

El preparador no solicita firmas ni transmite transacciones. Los dictámenes del sandbox son demostrativos y no modifican aprobaciones on-chain. El JSON es un paquete de revisión, no el formato de importación de Safe Transaction Builder: usar sus campos `to`, `value` y `data` con una wallet compatible o el ABI con una multisig.

## Contratos

- `TokvanERC20Factory`: cuatro participantes distintos e inmutables (tres revisores y un operador). No existe bypass de administrador. Cada revisor puede revocar su aprobación antes de la ejecución. No hay vencimiento automático. Un expediente sólo puede emitir una vez por factory.
- Hash: `keccak256(abi.encode(chainId, factory, projectId, config))`. El identificador textual se convierte con `keccak256(bytes(projectReference))`. Modificar parámetros, red, factory o expediente invalida aprobaciones anteriores.
- `TokvanERC20`: OpenZeppelin 5.4.0, Solidity 0.8.24, ERC20Capped, ERC20Pausable y AccessControl. Decimales entre 0 y 18. Supply en unidades mínimas (`uint256`); la interfaz convierte cadenas con precisión exacta.
- El admin del token recibe DEFAULT_ADMIN_ROLE y, si corresponde, MINTER_ROLE / PAUSER_ROLE. Puede delegar/revocar roles. El factory y su operador no reciben permisos sobre el token. El admin puede renunciar a sus roles; esa acción puede dejar funciones sin administrador.
- La tesorería recibe toda la emisión inicial. El cap limita supply en circulación, no emisión histórica acumulada: quemar puede permitir volver a emitir hasta el cap si mintable está habilitado.
- Quema de saldo propio y quema con allowance. La pausa afecta transferencias, mint y burn, pero no `approve`. Los flags no pueden activarse después del despliegue, aunque se otorguen roles.
- Sin proxy/upgrades, whitelist, KYC, custodia MPC implementada, distribución automática ni certificación regulatoria. El preparador bloquea expedientes que exijan esos controles de transferencia o upgrades.

Los participantes inmutables simplifican esta primera versión; cambiar un revisor u operador exige un factory nuevo y nuevas aprobaciones. Las wallets deben estar controladas por participantes realmente independientes; direcciones distintas por sí solas no prueban esa independencia. No hay auditoría externa de estos contratos.

## Verificación local

Requisitos: Node.js compatible con el proyecto y Foundry (`forge`, `anvil`, `cast`).

```bash
npm ci
npm run contracts:build
npm run contracts:test
npm run test:factory
npm run lint
npm run build
```

La prueba de integración inicia Anvil en el puerto 18545, con chain ID 11155111 sin conexión a Sepolia. Comprueba que el hash de TypeScript coincide con Solidity y que el calldata exportado permite aprobar y crear un token real en la cadena local. Las cuentas de Anvil sólo se usan para pruebas locales.

## Desplegar el factory en Sepolia

Definir `TECHNICAL_REVIEWER`, `COMPLIANCE_REVIEWER`, `BOARD_REVIEWER` y `FACTORY_OPERATOR` con direcciones distintas y no nulas, y `SEPOLIA_RPC_URL` con un endpoint. Usar una cuenta de Foundry en keystore; no escribir claves privadas en el repositorio. Los contratos también pueden ser llamados por multisigs.

Simular primero:

```bash
forge script script/DeployERC20Factory.s.sol:DeployERC20Factory --rpc-url "$SEPOLIA_RPC_URL" --account tokvan-deployer
```

Tras revisar la simulación, ejecutar con la misma cuenta:

```bash
forge script script/DeployERC20Factory.s.sol:DeployERC20Factory --rpc-url "$SEPOLIA_RPC_URL" --account tokvan-deployer --broadcast
```

El script permite únicamente Sepolia y cadena local 31337. Introducir la dirección resultante en el preparador. Las direcciones ingresadas en la pantalla tienen validación sintáctica; antes de firmar, comprobar el código desplegado y comparar `hashConfig` con el hash del JSON. Revisar cantidades y destinatarios desde el ABI del contrato, no aprobar hashes desconocidos.

Aprobación de cada revisor (también puede usarse la transacción `approval` del JSON):

```bash
cast send "$FACTORY_ADDRESS" 'setApproval(bytes32,bool)' "$REVIEW_DIGEST" true --rpc-url "$SEPOLIA_RPC_URL" --account tokvan-technical
```

Repetir con las cuentas de Compliance y Directorio. Para revocar, usar `false`. La creación usa la transacción `deployment` exportada, enviada por el operador; confirmar el éxito del receipt y consultar el registro del factory. No inferir éxito de la existencia de un hash de transacción.

## Estado de esta entrega

Implementación y pruebas locales. No se han desplegado contratos en una red pública. La web sigue siendo una demo de gestión con un preparador funcional; no persiste expedientes en un backend ni gestiona firmas reales desde el navegador.
