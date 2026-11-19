-- Diez respuestas empresariales RWA para TOKVANT AI. Solo borradores.
with entries(question,short_answer,more_answer,keywords,category,source_reference) as (
 values
 ('¿Qué recibe quien compra un token ligado a un activo real?',
  'Depende del proyecto: acceso, un derecho de cobro u otro derecho definido en documentos.',
  'Antes de elegir un estándar, completá: «Cada token da derecho a…». Indicá quién debe cumplirlo, cuándo nace y termina, y qué pasa si el activo cambia. Tener un token no convierte automáticamente a su titular en dueño del activo.',
  array['RWA','derechos','titular','activo real','propiedad','acceso','cobro'],'Derechos','TOKVANT-RWA-01'),
 ('¿Qué debo demostrar sobre el activo antes de tokenizarlo?',
  'Qué activo existe, quién puede disponer de él y qué documentos respaldan el derecho ofrecido.',
  'En el expediente describí ubicación, titularidad o control, valuación y evidencias vigentes. Para inventario físico, definí quién verifica cantidades y responde por diferencias. Una imagen o un hash no prueban por sí solos existencia ni titularidad.',
  array['RWA','respaldo','activo','documentos','titularidad','inventario','evidencia'],'Activo y evidencia','TOKVANT-RWA-02'),
 ('¿Cómo se conecta el token con el activo fuera de blockchain?',
  'Mediante documentos, responsables y un proceso verificable que relaciona cada token con el activo o derecho.',
  'Definí una referencia estable, quién actualiza los datos y qué evidencia respalda cada cambio. Si un lote se entrega, pierde o reemplaza, explicá cómo cambia el registro y el derecho del titular. La blockchain no observa sola el mundo físico.',
  array['RWA','vínculo','trazabilidad','lote','activo físico','off-chain'],'Activo y evidencia','TOKVANT-RWA-03'),
 ('¿Quién custodia el activo y quién controla las wallets?',
  'Son tareas distintas: una cuida el activo; otra controla las claves para operar tokens.',
  'Identificá al custodio del activo o documentos, al administrador del token y a quienes pueden firmar. Explicá cómo se controla el inventario y qué se hace ante pérdida de claves, disputa o cambio de operador.',
  array['RWA','custodia','wallet','claves','activo','administrador','MPC'],'Gobierno y custodia','TOKVANT-RWA-04'),
 ('¿Cómo decido cuántos tokens emitir y qué representa cada uno?',
  'Definí primero la unidad económica; después, cantidad, supply máximo y reglas de nuevas emisiones.',
  'Ejemplo ficticio: 1.000 bolsas podrían representarse como 1.000 unidades de un tipo de token. Un derecho sobre ingresos necesita otra definición. Documentá la relación entre unidades y activo, cómo se verifican cambios y quién los autoriza.',
  array['RWA','cantidad','supply','emisión','unidad','bolsas','lote'],'Diseño del token','TOKVANT-RWA-05'),
 ('¿Valuar un activo en un millón significa que puedo vender un millón en tokens?',
  'No. Valuación, monto de emisión, precio propuesto y ventas son decisiones diferentes.',
  'Indicá quién valuó el activo, cuándo y con qué supuestos. Luego definí qué derecho representa cada token. El interés de compradores, las condiciones de oferta y la liquidez se evalúan aparte. TOKVANT pide una valuación objetivo para iniciar esa revisión.',
  array['RWA','valuación','precio','emisión','venta','liquidez'],'Valor y comercialización','TOKVANT-RWA-06'),
 ('¿Qué pasa si el activo se vende, se pierde o deja de producir?',
  'El proyecto necesita reglas previas y un responsable para actuar ante esos eventos.',
  'Definí qué recibe el titular, quién informa el hecho, qué evidencia exige y si corresponde suspender operaciones. Una pérdida de cosecha no desaparece porque el token siga en la wallet. El contrato y los documentos deben contemplar el mismo procedimiento.',
  array['RWA','pérdida','venta del activo','incidente','cosecha','contingencia'],'Riesgos','TOKVANT-RWA-07'),
 ('¿Puede transferirse un RWA tokenizado a cualquier wallet?',
  'Depende de los derechos y reglas del proyecto; algunas emisiones necesitan destinatarios habilitados.',
  'Definí quién puede recibir y transferir, en qué países se prevé la oferta y cómo se verifica la elegibilidad. En la prueba ERC-3643 de TOKVANT, identidades ficticias y reglas del contrato restringen transferencias. Registrar una wallet propuesta no equivale a acreditarla.',
  array['RWA','transferencia','wallet','elegibilidad','ERC-3643','receptor'],'Circulación','TOKVANT-RWA-08'),
 ('¿Cómo recibe el titular pagos o beneficios del activo?',
  'Definí quién paga, cuándo, en qué moneda y cómo se calcula lo que corresponde a cada titular.',
  'Un token puede representar un derecho de cobro sin ejecutar automáticamente el pago. Explicá la fuente del dinero, registro de titulares, fechas, deducciones y atrasos. Si se promete rescate o recompra, describí condiciones y responsable.',
  array['RWA','pagos','beneficios','cobro','dividendos','rescate','recompra'],'Pagos y salida','TOKVANT-RWA-09'),
 ('¿Qué debe revisar una empresa antes de lanzar un proyecto RWA?',
  'Revisá el activo, el derecho del titular, responsables, documentos, circulación y plan para incidentes.',
  'En TOKVANT empezá por describir qué querés representar y para quién. Reuní evidencia, valuación, países, custodia, reglas de emisión y transferencia, y una estrategia comercial realista. El equipo revisará lo declarado; completar el formulario no equivale a aprobación.',
  array['RWA','empezar','lanzar','empresa','solicitud','revisión','expediente'],'Primeros pasos','TOKVANT-RWA-10')
)
insert into public.public_educational_answers
 (question,short_answer,more_answer,keywords,category,source_reference,status)
select question,short_answer,more_answer,keywords,category,source_reference,'draft'
from entries e
where not exists (
 select 1 from public.public_educational_answers existing
 where existing.source_reference=e.source_reference
)
returning source_reference,status,question;
