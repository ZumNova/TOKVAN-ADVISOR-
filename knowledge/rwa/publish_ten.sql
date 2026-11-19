-- Publicar las diez respuestas RWA revisadas por TOKVANT.
-- No modifica otras respuestas educativas.
update public.public_educational_answers
set status = 'published',
    reviewed_at = coalesce(reviewed_at, now()),
    updated_at = now()
where source_reference in (
 'TOKVANT-RWA-01','TOKVANT-RWA-02','TOKVANT-RWA-03','TOKVANT-RWA-04','TOKVANT-RWA-05',
 'TOKVANT-RWA-06','TOKVANT-RWA-07','TOKVANT-RWA-08','TOKVANT-RWA-09','TOKVANT-RWA-10'
)
  and status in ('draft','published');

select source_reference,status,question
from public.public_educational_answers
where source_reference in (
 'TOKVANT-RWA-01','TOKVANT-RWA-02','TOKVANT-RWA-03','TOKVANT-RWA-04','TOKVANT-RWA-05',
 'TOKVANT-RWA-06','TOKVANT-RWA-07','TOKVANT-RWA-08','TOKVANT-RWA-09','TOKVANT-RWA-10'
)
order by source_reference;
