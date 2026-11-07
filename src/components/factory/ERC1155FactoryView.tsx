import NFTMediaPanel from './NFTMediaPanel';
import {useEffect, useRef, useState} from 'react';
import {DEPLOYER, PARTICIPANTS, SEPOLIA_HEX, injectedWallet, walletError} from '../../lib/factoryWallet';
import {MULTI_DEFAULTS, MULTI_STORAGE_PREFIX as prefix, prepareCollection, readMultiState, reviewMultiOperation, sendMultiOperation, confirmMultiOperation, verifyMultiFactory, readMultiJournal, recoverMultiCollection, readMultiType, type CollectionInput, type MultiFactoryRecord, type MultiPending, type MultiReview, type MultiOperation, type MultiJournalEntry} from '../../lib/erc1155Workflow';
const button='rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-900 disabled:opacity-40 disabled:cursor-not-allowed';
const panel='rounded-xl border border-slate-200 bg-white p-5 space-y-4';
function saved<T>(key:string, fallback:T):T {try{return JSON.parse(localStorage.getItem(prefix+key)||'null') ?? fallback;}catch{return fallback;}}
const explorer='https://sepolia.etherscan.io';
function Tx({hash}:{hash:string}) {return <a className="text-blue-700 break-all underline" target="_blank" rel="noreferrer" href={`${explorer}/tx/${hash}`}>{hash}</a>;}
function FactoryHash({hash, onUse}:{hash:string;onUse:()=>void}) {
  const [notice,setNotice]=useState('');
  return <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2 text-sm">
    <p className="font-semibold">Hash de despliegue del factory ERC-1155</p>
    <Tx hash={hash}/>
    <p>Este es el hash que se usa en «Recuperar un factory ERC-1155 ya desplegado».</p>
    <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={async()=>{try{await navigator.clipboard.writeText(hash);setNotice('Hash copiado.');}catch{setNotice('No se pudo copiar automáticamente. Seleccione y copie el hash mostrado arriba.');}}}>Copiar hash del factory</button><button type="button" className={button} onClick={onUse}>Usar para recuperar</button></div>
    {notice&&<p role="status">{notice}</p>}
  </div>;
}
export default function ERC1155FactoryView() {
  const [record,setRecord]=useState<MultiFactoryRecord|undefined>(()=>saved(':factory',undefined));
  const [input,setInput]=useState<CollectionInput>(()=>{const value=saved(':draft',MULTI_DEFAULTS);try{prepareCollection(value,DEPLOYER);return value;}catch{return MULTI_DEFAULTS;}});
  const [pending,setPending]=useState<MultiPending|undefined>(()=>saved(':pending',undefined));
  const [review,setReview]=useState<MultiReview>();
  const [state,setState]=useState<Awaited<ReturnType<typeof readMultiState>>>();
  const [busy,setBusy]=useState(false);const lock=useRef(false);
  const [message,setMessage]=useState('');const [error,setError]=useState('');
  const [recipient,setRecipient]=useState(DEPLOYER);
  const [uri,setURI]=useState('');
  const [uploading,setUploading]=useState(false);
  const [initialAmount,setInitialAmount]=useState('100');const [typeCap,setTypeCap]=useState('100');
  const [amount,setAmount]=useState('1');
  const [typeState,setTypeState]=useState<Awaited<ReturnType<typeof readMultiType>>>();
  const [tokenId,setTokenId]=useState('1');const [recovery,setRecovery]=useState('');
  const managementPanel=useRef<HTMLElement>(null);
  const recoveryPanel=useRef<HTMLDetailsElement>(null);
  function useRecoveryHash(hash:string){setRecovery(hash);if(recoveryPanel.current){recoveryPanel.current.open=true;recoveryPanel.current.scrollIntoView({behavior:'smooth',block:'center'});}setMessage('Hash cargado. Pulse «Verificar y recuperar» para comprobarlo en Sepolia.');}
  const [journal,setJournal]=useState<MultiJournalEntry[]>([]);
  useEffect(()=>{
    let wallet;try{wallet=injectedWallet();}catch{return;}
    const reset=()=>{setReview(undefined);setState(undefined);setTypeState(undefined);setMessage('Cambió la wallet o la red. Actualice el estado antes de continuar.');};
    wallet.on?.('accountsChanged',reset);wallet.on?.('chainChanged',reset);
    return ()=>{wallet.removeListener?.('accountsChanged',reset);wallet.removeListener?.('chainChanged',reset);};
  },[]);
  async function run(action:()=>Promise<void>) {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await action();}catch(e){setReview(undefined);setError(walletError(e));}finally{lock.current=false;setBusy(false);}
  }
  async function refresh(current=record) {
    if(!current)throw new Error('Primero despliegue o recupere el factory ERC-1155.');
    setState(await readMultiState(injectedWallet(),current,input));setTypeState(undefined);
  }
  function change<K extends keyof CollectionInput>(key:K,value:CollectionInput[K]) {setInput({...input,[key]:value});setState(undefined);setReview(undefined);}
  async function simulate(operation:MultiOperation) {
    if(pending)throw new Error('Verifique primero la transacción pendiente.');
    localStorage.setItem(prefix+':draft',JSON.stringify(input));
    setReview(await reviewMultiOperation(injectedWallet(),{record,operation}));
  }
  async function confirm() {
    if(!pending)return;
    const result=await confirmMultiOperation(injectedWallet(),pending);
    if(result.status==='pending'){setMessage('La transacción sigue pendiente. Espere y vuelva a verificar.');return;}
    if(result.status==='failed'){setPending(undefined);localStorage.removeItem(prefix+':pending');throw new Error('La transacción falló en la red. Puede volver a simular.');}
    let current=record;
    if('record' in result && result.record){current=result.record;localStorage.setItem(prefix+':factory',JSON.stringify(current));setRecord(current);}
    localStorage.removeItem(prefix+':pending');setPending(undefined);
    setMessage('tokenId' in result && result.tokenId ? `Tipo #${result.tokenId} · emisión confirmada.` : 'Operación confirmada en Sepolia.');
    await refresh(current);
  }
  async function openCollection(entry:MultiJournalEntry) {
    if(!record)throw new Error('Recupere primero el factory.');
    const recovered=await recoverMultiCollection(injectedWallet(),record,entry.hash,entry.address);
    localStorage.setItem(prefix+':draft',JSON.stringify(recovered.input));
    setInput(recovered.input);setState(recovered.state);setTypeState(undefined);setReview(undefined);setURI('');setTokenId('1');
    setMessage(`Colección ${recovered.state.multi!.name} recuperada. Ya puede emitir, pausar o reanudar según los permisos de su wallet.`);
    requestAnimationFrame(()=>managementPanel.current?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  const reviewers=[PARTICIPANTS.technicalReviewer,PARTICIPANTS.complianceReviewer,PARTICIPANTS.boardReviewer];
  const reviewer=state?reviewers.indexOf(state.account):-1;
  const approved=reviewer>=0&&Boolean((state?.approvals||0)&(1<<reviewer));
  const disabled=busy||uploading||Boolean(pending)||Boolean(review);
  return <div className="space-y-6 text-slate-800">
    <header><h1 className="text-2xl font-bold">Factory ERC-1155 · Tipos y cantidades</h1><p>Sepolia · Las mismas cuatro wallets, con aprobaciones y bitácora propias.</p></header>
    <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={()=>void run(async()=>{await injectedWallet().request({method:'eth_requestAccounts'});if(record)await refresh();setMessage('Wallet conectada.');})}>Conectar wallet</button><button className={button} disabled={busy} onClick={()=>void run(async()=>{await injectedWallet().request({method:'wallet_switchEthereumChain',params:[{chainId:SEPOLIA_HEX}]});})}>Usar Sepolia</button><button className={button} disabled={busy||!record} onClick={()=>void run(()=>refresh())}>Actualizar estado ERC-1155</button></div>
    {state?.account&&<p className="break-all text-sm">Wallet conectada: {state.account}</p>}
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {message&&<p role="status" className="rounded-lg bg-blue-50 p-4">{message}</p>}
    <section className={panel}><h2 className="text-lg font-semibold">1. Factory ERC-1155</h2>
      <div className="text-sm space-y-2">{Object.entries(PARTICIPANTS).map(([role,address],i)=><p key={role} className="break-all"><strong>{['Revisión técnica','Cumplimiento','Directorio','Operador'][i]}:</strong> {address}</p>)}</div>
      {record?<p className="break-all">Factory guardado {state?'· Verificado':'· Pendiente de verificar'}: <a className="text-blue-700 underline" href={`${explorer}/address/${record.address}`} target="_blank" rel="noreferrer">{record.address}</a></p>:<><p>Con A047, cree el contrato que permitirá desplegar colecciones ERC-1155. Cada colección necesitará las tres aprobaciones y la firma del Operador.</p><button className={button} disabled={disabled} onClick={()=>void run(()=>simulate({kind:'factory'}))}>Simular despliegue ERC-1155</button></>}
      {record&&<FactoryHash hash={record.hash} onUse={()=>useRecoveryHash(record.hash)}/>}
      <details ref={recoveryPanel}><summary>Recuperar un factory ERC-1155 ya desplegado</summary><p className="mt-2 text-sm">Pegue el hash de la transacción que desplegó el factory. Lo encontrará en la entrada «Factory ERC-1155» de la bitácora o en su JSON descargado. La creación de colección y la emisión de unidades tienen hashes diferentes.</p><label className="block mt-3">Hash del despliegue<input className="block border rounded p-2 w-full" value={recovery} onChange={e=>setRecovery(e.target.value)}/></label><button className={button} disabled={disabled} onClick={()=>void run(async()=>{const result=await verifyMultiFactory(injectedWallet(),recovery.trim());if(result.status!=='confirmed')throw new Error('El despliegue todavía no está confirmado o falló.');localStorage.setItem(prefix+':factory',JSON.stringify(result.record));setRecord(result.record);setJournal([]);await refresh(result.record);setMessage('Factory ERC-1155 recuperado y verificado.');})}>Verificar y recuperar</button></details>
    </section>
    <section className={panel}><h2 className="text-lg font-semibold">2. Configurar y aprobar la colección</h2>{state?.multi&&<button className={button} disabled={disabled} onClick={()=>{const next={...MULTI_DEFAULTS,projectReference:''};setInput(next);setState(undefined);setReview(undefined);try{localStorage.setItem(prefix+':draft',JSON.stringify(next));}catch{/* Form remains usable. */}setMessage('Ingrese otro identificador de expediente para crear una nueva colección con este factory.');}}>Preparar otra colección</button>}<div className="grid md:grid-cols-2 gap-4">{([['projectReference','Identificador del expediente'],['name','Nombre de la colección'],['symbol','Símbolo'],['admin','Wallet administradora'],['maxTypes','Máximo de tipos distintos (IDs)']] as const).map(([key,label])=><label key={key}>{label}<input className="mt-1 block w-full border rounded-lg p-2" disabled={disabled||Boolean(state?.multi)} value={input[key]} onChange={e=>change(key,e.target.value)}/></label>)}</div>
      <div className="flex flex-wrap gap-4">{(['burnable','pausable'] as const).map(key=><label key={key}><input type="checkbox" checked={input[key]} disabled={disabled||Boolean(state?.multi)} onChange={e=>change(key,e.target.checked)}/> {key==='burnable'?'Quema por titular o autorizado':'Pausa de emergencia'}</label>)}</div>
      <p className="text-sm">Cada ID identifica un tipo de token con su propia imagen, cantidad y máximo histórico de emisión. Todas las unidades del mismo ID comparten los metadatos. Quemar unidades no libera cupo ni permite reutilizar IDs. La pausa bloquea transferencias, emisión y quema. Sin upgrade ni controles KYC on-chain en v1.</p>
      <div className="flex flex-wrap gap-2"><button className={button} disabled={disabled||!record} onClick={()=>void run(async()=>{localStorage.setItem(prefix+':draft',JSON.stringify(input));await refresh();setMessage('Parámetros preparados. Revise el nombre, máximo y administradora antes de aprobar.');})}>Preparar para revisión</button><button className={button} disabled={disabled||!state||Boolean(state.multi)||reviewer<0||approved} onClick={()=>void run(()=>simulate({kind:'approve',input}))}>Simular aprobación</button><button className={button} disabled={disabled||!approved||Boolean(state?.multi)} onClick={()=>void run(()=>simulate({kind:'revoke',input}))}>Simular revocación</button><button className={button} disabled={disabled||!state||Boolean(state.multi)||state.approvals!==7||state.account!==PARTICIPANTS.operator} onClick={()=>void run(()=>simulate({kind:'create',input}))}>Simular creación de colección</button></div>
      {state&&!state.multi&&<div className="text-sm"><p>Aprobaciones: {['Técnica','Cumplimiento','Directorio'].map((label,i)=>`${label}: ${state.approvals&(1<<i)?'aprobado':'pendiente'}`).join(' · ')}</p><p className="break-all">Hash de los parámetros: {state.digest}</p><p>Aprueban A047, FB24 y 1E8D. Después crea la colección el Operador 8A25.</p></div>}
    </section>
    {state?.multi&&<section ref={managementPanel} className={panel}>
      <h2 className="text-lg font-semibold">3. Emitir y administrar · {state.multi.name} ({state.multi.symbol})</h2>
      <a className="text-blue-700 break-all underline" target="_blank" rel="noreferrer" href={`${explorer}/address/${state.collection}`}>{state.collection}</a>
      <p>{state.multi.paused?'Pausada':'Activa'} · Tipos creados: {String(state.multi.minted)} / {String(state.multi.cap)} · Unidades en circulación: {String(state.multi.supply)}</p>
      <button className={button} disabled={disabled||!state.multi.canPause||!state.multi.pausable} onClick={()=>void run(()=>simulate({kind:state.multi!.paused?'unpause':'pause',input}))}>{state.multi.paused?'Reanudar colección':'Pausar colección'} · Simular</button>
      <p className="text-sm">La pausa afecta a todos los IDs de esta colección: bloquea emisión, transferencias y quema.</p>
      {pending&&<div className="rounded-lg bg-amber-50 p-3"><p>Verifique la transacción anterior para continuar.</p><button className={button} disabled={busy} onClick={()=>void run(confirm)}>Verificar confirmación</button></div>}
      {review&&<div className="rounded-lg bg-blue-50 p-3"><p>Hay una operación en revisión.</p><button className={button} disabled={busy} onClick={()=>setReview(undefined)}>Cancelar revisión</button></div>}
      <label className="block">Wallet destinataria (nueva emisión o transferencia)<input className="block border rounded p-2 w-full" disabled={disabled} value={recipient} onChange={e=>setRecipient(e.target.value)}/></label>
      <details open className="border rounded-lg p-4 space-y-3"><summary className="font-semibold">Crear un tipo nuevo · Nuevo ID</summary>
        <p className="text-sm">Ejemplo: 100 entradas generales del mismo tipo. Para unidades adicionales del mismo ID use los controles de abajo.</p>
        <div className="grid md:grid-cols-2 gap-3"><label>Cantidad inicial<input className="block border rounded p-2 w-full" inputMode="numeric" disabled={disabled} value={initialAmount} onChange={e=>setInitialAmount(e.target.value)}/></label><label>Máximo histórico de unidades de este tipo<input className="block border rounded p-2 w-full" inputMode="numeric" disabled={disabled} value={typeCap} onChange={e=>setTypeCap(e.target.value)}/></label></div>
        <NFTMediaPanel key={state.collection} standard="ERC1155" collection={state.collection} disabled={disabled} disabledReason={pending?'Verifique la transacción pendiente antes de cargar.':review?'Confirme o cancele la revisión antes de editar.':undefined} onURI={setURI} onBusy={setUploading}/>
        <details><summary>Usar una URI existente (avanzado)</summary><label>URI del JSON<input className="block border rounded p-2 w-full" disabled={disabled} value={uri} onChange={e=>setURI(e.target.value)}/></label></details>
        <button className={button} disabled={disabled||!uri||!state.multi.canMint||state.multi.paused||state.multi.minted>=state.multi.cap} onClick={()=>void run(()=>simulate({kind:'mint',input,recipient,uri,amount:initialAmount,cap:typeCap}))}>Crear tipo y emitir unidades · Simular</button>
      </details>
      <div className="border rounded-lg p-4 space-y-3"><h3 className="font-semibold">Administrar un tipo existente</h3>
        <label className="block">ID del tipo<input className="block border rounded p-2" inputMode="numeric" disabled={disabled} value={tokenId} onChange={e=>{setTokenId(e.target.value);setTypeState(undefined);}}/></label>
        <button className={button} disabled={disabled} onClick={()=>void run(async()=>{setTypeState(await readMultiType(injectedWallet(),record!,input,tokenId));})}>Consultar saldo y límites del ID</button>
        {typeState&&<div className="text-sm"><p>Tipo #{typeState.tokenId} · Saldo de tu wallet: {String(typeState.balance)} · En circulación: {String(typeState.supply)}</p><p>Emitidas históricamente: {String(typeState.minted)} / {String(typeState.cap)}</p><p className="break-all">Metadatos: {typeState.uri}</p></div>}
        <label className="block">Cantidad de unidades<input className="block border rounded p-2" inputMode="numeric" disabled={disabled} value={amount} onChange={e=>setAmount(e.target.value)}/></label>
        <div className="flex flex-wrap gap-2"><button className={button} disabled={disabled||!state.multi.canMint||state.multi.paused} onClick={()=>void run(()=>simulate({kind:'issue',input,recipient,tokenId,amount}))}>Emitir más unidades · Simular</button><button className={button} disabled={disabled||!state.account||state.multi.paused} onClick={()=>void run(()=>simulate({kind:'transfer',input,recipient,tokenId,amount}))}>Transferir unidades · Simular</button><button className={button} disabled={disabled||!state.account||!state.multi.burnable||state.multi.paused} onClick={()=>void run(()=>simulate({kind:'burn',input,tokenId,amount}))}>Quemar unidades · Simular</button></div>
        <p className="text-sm">La emisión adicional conserva el ID y la imagen. Transferir y quemar usan el saldo de la wallet conectada. La quema es irreversible, no elimina la colección ni repone el cupo histórico.</p>
      </div>
    </section>}
    {review&&<section className="rounded-xl border-2 border-blue-500 bg-blue-50 p-5 space-y-3" aria-label="Revisar operación"><h2 className="font-semibold">Antes de firmar</h2><p className="break-all">{review.summary}</p><p className="break-all">Firma: {review.tx.from}</p><p>Gas estimado con margen: {review.estimatedEth} ETH Sepolia. Revise el costo final en la wallet.</p><button className={button} disabled={busy} onClick={()=>void run(async()=>{localStorage.setItem(prefix+':draft',JSON.stringify(input));const sent=await sendMultiOperation(injectedWallet(),review);setPending(sent);setReview(undefined);setMessage('Transacción enviada. Verifique su confirmación antes de continuar.');localStorage.setItem(prefix+':pending',JSON.stringify(sent));})}>Confirmar en la wallet</button> <button className={button} disabled={busy} onClick={()=>setReview(undefined)}>Cancelar</button></section>}
    {pending&&<section className={panel}><h2>Transacción enviada · ERC-1155</h2><Tx hash={pending.hash}/><p>Espere la confirmación de red. No repita la operación.</p><button className={button} disabled={busy} onClick={()=>void run(confirm)}>Verificar confirmación</button></section>}
    <section className={panel}><h2 className="font-semibold">Bitácora ERC-1155 · Sepolia</h2><p className="text-sm">Para volver a una colección, pulse «Actualizar bitácora» y elija «Usar para recuperar» junto a su nombre. Se registran el factory, colecciones, emisiones, transferencias, quemas y pausas con dos bloques de espera.</p><button className={button} disabled={busy||!record} onClick={()=>void run(async()=>{setJournal(await readMultiJournal(injectedWallet(),record!));})}>Actualizar bitácora</button> <button className={button} disabled={!journal.length} onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({chainId:11155111,standard:'ERC1155',entries:journal},null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='bitacora-erc1155-sepolia.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Descargar JSON</button>
      {record&&!journal.some(entry=>entry.kind==='Factory ERC-1155')&&<div className="border-t pt-3"><p className="text-sm mb-2">Referencia guardada en este navegador · Pulse «Actualizar bitácora» para verificarla en Sepolia.</p><FactoryHash hash={record.hash} onUse={()=>useRecoveryHash(record.hash)}/></div>}
      {journal.some(entry=>entry.kind==='Colección ERC-1155')&&<div className="space-y-3"><h3 className="font-semibold">Mis colecciones · Seleccione una para administrarla</h3>{journal.filter(entry=>entry.kind==='Colección ERC-1155').map(entry=><article key={'collection:'+entry.id} className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2"><h4 className="font-semibold">{entry.collectionName||'Colección ERC-1155'} {entry.symbol&&`(${entry.symbol})`}</h4><p className="text-sm break-all">Contrato: {entry.address}</p><p className="text-sm">Tipos registrados: {journal.filter(multi=>multi.kind==='Tipo creado'&&multi.address===entry.address).map(multi=>`${multi.tokenName||'Tipo'} · #${multi.tokenId}`).join(', ')||'Sin emisiones registradas'}</p><p className="text-sm">Hash de creación de la colección:</p><Tx hash={entry.hash}/><button type="button" className={button} disabled={disabled} onClick={()=>void run(()=>openCollection(entry))}>Usar para recuperar · {entry.collectionName||'esta colección'}</button><p className="text-sm">Carga sus datos y controles de pausa. No despliega contratos ni pide una firma.</p></article>)}</div>}
      {journal.map(entry=><article key={entry.id} className="border-t pt-3 text-sm"><strong>{entry.kind}{entry.tokenId?` #${entry.tokenId}`:''}</strong><p>{entry.collectionName&&`Colección: ${entry.collectionName}`}{entry.tokenName&&` · Tipo: ${entry.tokenName}`}</p><p>Bloque {entry.block}{entry.amount!==undefined&&` · Cantidad: ${entry.amount}`}</p><p className="break-all">Contrato: {entry.address}</p>{entry.from&&<p className="break-all">Desde: {entry.from}</p>}{entry.to&&<p className="break-all">Hacia: {entry.to}</p>}{entry.kind==='Factory ERC-1155'?<FactoryHash hash={entry.hash} onUse={()=>useRecoveryHash(entry.hash)}/>:<><p>Hash de esta operación:</p><Tx hash={entry.hash}/></>}</article>)}
    </section>
  </div>;
}
