# ERC-1155 · Sepolia v1

Panel independiente en Factory → ERC-1155. Usa los contratos TokvanERC1155Factory y TokvanERC1155, OpenZeppelin 5.4.0 y Solidity 0.8.24. Versión de prueba sin auditoría externa.

## Recorrido desde la web

1. Conectar A047 en Sepolia y simular el despliegue del factory. Revisar el costo, confirmar en la wallet y verificar la confirmación.
2. Completar expediente único, nombre, símbolo, administradora y máximo de tipos (IDs). Preparar para revisión.
3. Aprobar con A047 (técnica), FB24 (cumplimiento) y 1E8D (directorio). Crear la colección con 8A25 (operador). Cada operación se simula, firma y verifica.
4. Volver a la administradora A047. Crear un tipo indicando destinataria, cantidad inicial, máximo histórico e imagen. El panel usa la integración privada de Pinata existente para subir imagen y JSON; también admite URI HTTPS/IPFS existente. Firmar la emisión.
5. Consultar el ID para ver saldo, circulación y emisión histórica. Emitir más unidades, transferir o quemar la cantidad indicada. Pausar/reanudar afecta todos los IDs de la colección.
6. Actualizar bitácora tras dos bloques. En Mis colecciones, elegir Usar para recuperar junto al nombre. Descargar JSON para conservar el hash del factory fuera del navegador.

Las cuatro direcciones completas están en deployment/sepolia-participants.json y en el panel. No se necesitan claves privadas del servidor. No hay despliegue público automático.

## Cantidades y límites

El máximo de tipos limita IDs distintos. Cada ID tiene su propia URI fija y máximo histórico de unidades, definidos al crearlo. Por ejemplo, ID 1 puede representar 100 entradas generales e ID 2 veinte entradas VIP. Un máximo por tipo de 100 y emisión inicial de 50 permite emitir otras 50; quemar no aumenta esa disponibilidad. Las cantidades son enteras sin decimales. Los IDs no se reutilizan.

El contrato permite transferencias por lote estándar; la interfaz administra un ID por operación. Quemar en la interfaz usa el saldo propio. El contrato también permite quema por operadores autorizados por el titular. La quema es irreversible y no elimina la colección. Todas las unidades de un ID comparten metadatos; con HTTPS el contenido del servidor puede cambiar aunque la URI sea fija.

Revisores y operador del factory son inmutables. Las aprobaciones vinculan red, factory, expediente y todos los parámetros. La administradora recibe los roles de emisión y, si se habilitó, pausa; puede delegarlos mediante AccessControl. No hay upgrade, regalías, whitelist ni KYC on-chain.

## Bitácora y persistencia

Eventos de factory, aprobaciones, colecciones, tipos, emisiones, transferencias (incluidos lotes), quemas y pausas se reconstruyen desde Sepolia. Los nombres de colección se leen del contrato; los nombres de tipos se obtienen opcionalmente de los metadatos IPFS. La recuperación verifica transacción, evento, dirección y parámetros. Los hashes de factory, colección y emisión son diferentes.

Estado local separado bajo tokvan:erc1155:sepolia:v1. Los metadatos preparados usan tokvan:erc1155:media:v1 por colección; ERC-721 conserva su almacenamiento. PINATA_JWT sigue siendo secreto del servidor. La firma de carga de medios no consume gas.

## Validación

- npm run contracts:test: permisos, límites, pausa, quema, receptores y reentrada.
- npm run test:erc1155: circuito de wallet sobre Anvil local con chain ID 11155111, recuperación y bitácora.
- npm run lint y npm run build.
- npm run contracts:export regenera ABI y bytecode desde los contratos compilados.
