# Factory ERC-20 v1

## Flujo implementado

1. Configurar la emisión en **Factory ERC-20**, desde un expediente compatible o una emisión de prueba.
2. Descargar el archivo de revisión: contiene parámetros exactos, hash, chain ID, factory y calldata de aprobación, revocación y creación.
3. Técnica, Compliance y Directorio verifican los mismos parámetros y cada cuenta envía `setApproval(digest, true)` al factory.
4. La cuenta operadora simula `createToken(projectId, config)` con `eth_call`, revisa gas y envía la transacción.
5. Confirmar el receipt y leer `TokenCreated` / `tokenByProject`. Sólo entonces existe el token.

La pantalla conecta la wallet del navegador para aprobar, revocar y crear tokens contra el factory registrado. Cada acción se simula antes de abrir la solicitud de firma. Los dictámenes del sandbox son demostrativos y no modifican aprobaciones on-chain. El JSON es un paquete de revisión, no el formato de importación de Safe Transaction Builder: usar sus campos `to`, `value` y `data` con una wallet compatible o el ABI con una multisig.

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

Factory desplegado y verificado en Sepolia: `0x56C8f5CcBb52B9A7c3577fc797Cf1BB6c42028fd`. TKN fue creado en `0x6B7Bf9902CcE9fD0b4b522Bc85a61446662e161A` (bloque 12077861). La pantalla permite aprobar, revocar y crear tokens mediante la wallet; el resto de la gestión de expedientes sigue siendo una demo sin backend. Ver [bitácora inicial](BITACORA_SEPOLIA.md).

## Despliegue desde la wallet del navegador

1. Abrir **Factory ERC-20** y conectar la cuenta `0x521125be95c5679539aB07582F55F0040975A047`.
2. Cambiar a Sepolia, pulsar **Estimar despliegue** y revisar participantes y costo.
3. Pulsar **Firmar y desplegar factory** y revisar/confirmar la transacción en la wallet.
4. Pulsar **Verificar confirmación** tras su inclusión. La dapp verifica receipt exitoso, remitente, calldata exacto y existencia de código antes de usar la dirección.

La cuenta A047 paga el despliegue y conserva su rol Técnico. El operador sigue siendo 8A25. La configuración pública está en `deployment/sepolia-participants.json`. No contiene claves. El hash se guarda en localStorage con versión y puede comprobarse tras recargar; no es un registro global compartido entre dispositivos. No desplegar otra vez desde otro navegador mientras haya un envío pendiente. Si se acelera o reemplaza una transacción desde la wallet, conservar el nuevo hash y comprobarla en el explorador antes de reintentar.

La pantalla utiliza la wallet inyectada (`window.ethereum`); no incluye WalletConnect ni selección de múltiples extensiones. Un cambio de cuenta o red invalida la estimación. Las comisiones finales se revisan en la wallet.

El artefacto público de compilación está en `src/generated/factoryArtifact.json`. Tras cambiar Solidity, ejecutar `npm run contracts:export` y `npm run test:factory` para comprobar que el bytecode web coincide con Foundry.

## Prueba TKN desde el panel

1. Usar **Nueva emisión ERC-20 de prueba · TKN**, revisar los parámetros y pulsar **Preparar para revisión**. El factory existente se carga automáticamente.
2. Conectar A047 en Sepolia, consultar estado, simular aprobación y firmarla. Verificar confirmación.
3. Repetir con FB24 (Compliance) y 1E8D (Directorio), sin cambiar los parámetros.
4. Conectar 8A25 (Operador), actualizar aprobaciones, simular creación y firmarla. Verificar confirmación.
5. Sincronizar/descargar la bitácora. La dirección, símbolo, parámetros, hash y bloque del token se leen de la emisión real.

El formulario preparado y los hashes pendientes se guardan localmente para retomar después de recargar. La bitácora confirmada se reconstruye desde eventos del factory en Sepolia, con consultas en bloques de 5.000 y un margen de dos bloques respecto de la cabecera del RPC. Las operaciones recientes pueden requerir esperar y sincronizar nuevamente. Requiere que el RPC de la wallet admita consultas históricas. Las aprobaciones consumidas dejan la máscara en cero; su historial permanece en los eventos.

La firma es siempre del usuario. No se guardan claves privadas. Si se reemplaza/acelera una transacción, su hash original puede permanecer pendiente; revisar el historial de la wallet antes de volver a enviar. La bitácora on-chain mostrará los eventos de la transacción que efectivamente se incluya.

## Quemar, pausar y reanudar desde el formulario

Los botones **Quemar tokens** y **Pausar / Reanudar** están junto a **Preparar para revisión**. Abren una ventana explicativa; no envían transacciones al abrirla.

1. Conectar wallet y consultar estado en Sepolia. El token se obtiene del registro `tokenByProject` del factory usando el expediente seleccionado, no de los parámetros editables del formulario.
2. Para quemar, indicar una cantidad positiva del saldo propio (por defecto 1). La quema es irreversible y reduce saldo y supply.
3. Para pausar/reanudar se comprueba PAUSER_ROLE; inicialmente A047. El texto y la acción cambian según el estado leído del contrato. La pausa bloquea transferencias, mint y burn.
4. Simular, revisar gas y acción, confirmar en la wallet y verificar receipt/evento. Cuenta, red, saldo y permisos se revisan nuevamente antes de enviar.
5. Sincronizar la bitácora después de dos bloques para ver la quema, pausa o reanudación confirmada. Los pendientes conservan su hash en el navegador.

Pruebas locales cubren pausa/reanudación, bloqueo de transferencias y quemas, permisos, cambio de cuenta, cantidad exacta, saldo insuficiente, reducción de supply y eventos de bitácora. No se envían transacciones reales durante esas pruebas.
