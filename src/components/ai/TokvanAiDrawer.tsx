import {useState,type FormEvent} from 'react';
import {X,Send} from 'lucide-react';
import {TokvanLogo} from '../brand/TokvanLogo';
import {suggestObjective,suggestSector,type SuggestedSector} from '../../lib/diagnosticAssistant';
import {containsPrivateData} from '../../../server/publicKnowledgeSearch';

type Mode='educativo'|'operativo';
type Topic='erc20'|'erc721'|'erc1155'|'erc3643'|'wallet'|'revision'|'pago'|'despliegue'|'imagen'|'inicio';
type Answer={short:string;more:string};
type Message={id:string;question:string;answer:Answer;expanded:boolean};
interface Props {isOpen:boolean;onClose:()=>void;currentView:string;leadOpen:boolean;}

const educational:Record<Topic,Answer>={
 erc20:{short:'ERC-20 crea unidades iguales entre sí. Sirve, por ejemplo, para puntos digitales de una comunidad ficticia.',more:'Primero se definen nombre, cantidad y administración. Después se revisan sus reglas y se crea el contrato. El estándar por sí solo no determina derechos económicos ni habilitaciones legales.'},
 erc721:{short:'ERC-721 crea piezas únicas. Una obra digital ficticia puede tener un NFT con imagen y número propios.',more:'La colección es el contrato; cada pieza emitida tiene un ID y una URI de metadatos. Crear la colección y emitir una pieza son pasos distintos.'},
 erc1155:{short:'ERC-1155 reúne varios tipos en una colección. Cada tipo puede tener muchas unidades, como lotes ficticios de productos.',more:'Cada tipo usa un ID, una cantidad y sus metadatos. Se puede emitir, transferir o quemar unidades según las reglas configuradas.'},
 erc3643:{short:'ERC-3643 incorpora controles de identidad y elegibilidad para recibir o transferir tokens.',more:'Antes de mover unidades, el sistema consulta acreditaciones, país y otras reglas. La prueba de TOKVANT en Sepolia usa identidades ficticias y no habilita una oferta real.'},
 wallet:{short:'Una wallet es la cuenta que firma y recibe activos. Su dirección pública se puede compartir; su clave privada, nunca.',more:'Antes de firmar, comprobá la red, la dirección receptora y la acción mostrada en la wallet.'},
 revision:{short:'La revisión comprueba que la solicitud y sus documentos estén completos antes de preparar un token.',more:'Cada rol registra su conclusión. Una aprobación de prueba no reemplaza una revisión profesional para un caso real.'},
 pago:{short:'El pago del servicio se registra contra el expediente antes de autorizar la preparación.',more:'Contaduría verifica el cobro fuera de la dapp, adjunta el comprobante privado y firma el recibo. Esa firma no crea tokens.'},
 despliegue:{short:'Desplegar es crear un contrato en la red. La wallet muestra la operación y el gas antes de firmar.',more:'Después se confirma la transacción y se vincula el resultado al expediente para consultarlo.'},
 imagen:{short:'La imagen de un NFT se carga junto con sus metadatos antes de emitir la pieza o el tipo.',more:'El JSON contiene el enlace a la imagen. Revisá ambos enlaces antes de emitir, porque la URI puede quedar fija en el token.'},
 inicio:{short:'No tengo información suficiente para responderte con certeza. Esta pregunta necesita que la revise una persona del equipo TOKVANT.',more:'Seguí completando tu solicitud con lo que sabés y señalá esta duda en la descripción. Cuando la envíes, el equipo podrá revisarla y responderte por el contacto que indiques.'},
};
const operational:Record<Topic,Answer>={
 ...educational,
 erc20:{short:'Para ERC-20, revisá supply, administradora, tesorería y controles antes de preparar la emisión.',more:'Comprobá que el estándar solicitado coincide con el factory. Después verificá aprobaciones y wallet operadora antes de crear el token.'},
 erc721:{short:'En ERC-721, crear la colección y emitir el NFT son operaciones separadas.',more:'Verificá máximo histórico, administradora y aprobaciones. Para emitir, revisá destinataria y URI del JSON antes de firmar.'},
 erc1155:{short:'En ERC-1155, verificá el máximo de tipos y luego cada ID, su imagen y sus unidades.',more:'Cada tipo nuevo consume un cupo. La emisión adicional de un ID conserva sus metadatos y respeta su límite histórico.'},
 erc3643:{short:'En ERC-3643, consultá identidad, país, cupo y congelamiento antes de emitir o transferir.',more:'La receptora necesita acreditación vigente. La transferencia ordinaria aplica las reglas del contrato; las acciones extraordinarias requieren revisión específica.'},
 revision:{short:'Antes de firmar, comprobá expediente, versión, observaciones y rol activo.',more:'Cada revisor firma su parte. Si algo no coincide, solicitá corrección. La autorización administrativa viene después de dictámenes y pago.'},
 pago:{short:'Contaduría firma el recibo tras verificar el cobro y adjuntar el comprobante privado.',more:'Comprobá importe, moneda, referencia y expediente. Luego actualizá la bitácora compartida para ver el pago verificado.'},
 despliegue:{short:'Antes del despliegue, compará los parámetros autorizados con la transacción de la wallet.',more:'Tras la confirmación, guardá el hash de creación y vinculá el contrato al expediente. El hash del factory y el del token son distintos.'},
};
function topicFor(question:string):Topic{
 const q=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/3643|identidad|kyc|kyb|acreditacion|congel/.test(q))return 'erc3643';
 if(/1155|multitoken|varios tipos|lotes/.test(q))return 'erc1155';
 if(/721|nft|coleccion|obra unica/.test(q))return 'erc721';
 if(/erc.?20|fungible|supply/.test(q))return 'erc20';
 if(/imagen|ipfs|uri|metadato|pinata/.test(q))return 'imagen';
 if(/wallet|red|sepolia|firma|direccion/.test(q))return 'wallet';
 if(/pago|comprobante|contadur/.test(q))return 'pago';
 if(/revision|aproba|compliance|dictamen/.test(q))return 'revision';
 if(/despleg|factory|contrato|gas/.test(q))return 'despliegue';
 return 'inicio';
}
function hint(view:string,leadOpen:boolean){
 if(leadOpen)return 'Contame qué activo o proyecto tenés. Te ayudo a elegir el sector y después el objetivo, de a un paso.';
 if(view==='wizard')return 'Estás cargando una solicitud. Preguntame qué significa cualquier campo.';
 if(view==='factory')return 'Estás en Factories. Puedo explicar qué comprobar antes de firmar.';
 if(view==='projects'||view==='approvals')return 'Estás en la revisión. Puedo explicar qué hace cada rol.';
 if(view==='simulator')return 'Estás en el simulador. Preguntame por los cuatro estándares.';
 return '¿Qué querés tokenizar o qué término te gustaría entender?';
}
export const TokvanAiDrawer=({isOpen,onClose,currentView,leadOpen}:Props)=>{
 const [mode,setMode]=useState<Mode>('educativo');
 const [query,setQuery]=useState('');
 const [messages,setMessages]=useState<Message[]>([]);
 const [guidedSector,setGuidedSector]=useState<SuggestedSector|null>(null);
 if(!isOpen)return null;
 async function ask(question:string){
  const sector=suggestSector(question);
  let answer:Answer;
  if(containsPrivateData(question)){
   answer={short:'Para cuidar la privacidad, reformulá tu pregunta sin nombres, contactos, direcciones de wallet ni datos de un expediente.',more:'Podés describir un caso ficticio y preguntar por el sector, el estándar o el siguiente paso del formulario.'};
  }else if(guidedSector&&/quiero|represent|comercial|vender|token|parte|lote|derecho|particip/i.test(question)&&!/^tengo\b/i.test(question)){
   answer={short:suggestObjective(question,guidedSector),more:'Es una orientación preliminar para completar «Objetivo Principal». Describí el derecho o producto concreto; TOKVANT revisará después el estándar y las reglas aplicables.'};
   setGuidedSector(null);
  }else if(sector){
   answer={short:`${sector.short} ¿Qué querés representar o comercializar con el token?`,more:'El sector describe tu actividad o activo. El objetivo describe qué recibiría el titular del token. Elegir el sector todavía no determina el estándar.'};
   setGuidedSector(sector.sector);
  }else{
   const topic=topicFor(question);
   answer=(mode==='educativo'?educational:operational)[topic];
   try{
    const response=await fetch('/api/public-knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});
    if(response.ok){const result=await response.json() as {answer?:Answer|null};if(result.answer?.short)answer=result.answer;}
   }catch{/* La guía local sigue disponible si la biblioteca no responde. */}
  }
  setMessages(previous=>[...previous,{id:crypto.randomUUID(),question,answer,expanded:false}]);
 }
 function send(event:FormEvent){event.preventDefault();const question=query.trim();if(!question)return;void ask(question);setQuery('');}
 return <div role="dialog" aria-modal="false" aria-label="TOKVANT AI" className="fixed inset-y-0 right-0 z-[70] flex w-full flex-col border-l border-[#34517B] bg-[#101725] text-white shadow-2xl sm:w-[430px]">
  <header className="flex items-center justify-between border-b border-[#273246] p-4"><div className="flex items-center gap-2"><TokvanLogo variant="mark-only" size="sm"/><div><h2 className="font-bold">TOKVANT AI</h2><p className="text-xs text-[#AFC2E0]">Una respuesta a la vez</p></div></div><button type="button" onClick={onClose} aria-label="Cerrar asistente" className="rounded-lg p-2 hover:bg-[#273246]"><X size={18}/></button></header>
  <div className="grid grid-cols-2 gap-2 border-b border-[#273246] p-3 text-sm"><button type="button" aria-pressed={mode==='educativo'} onClick={()=>setMode('educativo')} className={`rounded-lg px-3 py-2 ${mode==='educativo'?'bg-[#316BFA]':'bg-[#1D2A40]'}`}>Aprender</button><button type="button" aria-pressed={mode==='operativo'} onClick={()=>setMode('operativo')} className={`rounded-lg px-3 py-2 ${mode==='operativo'?'bg-[#316BFA]':'bg-[#1D2A40]'}`}>Guía de operación</button></div>
  <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm"><p className="rounded-xl bg-[#1D2A40] p-3 text-[#D9E6FA]">{hint(currentView,leadOpen)}</p>{messages.length===0&&<div className="flex flex-wrap gap-2">{(leadOpen?['Tengo vacas','Tengo una flota de camiones','Quiero tokenizar un inmueble']:['¿Qué es ERC-20?','¿Qué es un NFT?','¿Qué es ERC-1155?','¿Qué es ERC-3643?']).map(question=><button type="button" key={question} onClick={()=>ask(question)} className="rounded-full border border-[#45628B] px-3 py-2 text-xs hover:bg-[#203A69]">{question}</button>)}</div>}
   {messages.map(message=><section key={message.id} className="space-y-2"><p className="ml-6 rounded-xl bg-[#316BFA] p-3 text-xs">{message.question}</p><div className="mr-6 rounded-xl border border-[#334765] bg-[#0B0D12] p-3"><p>{message.answer.short}</p>{message.expanded&&<p className="mt-2 text-[#B8C9E1]">{message.answer.more}</p>}<button type="button" className="mt-2 text-xs font-semibold text-[#9BBCFF] underline" onClick={()=>setMessages(previous=>previous.map(item=>item.id===message.id?{...item,expanded:!item.expanded}:item))}>{message.expanded?'Ver menos':'Explicame más'}</button></div></section>)}
  </div>
  <form onSubmit={send} className="flex gap-2 border-t border-[#273246] p-3"><input aria-label="Escribí tu pregunta" maxLength={300} className="min-w-0 flex-1 rounded-lg border border-[#45628B] bg-[#0B0D12] p-2 text-sm" placeholder="Escribí tu pregunta…" value={query} onChange={event=>setQuery(event.target.value)}/><button type="submit" disabled={!query.trim()} aria-label="Enviar pregunta" className="rounded-lg bg-[#316BFA] px-3 disabled:opacity-40"><Send size={17}/></button></form>
  <p className="px-4 pb-3 text-[11px] text-[#8FA6C8]">Guía educativa. Consulta solo respuestas públicas revisadas; no accede a expedientes ni datos de clientes.</p>
 </div>;
};
