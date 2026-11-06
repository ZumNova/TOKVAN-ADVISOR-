import {getAddress, verifyMessage} from 'ethers';
import participants from '../deployment/sepolia-participants.json' with {type: 'json'};
import {MAX_IMAGE_BYTES, mediaMessage, validateMediaPayload, isIPFSUri} from '../src/lib/nftMedia.js';

const headers = {'Cache-Control': 'no-store'};
function json(value: unknown, status = 200) {return Response.json(value, {status, headers});}
function imageMatches(bytes: Buffer, mime: string) {
  if (mime === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}
class UploadError extends Error {}
async function pin(file: Blob, name: string, jwt: string, fetcher: typeof fetch) {
  const form = new FormData();
  form.set('network', 'public'); form.set('file', file, name); form.set('name', name); form.set('cid_version', 'v1');
  const response = await fetcher('https://uploads.pinata.cloud/v3/files', {
    method: 'POST', headers: {Authorization: `Bearer ${jwt}`}, body: form, signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) {
    // Do not return provider bodies, headers or credentials to clients/logs.
    console.error('nft-media: Pinata rejected upload', response.status);
    throw new UploadError(response.status === 401 || response.status === 403 ? 'Revise la clave PINATA_JWT y su permiso de subida en Vercel.' : 'Pinata no pudo completar la carga. Revise el cupo de la cuenta e intente nuevamente.');
  }
  const result = await response.json();
  const uri = `ipfs://${result?.data?.cid}`;
  if (!isIPFSUri(uri)) throw new UploadError('Pinata no devolvió un CID válido.');
  return uri;
}
export function createMediaHandlers(options: {jwt?: string; accounts?: string[]; fetcher?: typeof fetch} = {}) {
const jwt = options.jwt?.trim();
const accounts = options.accounts ?? Object.values(participants.participants);
const fetcher = options.fetcher ?? fetch;
async function GET() {
  return json({configured: Boolean(jwt), maxImageBytes: MAX_IMAGE_BYTES});
}
async function POST(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error: 'Use JSON para cargar el NFT.'}, 415);
  if (Number(request.headers.get('content-length')) > 3_000_000) return json({error: 'La imagen supera el tamaño permitido.'}, 413);
  if (!jwt) return json({error: 'Falta conectar Pinata: configure PINATA_JWT como variable privada de Vercel y vuelva a desplegar.'}, 503);
  let payload; let bytes: Buffer;
  try {
    // Bound reads even when a caller omits Content-Length.
    const reader = request.body?.getReader(); if (!reader) throw new Error('Faltan datos.');
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) {const {done, value} = await reader.read(); if (done) break; size += value.byteLength;
      if (size > 3_000_000) {await reader.cancel(); return json({error: 'La imagen supera el tamaño permitido.'}, 413);} chunks.push(value);}
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    payload = validateMediaPayload(body.payload);
    if (!Number.isSafeInteger(body.issuedAt) || body.issuedAt > Date.now() + 30_000 || Date.now() - body.issuedAt > 180_000) throw new Error('La autorización venció. Vuelva a cargar y firmar.');
    const account = getAddress(body.account);
    if (!accounts.includes(account) || verifyMessage(mediaMessage(payload, account, body.issuedAt), body.signature) !== account) {
      return json({error: 'Autorice la carga con una de las cuatro wallets de TOKVAN.'}, 403);
    }
    bytes = Buffer.from(payload.imageBase64, 'base64');
    if (bytes.length > MAX_IMAGE_BYTES || bytes.toString('base64') !== payload.imageBase64 || !imageMatches(bytes, payload.mime)) throw new Error('El archivo no coincide con una imagen PNG, JPG o WebP válida de hasta 2 MB.');
  } catch {
    return json({error: 'Datos o firma inválidos. Revise la imagen y firme nuevamente con una wallet de TOKVAN.'}, 400);
  }
  let imageUri: string | undefined;
  try {
    const extension = payload.mime === 'image/png' ? 'png' : payload.mime === 'image/jpeg' ? 'jpg' : 'webp';
    imageUri = await pin(new Blob([new Uint8Array(bytes)], {type: payload.mime}), `tokvan-nft.${extension}`, jwt, fetcher);
    const metadata = {name: payload.name, description: payload.description, image: imageUri};
    const metadataUri = await pin(new Blob([JSON.stringify(metadata)], {type: 'application/json'}), 'tokvan-nft.json', jwt, fetcher);
    return json({imageUri, metadataUri, metadata});
  } catch (error) {
    const message = error instanceof UploadError ? error.message : 'La carga no terminó. Intente nuevamente.';
    return json({error: message, ...(imageUri ? {imageUri, imageUploaded: true} : {})}, 502);
  }
}

return {GET, POST};
}
