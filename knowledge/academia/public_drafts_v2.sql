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
  'Puede haber una entidad que solicita la emisión, otra que administra el activo y personas que revisan el proyecto y reciben tokens.',
  'En la solicitud TOKVANT, indicá quién responde por el activo, quién emite, quién custodia los documentos y qué derecho recibiría cada titular. La custodia del activo físico y el control de las wallets son tareas distintas.',
  array['RWA','emisor','originador','custodia','administrador','activo real'], 'Formulario', 'BD-V1 FAQ-0010'),
 ('¿Un token con precio siempre se puede vender?',
  'No. Un precio indicado no garantiza que haya alguien dispuesto a comprar el token.',
  'La liquidez depende de compradores, reglas de transferencia, volumen y costos. Si el proyecto promete una salida o recompra, sus condiciones necesitan revisión específica; no se deducen del estándar del token.',
  array['precio','liquidez','venta','compradores','mercado'], 'Primeros pasos', 'BD-V1 FAQ-0018'),
 ('¿Cuándo puede servir blockchain en una empresa?',
  'Puede servir cuando varias partes necesitan compartir y verificar un historial bajo reglas comunes.',
  'Empezá por describir el problema, quién interviene, qué información debe ser privada y cómo se corrigen errores. TOKVANT puede evaluar después si una blockchain aporta algo útil a ese proceso.',
  array['empresa','uso de blockchain','trazabilidad','historial','proceso'], 'Primeros pasos', 'BD-V1 FAQ-0021'),
 ('¿Qué debo revisar en un token de membresía o acceso?',
  'Revisá qué permite hacer, quién presta el servicio, cuándo vence y si el token puede transferirse.',
  'Ejemplo ficticio: un club ofrece tres entradas durante un año. La solicitud debe explicar cómo se verifica cada ingreso, si cada entrada se consume y qué pasa si el servicio se cancela.',
  array['membresía','club','entrada','acceso','pase','QR'], 'Ejemplos ficticios', 'BD-V1 FAQ-0029'),
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
