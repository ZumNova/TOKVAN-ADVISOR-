# Recepción compartida TOKVANT

El cliente prepara la solicitud en su navegador y, al finalizar, la app intenta enviarla a Supabase. Los archivos se suben directamente al bucket privado `tokvant-expedientes` con tokens temporales emitidos por la API. La API registra la solicitud como `received` únicamente cuando todos los objetos previstos existen y tienen el tamaño declarado. El recibo muestra el identificador del expediente, un ID de recepción y la fecha. Si falla la carga, el expediente permanece `prepared` y puede reintentarse desde el mismo navegador.

El JSON del expediente incluye los datos de contacto y metadatos de documentos. Las firmas de aprobación y puntuaciones aportadas desde el navegador se descartan al recibirlo. Los hashes SHA-256 se calculan en el navegador; al descargar un adjunto, la app administrativa vuelve a comparar su contenido con el hash declarado. Esa comprobación de integridad no sustituye la revisión pericial ni antivirus.

La bandeja «Expedientes de emisión» tiene el botón «Cargar expedientes recibidos». La API exige un mensaje firmado por una wallet del equipo y, salvo para la 047, una autorización vigente firmada por la 047. El servidor verifica rol, vencimiento y dirección fija del factory para Técnico, Compliance, Directorio y Operador. Solo entonces devuelve los expedientes o un enlace de descarga privado válido por 60 segundos. Los clientes no reciben acceso directo a la tabla ni al bucket.

## Configuración

1. Crear o conectar un proyecto Supabase a Vercel y elegir un plan/región apropiados para la documentación que se guardará. No usar Pinata pública para documentos legales.
2. Ejecutar [`supabase/migrations/20261112_client_submissions.sql`](../supabase/migrations/20261112_client_submissions.sql) en el SQL Editor del proyecto Supabase.
3. Configurar en Vercel Production `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`. La clave secret es solo del servidor y debe guardarse como Secret. La integración Marketplace puede generar nombres diferentes; mapearlos a estos tres nombres o usar los alias admitidos `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
4. Redeployar, completar un expediente real de prueba desde un navegador cliente y confirmar que la 047 lo ve desde otro navegador en «Cargar expedientes recibidos».

La tabla tiene RLS activa y no concede permisos a `anon` o `authenticated`; el bucket es privado. El servidor usa la clave secret después de validar permisos. Todavía faltan límites de tasa, gestión de expedientes abandonados, revisión antivirus, borrado/retención y persistencia compartida de los dictámenes. La recepción compartida queda disponible tras la configuración del servicio; las firmas de dictamen siguen siendo demo local y las aprobaciones on-chain siguen en los paneles de factory.
