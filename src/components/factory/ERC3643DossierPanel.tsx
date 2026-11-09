import {DOSSIER_FIELDS,demoDossier,productionReadiness,type Dossier} from '../../lib/erc3643Dossier';
export default function ERC3643DossierPanel({value,onChange,disabled}:{value:Dossier;onChange:(v:Dossier)=>void;disabled:boolean}){
 const completed=DOSSIER_FIELDS.filter(([key])=>(value.fields[key]||'').trim().length>=8).length;
 return <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
  <h2 className="text-lg font-semibold">1. Expediente educativo · Dónde documentar cada habilitación</h2>
  <p>Campos declarativos: {completed}/{DOSSIER_FIELDS.length}. Completarlos no acredita cumplimiento legal. En producción se deberá determinar lo aplicable para cada país de emisión, oferta y residencia del inversor.</p>
  <p className="rounded-lg bg-amber-50 p-3 text-amber-900">{productionReadiness().reason}</p>
  <p className="text-sm">Usá solo referencias ficticias. Los textos quedan en este navegador y en el JSON que descargues; únicamente su hash se vincula a la emisión. No ingreses documentos personales, claves ni información sensible. Un hash tampoco garantiza confidencialidad de datos predecibles.</p>
  <button type="button" disabled={disabled} className="rounded-lg border px-4 py-2 disabled:opacity-40" onClick={()=>onChange(demoDossier())}>Cargar expediente ficticio de ejemplo</button>
  <div className="space-y-3">{DOSSIER_FIELDS.map(([key,label,help])=><details key={key} className="rounded border p-3"><summary className="cursor-pointer font-medium">{label} · {(value.fields[key]||'').trim().length>=8?'Documentado (sin verificar)':'Pendiente'}</summary><p className="text-sm my-2">{help}</p><label className="block">Referencia y explicación de prueba<textarea maxLength={2000} rows={3} disabled={disabled} className="mt-1 block w-full rounded border p-2" value={value.fields[key]||''} onChange={e=>onChange({...value,fields:{...value.fields,[key]:e.target.value},acknowledged:false})}/></label></details>)}</div>
  <label className="flex gap-2"><input type="checkbox" disabled={disabled} checked={value.acknowledged} onChange={e=>onChange({...value,acknowledged:e.target.checked})}/>Entiendo que este expediente y las acreditaciones son ficticios, exclusivos de Sepolia, sin habilitación para mainnet.</label>
  <p className="text-sm">Para un caso real: añadir por país el requisito aplicable, autoridad, norma vigente, responsable, evidencia privada, fecha/vencimiento y conclusión de la revisión profesional. Justificar lo no aplicable; no marcarlo como aprobado automáticamente.</p>
 </section>;
}
