# Panel del cliente: etapa de preparación

El diagnóstico conserva contacto, consentimiento y contexto comercial al abrir el asistente. El asistente guarda un registro por expediente en localStorage (`tokvant:client-project:v1:<id>`), con el paso actual. «Guardar y salir» comprueba el guardado antes de volver al inicio. La página de inicio permite retomar cada borrador desde ese navegador.

Los adjuntos se guardan como blobs en IndexedDB (`tokvant-client-documents`, store `files`), asociados al ID del expediente. Se admiten PDF, DOCX, XLSX, PNG, JPG y WEBP; se comprueban extensión, MIME, cabecera básica, tamaño y SHA-256. Esto no es análisis antivirus ni validación profesional del documento. Límite: 25 MB por archivo, 20 adjuntos y 100 MB por expediente. Durante la preparación permanecen en el navegador. Al enviar, se suben al bucket privado configurado para recepción, nunca a Pinata pública. Al preparar la solicitud se verifica que todos los archivos sigan disponibles y coincidan con su hash.

La completitud mide campos y adjuntos aportados. Los documentos quedan pendientes de revisión y no hay auditoría automática ni anclaje blockchain. Los ejemplos documentales anteriores no se cargan como evidencia real.

«Preparar expediente para TOKVANT» guarda el estado local `prepared` e inicia el envío privado. Solo cuando la API confirma todos los adjuntos pasa a `submitted` y muestra el comprobante de recepción. Si el servicio falla, queda `prepared` y se puede reintentar. El JSON contiene referencias y hashes, no los archivos. El envío de emails todavía no está implementado. Borrar datos del navegador elimina estas copias; el usuario puede descargar su respaldo.

## Próxima etapa

La recepción central dispone de API, tabla privada, bucket privado y comprobante tras confirmación; requiere conectar las credenciales de Supabase en Vercel y ejecutar la migración. Quedan pendientes la autenticación del cliente para consultar desde otros dispositivos, límites de tasa y retención, y la persistencia compartida de dictámenes. Los roles administrativos se comprueban en el servidor para lectura y descarga. La cabecera simplificada del asistente solo mejora la navegación: no constituye un control de acceso. La demo administrativa continúa disponible fuera del recorrido del cliente.

## Verificación

`npx tsx --test test/clientProjects.test.ts` cubre recuperación de datos, estado del borrador, errores de almacenamiento, completitud y validación/hashes de archivos. También se comprobó en Chromium el diagnóstico → asistente → guardar/salir → recargar → recuperar PDF e imagen → preparar → pantalla final, con verificación de descarga y diseño móvil.
