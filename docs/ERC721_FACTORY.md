# Factory ERC-721 v1 · Sepolia

La sección Factories separa ERC-20, ERC-721, ERC-1155 y ERC-3643. Los últimos dos son espacios pendientes, sin controles de despliegue. ERC-721 usa contratos, formularios, aprobaciones y almacenamiento separados de ERC-20.

## Primera prueba desde la web

1. Abra Factories → ERC-721. Conecte la wallet **A047** en Sepolia.
2. Simule el despliegue ERC-721, revise el costo y confirme en la wallet. Pulse **Verificar confirmación**. Guarde el hash; permite recuperar el factory en otro navegador.
3. Revise `TOKVAN-SEPOLIA-NFT-001`, nombre `TOKVAN NFT Test`, símbolo `TKNFT`, administradora A047 y máximo histórico 100. Pulse **Preparar para revisión**.
4. Simule y confirme la aprobación desde **A047**, después **FB24** y **1E8D**. Verifique cada confirmación y actualice el estado al cambiar de cuenta. Las tres deben aprobar exactamente los mismos parámetros.
5. Cambie a **8A25**, actualice el estado y cree la colección. Verifique su confirmación.
6. Regrese a **A047**, actualice y emita un NFT a la wallet elegida. Cargue imagen, nombre y descripción desde el panel; la integración con Pinata crea el JSON y completa la URI. Para activarla consulte [PINATA_NFT.md](./PINATA_NFT.md). También puede usar una URI existente en la opción avanzada. Revise la operación, firme y verifique para obtener el ID.
7. Actualice la bitácora después de dos bloques y descargue su JSON. Puede probar pausa/reanudación y quema, con revisión antes de cada firma.

El despliegue del factory no crea una colección ni emite NFTs. Cada paso consume gas Sepolia. Ninguna prueba automatizada usa ETH de la red pública. El factory todavía requiere la firma del usuario para desplegarse.

## Comportamiento

- Tres revisores y operador distintos e inmutables, provenientes de `deployment/sepolia-participants.json`.
- El hash aprobado incluye versión ERC-721, chain ID, factory, expediente y todos los parámetros. Cambiar un parámetro exige nuevas aprobaciones.
- Un expediente admite una colección por factory. Para otra colección use **Preparar otra colección** e ingrese otro expediente.
- La administradora recibe los roles de emisión, administración y pausa cuando corresponde. El operador del factory no recibe permisos sobre los NFTs.
- IDs desde 1. El máximo cuenta todas las emisiones históricas; quemar reduce circulación pero no libera cupos ni reutiliza IDs.
- La URI se fija al emitir. HTTPS permite cambiar contenido fuera de cadena; use almacenamiento por contenido como IPFS cuando corresponda.
- Pausa bloquea transferencias, emisión y quema. Quema permitida al titular o autorizado si se habilitó al crear la colección.
- Sin upgrade, royalties ERC-2981, whitelist ni KYC on-chain. Versión de prueba sin auditoría externa.

## Verificación y persistencia

La dapp simula calldata exacto, estima gas y revisa cuenta, red, permisos y saldo antes de enviar. Confirma receipt y evento esperado antes de avanzar. Para recuperar un factory valida remitente A047, bytecode de creación y los cuatro argumentos. No acepta el hash del factory ERC-20.

Claves del navegador: `tokvan:erc721:sepolia:v1:*`. El borrador y hash pendiente sobreviven a recargas; la verdad de contratos y permisos se vuelve a consultar. No hay claves privadas en el proyecto. La bitácora se reconstruye con eventos del factory y sus colecciones, con dos bloques de espera; no es una garantía de finalidad.

Metadatos demo: `/metadata/tokvan-nft-1.json`; imagen: `/metadata/tokvan-nft.svg`. No representan activos ni certificados reales.

## Pruebas

- `forge test`: contratos ERC-20 y ERC-721, permisos, callbacks, reentrada, límites y pausa.
- `npm run test:erc721`: flujo de wallet sobre Anvil local (puerto 18546, chain ID 11155111), comprobación de eventos y bitácora.
- `npm run test:factory`: regresión ERC-20 local.
- `npm run lint` y `npm run build`.
