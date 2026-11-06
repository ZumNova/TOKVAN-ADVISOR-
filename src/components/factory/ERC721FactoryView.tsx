import NFTMediaPanel from './NFTMediaPanel';
import {useEffect, useRef, useState} from 'react';
import {DEPLOYER, PARTICIPANTS, SEPOLIA_HEX, injectedWallet, walletError} from '../../lib/factoryWallet';
import {NFT_DEFAULTS, NFT_STORAGE_PREFIX as prefix, prepareCollection, readNFTState, reviewNFTOperation, sendNFTOperation, confirmNFTOperation, verifyNFTFactory, readNFTJournal, type CollectionInput, type NFTFactoryRecord, type NFTPending, type NFTReview, type NFTOperation, type NFTJournalEntry} from '../../lib/erc721Workflow';
const button='rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-900 disabled:opacity-40 disabled:cursor-not-allowed';
const panel='rounded-xl border border-slate-200 bg-white p-5 space-y-4';
function saved<T>(key:string, fallback:T):T {try{return JSON.parse(localStorage.getItem(prefix+key)||'null') ?? fallback;}catch{return fallback;}}
const explorer='https://sepolia.etherscan.io';
function Tx({hash}:{hash:string}) {return <a className="text-blue-700 break-all underline" target="_blank" rel="noreferrer" href={`${explorer}/tx/${hash}`}>{hash}</a>;}
export default function ERC721FactoryView() {
  const [record,setRecord]=useState<NFTFactoryRecord|undefined>(()=>saved(':factory',undefined));
  const [input,setInput]=useState<CollectionInput>(()=>{const value=saved(':draft',NFT_DEFAULTS);try{prepareCollection(value,DEPLOYER);return value;}catch{return NFT_DEFAULTS;}});
  const [pending,setPending]=useState<NFTPending|undefined>(()=>saved(':pending',undefined));
  const [review,setReview]=useState<NFTReview>();
  const [state,setState]=useState<Awaited<ReturnType<typeof readNFTState>>>();
  const [busy,setBusy]=useState(false);const lock=useRef(false);
  const [message,setMessage]=useState('');const [error,setError]=useState('');
  const [recipient,setRecipient]=useState(DEPLOYER);
  const [uri,setURI]=useState('');
  const [uploading,setUploading]=useState(false);
  const [tokenId,setTokenId]=useState('1');const [recovery,setRecovery]=useState('');
  const [journal,setJournal]=useState<NFTJournalEntry[]>([]);
  useEffect(()=>{
    let wallet;try{wallet=injectedWallet();}catch{return;}
    const reset=()=>{setReview(undefined);setState(undefined);setMessage('Cambió la wallet o la red. Actualice el estado antes de continuar.');};
    wallet.on?.('accountsChanged',reset);wallet.on?.('chainChanged',reset);
    return ()=>{wallet.removeListener?.('accountsChanged',reset);wallet.removeListener?.('chainChanged',reset);};
  },[]);
  async function run(action:()=>Promise<void>) {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await action();}catch(e){setReview(undefined);setError(walletError(e));}finally{lock.current=false;setBusy(false);}
  }
  async function refresh(current=record) {
    if(!current)throw new Error('Primero despliegue o recupere el factory ERC-721.');
    setState(await readNFTState(injectedWallet(),current,input));
  }
  function change<K extends keyof CollectionInput>(key:K,value:CollectionInput[K]) {setInput({...input,[key]:value});setState(undefined);setReview(undefined);}
  async function simulate(operation:NFTOperation) {
    if(pending)throw new Error('Verifique primero la transacción pendiente.');
    localStorage.setItem(prefix+':draft',JSON.stringify(input));
    setReview(await reviewNFTOperation(injectedWallet(),{record,operation}));
  }
  async function confirm() {
    if(!pending)return;
    const result=await confirmNFTOperation(injectedWallet(),pending);
    if(result.status==='pending'){setMessage('La transacción sigue pendiente. Espere y vuelva a verificar.');return;}
    if(result.status==='failed'){setPending(undefined);localStorage.removeItem(prefix+':pending');throw new Error('La transacción falló en la red. Puede volver a simular.');}
    let current=record;
    if('record' in result && result.record){current=result.record;localStorage.setItem(prefix+':factory',JSON.stringify(current));setRecord(current);}
    localStorage.removeItem(prefix+':pending');setPending(undefined);
    setMessage('tokenId' in result && result.tokenId ? `NFT #${result.tokenId} emitido y confirmado.` : 'Operación confirmada en Sepolia.');
    await refresh(current);
  }
  const reviewers=[PARTICIPANTS.technicalReviewer,PARTICIPANTS.complianceReviewer,PARTICIPANTS.boardReviewer];
  const reviewer=state?reviewers.indexOf(state.account):-1;
  const approved=reviewer>=0&&Boolean((state?.approvals||0)&(1<<reviewer));
  const disabled=busy||uploading||Boolean(pending)||Boolean(review);
  return <div className="space-y-6 text-slate-800">
    <header><h1 className="text-2xl font-bold">Factory ERC-721 · NFTs únicos</h1><p>Sepolia · Las mismas cuatro wallets, con aprobaciones y bitácora propias.</p></header>
    <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={()=>void run(async()=>{await injectedWallet().request({method:'eth_requestAccounts'});if(record)await refresh();setMessage('Wallet conectada.');})}>Conectar wallet</button><button className={button} disabled={busy} onClick={()=>void run(async()=>{await injectedWallet().request({method:'wallet_switchEthereumChain',params:[{chainId:SEPOLIA_HEX}]});})}>Usar Sepolia</button><button className={button} disabled={busy||!record} onClick={()=>void run(()=>refresh())}>Actualizar estado ERC-721</button></div>
    {state?.account&&<p className="break-all text-sm">Wallet conectada: {state.account}</p>}
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {message&&<p role="status" className="rounded-lg bg-blue-50 p-4">{message}</p>}
    <section className={panel}><h2 className="text-lg font-semibold">1. Factory ERC-721</h2>
      <div className="text-sm space-y-2">{Object.entries(PARTICIPANTS).map(([role,address],i)=><p key={role} className="break-all"><strong>{['Revisión técnica','Cumplimiento','Directorio','Operador'][i]}:</strong> {address}</p>)}</div>
      {record?<p className="break-all">Factory guardado {state?'· Verificado':'· Pendiente de verificar'}: <a className="text-blue-700 underline" href={`${explorer}/address/${record.address}`} target="_blank" rel="noreferrer">{record.address}</a></p>:<><p>Con A047, cree el contrato que permitirá desplegar colecciones NFT. Cada colección necesitará las tres aprobaciones y la firma del Operador.</p><button className={button} disabled={disabled} onClick={()=>void run(()=>simulate({kind:'factory'}))}>Simular despliegue ERC-721</button></>}
      <details><summary>Recuperar un factory ERC-721 ya desplegado</summary><label className="block mt-3">Hash del despliegue<input className="block border rounded p-2 w-full" value={recovery} onChange={e=>setRecovery(e.target.value)}/></label><button className={button} disabled={disabled} onClick={()=>void run(async()=>{const result=await verifyNFTFactory(injectedWallet(),recovery.trim());if(result.status!=='confirmed')throw new Error('El despliegue todavía no está confirmado o falló.');localStorage.setItem(prefix+':factory',JSON.stringify(result.record));setRecord(result.record);setJournal([]);await refresh(result.record);setMessage('Factory ERC-721 recuperado y verificado.');})}>Verificar y recuperar</button></details>
    </section>
    <section className={panel}><h2 className="text-lg font-semibold">2. Configurar y aprobar la colección</h2>{state?.nft&&<button className={button} disabled={disabled} onClick={()=>{const next={...NFT_DEFAULTS,projectReference:''};setInput(next);setState(undefined);setReview(undefined);try{localStorage.setItem(prefix+':draft',JSON.stringify(next));}catch{/* Form remains usable. */}setMessage('Ingrese otro identificador de expediente para crear una nueva colección con este factory.');}}>Preparar otra colección</button>}<div className="grid md:grid-cols-2 gap-4">{([['projectReference','Identificador del expediente'],['name','Nombre de la colección'],['symbol','Símbolo'],['admin','Wallet administradora'],['maxSupply','Máximo histórico de NFTs']] as const).map(([key,label])=><label key={key}>{label}<input className="mt-1 block w-full border rounded-lg p-2" disabled={disabled||Boolean(state?.nft)} value={input[key]} onChange={e=>change(key,e.target.value)}/></label>)}</div>
      <div className="flex flex-wrap gap-4">{(['burnable','pausable'] as const).map(key=><label key={key}><input type="checkbox" checked={input[key]} disabled={disabled||Boolean(state?.nft)} onChange={e=>change(key,e.target.checked)}/> {key==='burnable'?'Quema por titular o autorizado':'Pausa de emergencia'}</label>)}</div>
      <p className="text-sm">Cada NFT tiene un identificador único y su propia URI de metadatos. Quemar no libera cupos del máximo histórico. La pausa bloquea transferencias, emisión y quema. Sin upgrade ni controles KYC on-chain en v1.</p>
      <div className="flex flex-wrap gap-2"><button className={button} disabled={disabled||!record} onClick={()=>void run(async()=>{localStorage.setItem(prefix+':draft',JSON.stringify(input));await refresh();setMessage('Parámetros preparados. Revise el nombre, máximo y administradora antes de aprobar.');})}>Preparar para revisión</button><button className={button} disabled={disabled||!state||Boolean(state.nft)||reviewer<0||approved} onClick={()=>void run(()=>simulate({kind:'approve',input}))}>Simular aprobación</button><button className={button} disabled={disabled||!approved||Boolean(state?.nft)} onClick={()=>void run(()=>simulate({kind:'revoke',input}))}>Simular revocación</button><button className={button} disabled={disabled||!state||Boolean(state.nft)||state.approvals!==7||state.account!==PARTICIPANTS.operator} onClick={()=>void run(()=>simulate({kind:'create',input}))}>Simular creación de colección</button></div>
      {state&&!state.nft&&<div className="text-sm"><p>Aprobaciones: {['Técnica','Cumplimiento','Directorio'].map((label,i)=>`${label}: ${state.approvals&(1<<i)?'aprobado':'pendiente'}`).join(' · ')}</p><p className="break-all">Hash de los parámetros: {state.digest}</p><p>Aprueban A047, FB24 y 1E8D. Después crea la colección el Operador 8A25.</p></div>}
    </section>
    {state?.nft&&<section className={panel}><h2 className="text-lg font-semibold">3. Emitir y administrar NFTs · {state.nft.name} ({state.nft.symbol})</h2><a className="text-blue-700 break-all underline" target="_blank" rel="noreferrer" href={`${explorer}/address/${state.collection}`}>{state.collection}</a><p>{state.nft.paused?'Pausada':'Activa'} · Emitidos: {String(state.nft.minted)} / {String(state.nft.cap)} · En circulación: {String(state.nft.supply)}</p>
      <label className="block">Wallet que recibe el NFT<input className="block border rounded p-2 w-full" disabled={disabled} value={recipient} onChange={e=>setRecipient(e.target.value)}/></label>{pending&&<div className="rounded-lg bg-amber-50 p-3"><p>Verifique la transacción anterior para continuar con la carga de imagen.</p><button className={button} disabled={busy} onClick={()=>void run(confirm)}>Verificar confirmación</button></div>}{review&&<div className="rounded-lg bg-blue-50 p-3"><p>Hay una operación en revisión. Cancele la revisión si quiere editar la imagen.</p><button className={button} disabled={busy} onClick={()=>setReview(undefined)}>Cancelar revisión</button></div>}<NFTMediaPanel key={state.collection} collection={state.collection} disabled={disabled} disabledReason={pending ? 'Hay una transacción enviada por verificar. Pulse «Verificar confirmación» junto a este panel.' : review ? 'Hay una operación en revisión. Confírmela o pulse «Cancelar revisión» para editar los datos del NFT.' : undefined} onURI={setURI} onBusy={setUploading}/><details><summary>Usar una URI existente (avanzado)</summary><label className="block">URI de metadatos JSON (HTTPS o IPFS)<input className="block border rounded p-2 w-full" disabled={disabled} value={uri} onChange={e=>setURI(e.target.value)}/></label><p className="text-sm">La URI queda fija al emitir. Revisá la imagen y los datos antes de firmar.</p></details>
      <div className="flex flex-wrap gap-2"><button className={button} disabled={disabled||!uri||!state.nft.canMint||state.nft.paused||state.nft.minted>=state.nft.cap} onClick={()=>void run(()=>simulate({kind:'mint',input,recipient,uri}))}>Emitir un NFT · Simular</button><button className={button} disabled={disabled||!state.nft.canPause||!state.nft.pausable} onClick={()=>void run(()=>simulate({kind:state.nft!.paused?'unpause':'pause',input}))}>{state.nft.paused?'Reanudar colección':'Pausar colección'} · Simular</button></div>
      <label className="block">ID del NFT que desea quemar<input className="block border rounded p-2" inputMode="numeric" disabled={disabled} value={tokenId} onChange={e=>setTokenId(e.target.value)}/></label><p className="text-sm">Quemar destruye ese NFT de forma irreversible. Solo puede hacerlo su titular o una cuenta autorizada.</p><button className={button} disabled={disabled||!state.nft.burnable||state.nft.paused} onClick={()=>void run(()=>simulate({kind:'burn',input,tokenId}))}>Quemar NFT · Simular</button>
    </section>}
    {review&&<section className="rounded-xl border-2 border-blue-500 bg-blue-50 p-5 space-y-3" aria-label="Revisar operación"><h2 className="font-semibold">Antes de firmar</h2><p className="break-all">{review.summary}</p><p className="break-all">Firma: {review.tx.from}</p><p>Gas estimado con margen: {review.estimatedEth} ETH Sepolia. Revise el costo final en la wallet.</p><button className={button} disabled={busy} onClick={()=>void run(async()=>{localStorage.setItem(prefix+':draft',JSON.stringify(input));const sent=await sendNFTOperation(injectedWallet(),review);setPending(sent);setReview(undefined);setMessage('Transacción enviada. Verifique su confirmación antes de continuar.');localStorage.setItem(prefix+':pending',JSON.stringify(sent));})}>Confirmar en la wallet</button> <button className={button} disabled={busy} onClick={()=>setReview(undefined)}>Cancelar</button></section>}
    {pending&&<section className={panel}><h2>Transacción enviada · ERC-721</h2><Tx hash={pending.hash}/><p>Espere la confirmación de red. No repita la operación.</p><button className={button} disabled={busy} onClick={()=>void run(confirm)}>Verificar confirmación</button></section>}
    <section className={panel}><h2 className="font-semibold">Bitácora ERC-721 · Sepolia</h2><p className="text-sm">Registra el factory, colecciones, aprobaciones, emisiones, transferencias, quemas y pausas. Los eventos se muestran con dos bloques de espera.</p><button className={button} disabled={busy||!record} onClick={()=>void run(async()=>{setJournal(await readNFTJournal(injectedWallet(),record!));})}>Actualizar bitácora</button> <button className={button} disabled={!journal.length} onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({chainId:11155111,standard:'ERC721',entries:journal},null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='bitacora-erc721-sepolia.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Descargar JSON</button>
      {journal.map(entry=><article key={entry.id} className="border-t pt-3 text-sm"><strong>{entry.kind}{entry.tokenId?` #${entry.tokenId}`:''}</strong><p>Bloque {entry.block}</p><p className="break-all">Contrato: {entry.address}</p>{entry.from&&<p className="break-all">Desde: {entry.from}</p>}{entry.to&&<p className="break-all">Hacia: {entry.to}</p>}<Tx hash={entry.hash}/></article>)}
    </section>
  </div>;
}
