import {useEffect,useRef,useState} from 'react';
import {injectedWallet,walletError} from '../../lib/factoryWallet';
import {FACTORY_REGISTRY,FACTORY_JOURNAL_ENTRY,readJournal,type JournalEntry} from '../../lib/tokenWorkflow';
export default function FactoryJournal({revision}:{revision:number}) {
  const [entries,setEntries]=useState<JournalEntry[]>([FACTORY_JOURNAL_ENTRY]);
  const [busy,setBusy]=useState(false);const lock=useRef(false);
  const [error,setError]=useState('');const [updated,setUpdated]=useState('');
  const refresh=async()=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{setEntries(await readJournal(injectedWallet()));setUpdated(new Date().toLocaleString('es-AR'));}
    catch(e){setError(walletError(e));}finally{lock.current=false;setBusy(false);}
  };
  useEffect(()=>{if(revision>0)void refresh();},[revision]);
  const download=()=>{
    const body=JSON.stringify({chainId:11155111,factory:FACTORY_REGISTRY.address,lastSyncedAt:updated||null,entries},null,2);
    const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='tokvan-bitacora-sepolia.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <section className="rounded-2xl bg-[#141A27] border border-[#273246] p-5 space-y-4">
    <h2 className="text-xl font-semibold">Bitácora de Sepolia · ERC-20</h2>
    <p className="text-sm text-slate-300">Factory registrado y eventos confirmados de aprobación, revocación y creación de tokens. La cadena conserva el historial; los envíos pendientes se guardan en este navegador. Se consultan eventos hasta dos bloques antes del último: después de confirmar, espere unos segundos y sincronice.</p>
    <div className="flex flex-wrap gap-3">
      <button disabled={busy} onClick={refresh} className="rounded-lg border border-[#316BFA] px-4 py-2 text-sm disabled:opacity-40">{busy?'Leyendo Sepolia…':'Sincronizar bitácora'}</button>
      <button onClick={download} className="rounded-lg border border-[#273246] px-4 py-2 text-sm">Descargar bitácora JSON</button>
    </div>
    <p className="text-xs text-slate-400">{updated?`Última consulta: ${updated}`:'Factory confirmado el 05/11/2026. Sincronice con su wallet en Sepolia para consultar eventos posteriores.'}</p>
    <div className="space-y-3">{entries.map(entry=><article key={entry.id} className="rounded-xl bg-[#0B0D12] p-4 text-xs space-y-2">
      <div className="flex flex-wrap justify-between gap-2"><strong>{entry.kind} · {entry.tokenSymbol ?? 'ERC-20'}{entry.tokenName ? ` · ${entry.tokenName}` : ''}</strong><span className="text-green-300">Confirmado · bloque {entry.blockNumber}</span></div>
      <a className="block break-all text-[#7096FF] underline" href={`https://sepolia.etherscan.io/address/${entry.address}`} target="_blank" rel="noreferrer">{entry.address}</a>
      <a className="block break-all text-slate-300 underline" href={`https://sepolia.etherscan.io/tx/${entry.transactionHash}`} target="_blank" rel="noreferrer">Transacción: {entry.transactionHash}</a>
      {entry.digest&&<p className="break-all text-slate-400">Emisión (hash): {entry.digest}</p>}
      {entry.projectId&&<p className="break-all text-slate-400">Expediente (hash): {entry.projectId}</p>}
      {entry.admin&&<p className="break-all">Administración: {entry.admin} · Tesorería: {entry.treasury}</p>}
    </article>)}</div>
    {error&&<p role="alert" className="text-sm text-red-300 break-words">No se pudo actualizar la bitácora: {error}</p>}
  </section>;
}
