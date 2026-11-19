-- Revisión del segundo lote ya cargado en Supabase.
-- Publica solo FAQ-0001, aprobada por el responsable de TOKVANT.
-- FAQ-0002 y FAQ-0006 siguen en draft. Las demás revisiones siguen en draft.
with revisions(source_reference,question,short_answer,more_answer,keywords) as (
 values
 ('BD-V1 FAQ-0010','¿Quiénes intervienen en un proyecto con activos reales?',
  'Intervienen quienes aportan el activo, definen los derechos, revisan el proyecto, operan el token y reciben sus unidades.',
  'En TOKVANT, el cliente describe el activo y sus derechos; el equipo técnico revisa la configuración; compliance revisa la documentación; el directorio autoriza; y la empresa administra el token emitido. También puede haber custodios, verificadores y titulares. Una misma entidad puede cumplir varios papeles, pero cada responsabilidad debe quedar clara.',
  array['RWA','emisor','originador','custodia','administrador','activo real']),
 ('BD-V1 FAQ-0018','¿Cómo se da a conocer un token para que pueda venderse?',
  'Definí a quién sirve, qué recibe su titular y cómo vas a comunicar la propuesta a ese público.',
  'Un token puede estar creado y tener un precio, pero necesita una propuesta comprensible, canales de comunicación y posibles compradores. Prepará una estrategia comercial: público, mensaje, canales y atención de consultas. La difusión y las ventas deben respetar las condiciones de oferta que correspondan al proyecto. Una campaña tampoco garantiza compradores ni liquidez.',
  array['precio','liquidez','venta','compradores','mercado','marketing','publicidad','campaña','estrategia comercial']),
 ('BD-V1 FAQ-0021','¿Cuándo puede servir blockchain en una empresa?',
  'Puede servir cuando varias partes necesitan verificar un historial común, automatizar reglas o seguir unidades digitales entre ellas.',
  'Ejemplo ficticio: una empresa registra lotes de cacao y sus movimientos; otra consulta qué lote recibió. Antes de elegir blockchain, describí quién aporta cada dato, cómo se comprueba, qué debe quedar privado y quién corrige errores. TOKVANT puede comparar esa necesidad con otras formas de llevar el registro y definir si un token aporta una función concreta.',
  array['empresa','uso de blockchain','trazabilidad','historial','proceso']),
 ('BD-V1 FAQ-0029','¿Qué debo revisar en un token de membresía o acceso?',
  'Definí qué acceso da, quién lo valida, cuándo vence y si puede transferirse o reutilizarse.',
  'Ejemplo ficticio: una entrada de fútbol es un NFT con imagen coleccionable. En el acceso se verifica la wallet y se marca esa entrada como usada para impedir un segundo ingreso; el NFT puede conservarse como recuerdo. Si se quema al entrar, deja de existir como coleccionable. La validación por QR necesita impedir copias y usos repetidos.',
  array['membresía','club','entrada','fútbol','NFT','acceso','pase','QR','coleccionable'])
)
update public.public_educational_answers answer
set question = revisions.question,
    short_answer = revisions.short_answer,
    more_answer = revisions.more_answer,
    keywords = revisions.keywords,
    updated_at = now()
from revisions
where answer.source_reference = revisions.source_reference
  and answer.status = 'draft';

update public.public_educational_answers
set status = 'published', reviewed_at = now(), updated_at = now()
where source_reference = 'BD-V1 FAQ-0001' and status = 'draft';

select source_reference,status,question
from public.public_educational_answers
where source_reference in (
 'BD-V1 FAQ-0001','BD-V1 FAQ-0002','BD-V1 FAQ-0006',
 'BD-V1 FAQ-0010','BD-V1 FAQ-0018','BD-V1 FAQ-0021','BD-V1 FAQ-0029'
)
order by source_reference;
