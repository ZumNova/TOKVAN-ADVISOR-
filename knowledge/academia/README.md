# Lote educativo de Blockchain Disruptivo · V1

`public_drafts.sql` adapta diez preguntas del archivo recibido el 18/11/2026 y agrega tres preguntas de diagnóstico con ejemplos ficticios. Todas ingresan a `public.public_educational_answers` como `draft`. Ejecutar el archivo en el SQL Editor del proyecto Supabase de TOKVANT después de la migración `20261118_public_educational_answers.sql`.

La fuente original marca las FAQ seleccionadas como **revisión editorial pendiente**. Este lote no las publica. Antes de cambiar el estado a `published`, revisar exactitud, claridad, permiso de uso del material, ausencia de datos identificables y pertinencia para clientes. Los ID originales quedan en `source_reference`, que la API no devuelve al navegador. Los enlaces a bibliotecas personales de ChatGPT no se incorporan.

`public_drafts_v2.sql` agrega ocho preguntas distintas de la misma base V1, enfocadas en dudas durante el diagnóstico y la solicitud TOKVANT. También se insertan únicamente como `draft` y puede ejecutarse nuevamente sin duplicar sus referencias. Revisar cada respuesta antes de publicarla; no cargar automáticamente el manual completo.

Quedan excluidas las FAQ de validación especializada y las marcadas «No publicar». También quedan fuera las afirmaciones sobre productos o servicios de terceros cuya versión actual no se verificó. El bot solo usa las filas publicadas; mientras tanto conserva sus respuestas incorporadas.
