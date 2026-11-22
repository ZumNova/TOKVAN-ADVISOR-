import {useState} from 'react';
import {CheckCircle2, CircuitBoard} from 'lucide-react';
import {TokvanLogo} from '../brand/TokvanLogo';
import type {ClientProjectRecord} from '../../lib/clientProjects';
import {downloadClientFile,getClientDocument} from '../../lib/clientDocuments';

const networkName:Record<string,string>={sepolia:'Sepolia · red de prueba',polygon:'Polygon',ethereum:'Ethereum',arbitrum:'Arbitrum'};

type Props={
 record:ClientProjectRecord;
 onOpenReceived?:(record:ClientProjectRecord)=>void;
 onRemove?:(record:ClientProjectRecord)=>Promise<void>;
 canRemove:boolean;
};

export default function ReceivedProjectCard({record,onOpenReceived,onRemove,canRemove}:Props){
 const [collapsed,setCollapsed]=useState(false);
 const [removing,setRemoving]=useState(false);
 const [error,setError]=useState('');
 const project=record.project;
 async function remove(){
  if(!onRemove||!window.confirm('Quitar esta copia y sus adjuntos de este navegador? El expediente recibido seguirá en Supabase.'))return;
  setRemoving(true);setError('');
  try{await onRemove(record);}catch(e){setError(e instanceof Error?e.message:'No se pudo quitar la copia local.');}finally{setRemoving(false);}
 }
 return <article className="overflow-hidden rounded-[1.65rem] border border-[#517899] bg-[#EAF2F7] text-[#142437] shadow-[0_18px_42px_rgba(2,14,31,0.32)]">
  <div className="relative min-h-44 overflow-hidden bg-gradient-to-br from-[#142C58] via-[#176182] to-[#36A8A4] p-5 text-white">
   <div aria-hidden="true" className="absolute inset-0 opacity-30" style={{backgroundImage:'repeating-linear-gradient(90deg, transparent 0 27px, rgba(140,235,248,.45) 28px, transparent 29px), repeating-linear-gradient(0deg, transparent 0 27px, rgba(140,235,248,.28) 28px, transparent 29px)',maskImage:'linear-gradient(90deg, black, transparent 65%, black)'}}/>
   <div className="relative flex items-start justify-between gap-3"><TokvanLogo size="lg" showSubtitle={false}/><button type="button" aria-label={collapsed?`Abrir ${project.title||project.id}`:`Cerrar detalles de ${project.title||project.id}`} aria-expanded={!collapsed} onClick={()=>setCollapsed(!collapsed)} className="shrink-0 rounded-lg border border-white/50 px-3 py-1.5 text-sm text-white hover:bg-white/10">{collapsed?'Abrir':'×'}</button></div>
   <div className="relative mt-7 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9EFF5]">Constancia de pretokenización</p><p className="mt-1 text-lg font-bold">Solicitud recibida</p></div><span className="rounded-2xl border border-white/45 bg-[#12396B]/60 p-3" aria-hidden="true"><CircuitBoard size={36}/></span></div>
  </div>
  {!collapsed&&<div className="space-y-4 p-5 sm:p-6">
   <div className="flex items-start gap-2 rounded-xl bg-[#DDF5EA] px-3 py-2 text-sm font-semibold text-[#145A47]"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/>Recibido por TOKVANT · pendiente de revisión</div>
   <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#53708D]">Proyecto</p><h3 className="break-words text-lg font-bold leading-snug">{project.title||'Proyecto sin título'}</h3></div>
   <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-[#53708D]">Estándar solicitado</p><p className="font-semibold">{project.standard}</p></div><div><p className="text-xs text-[#53708D]">Red indicada</p><p className="font-semibold">{networkName[project.network]||project.network}</p></div></div>
   <div><p className="text-xs text-[#53708D]">ID del proyecto</p><p className="break-all font-mono text-xs font-semibold">{project.id}</p></div>
   <div><p className="text-xs text-[#53708D]">Recibido</p><p className="font-semibold">{record.receivedAt?new Date(record.receivedAt).toLocaleString('es-AR'):'Confirmado'}</p><p className="mt-1 break-all text-xs text-[#53708D]">Comprobante: {record.submissionId}</p></div>
   {project.contact?.email&&<p className="break-all text-xs text-[#53708D]">Contacto declarado: {project.contact.email}</p>}
   <div className="flex flex-wrap gap-2">{onOpenReceived&&<button type="button" onClick={()=>onOpenReceived(record)} className="rounded-lg bg-[#316BFA] px-4 py-2 text-sm text-white">Abrir en administración</button>}<button type="button" onClick={()=>downloadClientFile(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}),`${project.id}.json`)} className="rounded-lg border border-[#BCCCE0] px-4 py-2 text-sm text-[#12335D] hover:bg-[#E8F1FA]">Descargar resumen JSON</button>{canRemove&&onRemove&&<button type="button" disabled={removing} onClick={()=>void remove()} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-50">{removing?'Quitando…':'Quitar copia de este navegador'}</button>}</div>
   <p className="border-t border-[#CAD8E4] pt-3 text-xs text-[#53708D]">Esta constancia confirma la recepción de la solicitud. La revisión, la aprobación y la emisión se informan por separado.</p>
   <p className="text-xs text-[#53708D]">El JSON contiene el formulario y las referencias; descargá los adjuntos por separado para conservar una copia fuera del navegador.</p>
   {project.documents.filter(document=>document.storage==='browser').map(document=><button key={document.id} type="button" className="block text-left text-xs text-[#3567B7] underline break-all" onClick={()=>{setError('');void getClientDocument(project.id,document).then(blob=>downloadClientFile(blob,document.fileName)).catch(e=>setError(e.message));}}>Descargar {document.fileName}</button>)}
   {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>}
 </article>;
}
