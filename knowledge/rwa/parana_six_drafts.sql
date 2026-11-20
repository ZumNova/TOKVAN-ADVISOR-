-- Seis preguntas inspiradas en las tarjetas del corredor productivo.
-- Se cargan como borradores para revisión editorial antes de publicarlas.
with entries(question,short_answer,more_answer,keywords,category,source_reference) as (
 values
 ('Tengo mercadería almacenada y quiero financiar la próxima campaña. ¿Por dónde empiezo?',
  'Prepará un resumen de una página: producto, cantidad, lugar de guarda, respaldo del stock, monto buscado y uso de los fondos. Adjuntalo a tu solicitud TOKVANT para pedir asesoría.',
  'Indicá quién es dueño de la mercadería, quién la custodia y cómo se verifican las existencias. Si tenés certificados o contratos, adjuntalos en la solicitud; no pegues datos de la empresa en este chat. El equipo evaluará si el caso admite una estructura viable y qué documentación falta. El stock por sí solo no garantiza financiación.',
  array['pyme','mercadería almacenada','stock','acopio','granos','cosecha','campaña','financiar','financiamiento'],'Ideas productivas','TOKVANT-PARANA-01'),
 ('Nuestra cooperativa tiene insumos productivos. ¿Podemos usarlos para buscar financiamiento?',
  'Podés presentar la idea para evaluación. Armá un documento con los insumos, cantidades, ubicación, titularidad, custodia y destino de los fondos; adjuntalo en tu solicitud TOKVANT.',
  'Sumá cómo se controla el inventario y qué comprobantes tenés. Si las existencias cambian, explicá cómo se registrarían esos cambios. El equipo revisará el derecho que se podría representar y la estructura adecuada; no elijas un estándar solo por el tipo de producto.',
  array['cooperativa','insumos','inventario','existencias','productivos','financiamiento','custodia'],'Ideas productivas','TOKVANT-PARANA-02'),
 ('Mi pyme tiene facturas por cobrar y necesita adelantar fondos. ¿Qué preparo?',
  'Prepará una hoja con el tipo de crédito, importes aproximados, vencimientos, quién debe pagar y para qué necesitás los fondos. Adjuntá los comprobantes en la solicitud TOKVANT y pedí una revisión.',
  'Indicá si los derechos de cobro pueden cederse y quién los administra, según tus documentos. No compartas nombres, facturas ni datos del pagador en el chat educativo; usá los adjuntos privados del expediente. TOKVANT revisará la evidencia y las condiciones antes de proponer una estructura.',
  array['facturas','factoring','cobros','cuentas por cobrar','créditos comerciales','adelantar fondos','proveedora'],'Ideas productivas','TOKVANT-PARANA-03'),
 ('Queremos renovar una flota de camiones. ¿Cómo presentamos el proyecto?',
  'Hacé un resumen de los vehículos, su titularidad, uso actual, ingresos previstos, inversión necesaria y responsables. Adjuntalo a la solicitud TOKVANT para estudiar las opciones.',
  'Podés sumar contratos de flete o alquiler, estado de la flota y costos estimados. Aclarar qué recibiría quien tenga un token es más útil que elegir ERC-721 o ERC-20 desde el principio. El equipo revisará activos, derechos y riesgos antes de recomendar una estructura.',
  array['camiones','flota','transporte','vehículos','flete','maquinaria','renovación'],'Ideas productivas','TOKVANT-PARANA-04'),
 ('Tenemos una obra portuaria o logística. ¿Qué datos sirven para pedir asesoría?',
  'Prepará una ficha breve con la obra, etapa actual, presupuesto estimado, responsables, permisos pendientes y posible fuente de ingresos. Adjuntala a tu solicitud TOKVANT.',
  'Explicá quién ejecutaría la obra, quién usaría la infraestructura y qué derecho se ofrecería a terceros. Si hay estudios o contratos, adjuntalos al expediente. La revisión deberá separar la viabilidad del proyecto, las habilitaciones y el diseño del token.',
  array['puerto','portuaria','logística','infraestructura','obra','terminal','permisos'],'Ideas productivas','TOKVANT-PARANA-05'),
 ('Somos varias pymes y queremos financiar un proyecto compartido. ¿Cómo empezamos?',
  'Redacten una página con el objetivo común, participantes, aportes de cada parte, fondos buscados y forma de tomar decisiones. Adjúntenla en una solicitud TOKVANT para pedir asesoría.',
  'Indiquen quién representaría al grupo, qué activo o derecho respaldaría la propuesta y qué documentos ya existen. Eviten incluir datos personales en el chat. TOKVANT podrá señalar qué puntos deben acordar y revisar antes de diseñar una emisión.',
  array['pymes','empresas','proyecto compartido','consorcio','asociación','aportes','financiamiento productivo'],'Ideas productivas','TOKVANT-PARANA-06')
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
