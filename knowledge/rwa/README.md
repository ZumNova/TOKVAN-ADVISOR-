# Preguntas empresariales sobre RWA

`public_drafts.sql` prepara diez respuestas para TOKVANT AI. Todas ingresan como `draft`; el bot público solo consulta `published`. El archivo puede ejecutarse varias veces sin duplicar referencias.

Fuentes primarias que orientan la selección; las preguntas y los ejemplos ficticios son una adaptación editorial a TOKVANT:

- [BIS, *The tokenisation continuum*](https://www.bis.org/publications/bulletin-72-tokenisation-continuum): derechos, reglas y gobierno del token.
- [IOSCO, *Tokenization of Financial Assets*](https://www.iosco.org/library/pubdocs/pdf/IOSCOPD809.pdf): vínculo con el activo, custodia y ciclo de vida.
- [BIS/FSB, *Financial stability implications of tokenisation*](https://www.bis.org/fsi/fsisummaries/exsum_23905.htm): liquidez, respaldo, terceros y riesgos operativos.
- [Banco Mundial, *Infrastructure Tokenization*](https://documents.worldbank.org/en/publication/documents-reports/documentdetail/099200503082329768): evaluación de beneficios y riesgos.

Antes de publicar, revisar especialmente las respuestas sobre derechos, pagos y circulación con los responsables técnico y de cumplimiento. No clasifican jurídicamente ningún proyecto ni sustituyen la revisión por país.

Todas las respuestas amplias conducen al mismo paso: resumir la idea y las preguntas en la solicitud y adjuntar allí los respaldos disponibles. El chat público no recibe documentos ni datos privados. Si las diez filas ya se cargaron antes de esta mejora, ejecutar `guide_to_submission.sql`; solo actualiza sus borradores y evita repetir el texto.

Una vez revisados los diez borradores en Supabase, ejecutar `publish_ten.sql` para ponerlos a disposición del bot público. El resultado debe mostrar diez filas con estado `published`.

## Ideas del corredor productivo

`parana_six_drafts.sql` agrega seis preguntas basadas en las tarjetas públicas: mercadería almacenada, insumos, facturas, flota, infraestructura y proyecto compartido. Cada respuesta invita a preparar un resumen y adjuntarlo a la solicitud TOKVANT. Son ejemplos ficticios inspirados en el análisis del corredor del Paraná; no prometen financiación ni eligen un estándar por adelantado.

Revisar las seis filas en Supabase y luego ejecutar `parana_six_publish.sql`. El bot consulta solo respuestas `published`; no necesita un nuevo despliegue para leerlas. No cargar nombres, documentos ni datos de empresas reales en esta tabla pública.
