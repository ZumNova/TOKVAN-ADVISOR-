import {useEffect,useId,useRef,useState} from 'react';
import {formatUnits} from 'ethers';
import {injectedWallet,walletError,type WalletProvider} from '../../lib/factoryWallet';
import {readManagedToken,simulateManagement,sendManagement,confirmManagement,type TokenTarget,type ManagementPending,type ManagementReview} from '../../lib/tokenManagement';

export default function TokenManagementDialog({mode,target,onClose,onConfirmed}:{mode:'burn'|'pause';target:TokenTarget;onClose:()=>void;onConfirmed:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);const titleId=useId();
  const [state,setState]=useState<Awaited<ReturnType<typeof readManagedToken>>|null>(null);
  const [amount,setAmount]=useState('1');const [review,setReview]=useState<ManagementReview|null>(null);
  const key=`tokvan:token-management:v1:${target.factory.toLowerCase()}:${target.projectReference}`;
  const [pending,setPending]=useState<ManagementPending|null>(()=>{
    try {const p=JSON.parse(localStorage.getItem(key)??'null');return p&&/^0x[0-9a-fA-F]{64}$/.test(p.hash)&&['burn','pause','unpause'].includes(p.action)&&typeof p.data==='string'&&typeof p.amount==='string'?p:null;}catch{return null;}
  });
  const [busy,setBusy]=useState(false);const lock=useRef(false);const mounted=useRef(true);
  const [message,setMessage]=useState('');const [error,setError]=useState('');
  useEffect(()=>{
    mounted.current=true;dialog.current?.showModal();
    let wallet:WalletProvider|undefined;try{wallet=injectedWallet();}catch{}
    const invalidate=()=>{setState(null);setReview(null);setMessage('Cambió la cuenta o la red. Consulte el estado otra vez.');};
    wallet?.on?.('accountsChanged',invalidate);wallet?.on?.('chainChanged',invalidate);
    return ()=>{mounted.current=false;wallet?.removeListener?.('accountsChanged',invalidate);wallet?.removeListener?.('chainChanged',invalidate);dialog.current?.close();};
  },[]);
  const run=async(action:()=>Promise<void>)=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await action();}catch(e){if(mounted.current)setError(walletError(e));}finally{lock.current=false;if(mounted.current)setBusy(false);}
  };
  const connect=()=>run(async()=>{
    setReview(null);await injectedWallet().request({method:'eth_requestAccounts'});
    setState(await readManagedToken(injectedWallet(),target));setMessage('Estado consultado en Sepolia.');
  });
  const action=mode==='burn'?'burn':state?.paused?'unpause':'pause';
  const verb=mode==='burn'?'Quemar':state?.paused?'Reanudar':'Pausar';
  const explanation=mode==='burn'
    ? 'Elimina tokens de tu saldo y reduce el total en circulación. No se puede deshacer.'
    : state?.paused?'Vuelve a permitir transferencias, emisiones y quemas. Sólo una wallet con permiso de pausa puede hacerlo.'
    : 'Detiene transferencias, emisiones y quemas hasta que reanudes el token. No elimina tokens ni cambia los saldos.';
  const simulate=()=>run(async()=>{
    setReview(null);const result=await simulateManagement(injectedWallet(),target,action,amount);
    setState(result.state);setReview(result);setMessage('Simulación correcta. Revisá la operación antes de confirmar en tu wallet.');
  });
  const submit=()=>run(async()=>{
    if(!review||pending)return;
    localStorage.setItem(key+':check','1');localStorage.removeItem(key+':check');
    const tx=await sendManagement(injectedWallet(),review);setPending(tx);setReview(null);
    try{localStorage.setItem(key,JSON.stringify(tx));}catch{setError('No se pudo guardar el hash. Copialo antes de cerrar.');}
    setMessage('Transacción enviada. Verificá la confirmación antes de repetir la acción.');
  });
  const confirm=()=>run(async()=>{
    if(!pending)return;
    const status=await confirmManagement(injectedWallet(),pending);
    if(status==='pending'){setMessage('La transacción todavía está pendiente en Sepolia.');return;}
    localStorage.removeItem(key);setPending(null);setReview(null);
    setMessage(status==='failed'?'La transacción falló. No se aplicaron cambios.':pending.action==='burn'?'Quema confirmada. El saldo y el total se actualizaron.':pending.action==='pause'?'Pausa confirmada. Las transferencias están detenidas.':'Reanudación confirmada. Las transferencias están habilitadas.');
    if(status==='confirmed')onConfirmed();
    setState(await readManagedToken(injectedWallet(),target));
  });
  const unavailable=!state||(mode==='burn'?(!state.burnable||state.paused):(!state.pausable||!state.canPause));
  const button='rounded-lg bg-[#316BFA] px-5 py-3 font-semibold text-sm disabled:opacity-40';
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}
    className="m-auto w-[calc(100%_-_2rem)] max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#273246] bg-[#141A27] p-6 text-white backdrop:bg-black/70">
    <div className="flex items-center justify-between gap-3"><h2 id={titleId} className="text-xl font-bold">{verb} tokens</h2><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-[#273246] px-3 py-2 text-sm disabled:opacity-40">Cerrar</button></div>
    <p className="my-4 rounded-lg bg-[#0B0D12] p-4 text-sm">{explanation}</p>
    <p className="text-xs text-slate-400 mb-4">Sepolia · Expediente {target.projectReference}. Esta acción usa el token ya creado; los cambios del formulario de emisión no modifican ese contrato.</p>
    <button type="button" className={button} disabled={busy} onClick={connect}>Conectar wallet y consultar estado</button>
    {state&&<div className="my-4 space-y-2 text-sm">
      <p className="break-all">Token: <a href={`https://sepolia.etherscan.io/address/${state.token}`} target="_blank" rel="noreferrer" className="text-[#7096FF] underline">{state.symbol} · {state.token}</a></p>
      <p className="text-xs break-all">Wallet: {state.account}</p>
      <p>Tu saldo: {formatUnits(state.balance,state.decimals)} {state.symbol}</p>
      <p>Total en circulación: {formatUnits(state.supply,state.decimals)} {state.symbol}</p>
      <p>Estado: <strong>{state.paused?'Pausado':'Activo'}</strong></p>
      {mode==='pause'&&!state.canPause&&<p className="text-amber-200">Esta wallet no tiene permiso de pausa. Para TKN, conectá A047.</p>}
      {mode==='burn'&&state.paused&&<p className="text-amber-200">Primero reanudá el token para poder quemar.</p>}
      {mode==='burn'&&!state.burnable&&<p className="text-amber-200">La quema no está habilitada en este token.</p>}
      {mode==='pause'&&!state.pausable&&<p className="text-amber-200">La pausa no está habilitada en este token.</p>}
    </div>}
    {mode==='burn'&&<label className="block my-4 text-sm">Cantidad a quemar de tu saldo
      <input autoComplete="off" inputMode="decimal" disabled={busy||Boolean(pending)} value={amount} onChange={event=>{setAmount(event.target.value);setReview(null);}}
        className="mt-2 w-full rounded-lg border border-[#273246] bg-[#0B0D12] p-3" />
    </label>}
    {!pending&&<button type="button" disabled={busy||unavailable} className={button+' mt-4'} onClick={simulate}>Simular {verb.toLowerCase()}</button>}
    {review&&!pending&&<div className="my-4 rounded-lg border border-[#316BFA] p-4 space-y-3 text-sm">
      <p>{review.action==='burn'?`Vas a quemar ${review.amountText} ${review.state.symbol} de tu wallet. Es irreversible.`:review.action==='pause'?'Vas a pausar este token para todos sus titulares.':'Vas a reanudar las operaciones de este token.'}</p>
      <p>Gas estimado: {review.estimatedEth} ETH Sepolia. La wallet muestra la tarifa final.</p>
      <button type="button" className={button} disabled={busy} onClick={submit}>Confirmar {review.action==='burn'?'quema':review.action==='pause'?'pausa':'reanudación'} en wallet</button>
    </div>}
    {pending&&<div className="my-4 space-y-3 text-sm"><a className="block break-all text-[#7096FF] underline" href={`https://sepolia.etherscan.io/tx/${pending.hash}`} target="_blank" rel="noreferrer">Transacción pendiente de verificar: {pending.hash}</a><button type="button" className={button} disabled={busy} onClick={confirm}>Verificar confirmación</button></div>}
    {message&&<p role="status" className="mt-4 text-sm text-slate-300">{message}</p>}
    {error&&<p role="alert" className="mt-4 text-sm text-red-300 break-words">{error}</p>}
  </dialog>;
}
