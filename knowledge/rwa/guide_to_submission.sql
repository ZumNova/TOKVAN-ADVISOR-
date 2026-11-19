-- Para las diez preguntas RWA ya cargadas como borradores.
-- Vincula cada respuesta con la solicitud y sus adjuntos privados.
update public.public_educational_answers
set more_answer = more_answer || ' En la solicitud TOKVANT, escribí un resumen breve de tu idea y tus preguntas; adjuntá los documentos de respaldo que tengas. Si te falta alguno, indicalo para que el equipo lo evalúe.',
    updated_at = now()
where source_reference in (
 'TOKVANT-RWA-01','TOKVANT-RWA-02','TOKVANT-RWA-03','TOKVANT-RWA-04','TOKVANT-RWA-05',
 'TOKVANT-RWA-06','TOKVANT-RWA-07','TOKVANT-RWA-08','TOKVANT-RWA-09','TOKVANT-RWA-10'
)
  and status = 'draft'
  and more_answer not like '%En la solicitud TOKVANT, escribí un resumen breve%'
returning source_reference,status;
