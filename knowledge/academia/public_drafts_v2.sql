-- Segundo lote de Blockchain Disruptivo V1 para TOKVANT AI.
-- Solo agrega borradores para revisión editorial; no publica respuestas.
with entries(question,short_answer,more_answer,keywords,category,source_reference) as (
 values
 ('¿Qué es una blockchain?',
  'Es un registro compartido donde las operaciones se agrupan en bloques enlazados y pueden verificarse según las reglas de la red.',
  'Puede ayudar a revisar cuándo se registró una operación. Que algo figure en la cadena no demuestra por sí solo que el dato original sea verdadero: también hay que verificar quién lo aportó y cómo.',
  array['blockchain','cadena de bloques','registro','bloques'], 'Fundamentos', 'BD-V1 FAQ-0001'),
 ('¿Quién incorpora una transacción a la blockchain?',
  'La red procesa las transacciones según su protocolo. Un participante propone un bloque y otros verifican que cumpla las reglas.',
  'El mecanismo concreto depende de la red. En TOKVANT, la wallet firma una operación; después la red la incluye y confirma. Firmar no equivale todavía a tener una transacción confirmada.',
  array['transacción','confirmación','bloque','validadores','red'], 'Fundamentos', 'BD-V1 FAQ-0002'),
 ('¿Para qué sirve un oráculo?',
  'Un oráculo aporta a un contrato inteligente datos que se originan fuera de la blockchain.',
  'Por ejemplo, podría informar un dato meteorológico para un proyecto agrícola. Antes de usarlo hay que definir la fuente, la frecuencia de actualización y qué hacer si el dato falta o es erróneo.',
  array['oráculo','oracle','datos externos','clima','precio'], 'Fundamentos', 'BD-V1 FAQ-0006'),
 ('¿Quiénes intervienen en un proyecto con activos reales?',
  'Intervienen quienes aportan el activo, definen los derechos, revisan el proyecto, operan el token y reciben sus unidades.',
  'En TOKVANT, el cliente describe el activo y sus derechos; el equipo técnico revisa la configuración; compliance revisa la documentación; el directorio autoriza; y la empresa administra el token emitido. También puede haber custodios, verificadores y titulares. Una misma entidad puede cumplir varios papeles, pero cada responsabilidad debe quedar clara.',
  array['RWA','emisor','originador','custodia','administrador','activo real'], 'Formulario', 'BD-V1 FAQ-0010'),
 ('¿Cómo se da a conocer un token para que pueda venderse?',
  'Definí a quién sirve, qué recibe su titular y cómo vas a comunicar la propuesta a ese público.',
  'Un token puede estar creado y tener un precio, pero necesita una propuesta comprensible, canales de comunicación y posibles compradores. Prepará una estrategia comercial: público, mensaje, canales y atención de consultas. La difusión y las ventas deben respetar las condiciones de oferta que correspondan al proyecto. Una campaña tampoco garantiza compradores ni liquidez.',
  array['precio','liquidez','venta','compradores','mercado','marketing','publicidad','campaña','estrategia comercial'], 'Primeros pasos', 'BD-V1 FAQ-0018'),
 ('¿Cuándo puede servir blockchain en una empresa?',
  'Puede servir cuando varias partes necesitan verificar un historial común, automatizar reglas o seguir unidades digitales entre ellas.',
  'Ejemplo ficticio: una empresa registra lotes de cacao y sus movimientos; otra consulta qué lote recibió. Antes de elegir blockchain, describí quién aporta cada dato, cómo se comprueba, qué debe quedar privado y quién corrige errores. TOKVANT puede comparar esa necesidad con otras formas de llevar el registro y definir si un token aporta una función concreta.',
  array['empresa','uso de blockchain','trazabilidad','historial','proceso'], 'Primeros pasos', 'BD-V1 FAQ-0021'),
 ('¿Qué debo revisar en un token de membresía o acceso?',
  'Definí qué acceso da, quién lo valida, cuándo vence y si puede transferirse o reutilizarse.',
  'Ejemplo ficticio: una entrada de fútbol es un NFT con imagen coleccionable. En el acceso se verifica la wallet y se marca esa entrada como usada para impedir un segundo ingreso; el NFT puede conservarse como recuerdo. Si se quema al entrar, deja de existir como coleccionable. La validación por QR necesita impedir copias y usos repetidos.',
  array['membresía','club','entrada','fútbol','NFT','acceso','pase','QR','coleccionable'], 'Ejemplos ficticios', 'BD-V1 FAQ-0029'),
 ('¿Puedo pagar con cualquier token que tenga valor?',
  'No necesariamente. Para usarlo como pago, alguien debe aceptar ese token y definir las condiciones.',
  'Un token que da acceso a un servicio puede ser útil para su titular, pero otro comercio no está obligado a recibirlo. Verificá quién lo acepta, para qué y bajo qué reglas.',
  array['pago','valor','aceptación','comercio','token'], 'Primeros pasos', 'BD-V1 FAQ-0031')
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
