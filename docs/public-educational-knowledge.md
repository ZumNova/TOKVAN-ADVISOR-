# Biblioteca pública de TOKVANT AI

La ayuda para clientes consulta únicamente `public.public_educational_answers` con `status = 'published'`. La tabla está separada de expedientes, contactos, notas internas e identidades. La API devuelve una sola respuesta breve con detalle opcional; no entrega la tabla completa ni las fuentes al navegador.

Para activarla en el proyecto Supabase, ejecutar `supabase/migrations/20261118_public_educational_answers.sql` en SQL Editor. La migración solo crea tabla, índice, RLS y permisos; no borra datos. Sin la tabla, el asistente conserva sus respuestas incorporadas.

Incorporar el material de la academia como preguntas y fragmentos independientes. Cada fila debe contener `question`, `short_answer`, `more_answer`, `keywords`, `category` y `source_reference`. Cargar primero como `draft`. Revisar que no incluya nombres de personas o empresas, contactos, wallets, expedientes ni casos reales identificables. Publicar solo tras esa revisión, asignando `status = 'published'` y `reviewed_at = now()` desde una cuenta administrativa de Supabase. La fuente queda para auditoría interna; el bot no la expone.

La recuperación inicial usa coincidencias de texto sobre preguntas, palabras clave y categoría. No lee archivos TXT completos, no usa embeddings y no genera respuestas nuevas con un modelo. El servidor omite respuestas que detecta con datos identificables evidentes; esa comprobación complementa, pero no sustituye, la revisión humana antes de publicar. El límite inicial es de 200 fragmentos publicados. Para una biblioteca mayor, se deberá añadir búsqueda indexada y evaluación con preguntas reales antes de elegir búsqueda vectorial.
