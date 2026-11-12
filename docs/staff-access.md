# Acceso del equipo TOKVANT (etapa de demo)

La wallet propietaria es `0x521125be95c5679539aB07582F55F0040975A047`. Desde «Acceso equipo TOKVANT», firma un mensaje gratuito para entrar. No depende de la red seleccionada en la wallet. Cada acceso requiere una nueva firma de sesión; se cierra al cambiar cuenta o red.

La propietaria puede emitir autorizaciones firmadas por 30 días para otras wallets. La autorización incluye origen web, wallet, rol y vencimiento. Se guarda en el navegador de la propietaria; debe entregarse el JSON firmado al destinatario, quien lo importa en su propio navegador y firma su sesión. El rol no se concede por escribir una dirección en localStorage: la app verifica la firma de la propietaria y la firma de sesión de la wallet destinataria.

Roles: `administrator` (módulos internos), `factory` (factories y material técnico), `reviewer` y `compliance` (expedientes, aprobaciones, dashboard y material técnico). El cliente conserva el asistente y sus propios borradores locales. El menú público y la pantalla de confirmación ya no abren módulos internos sin acceso.

Esta etapa protege la navegación de la demo, no constituye control de acceso a datos privados en servidor. Los expedientes de la demo siguen en memoria del navegador y los documentos del cliente siguen en su navegador. Antes de recibir documentación compartida hay que agregar identidad de usuarios, validación de roles en la API, almacenamiento privado y revocación centralizada. Las autorizaciones firmadas de esta demo vencen a los 30 días; no hay revocación remota anticipada.
