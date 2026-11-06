import {getAddress, keccak256, toUtf8Bytes} from 'ethers';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export interface MediaPayload {name: string; description: string; mime: string; imageBase64: string;}
export interface MediaResult {imageUri: string; metadataUri: string; metadata: {name: string; description: string; image: string};}
export function validateMediaPayload(value: unknown): MediaPayload {
  const p = value as MediaPayload;
  if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100 ||
      typeof p.description !== 'string' || p.description.length > 2000 || !IMAGE_TYPES.includes(p.mime) ||
      typeof p.imageBase64 !== 'string' || !p.imageBase64.length || p.imageBase64.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 ||
      p.imageBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(p.imageBase64)) {
    throw new Error('Complete el nombre (hasta 100 caracteres), descripción (hasta 2000) e imagen PNG, JPG o WebP de hasta 2 MB.');
  }
  return {name: p.name.trim(), description: p.description.trim(), mime: p.mime, imageBase64: p.imageBase64};
}
export function mediaMessage(payload: MediaPayload, account: string, issuedAt: number) {
  const digest = keccak256(toUtf8Bytes(JSON.stringify(validateMediaPayload(payload))));
  return ['TOKVAN · Publicar imagen y metadatos NFT', 'Dominio: tokvan-advisor.vercel.app',
    'Red: Sepolia (11155111)', `Wallet: ${getAddress(account)}`, `Emitido: ${issuedAt}`,
    `Contenido: ${digest}`, 'Autorizo publicar estos archivos en IPFS mediante Pinata. Esta firma no envia transacciones ni transfiere tokens.'].join('\n');
}
export function isIPFSUri(value: unknown): value is string {
  return typeof value === 'string' && /^ipfs:\/\/(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[yk][a-z2-7]{20,120})$/.test(value);
}
