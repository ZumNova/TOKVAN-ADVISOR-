# Imágenes y metadatos NFT con Pinata

En Factories → ERC-721, después de crear la colección, el panel **Imagen y datos del NFT** permite elegir PNG, JPG o WebP de hasta 2 MiB, escribir nombre y descripción, ver la imagen y pulsar **Subir imagen y preparar NFT**. La publicación es pública. La wallet firma un mensaje sin gas que autoriza ese contenido. El backend sube la imagen a IPFS público, crea `{name, description, image: "ipfs://…"}`, sube ese JSON y completa la URI de emisión. La emisión sigue siendo una transacción separada y revisable.

No hay cambios en los contratos ni en las aprobaciones existentes. No requiere desplegar otro factory. El Operador 8A25 crea la colección; la administradora A047 emite los NFTs.

## Activación por única vez

1. Crear una cuenta en https://app.pinata.cloud.
2. Abrir **API Keys → New Key**, crear una clave para TOKVAN con permiso de subida de archivos (`org:files:write`) y copiar el **JWT**. No compartirlo por chat ni guardarlo en Git.
3. En Vercel → proyecto `tokvan-advisor` → Settings → Environment Variables, agregar **PINATA_JWT** con ese valor, privado/sensible y entorno **Production**. No usar prefijo `VITE_`.
4. Volver a desplegar el proyecto en Vercel para que la función reciba la variable.
5. En la dapp, pulsar **Comprobar conexión con Pinata**. Este botón comprueba presencia de configuración; la primera carga valida que la clave y permisos funcionen.

No se necesita configurar un gateway para emitir: la URI usa IPFS directamente. La disponibilidad depende de mantener los archivos alojados en Pinata u otro nodo que conserve esos CIDs. Crear una cuenta y aceptar su plan corresponde al usuario; esta implementación no contrata servicios.

## Implementación y pruebas

- `api/nft-media.ts`: función Vercel Node (GET configuración / POST carga).
- `server/nftMedia.ts`: clave privada, validación de tamaño y cabecera de imagen, autorización por firma y subida V3 de Pinata. Solo admite las cuatro wallets existentes. La firma incluye dominio, red, hash del contenido y fecha; vence a los tres minutos. No es una sesión ni una autorización on-chain. Dentro de esa ventana la misma petición puede repetirse; solo autoriza el mismo contenido, no es un mecanismo de cuota por usuario.
- `src/lib/nftMedia.ts`: validación y mensaje compartidos.
- `NFTMediaPanel.tsx`: vista previa local, estados y conservación de URI/JSON por colección en este navegador. Cambiar imagen, nombre o descripción invalida el resultado anterior antes de emitir. La opción avanzada permite una URI externa existente.
- Si la imagen sube pero el JSON falla, se informa la carga parcial; puede reintentarse. No se borra automáticamente la imagen ya publicada.
- No se registran JWT, firmas ni archivos en logs. Sin cambios en contratos o claves privadas de wallets.
- Para probar funciones locales usar `vercel dev`; `npm run dev` sirve únicamente Vite y no ejecuta `/api`.
- `npm run test:nft-media`: proveedor simulado, publicación de imagen y JSON, datos alterados, wallet no permitida, firmas vencidas, formato/tamaño y fallo parcial. No prueba una cuenta real de Pinata.

Fuentes: [Pinata Quickstart](https://docs.pinata.cloud/quickstart), [Upload a File](https://docs.pinata.cloud/api-reference/endpoint/upload-a-file), [Vercel Node runtime](https://vercel.com/docs/functions/runtimes/node-js).
