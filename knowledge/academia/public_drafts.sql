-- Blockchain Disruptivo V1 → TOKVANT AI. Revisión editorial pendiente.
-- Este archivo solo agrega borradores. No publica respuestas.
with entries(question,short_answer,more_answer,keywords,category,source_reference) as (
 values
 ('¿Qué es un smart contract?',
  'Es un programa en una blockchain que ejecuta las reglas definidas cuando recibe una operación válida.',
  'Puede registrar movimientos o comprobar condiciones. Los documentos del proyecto explican derechos y obligaciones: conviene revisar que coincidan con lo que hace el programa.',
  array['smart contract','contrato inteligente','programa','reglas'], 'Fundamentos', 'BD-V1 FAQ-0005'),
 ('¿Qué significa tokenizar un activo?',
  'Es crear una representación digital vinculada a un activo o a un derecho. Primero hay que definir qué representa el token.',
  'En un ejemplo ficticio, un token relacionado con un local podría dar acceso a un servicio o representar un derecho de cobro. Tener el token no define por sí solo qué derecho recibe su titular.',
  array['tokenizar','activo','derecho','representación'], 'Primeros pasos', 'BD-V1 FAQ-0007'),
 ('¿Para qué sirve un token de utilidad?',
  'Puede dar acceso a un servicio, beneficio o membresía según las condiciones del proyecto.',
  'Antes de crear uno, describí quién presta el servicio, cuándo se puede usar, si vence y si se puede transferir. Si se prometen rendimientos u otros derechos económicos, el caso necesita revisión específica.',
  array['utility','utilidad','beneficio','membresía','acceso'], 'Tipos de token', 'BD-V1 FAQ-0008'),
 ('¿Qué significa RWA?',
  'RWA se usa para proyectos vinculados con activos o derechos que existen fuera de la blockchain.',
  'Podrían involucrar inmuebles, mercadería o derechos de cobro. Para entender el caso, identificá el activo, qué derecho obtiene el titular y qué evidencia conecta ese derecho con el token.',
  array['RWA','activo real','inmueble','mercadería','derecho de cobro'], 'Primeros pasos', 'BD-V1 FAQ-0009'),
 ('¿Qué guarda una wallet?',
  'Una wallet permite gestionar credenciales para firmar operaciones y consultar activos asociados a una cuenta.',
  'Los tokens se registran según las reglas de la red. Para saber quién puede moverlos, verificá quién controla las claves o el servicio de custodia y cómo se recupera el acceso.',
  array['wallet','billetera','clave','firma','custodia'], 'Wallet y seguridad', 'BD-V1 FAQ-0019'),
 ('¿Para qué sirve la frase de recuperación?',
  'En wallets que la utilizan, la frase permite restaurar el acceso. Nunca la compartas ni la ingreses en un enlace recibido por mensaje.',
  'Quien obtiene esa frase puede llegar a controlar los activos. Si tu wallet usa otro sistema de recuperación, seguí sus instrucciones oficiales. TOKVANT nunca necesita tu frase para revisar una solicitud.',
  array['frase semilla','frase de recuperación','respaldo','wallet','seguridad'], 'Wallet y seguridad', 'BD-V1 FAQ-0020'),
 ('¿Qué datos preparo para una primera consulta de tokenización?',
  'Describí qué querés representar, quién usaría el token y qué recibiría su titular.',
  'Sumá quién administra el activo o presta el servicio y qué documentos respaldan el proyecto. Si intervienen varios países, indicá dónde está el activo, dónde está la entidad emisora y dónde se ofrecería el token.',
  array['primera consulta','diagnóstico','proyecto','solicitud','documentos'], 'Formulario', 'BD-V1 FAQ-0025'),
 ('¿Cómo se podría usar un token en un proyecto agropecuario?',
  'Un proyecto agropecuario puede explorar distintos derechos; primero hay que precisar qué recibiría el titular del token.',
  'Ejemplo ficticio: un derecho de cobro ligado a una operación agrícola. Habría que identificar quién debe pagar, qué documento respalda el cobro y quién administra la operación. El caso necesita revisión según sus países y forma de oferta.',
  array['agro','ganado','vacas','cultivo','cosecha','derecho de cobro'], 'Ejemplos ficticios', 'BD-V1 FAQ-0026'),
 ('¿Qué significa on-chain y off-chain?',
  'On-chain es lo registrado en la blockchain. Off-chain es lo que se guarda o sucede fuera de ella.',
  'Ejemplo: la red guarda la huella de un documento y el archivo queda en un repositorio privado. La huella ayuda a comprobar una versión, pero no demuestra por sí sola que su contenido sea verdadero.',
  array['on-chain','off-chain','cadena','documento','huella'], 'Fundamentos', 'BD-V1 FAQ-0030'),
 ('¿Qué datos conviene guardar fuera de la blockchain?',
  'Los datos que necesitan acceso restringido, corrección o eliminación suelen requerir almacenamiento privado fuera de la cadena.',
  'Por ejemplo, anexos de un expediente pueden quedar en un repositorio con permisos. Antes de registrar una referencia o huella en blockchain, revisá si permitiría inferir información privada.',
  array['privacidad','datos personales','documentos','expediente','off-chain'], 'Privacidad', 'BD-V1 FAQ-0032'),
 ('Tengo vacas: ¿qué necesito definir antes de tokenizarlas?',
  'Elegí el sector agropecuario y explicá qué representaría cada token: un animal, un lote, un servicio o un derecho de cobro.',
  'Es un ejemplo ficticio. También indicá quién controla los animales, qué documentos respaldan el proyecto y cómo se verificarían los cambios. La elección del sector no decide el estándar ni los derechos.',
  array['vacas','ganado','campo','agropecuario','animales'], 'Ejemplos ficticios', 'TOKVANT ejemplo + BD-V1 FAQ-0007/0026'),
 ('Tengo camiones: ¿qué necesito definir antes de tokenizarlos?',
  'Elegí infraestructura y logística. Después explicá si querés representar cada camión, un servicio o un derecho económico.',
  'Es un ejemplo ficticio. Describí quién administra la flota, qué documentos respaldan los activos y qué recibiría quien tenga el token. El sector no determina por sí solo el estándar.',
  array['camiones','flota','transporte','logística','vehículos'], 'Ejemplos ficticios', 'TOKVANT ejemplo + BD-V1 FAQ-0007/0009'),
 ('Tengo un inmueble: ¿qué necesito definir antes de tokenizarlo?',
  'Elegí el sector inmobiliario y describí qué derecho o servicio recibiría quien tenga el token.',
  'Es un ejemplo ficticio. Indicá dónde está el inmueble, quién lo administra y qué documentos respaldan el proyecto. Un token no convierte automáticamente a su titular en propietario del inmueble; ese alcance requiere revisión especializada.',
  array['inmueble','terreno','edificio','departamento','propiedad'], 'Ejemplos ficticios', 'TOKVANT ejemplo + BD-V1 FAQ-0007/0009')
)
insert into public.public_educational_answers
 (question,short_answer,more_answer,keywords,category,source_reference,status)
select question,short_answer,more_answer,keywords,category,source_reference,'draft'
from entries e
where not exists (
 select 1 from public.public_educational_answers existing
 where existing.source_reference=e.source_reference
)
returning source_reference,status;
