# Manual operativo ERC-3643 · CORPO en Sepolia

Este manual describe la prueba educativa de TOKVANT con contratos reales en Sepolia e identidades y acreditaciones ficticias. No acredita cumplimiento legal ni habilita una oferta de tokens. No cargar datos personales, documentos KYC/KYB, claves ni referencias sensibles en los campos de prueba o en blockchain.

## Datos de esta prueba

| Elemento | Valor |
| --- | --- |
| Red | Ethereum Sepolia (`11155111`) |
| Factory ERC-3643 | `0x873Cd8e429c677e678b4C5970e28492585403774` |
| Token CORPO | `0xe038C37d78178572c81b0E1267F24e8891B42787` |
| Propietaria y agente inicial | AE0E: `0x85F70AC2723BdA03f3Ea4e0259a8f40bC76FAE0E` |
| Autoridad de acreditación ficticia | FB24: `0xeFcA0FAFd073A7B5EBb044A83fA449A79835FB24` |
| Administración TOKVANT | 047: `0x521125be95c5679539aB07582F55F0040975A047` |
| Límites configurados | Supply circulante máximo: 1.000.000 CORPO; máximo por wallet en operaciones normales: 1.000 CORPO |
| Países de prueba | `032` Argentina y `600` Paraguay |

Los permisos de acceso al panel TOKVANT y los permisos del contrato son distintos. La 047 asigna acceso web; el contrato decide quién puede acreditar, emitir, congelar o transferir. Las firmas de acceso y consulta son gratuitas; las transacciones on-chain consumen gas Sepolia.

## Recuperar CORPO y abrir el registro

1. En **Factories → ERC-3643**, conectar la wallet autorizada y seleccionar Sepolia.
2. Si falta el factory, recuperarlo en **2. Componentes oficiales y factory → Recuperar despliegue por hash** con el hash de despliegue anotado en la bitácora. Recuperar el factory por sí solo no abre CORPO.
3. Al final del panel, pulsar **Bitácora ERC-3643 → Actualizar bitácora**. Buscar la tarjeta CORPO cuya dirección sea `0xe038C37d78178572c81b0E1267F24e8891B42787` y pulsar **Usar para recuperar · CORPO**.
4. Bajo **4. CORPO · Identidades y acreditaciones de prueba** aparece **Participantes de CORPO · registro operativo**. La 047 vincula el token al registro una sola vez. Si el panel ya muestra `Registro compartido`, ese vínculo existe.

## Incorporar una wallet receptora

1. La empresa, con AE0E conectada y su autorización de `token_operator` en el navegador, abre **Proponer wallet receptora**. Ingresa dirección pública, código interno sin datos personales (por ejemplo `INV_CORPO_002`) y país propuesto `032` o `600`. Firma **Agregar a revisión** y después **Actualizar registro y estados**.
2. La propuesta crea un renglón operativo. No acredita identidad, no da un rol administrativo y no mueve CORPO. Hasta acreditar, la tarjeta puede mostrar `Identidad: no habilitada`, país on-chain `0`, saldo `0` y `Pendiente o sin cupo`.
3. FB24 conecta su wallet y pulsa **Usar en acreditación (sección 4)** en esa tarjeta. Revisa que la wallet y el país sean correctos, define vencimiento y referencia ficticia, marca KYC si se simula persona o KYB si se simula entidad, más AML y elegibilidad. Confirma que son datos ficticios, simula, revisa el resumen, firma la transacción y pulsa **Verificar confirmación**.
4. Al actualizar el registro, una wallet vigente, no congelada, en país permitido y con saldo bajo el límite aparece **Acreditada y con cupo**. Esto todavía no le asigna tokens.
5. AE0E vuelve a la tarjeta y pulsa **Usar como destinataria (sección 5)**. En **5. Emisión, transferencias y controles**, indica la cantidad y elige **Transferir mis tokens** para enviar desde su saldo. **Emitir tokens** crea suministro adicional y requiere permiso de agente; no equivale a transferir. Tras confirmar, actualiza la tarjeta para consultar el saldo on-chain.

Prueba realizada: `0xA7Da01B2c47A74831Df054eC54C1d95691Ef82F7` fue propuesta como `INV_CORPO_002`, acreditada ficticiamente por FB24 para país `032`, y luego recibió `1 CORPO` de AE0E. El registro mostró identidad vigente, saldo `1.0 CORPO`, ausencia de congelamiento y cupo disponible. Otra participante, `0x21b4e7edb4f43b050c2af87fcd5f8bc0bf93d189`, figuró acreditada con `10 CORPO` antes de la siguiente prueba.

## Transferir desde MetaMask, fuera de TOKVANT

Con la wallet titular `0xA7Da…82F7`, importar CORPO como token personalizado si MetaMask no lo muestra, usando la dirección exacta del contrato de arriba. Seleccionar Sepolia y enviar una cantidad a `0x21b4…d189`, que ya está acreditada, siempre que ambas identidades sigan vigentes, el token esté despausado, ninguna wallet esté congelada, la receptora tenga cupo y haya ETH Sepolia para gas. Confirmar dirección, importe y resultado en MetaMask y Etherscan; después actualizar el registro TOKVANT. Esta transferencia ordinaria no necesita una nueva firma de FB24 ni la intervención de AE0E. El contrato aplica las restricciones también si se opera desde MetaMask.

Si MetaMask rechaza o falla la estimación, no repetir firmas a ciegas: comprobar red, dirección del contrato, saldo de CORPO y ETH, pausa, acreditación vigente, país, congelamiento y cupo de la receptora. Una propuesta en el registro no sustituye la acreditación on-chain.

**Resultado observado:** AE0E envió un segundo CORPO a `0xA7Da…82F7`, que mostró saldo `2.0`. Esa wallet transfirió `1 CORPO` a `0x21b4…d189` desde MetaMask, fuera de TOKVANT. Después, la consulta del registro mostró `1.0 CORPO` en A7Da y el titular confirmó `11 CORPO` en 21b4. Falta incorporar el hash de esta transferencia a la bitácora de prueba si se necesita una referencia verificable del caso.

## Controles y pruebas siguientes

- **Pausa:** un agente detiene transferencias normales; la emisión por agente puede seguir disponible en este contrato. Reanudar antes de probar transferencias ordinarias.
- **Congelamiento total o parcial:** AE0E como agente puede impedir transferencias normales de una wallet o reservar parte de su saldo. Descongelar no vuelve a acreditar una identidad vencida o revocada.
- **Revocación:** FB24 puede revocar la acreditación ficticia. Impide nuevas recepciones normales, pero no congela automáticamente los envíos de una wallet que ya tiene saldo; para bloquearlos, el agente debe congelarla.
- **Cupo:** una transferencia normal que haga superar 1.000 CORPO a la receptora debe rechazarse. El máximo de supply circulante y el máximo por wallet son controles diferentes.
- **Acciones extraordinarias:** quema por agente, transferencia forzada y recuperación no son operaciones ordinarias del titular. Requieren permisos del contrato y un procedimiento documentado antes de cualquier uso real. En la prueba, FB24 autoriza una nueva wallet de recuperación y el agente ejecuta el traslado de identidad/saldo; una wallet nueva no debe estar ya registrada.

El orden recomendado para cerrar la prueba es: (1) transferencia A7Da → 21b4 desde MetaMask; (2) rechazo controlado a una wallet no acreditada; (3) pausa y reanudación; (4) congelamiento y liberación con importes pequeños; (5) revocación y reacreditación solo si se quiere ensayar el circuito completo. Registrar cada hash en la **Bitácora ERC-3643**. Evitar las acciones extraordinarias sobre saldos que se quieran conservar.

## Privacidad y alcance

El registro compartido guarda wallets, referencias internas y un país propuesto; consulta estado on-chain. No identifica al titular ni guarda documentos KYC/KYB. Los datos personales y archivos de identidad requieren custodia y acceso separados antes de un uso real. El expediente educativo de 14 campos es declarativo: completar 14/14 no significa aprobación legal. La política y una posible custodia de identidades fuera del stack operativo están en `docs/erc3643-participants-and-knowledge.md`.
