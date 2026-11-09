# ERC-3643 · Laboratorio Sepolia

Esta versión despliega contratos reales en Sepolia (11155111), con identidades y acreditaciones **ficticias**. No realiza KYC/KYB, no consulta listas de sanciones y no autoriza una oferta. Mainnet queda bloqueada en la interfaz y en los constructores del factory y módulos ficticios. Completar el expediente nunca abre mainnet.

## Componentes y procedencia

El token, Identity Registry, Identity Registry Storage, Claim Topics Registry y Trusted Issuers Registry utilizan exactamente los artefactos de `@erc3643org/erc-3643@4.1.3`, paquete oficial fijado en package-lock.json. No recompilamos ni modificamos su bytecode. El factory comprueba sus hashes de runtime y crea clones EIP-1167, inicializados y configurados atómicamente. Las implementaciones se despliegan una vez desde A047; luego pueden reutilizarse. Los clones no tienen una ruta de actualización de implementación. El propietario sí conserva las facultades oficiales de administrar agentes y cambiar registros/compliance: no equivalen a parámetros inmutables de producción.

- [Especificación ERC-3643](https://eips.ethereum.org/EIPS/eip-3643)
- [Repositorio oficial](https://github.com/ERC-3643/ERC-3643)
- [Paquete fijado 4.1.3](https://www.npmjs.com/package/@erc3643org/erc-3643/v/4.1.3)
- Licencia de la suite: [GPL-3.0](licenses/ERC3643-GPL-3.0.txt). Se conserva el aviso y las fuentes están en el paquete fijado. Los contratos locales de integración tienen SPDX GPL-3.0. Los artefactos exportados no representan una auditoría de TOKVAN.

`Tokvan3643TestClaimIssuer` acredita mediante transacciones de una autoridad de prueba. `Tokvan3643TestIdentity` adapta las consultas de claims y claves que usa la suite; **no es una implementación completa de ONCHAINID ni una identidad de producción**. La firma de claim es un marcador ficticio: la validez se comprueba contra datos escritos por la autoridad autorizada, no contra firmas KYC externas. No se deben reutilizar estos módulos en producción.

`Tokvan3643TestCompliance` implementa la interfaz de compliance con países permitidos, máximo circulante y máximo por wallet para emisiones y transferencias normales. No implementa legislación, límites por identidad agregada, lockups, máximo de titulares, acreditación profesional ni reglas fiscales.

## Roles y dónde habilitarlos

| Responsabilidad | En esta prueba | Dónde queda |
|---|---|---|
| Aprobar configuración y hash del expediente | A047, FB24, 1E8D | Factory: tres bits de aprobación |
| Crear token aprobado | 8A25 | Factory: operador |
| Propiedad y agente inicial del token | A047, configurable antes de aprobar | Token: owner y AgentRole |
| Acreditar KYC/KYB, AML, elegibilidad | FB24, configurable antes de aprobar | TestClaimIssuer: authority inmutable |
| Vincular wallet, identidad y país | TestClaimIssuer, al acreditar | Identity Registry / Storage |
| Exigir temas de acreditación | 1 identidad, 2 AML, 3 elegibilidad | Claim Topics Registry |
| Autorizar al verificador | TestClaimIssuer de esa emisión | Trusted Issuers Registry |
| Controlar países y límites | Parámetros aprobados de prueba | TestCompliance |
| Autorizar nueva clave de recuperación | Autoridad de prueba | TestIdentity, evento TestRecoveryAuthorized |
| Ejecutar recuperación | Agente del token | Token y registro |

Las direcciones completas están en deployment/sepolia-participants.json. Aprobar la configuración NO acredita al titular. La emisora no se habilita automáticamente. Puede usarse KYC para personas y KYB para entidades; la demo también exige AML y elegibilidad. Estos temas/números son una convención de la prueba, no un listado legal universal.

## Primera prueba

1. En ERC-3643, cargar el expediente ficticio, leerlo y confirmar el modo de prueba. Puede completarse manualmente. Descargar una copia: los textos permanecen en el navegador/JSON, no en blockchain. No introducir datos personales ni documentos reales.
2. Con A047 desplegar y verificar los cinco componentes oficiales. Cada uno tiene su hash. Después desplegar y verificar el factory. No repetir pasos confirmados; recuperar por hash si cambia el navegador.
3. Configurar nombre, símbolo, decimales, propietaria/agente, autoridad de prueba, máximo circulante, máximo por wallet y países numéricos ISO. Ejemplo ficticio: 600 (Paraguay), 032 (Argentina). La dapp valida formato/rango, no determina si una oferta está legalmente permitida allí.
4. Preparar para revisión. A047, FB24 e 1E8D aprueban; 8A25 crea. Cualquier cambio de configuración o hash de expediente exige aprobaciones nuevas. El token nace pausado, con supply cero, sin identidades acreditadas.
5. Con FB24, consultar/acreditar A047. Seleccionar persona o entidad; marcar KYC o KYB correspondiente, AML y elegibilidad; indicar país, vencimiento (máximo 366 días) y referencia ficticia. Confirmar acreditación ficticia y simular/firmar/verificar. Pueden dejarse controles sin cumplir para probar rechazos.
6. Con A047, vincular su identidad como emisora y emitir 100 tokens a A047. La emisión por agente es posible aun pausado. Reanudar las transferencias.
7. Intentar enviar 3 tokens a 1E8D antes de acreditarla: la simulación debe rechazar sin firma. Acreditarla desde FB24 y repetir la transferencia: debe confirmarse.
8. Probar límites por wallet, país no permitido, vencimiento, revocación y congelamientos. Actualizar estado después de cambiar wallet y consultar saldos.
9. Recuperación: usar una nueva wallet propia no registrada. FB24 autoriza su clave en la identidad de la wallet anterior; A047 ejecuta recuperación, que mueve todo el saldo y congelamientos y elimina la asociación anterior del registro.
10. Actualizar bitácora después de dos bloques. Descargar JSON; recuperar tokens por nombre y hash de creación.

Todas las acciones requieren simulación, revisión explícita, firma en la wallet y verificación del receipt. No se solicitan ni guardan claves privadas. No hay nuevos documentos en Pinata: la evidencia de identidad se representa únicamente mediante referencias ficticias hash. Las referencias predecibles no son confidenciales por estar hasheadas.

## Diferencias con los tres paneles anteriores

- **Pausa:** bloquea transferencias normales, no emisión/quema/transferencia forzada/recuperación por agentes.
- **Quema:** solo agentes, puede afectar saldo de otro titular y saldo congelado. Es irreversible. Reduce supply circulante y libera cupo; no es un máximo histórico como ERC-721/1155.
- **Congelamiento:** total o parcial para transferencias normales. No suprime las facultades extraordinarias del agente.
- **Transferencia forzada:** exige receptor verificado, pero omite pausa, congelamientos y reglas de compliance (incluidos países/límites). Puede superar el límite por wallet; el panel lo explica antes de firmar.
- **Revocación/vencimiento de identidad:** impide recibir. No bloquea automáticamente envíos: el token oficial verifica identidad del destinatario. Para bloquear envíos normales usar congelamiento.
- **Recuperación:** requiere identidad existente y clave de gestión autorizada de la nueva wallet. La interfaz utiliza la identidad de la wallet anterior y rechaza nueva wallet ya registrada. La clave ficticia autorizada no expira ni tiene revocación en esta demo; debe reemplazarse por un proceso de identidad real en producción.
- **Operaciones por lote:** disponibles en las interfaces oficiales (batchTransfer, batchMint, batchBurn, etc.). Este panel guía operaciones individuales. La prueba integrada también comprueba batchTransfer y sus eventos.

El control extraordinario depende de agentes confiables: no interpretar el token como un activo sin intervención administrativa. El panel no implementa un quórum adicional para cada acción del agente; las tres aprobaciones se aplican a la creación inicial.

## Expediente y producción

Los campos organizan la información que debe evaluarse; no certifican que una lista genérica cubra todas las obligaciones de todos los países. Documentar por cada jurisdicción: clasificación del activo/oferta, autoridades, licencias/registros/exenciones aplicables, KYC/KYB/beneficiarios finales, AML/sanciones/origen de fondos, elegibilidad, documentación contractual, restricciones de circulación, privacidad, custodia/rescate, poderes de agentes, responsable profesional y revisión técnica.

Para cada requisito real deben definirse norma/fuente vigente, aplicabilidad y fundamento, evidencia privada, responsable, fecha y vencimiento. Lo no aplicable necesita justificación profesional. Los campos actuales son **declarativos y simulados**; incluso completos, el estado de producción continúa bloqueado.

Antes de diseñar un lanzamiento: determinar países y estructura jurídica concretos; integrar identidades, verificadores y claims reales; traducir restricciones aplicables a módulos; añadir validación de evidencias y aprobaciones por responsables; revisar recuperación/poderes excepcionales; auditar y probar la configuración final. Se requiere un flujo de producción separado que no acepte credenciales ficticias. No basta cambiar chainId ni marcar una casilla.

## Persistencia y bitácora

Prefijo local: tokvan:erc3643:sepolia:educational:v1. Draft, expediente, componentes, factory y transacción pendiente se guardan separados de los otros estándares. Exportar expediente y bitácora para conservar referencias fuera del navegador. La recuperación on-chain reconstruye configuración/hash, pero no el texto privado del expediente.

La bitácora consulta eventos del factory, token y los seis módulos asociados, con direcciones acotadas y ventanas RPC de 5000 bloques. Registra aprobaciones, creación, identidades, acreditaciones/revocaciones, autorizaciones de recuperación, transferencias, quemas, pausas y cambios administrativos. Importes de eventos en unidades mínimas; consulta de saldo con decimales. Las referencias de acreditación/autorización se guardan hasheadas. El texto de motivo mostrado para transferencia forzada o recuperación no se agrega a los eventos oficiales ni constituye un expediente de actuación persistente.

## Comandos

- npm run contracts:export: exporta artefactos oficiales y hashes fijados, compila código local y exporta ABI/bytecode.
- npm run test:erc3643: integración local Anvil, sin transacciones públicas ni gasto Sepolia.
- forge test: regresión Solidity y pruebas de bloqueo mainnet/permisos.
- npm run lint && npm run build.

Los artefactos oficiales se suministran precompilados por el paquete, con fuentes correspondientes incluidas. El compilador local 0.8.24 se aplica a los módulos TOKVAN, no a recompilar la suite oficial de pragma 0.8.17.
