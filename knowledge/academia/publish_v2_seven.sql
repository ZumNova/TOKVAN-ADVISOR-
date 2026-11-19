-- Publicar las siete respuestas V2 revisadas y aprobadas por TOKVANT.
-- No publica FAQ-0031 (aceptación de tokens como pago), aún sin revisión.
update public.public_educational_answers
set status = 'published',
    reviewed_at = coalesce(reviewed_at, now()),
    updated_at = now()
where source_reference in (
 'BD-V1 FAQ-0001',
 'BD-V1 FAQ-0002',
 'BD-V1 FAQ-0006',
 'BD-V1 FAQ-0010',
 'BD-V1 FAQ-0018',
 'BD-V1 FAQ-0021',
 'BD-V1 FAQ-0029'
)
  and status in ('draft', 'published');

select source_reference,status,question
from public.public_educational_answers
where source_reference like 'BD-V1 FAQ-%'
  and source_reference in (
   'BD-V1 FAQ-0001',
   'BD-V1 FAQ-0002',
   'BD-V1 FAQ-0006',
   'BD-V1 FAQ-0010',
   'BD-V1 FAQ-0018',
   'BD-V1 FAQ-0021',
   'BD-V1 FAQ-0029'
  )
order by source_reference;
