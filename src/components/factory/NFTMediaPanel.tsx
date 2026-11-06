import {useEffect, useRef, useState} from 'react';
import {hexlify, toUtf8Bytes, getAddress} from 'ethers';
import {injectedWallet, PARTICIPANTS, walletError} from '../../lib/factoryWallet';
import {requireNFTChain} from '../../lib/erc721Workflow';
import {IMAGE_TYPES, MAX_IMAGE_BYTES, mediaMessage, isIPFSUri, type MediaResult} from '../../lib/nftMedia';

const button = 'rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-900 disabled:opacity-40 disabled:cursor-not-allowed';
interface Props {collection: string; disabled: boolean; onURI: (uri: string) => void; onBusy: (busy: boolean) => void;}
export default function NFTMediaPanel({collection, disabled, onURI, onBusy}: Props) {
  const storageKey = `tokvan:erc721:media:v1:${collection.toLowerCase()}`;
  const [result, setResult] = useState<MediaResult | undefined>(() => {
    try {const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return isIPFSUri(saved?.metadataUri) && isIPFSUri(saved?.imageUri) && typeof saved?.metadata?.name === 'string' ? saved : undefined;
    } catch {return undefined;}
  });
  const [name, setName] = useState(result?.metadata.name || 'TOKVAN NFT #1');
  const [description, setDescription] = useState(result?.metadata.description || 'NFT de prueba de TOKVAN en Sepolia.');
  const [file, setFile] = useState<File>(); const [preview, setPreview] = useState('');
  const [configured, setConfigured] = useState<boolean>();
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => {onURI(result?.metadataUri || '');}, [result, onURI]);
  useEffect(() => {if (!file) {setPreview(''); return;} const url = URL.createObjectURL(file);setPreview(url);return () => URL.revokeObjectURL(url);}, [file]);
  async function check() {
    try {const response = await fetch('/api/nft-media');if (!response.ok) throw new Error();const data = await response.json();setConfigured(data.configured === true);}
    catch {setConfigured(undefined);setError('No se pudo consultar Pinata. Reintente desde la web publicada.');}
  }
  useEffect(() => {void check();}, []);
  function invalidate() {setResult(undefined);onURI('');setMessage('');try {localStorage.removeItem(storageKey);} catch {/* In-memory form still works. */}}
  async function upload() {
    if (lock.current || !file) return;lock.current = true;setBusy(true);onBusy(true);setError('');
    try {
      const wallet = injectedWallet();await requireNFTChain(wallet);
      const accounts = await wallet.request({method: 'eth_accounts'}) as string[];
      const account = getAddress(accounts[0]);
      if (!Object.values(PARTICIPANTS).includes(account)) throw new Error('Conecte una de las cuatro wallets de TOKVAN para cargar la imagen.');
      const imageBase64 = await new Promise<string>((resolve, reject) => {const reader = new FileReader();reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));reader.onload = () => resolve(String(reader.result).split(',')[1]);reader.readAsDataURL(file);});
      const payload = {name: name.trim(), description: description.trim(), mime: file.type, imageBase64};
      const issuedAt = Date.now();
      setMessage('Autorice la publicación en la wallet. Es una firma de mensaje, sin gas.');
      const signature = await wallet.request({method: 'personal_sign', params: [hexlify(toUtf8Bytes(mediaMessage(payload, account, issuedAt))), account]});
      await requireNFTChain(wallet);
      const current = await wallet.request({method: 'eth_accounts'}) as string[];
      if (getAddress(current[0]) !== account) throw new Error('Cambió la wallet. Vuelva a cargar.');
      setMessage('Subiendo imagen y creando el JSON en Pinata…');
      const response = await fetch('/api/nft-media', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({payload, account, issuedAt, signature}), signal: AbortSignal.timeout(65000)});
      const data = await response.json();
      if (!response.ok) throw new Error(`${data.error || 'No se pudo cargar el NFT.'}${data.imageUploaded ? ' La imagen ya se subió; falta completar el JSON. Puede reintentar.' : ''}`);
      if (!isIPFSUri(data.metadataUri) || !isIPFSUri(data.imageUri) || data.metadata?.name !== payload.name || data.metadata?.image !== data.imageUri) throw new Error('La respuesta de carga no contiene metadatos válidos.');
      setResult(data);onURI(data.metadataUri);setMessage('Imagen y JSON listos. Ya puede simular la emisión del NFT.');
      try {localStorage.setItem(storageKey, JSON.stringify(data));} catch {setMessage('Imagen y JSON listos. Copie la URI: este navegador no permite guardarla para futuras visitas.');}
    } catch (e) {setError(walletError(e));setMessage('');} finally {lock.current = false;setBusy(false);onBusy(false);}
  }
  const blocked = disabled || busy;
  return <div className="rounded-xl border border-blue-200 p-4 space-y-3">
    <h3 className="font-semibold">Imagen y datos del NFT</h3>
    <p className="text-sm">Elegí una imagen y completá sus datos. Creamos el JSON y la URI automáticamente. La imagen y los datos se publicarán en IPFS.</p>
    {configured === false && <p role="status" className="rounded bg-amber-50 p-3 text-amber-900">Pinata todavía no está conectado. Falta configurar su clave privada en Vercel. Podés preparar los datos mientras tanto.</p>}
    {configured !== true && <button type="button" className={button} disabled={blocked} onClick={() => void check()}>Comprobar conexión con Pinata</button>}
    <label className="block">Nombre del NFT<input maxLength={100} className="block w-full border rounded p-2" disabled={blocked} value={name} onChange={e => {invalidate();setName(e.target.value);}}/></label>
    <label className="block">Descripción<textarea maxLength={2000} className="block w-full border rounded p-2" disabled={blocked} value={description} onChange={e => {invalidate();setDescription(e.target.value);}}/></label>
    <label className="block">Cargar imagen · PNG, JPG o WebP · Hasta 2 MB<input type="file" accept="image/png,image/jpeg,image/webp" className="block mt-2 w-full" disabled={blocked} onChange={e => {invalidate();setError('');const selected = e.target.files?.[0];setFile(undefined);if (!selected) return;if (!IMAGE_TYPES.includes(selected.type) || selected.size > MAX_IMAGE_BYTES || !selected.size) {setError('Seleccione una imagen PNG, JPG o WebP de hasta 2 MB.');e.target.value = '';return;}setFile(selected);}}/></label>
    {preview && <img src={preview} alt="Vista previa de la imagen elegida para el NFT" className="h-48 max-w-full rounded-lg object-contain"/>}
    <button type="button" className={button} disabled={blocked || configured !== true || !file || !name.trim() || Boolean(result)} onClick={() => void upload()}>{busy ? 'Preparando NFT…' : 'Subir imagen y preparar NFT'}</button>
    <p className="text-sm">La wallet autoriza la carga con un mensaje sin gas. Después firmarás la emisión del NFT por separado.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status">{message}</p>}
    {result && <div className="text-sm space-y-2"><p className="text-green-800">Imagen y metadatos preparados en IPFS.</p><details><summary>Ver URI y JSON generados</summary><p className="break-all">{result.metadataUri}</p><pre className="whitespace-pre-wrap break-all">{JSON.stringify(result.metadata, null, 2)}</pre></details></div>}
  </div>;
}
