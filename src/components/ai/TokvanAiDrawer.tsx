import {useState,type FormEvent} from 'react';
import {X,BookOpen,Compass,Send,RefreshCw,Download,Plus} from 'lucide-react';
import type {TokenProject} from '../../types';
import {injectedWallet} from '../../lib/factoryWallet';
import {answerFromJournal,loadNotes,saveNotes,syncUsageJournal,type UsageEvent,type UsageNote,type Standard} from '../../lib/usageJournal';

interface Props {isOpen:boolean;onClose:()=>void;activeProject?:TokenProject|null;onApplyAdvisorSuggestion?:(suggestion:string)=>void;}
type Reply=ReturnType<typeof answerFromJournal>;
type Message={id:string;question:string;reply:Reply};
const standards:Standard[]=['ERC-20','ERC-721','ERC-1155','ERC-3643'];
const button='rounded-lg border border-[#405577] px-3 py-2 text-xs text-white hover:bg-[#273246] disabled:opacity-40';
function exportNotes(notes:UsageNote[]){const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'tokvan-usage-notes-v1',notes},null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='tokvan-bitacora-notas.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export const TokvanAiDrawer=({isOpen,onClose,activeProject}:Props)=>{
 const [layer,setLayer]=useState<'educativo'|'advisor'>('educativo');
 const [query,setQuery]=useState('');
 const [messages,setMessages]=useState<Message[]>([]);
 const [events,setEvents]=useState<UsageEvent[]>([]);
 const [notes,setNotes]=useState<UsageNote[]>(loadNotes);
 const [syncedAt,setSyncedAt]=useState<string>();
 const [status,setStatus]=useState<Record<Standard,string>>();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [noteOpen,setNoteOpen]=useState(false);
 const [noteStandard,setNoteStandard]=useState<Standard>('ERC-3643');
 const [noteTitle,setNoteTitle]=useState('');
 const [noteBody,setNoteBody]=useState('');
 if(!isOpen)return null;
 async function sync(){setBusy(true);setError('');try{const result=await syncUsageJournal(injectedWallet());setEvents(result.events);setStatus(result.status);setSyncedAt(result.syncedAt);}catch(e){setError(e instanceof Error?e.message:'No se pudo sincronizar Sepolia.');}finally{setBusy(false);}}
 function send(e:FormEvent){e.preventDefault();const q=query.trim();if(!q)return;const reply=answerFromJournal(q,events,notes,syncedAt);setMessages(prev=>[...prev,{id:crypto.randomUUID(),question:q,reply}]);setQuery('');}
 function addNote(e:FormEvent){e.preventDefault();if(!noteTitle.trim()||!noteBody.trim())return;try{const next=[{id:crypto.randomUUID(),createdAt:new Date().toISOString(),standard:noteStandard,title:noteTitle.trim(),body:noteBody.trim()},...notes];saveNotes(next);setNotes(next);setNoteTitle('');setNoteBody('');setNoteOpen(false);setError('');}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar la nota.');}}
 return <div role="dialog" aria-label="TOKVANT IA y bitácora de uso" className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-[#141A27] border-l border-[#273246] shadow-2xl flex flex-col text-white">
  <div className="p-4 border-b border-[#273246] flex justify-between items-center"><div><h2 className="font-bold">TOKVANT IA · Bitácora de uso</h2><p className="text-xs text-[#9BA6BD]">Aprendizaje guiado con eventos de Sepolia y notas</p></div><button onClick={onClose} aria-label="Cerrar TOKVANT IA"><X size={19}/></button></div>
  <div className="grid grid-cols-2 gap-2 p-2 border-b border-[#273246] text-xs"><button className={`${button} ${layer==='educativo'?'bg-[#316BFA]':''}`} onClick={()=>setLayer('educativo')}><BookOpen className="inline mr-1" size={14}/>Bot educativo</button><button className={`${button} ${layer==='advisor'?'bg-[#316BFA]':''}`} onClick={()=>setLayer('advisor')}><Compass className="inline mr-1" size={14}/>Advisor</button></div>
  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
   <p className="text-[#BDCAE0] text-xs">{layer==='advisor'&&activeProject?`Expediente abierto: ${activeProject.title}. `:''}Consultas en modo lectura. Las notas son testimonios del administrador; los hechos confirmados incluyen enlace a Etherscan. La demo ERC-3643 usa identidades ficticias.</p>
   <section className="rounded-xl border border-[#405577] p-3 space-y-2"><div className="flex items-center justify-between"><h3 className="font-semibold">Eventos verificados · Sepolia</h3><button className={button} disabled={busy} onClick={()=>void sync()}><RefreshCw className="inline mr-1" size={13}/>{busy?'Consultando…':'Actualizar bitácora'}</button></div>
    <p className="text-xs text-[#9BA6BD]">{syncedAt?`${events.length} eventos consultados. Última lectura: ${new Date(syncedAt).toLocaleString('es-AR')}.`:'Pulse «Actualizar bitácora» para leer las transacciones confirmadas.'}</p>
    {status&&<div className="grid grid-cols-2 gap-1 text-xs">{standards.map(s=><p key={s}><strong>{s}:</strong> {status[s]}</p>)}</div>}
    {events.length>0&&<details><summary className="cursor-pointer text-xs text-[#9BBCFF]">Ver eventos recientes</summary><ul className="mt-2 space-y-2 max-h-52 overflow-y-auto">{events.slice(0,15).map(e=><li key={e.id} className="border-t border-[#273246] pt-2 text-xs"><span>{e.standard} · {e.kind} · bloque {e.block}</span><span className="block text-[#9BA6BD] break-all">{e.description.slice(0,180)}</span><a className="text-[#9BBCFF] underline" href={`https://sepolia.etherscan.io/tx/${e.hash}`} target="_blank" rel="noreferrer">Ver transacción</a></li>)}</ul></details>}
   </section>
   <section className="rounded-xl border border-[#405577] p-3 space-y-2"><div className="flex items-center justify-between"><h3 className="font-semibold">Notas de administradores</h3><div className="flex gap-2"><button className={button} onClick={()=>setNoteOpen(v=>!v)}><Plus className="inline" size={13}/> Añadir</button><button className={button} disabled={!notes.length} onClick={()=>exportNotes(notes)} aria-label="Descargar notas"><Download size={13}/></button></div></div><p className="text-xs text-[#9BA6BD]">Se guardan en este navegador; no verifican hechos on-chain ni contienen KYC real. Puede descargar el JSON para conservarlas.</p>
    {noteOpen&&<form onSubmit={addNote} className="space-y-2"><select aria-label="Estándar de la nota" value={noteStandard} onChange={e=>setNoteStandard(e.target.value as Standard)} className="w-full bg-[#0B0D12] border border-[#405577] rounded p-2">{standards.map(s=><option key={s}>{s}</option>)}</select><input aria-label="Título de la nota" className="w-full bg-[#0B0D12] border border-[#405577] rounded p-2" maxLength={120} placeholder="Ejemplo: Prueba de congelamiento de 1E8D" value={noteTitle} onChange={e=>setNoteTitle(e.target.value)}/><textarea aria-label="Contenido de la nota" className="w-full bg-[#0B0D12] border border-[#405577] rounded p-2" maxLength={2000} rows={3} placeholder="Qué se intentó, resultado y hash si lo conoce. No incluya datos personales." value={noteBody} onChange={e=>setNoteBody(e.target.value)}/><button className={button} disabled={!noteTitle.trim()||!noteBody.trim()}>Guardar nota local</button></form>}
    {notes.length>0&&<details><summary className="cursor-pointer text-xs text-[#9BBCFF]">Ver {notes.length} notas</summary><ul className="mt-2 space-y-2">{notes.slice(0,15).map(n=><li key={n.id} className="text-xs border-t border-[#273246] pt-2"><strong>{n.standard} · {n.title}</strong><p className="text-[#BDCAE0] whitespace-pre-wrap">{n.body}</p><small className="text-[#9BA6BD]">Nota local · {new Date(n.createdAt).toLocaleString('es-AR')}</small></li>)}</ul></details>}
   </section>
   {messages.map(m=><section key={m.id} className="space-y-2"><p className="ml-8 bg-[#316BFA] rounded-lg p-3 text-xs">{m.question}</p><div className="mr-8 bg-[#0B0D12] border border-[#273246] rounded-lg p-3 text-xs space-y-2"><p>{m.reply.text}</p><p className="text-[#9BA6BD]">{m.reply.notice}</p>{m.reply.events.length>0&&<div><strong>Operaciones relacionadas:</strong>{m.reply.events.map(e=><p key={e.id} className="mt-1">{e.standard} · {e.kind} · bloque {e.block} · <a className="text-[#9BBCFF] underline" href={`https://sepolia.etherscan.io/tx/${e.hash}`} target="_blank" rel="noreferrer">transacción</a></p>)}</div>}{m.reply.notes.length>0&&<div><strong>Notas del administrador, sin verificar:</strong>{m.reply.notes.map(n=><p key={n.id}>{n.title}: {n.body.slice(0,200)}</p>)}</div>}</div></section>)}
   {error&&<p role="alert" className="text-red-300 text-xs">{error}</p>}
  </div>
  <form onSubmit={send} className="p-3 border-t border-[#273246] flex gap-2"><input className="flex-1 min-w-0 bg-[#0B0D12] border border-[#405577] rounded-lg p-2 text-xs" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ej.: ¿qué cambia si congelo 2 TKREG de 1E8D?"/><button className={button} disabled={!query.trim()} aria-label="Preguntar"><Send size={15}/></button></form>
 </div>;
};
