-- Ejecutar solo después de revisar las seis respuestas en Supabase.
update public.public_educational_answers
set status = 'published',
    reviewed_at = coalesce(reviewed_at, now()),
    updated_at = now()
where source_reference in (
 'TOKVANT-PARANA-01','TOKVANT-PARANA-02','TOKVANT-PARANA-03',
 'TOKVANT-PARANA-04','TOKVANT-PARANA-05','TOKVANT-PARANA-06'
)
  and status in ('draft','published');

select source_reference,status,question
from public.public_educational_answers
where source_reference in (
 'TOKVANT-PARANA-01','TOKVANT-PARANA-02','TOKVANT-PARANA-03',
 'TOKVANT-PARANA-04','TOKVANT-PARANA-05','TOKVANT-PARANA-06'
)
order by source_reference;
