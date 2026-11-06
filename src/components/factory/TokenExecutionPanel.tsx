import {useEffect,useRef,useState} from 'react';
import {ZeroAddress} from 'ethers';
import {injectedWallet, PARTICIPANTS, SEPOLIA_HEX, walletError} from '../../lib/factoryWallet';
import {REVIEWERS,readTokenState,estimateTokenAction,sendTokenAction,confirmTokenTransaction,type TokenRequest,type TokenAction,type PendingTokenTransaction} from '../../lib/tokenWorkflow';
const pendingKey='tokvan:erc20:pending-transactions:v1';
function loadPending():PendingTokenTransaction[] {
  try {
    const data=JSON.parse(localStorage.getItem(pendingKey)??'[]');
    return Array.isArray(data)?data.filter(p=>p&&/^0x[0-9a-fA-F]{64}$/.test(p.hash)&&typeof p.data==='string'&&typeof p.from==='string'&&['approval','revocation','deployment'].includes(p.action)&&typeof p.digest==='string'&&typeof p.projectId==='string'):[];
  } catch {return [];}
}
export default function TokenExecutionPanel({request,onConfirmed}:{request:TokenRequest;onConfirmed:()=>void}) {
  const [state,setState]=useState<Awaited<ReturnType<typeof readTokenState>>|null>(null);
  const [review,setReview]=useState<{action:TokenAction;estimate:Awaited<ReturnType<typeof estimateTokenAction>>}|null>(null);
  const [pending,setPending]=useState(loadPending);
  const [busy,setBusy]=useState(false); const lock=useRef(false);
  const [message,setMessage]=useState('Conecte la wallet y consulte las aprobaciones reales.');
  const [error,setError]=useState('');
  useEffect(()=>{
    let wallet;try{wallet=injectedWallet();}catch{return;}
    const reset=()=>{setState(null);setReview(null);setMessage('Cuenta o red modificada. Actualice el estado antes de firmar.');};
    wallet.on?.('accountsChanged',reset);wallet.on?.('chainChanged',reset);
    return ()=>{wallet.removeListener?.('accountsChanged',reset);wallet.removeListener?.('chainChanged',reset);};
  },[]);
  const run=async(action:()=>Promise<void>)=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await action();}catch(e){setError(walletError(e));}finally{lock.current=false;setBusy(false);}
  };
  const refresh=async()=>{setReview(null);setState(await readTokenState(injectedWallet(),request));};
  const connect=()=>run(async()=>{await injectedWallet().request({method:'eth_requestAccounts'});await refresh();});
  const simulate=(action:TokenAction)=>run(async()=>{
    setReview(null);const estimate=await estimateTokenAction(injectedWallet(),request,action);
    setReview({action,estimate});setMessage('Simulación correcta. Revise la cuenta, los parámetros y el costo antes de firmar.');
  });
  const submit=()=>run(async()=>{
    if(!review||pending.some(p=>p.digest===request.digest))return;
    // A usable local journal is required before opening the signature request.
    localStorage.setItem(pendingKey,JSON.stringify(pending));
    const record=await sendTokenAction(injectedWallet(),request,review.action,review.estimate.account);
    const next=[...pending,record];setPending(next);setReview(null);
    try{localStorage.setItem(pendingKey,JSON.stringify(next));}catch{setError('No se pudo guardar el hash. Cópielo antes de salir.');}
    setMessage('Transacción enviada, todavía pendiente. Verifique su confirmación antes de continuar.');
  });
  const confirm=(record:PendingTokenTransaction)=>run(async()=>{
    const status=await confirmTokenTransaction(injectedWallet(),record);
    if(status==='pending'){setMessage('Todavía pendiente de inclusión en Sepolia.');return;}
    const next=pending.filter(p=>p.hash!==record.hash);localStorage.setItem(pendingKey,JSON.stringify(next));setPending(next);
    setMessage(status==='failed'?'La transacción falló; no se aplicaron cambios. Puede volver a simular.':'Transacción confirmada. Actualizando aprobaciones y bitácora.');
    onConfirmed();await refresh();
  });
  const activeReviewer=REVIEWERS.find(r=>r.address===state?.account);
  const alreadyApproved=Boolean(activeReviewer&&state&&(state.approvals&activeReviewer.bit));
  const alreadyCreated=state&&state.token!==ZeroAddress;
  const pendingCurrent=pending.some(p=>p.digest===request.digest);
  const button='rounded-lg border border-[#316BFA] px-4 py-2 text-sm disabled:opacity-40';
  return <div className="space-y-4 border-t border-[#273246] pt-5">
    <h3 className="text-lg font-semibold">Aprobar y crear {request.config.symbol} desde la wallet</h3>
    <p className="text-sm text-slate-300">Técnico A047 → Compliance FB24 → Directorio 1E8D → Operador 8A25. Cambie la cuenta en su wallet para cada firma.</p>
    <div className="flex flex-wrap gap-3">
      <button className={button} disabled={busy} onClick={connect}>Conectar wallet y consultar</button>
      <button className={button} disabled={busy} onClick={()=>run(async()=>{await injectedWallet().request({method:'wallet_switchEthereumChain',params:[{chainId:SEPOLIA_HEX}]});await refresh();})}>Cambiar a Sepolia</button>
      <button className={button} disabled={busy} onClick={()=>run(refresh)}>Actualizar aprobaciones</button>
    </div>
    <ul className="grid sm:grid-cols-3 gap-3 text-sm">{REVIEWERS.map(r=><li className="rounded-lg bg-[#0B0D12] p-3" key={r.bit}>{r.label}: {alreadyCreated?'Emisión ejecutada':state?(state.approvals&r.bit?'Aprobado':'Pendiente'):'Sin consultar'}</li>)}</ul>
    {state&&<p className="text-xs break-all">Cuenta: {state.account||'Sin conectar'} · Rol: {activeReviewer?.label??(state.account===PARTICIPANTS.operator?'Operador':'Sin permiso de emisión')}</p>}
    {alreadyCreated?<p className="text-green-300 text-sm break-all">Token creado: <a className="underline" href={`https://sepolia.etherscan.io/address/${state.token}`} target="_blank" rel="noreferrer">{state.token}</a></p>:<div className="flex flex-wrap gap-3">
      <button className={button} disabled={busy||!activeReviewer||alreadyApproved||pendingCurrent} onClick={()=>simulate('approval')}>Simular aprobación</button>
      <button className={button} disabled={busy||!activeReviewer||!alreadyApproved||pendingCurrent} onClick={()=>simulate('revocation')}>Simular revocación</button>
      <button className={button} disabled={busy||state?.account!==PARTICIPANTS.operator||state?.approvals!==7||pendingCurrent} onClick={()=>simulate('deployment')}>Simular creación del token</button>
    </div>}
    {review&&<div className="rounded-lg border border-[#7096FF] p-4 space-y-3 text-sm">
      <p>Operación: {review.action==='deployment'?'Crear token':review.action==='approval'?'Aprobar emisión':'Revocar aprobación'} · Costo estimado: {review.estimate.estimatedEth} ETH Sepolia.</p>
      <p className="break-all">Firma: {review.estimate.account}</p>
      <button className={button+' bg-[#316BFA]'} disabled={busy||pendingCurrent} onClick={submit}>Firmar {review.action==='deployment'?'creación':review.action==='approval'?'aprobación':'revocación'} en wallet</button>
    </div>}
    {pending.length>0&&<div className="space-y-3"><h4 className="font-semibold">Transacciones pendientes de verificar</h4>{pending.map(p=><div className="text-xs break-all space-y-2" key={p.hash}>
      <a className="text-[#7096FF] underline" href={`https://sepolia.etherscan.io/tx/${p.hash}`} target="_blank" rel="noreferrer">{p.action} · {p.hash}</a>
      <button className={button+' block'} disabled={busy} onClick={()=>confirm(p)}>Verificar confirmación</button>
    </div>)}</div>}
    <p role="status" className="text-sm text-slate-300">{message}</p>
    {error&&<p role="alert" className="text-sm text-red-300 break-words">{error}</p>}
  </div>;
}
