import {useState} from 'react';
import type {ClientProjectRecord} from '../../lib/clientProjects';
import {downloadClientFile,getClientDocument} from '../../lib/clientDocuments';
export default function ClientProjectHome({records,onResume,receipt,onHome}:{records:ClientProjectRecord[];onResume:(r:ClientProjectRecord)=>void;receipt?:ClientProjectRecord;onHome?:()=>void}){
 const [error,setError]=useState('');
 const rows=receipt?[receipt]:records;
 if(!rows.length)return null;
 return <section className="mx-auto max-w-5xl p-6 text-white space-y-4"><h2 className="text-xl font-semibold">{receipt?'Tu expediente está preparado':'Tus borradores y solicitudes en este navegador'}</h2>
  <p className="text-sm text-[#AABBD4]">{receipt?'Gracias por completar tu proyecto. Conservamos esta preparación en tu navegador. La recepción central y los avisos por email se habilitarán con los accesos privados; todavía no fue enviado a TOKVANT.':'Podés retomar lo guardado desde este equipo y navegador. Estas copias locales aún no se comparten con administración.'}</p>
  {rows.map(r=><article key={r.project.id} className="rounded-xl border border-[#39547C] bg-[#101A2A] p-5 space-y-3"><p className="text-xs text-[#9BA6BD] break-all">{r.project.id}</p><h3 className="font-semibold">{r.project.title||'Proyecto sin título'}</h3><p className="text-sm">{r.project.standard} · {r.stage==='draft'?`Borrador · Paso ${r.step} de 5`:'Preparado · Pendiente de envío a TOKVANT'}</p><p className="text-xs text-[#9BA6BD]">Guardado: {new Date(r.savedAt).toLocaleString('es-AR')}{r.project.contact?.email?` · Contacto: ${r.project.contact.email}`:''}</p><div className="flex gap-2 flex-wrap"><button className="rounded-lg bg-[#316BFA] px-4 py-2 text-sm" onClick={()=>onResume(r)}>{r.stage==='draft'?'Continuar borrador':'Revisar solicitud'}</button><button className="rounded-lg border border-[#39547C] px-4 py-2 text-sm" onClick={()=>downloadClientFile(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}),`${r.project.id}.json`)}>Descargar resumen JSON</button></div><p className="text-xs text-[#9BA6BD]">El JSON contiene el formulario y las referencias; descargá los adjuntos por separado para conservar una copia fuera del navegador.</p>{r.project.documents.filter(d=>d.storage==='browser').map(d=><button key={d.id} className="block text-xs text-[#9BBCFF] underline text-left break-all" onClick={()=>{setError('');void getClientDocument(r.project.id,d).then(b=>downloadClientFile(b,d.fileName)).catch(e=>setError(e.message));}}>Descargar {d.fileName}</button>)}</article>)}
  {error&&<p role="alert" className="text-red-300 text-sm">{error}</p>}
  {onHome&&<button className="rounded-lg bg-[#316BFA] px-5 py-3 text-sm" onClick={onHome}>Volver al inicio</button>}
 </section>;
}
