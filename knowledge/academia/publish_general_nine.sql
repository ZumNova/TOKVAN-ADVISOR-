-- Publicar únicamente las nueve respuestas generales revisadas del lote BD V1.
-- Las FAQ-0013, 0017 y 0027 permanecen en borrador para revisión especializada.
update public.public_educational_answers
set status = 'published', reviewed_at = now(), updated_at = now()
where source_reference in (
 'BD-V1 FAQ-0005', -- smart contract
 'BD-V1 FAQ-0008', -- token de utilidad
 'BD-V1 FAQ-0009', -- RWA
 'BD-V1 FAQ-0019', -- wallet
 'BD-V1 FAQ-0020', -- frase de recuperación
 'BD-V1 FAQ-0026', -- proyecto agropecuario ficticio
 'BD-V1 FAQ-0030', -- on-chain y off-chain
 'BD-V1 FAQ-0031', -- aceptación como pago
 'BD-V1 FAQ-0032'  -- datos fuera de la blockchain
)
and status = 'draft'
returning source_reference, question, status;
