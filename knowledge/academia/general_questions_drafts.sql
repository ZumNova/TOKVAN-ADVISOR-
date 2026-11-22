-- Preguntas generales adicionales de Blockchain Disruptivo V1 para TOKVANT AI.
-- El material de origen indica validación especializada pendiente. Este lote
-- solo crea borradores; no se publica hasta que el equipo revise cada respuesta.
with entries(question,short_answer,more_answer,keywords,category,source_reference) as (
 values
 ('¿Para qué sirve una estructura jurídica en un proyecto tokenizado?',
  'Ayuda a definir quién administra el activo, qué obligaciones asume cada parte y dónde se documentan los derechos del titular.',
  'En la solicitud TOKVANT, describí quién es titular del activo, quién lo administra, qué recibe quien tenga el token y qué documentos respaldan esas funciones. La estructura concreta depende del proyecto y debe revisarla el equipo profesional.',
  array['estructura jurídica','vehículo jurídico','sociedad','fideicomiso','administración','derechos'], 'Estructura del proyecto', 'BD-V1 FAQ-0013'),
 ('¿Qué documentos ayudan a explicar los pagos previstos en un proyecto RWA?',
  'Prepará una descripción de dónde saldrían los cobros, qué gastos habría y qué documento definiría el derecho a recibir pagos.',
  'Podés adjuntar al expediente un modelo financiero, los contratos que describen los pagos y antecedentes disponibles. Indicá qué cifras son estimaciones y qué datos tienen respaldo. TOKVANT podrá revisar las diferencias y las preguntas pendientes; el bot no calcula ni promete rendimientos.',
  array['pagos','cobros','flujo','modelo financiero','contratos','RWA','ingresos'], 'Documentación del proyecto', 'BD-V1 FAQ-0017'),
 ('¿Qué preguntas conviene hacer antes de presentar un proyecto RWA?',
  'Empezá por cuatro datos: qué representa el token, qué recibe su titular, quién responde por ese derecho y qué documento lo respalda.',
  'Después describí cómo se administra el activo, de dónde saldrían los pagos si los hubiera, qué restricciones existirían y qué información falta comprobar. Podés reunir esas respuestas en un documento breve y adjuntarlo a la solicitud TOKVANT para que el equipo lo revise.',
  array['RWA','preguntas','derechos','documentos','riesgos','solicitud','proyecto'], 'Primeros pasos', 'BD-V1 FAQ-0027')
)
insert into public.public_educational_answers
 (question,short_answer,more_answer,keywords,category,source_reference,status)
select question,short_answer,more_answer,keywords,category,source_reference,'draft'
from entries e
where not exists (
 select 1 from public.public_educational_answers existing
 where existing.source_reference=e.source_reference
)
returning source_reference,question,status;
