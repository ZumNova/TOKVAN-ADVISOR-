# Gobernanza compartida de expedientes

La migración `supabase/migrations/20261113_governance.sql` agrega bitácoras privadas y append-only de dictámenes, pagos y autorizaciones. Todas las operaciones pasan por `/api/governance`: se verifica una firma reciente de la wallet del equipo y, para cuentas distintas de la 047, una autorización firmada por la 047. Supabase no concede lectura directa a clientes ni wallets del equipo.

Los dictámenes de Técnico (047), Compliance (FB24) y Directorio (1E8D) se verifican contra la versión canónica del expediente recibido. La decisión más reciente de cada rol determina el estado actual; el historial anterior permanece. Una corrección o rechazo invalida la condición de tres aprobaciones.

La 047 puede asignar el rol `accounting` a una wallet para registrar pagos. Contaduría debe verificar el cobro fuera de la dapp, cargar un comprobante privado PDF o imagen, indicar importe, moneda y referencia, y firmar un recibo vinculado al hash del archivo y al expediente. El sistema comprueba el hash del archivo antes de registrar el recibo como verificado. Esto es un registro manual de TOKVANT, no una conciliación bancaria ni un cobro automático.

Con tres dictámenes aprobados para la versión actual y al menos un pago verificado, la 047 puede firmar la autorización de preparación. La firma incorpora los IDs de los tres dictámenes y del pago. Una decisión posterior que sustituya alguno de los dictámenes vuelve no vigente esa autorización.

La autorización todavía **no** ejecuta el factory ni habilita automáticamente un botón de despliegue. Las aprobaciones on-chain de cada factory siguen separadas. Antes de conectar el último paso hay que fijar la wallet administradora de cada token, la receptora de la emisión inicial y comprobar la red y, en ERC-3643, la identidad de la receptora. El control posterior del token de la empresa debe quedar en la wallet empresarial configurada, sin otorgarle por ello administración global de TOKVANT.
