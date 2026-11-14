import {useState} from 'react';
import {formatUnits,getAddress} from 'ethers';
import {DEPLOYER,PARTICIPANTS,injectedWallet} from '../../lib/factoryWallet';
import {readRegIdentity, type RegInput, type RegRecord, readRegState} from '../../lib/erc3643Workflow';
import {loadParticipants,proposeParticipant,registerRegulatedToken,type ParticipantRoster} from '../../lib/regulatedParticipants';

type State=Awaited<ReturnType<typeof readRegState>>;
type Live=Awaited<ReturnType<typeof readRegIdentity>>;
type Props={state:State;record:RegRecord;input:RegInput;staffAccount:string|null;onPick:(wallet:string,country:number|null,reference:string)=>void};
const button='rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-900 disabled:opacity-40';
export default function ERC3643ParticipantsPanel({state,record,input,staffAccount,onPick}:Props){
 const [roster,setRoster]=useState<ParticipantRoster|null>(null),[live,setLive]=useState<Record<string,Live|null>>({});
 const [wallet,setWallet]=useState(''),[reference,setReference]=useState(''),[country,setCountry]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const token=state.token,d=state.details!;
 const isOwner=staffAccount&&getAddress(staffAccount)===getAddress(DEPLOYER);
 const isCompany=staffAccount&&getAddress(staffAccount)===getAddress(d.owner);
 const isAuthority=staffAccount&&getAddress(staffAccount)===getAddress(PARTICIPANTS.complianceReviewer);
 const allowed=new Set(input.countries.split(',').map(v=>Number(v.trim())));
 async function run(fn:()=>Promise<void>){setBusy(true);setError('');setMessage('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'No se pudo completar la operación.');}finally{setBusy(false);}}
 async function refresh(){if(!staffAccount)throw new Error('Conectá una wallet del equipo.');const result=await loadParticipants(staffAccount,token);setRoster(result);const checks=await Promise.allSettled(result.items.map(row=>readRegIdentity(injectedWallet(),state,row.wallet_address)));setLive(Object.fromEntries(result.items.map((row,index)=>[row.wallet_address,checks[index].status==='fulfilled'?checks[index].value:null])));setMessage(result.token?'Registro y estado de Sepolia actualizados.':'La 047 debe vincular CORPO al registro una vez.');}
 async function register(){if(!staffAccount||!isOwner)throw new Error('Solo la 047 puede vincular este token.');await registerRegulatedToken(staffAccount,token,record.address,d.owner,d.authority,input.projectReference,d.name,d.symbol);await refresh();}
 async function propose(){if(!staffAccount||!isCompany)throw new Error('Conectá la wallet propietaria del token.');if(!roster?.token)throw new Error('La 047 debe vincular primero este token.');const nextCountry=country.trim()?Number(country):null;await proposeParticipant(staffAccount,token,wallet,reference.trim().toUpperCase(),nextCountry);setWallet('');setReference('');setCountry('');setRoster(null);setLive({});setMessage('Wallet propuesta. Pulsá «Actualizar registro» para consultar su estado en Sepolia.');}
 return <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
  <h2 className="text-lg font-semibold">Participantes de CORPO · registro operativo</h2>
  <p className="text-sm">La empresa propone wallets; FB24 acredita identidades ficticias en la sección 4. La aptitud para recibir se consulta en Sepolia. Registrar una wallet aquí no le otorga permisos administrativos ni mueve tokens.</p>
  <p className="break-all text-xs">Token: {token}</p>
  <div className="flex gap-2 flex-wrap"><button className={button} disabled={busy||!staffAccount} onClick={()=>void run(refresh)}>Actualizar registro y estados</button>{isOwner&&!roster?.token&&<button className={button} disabled={busy} onClick={()=>void run(register)}>Vincular este token al registro · 047</button>}</div>
  {roster?.token&&<p className="text-sm">Registro compartido: {roster.items.length} wallet(s) · Propietaria {roster.token.admin_wallet}</p>}
  {roster?.token&&isCompany&&<div className="rounded border p-3 space-y-3"><h3 className="font-medium">Proponer wallet receptora</h3><p className="text-xs">Solo una referencia interna, sin nombre, email ni datos personales. Ejemplo: INV_CORPO_001.</p><div className="grid gap-3 md:grid-cols-3"><label className="text-sm">Wallet<input className="mt-1 block w-full rounded border p-2" value={wallet} onChange={e=>setWallet(e.target.value)} placeholder="0x…"/></label><label className="text-sm">Código interno<input className="mt-1 block w-full rounded border p-2" value={reference} onChange={e=>setReference(e.target.value)} placeholder="INV_CORPO_001"/></label><label className="text-sm">País propuesto (opcional)<input className="mt-1 block w-full rounded border p-2" value={country} onChange={e=>setCountry(e.target.value)} placeholder="032 o 600" inputMode="numeric"/></label></div><button className={button} disabled={busy||!wallet||!reference} onClick={()=>void run(propose)}>Agregar a revisión</button></div>}
  {roster?.items.map(row=>{const status=live[row.wallet_address],countryAllowed=status?allowed.has(status.country):false,hasRoom=status?status.balance<state.config.walletCap:false;const ready=Boolean(status?.verified&&countryAllowed&&!status.frozen&&hasRoom);return <article className="rounded border p-3 space-y-1 text-sm" key={row.id}><p className="font-medium">{row.internal_reference} · {ready?'Acreditada y con cupo':'Pendiente o sin cupo'}</p><p className="break-all">{row.wallet_address}</p><p>{status?`Identidad: ${status.verified?'vigente':'no habilitada'} · País ${status.country}${countryAllowed?' permitido':' no permitido'} · Saldo ${formatUnits(status.balance,d.decimals)} ${d.symbol} · ${status.frozen?'Congelada':'No congelada'} · ${hasRoom?'Con cupo':'Sin cupo'}`:'Estado on-chain no disponible; actualizar o consultar manualmente.'}</p>{isAuthority&&<button className={button} disabled={busy} onClick={()=>onPick(row.wallet_address,row.proposed_country,row.internal_reference)}>Usar en acreditación (sección 4)</button>}{isCompany&&<button className={button} disabled={busy} onClick={()=>onPick(row.wallet_address,row.proposed_country,row.internal_reference)}>Usar como destinataria (sección 5)</button>}</article>;})}
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{message&&<p role="status" className="text-sm text-blue-800">{message}</p>}
 </section>;
}
