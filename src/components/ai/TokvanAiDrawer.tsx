import {useEffect,useRef,useState} from 'react';
import {X,MessageCircle} from 'lucide-react';
import {TokvanLogo} from '../brand/TokvanLogo';
import {basicIntent,countryFromLocation,isAccessPassProposal,isMiningProposal,isTaxIdQuestion,suggestObjective,suggestSector,volumeBandFromText,type SuggestedSector} from '../../lib/diagnosticAssistant';
import {containsPrivateData} from '../../../server/publicKnowledgeSearch';
import {mentionedDiagnosticField,nextDiagnosticField,unresolvedDiagnosticAnswer,type CommercialStage,type DiagnosticStage,type LeadField} from './diagnosticFlow';
import {artGuide,decimalGuide,explicitStandardQuestion,privilegedGuide,submittedProjectGuide,transferGuide,wizardGuide,wizardFallback} from './wizardGuide';

type Mode='educativo'|'operativo';
type Topic='erc20'|'erc721'|'erc1155'|'erc3643'|'wallet'|'revision'|'pago'|'despliegue'|'imagen'|'inicio';
type Answer={short:string;more:string};
type Message={id:string;question:string;answer:Answer;expanded:boolean};
type SuggestedQuestion={question:string;short:string;more:string};
interface Props {isOpen:boolean;onClose:()=>void;currentView:string;leadOpen:boolean;leadStep:1|2|3;leadField:LeadField;wizardStep:number;wizardStandard:string;}

const whatsappNumber=String(import.meta.env.VITE_TOKVANT_WHATSAPP_NUMBER||'').replace(/\D/g,'');
const whatsappReady=/^\d{8,15}$/.test(whatsappNumber);
function questionsForScreen(items:SuggestedQuestion[],view:string,leadOpen:boolean,leadStep:number,leadField:LeadField,wizardStep:number,standard:string){
 const context=(leadOpen
  ?leadStep===1?(leadField==='sector'||leadField==='sectorOther'?'activo sector empresa proyecto':leadField==='country'?'pais jurisdiccion activo':leadField==='volume'?'valor valuacion volumen emision':leadField==='objective'?'objetivo derecho tokenizacion':'activo tokenizacion proyecto')
   :leadStep===2?'empresa participantes comercial solicitud':'diagnostico proyecto estandar'
  :view==='wizard'
   ?wizardStep===1?'empresa activo proyecto jurisdiccion':wizardStep===2?'estandar token erc wallet cantidad':wizardStep===3?'derechos transferencia controles':wizardStep===4?'documentos evidencia imagen': 'solicitud revision comprobante'
  :view==='simulator'?'estandar erc blockchain red gas costo':view==='factory'?'factory emision wallet despliegue token':view==='projects'||view==='approvals'||view==='admin'?'revision compliance roles pago expediente':view==='client-confirmation'?'solicitud comprobante revision contacto':'tokenizar activo blockchain empresa proyecto')+(view==='wizard'&&standard?` ${standard.toLowerCase()}`:'');
 const terms=context.split(' ');
 const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const matching=items.map((item,index)=>({item,index,score:terms.reduce((score,term)=>score+(normalized(item.question).includes(term)?3:0)+(normalized(`${item.short} ${item.more}`).includes(term)?1:0),0)}))
  .filter(entry=>entry.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).map(entry=>entry.item);
 return matching.length?matching:items.slice(0,3);
}

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
 inicio:{short:'Contame qué activo, producto o servicio querés representar y te acompaño por el diagnóstico, un campo a la vez.',more:'Si una duda requiere revisión del equipo, podés dejarla planteada en la solicitud y avanzar con los datos que conocés.'},
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
function hint(view:string,leadOpen:boolean,leadStep:1|2|3,commercialStage:CommercialStage,diagnosticStage:DiagnosticStage,activeField:LeadField,accessStage:'usage'|'individual'|null,sowingStage:boolean,caseStage:'bees'|'wine'|'farm_stay'|null,wizardStep:number){
 if(view==='wizard')return `Estás en la solicitud completa, paso ${wizardStep} de 5. Elegí una pregunta sugerida para entender el campo que estás completando.`;
 if(caseStage)return 'Caso nuevo: aclaremos qué recibiría quien tenga el token antes de sugerir un estándar.';
 if(sowingStage)return 'Caso: lote de siembra. Aclaremos qué representa el token antes de elegir un estándar.';
 if(accessStage==='usage')return 'Caso: pases de acceso al club. Definamos primero si sirven una vez o varias veces.';
 if(accessStage==='individual')return 'Caso: pases de acceso al club. Ahora definamos si cada pase es individual o intercambiable.';
 if(leadOpen){const next=nextDiagnosticField({leadOpen,leadStep,commercialStage,diagnosticStage,activeField});return next?`Estás en el diagnóstico breve. Campo actual: «${next.label}». ${next.guidance}`:'Sigamos el diagnóstico, un campo por vez.';}
 if(view==='wizard')return 'Estás en la solicitud completa de cinco pasos. El diagnóstico breve de tres etapas era opcional. Preguntame por el campo que estés completando.';
 if(view==='factory')return 'Estás en Factories. Explorá las preguntas sobre emisión y despliegue.';
 if(view==='projects'||view==='approvals')return 'Estás en la revisión. Explorá las preguntas sobre roles y cumplimiento.';
 if(view==='simulator')return 'Estás en el simulador. Explorá las preguntas sobre estándares y costos.';
 return 'Elegí una pregunta educativa para comenzar.';
}
async function publicAnswer(question:string):Promise<Answer|null>{
 try{
  const response=await fetch('/api/public-knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});
  if(response.ok){const result=await response.json() as {answer?:Answer|null};return result.answer?.short?result.answer:null;}
 }catch{/* La guía local sigue disponible si la biblioteca no responde. */}
 return null;
}
export const TokvanAiDrawer=({isOpen,onClose,currentView,leadOpen,leadStep,leadField,wizardStep,wizardStandard}:Props)=>{
 const drawerRef=useRef<HTMLDivElement>(null);
 const [mode,setMode]=useState<Mode>('educativo');
 const [contactMessage,setContactMessage]=useState('');
 const [messages,setMessages]=useState<Message[]>([]);
 const [suggestedQuestions,setSuggestedQuestions]=useState<SuggestedQuestion[]>([]);
 const [guidedSector,setGuidedSector]=useState<SuggestedSector|null>(null);
 const [diagnosticStage,setDiagnosticStage]=useState<DiagnosticStage>(null);
 const [commercialStage,setCommercialStage]=useState<CommercialStage>('audience');
 const [accessStage,setAccessStage]=useState<'usage'|'individual'|null>(null);
 const [sowingStage,setSowingStage]=useState(false);
 const [caseStage,setCaseStage]=useState<'bees'|'wine'|'farm_stay'|null>(null);
 const [mentionedField,setMentionedField]=useState<LeadField|null>(null);
 useEffect(()=>setMentionedField(null),[leadField]);
 useEffect(()=>{
  if(!isOpen)return;
  const controller=new AbortController();
  void fetch('/api/public-knowledge',{signal:controller.signal})
   .then(response=>response.ok?response.json():{questions:[]})
   .then((result:{questions?:SuggestedQuestion[]})=>{
    if(!controller.signal.aborted)setSuggestedQuestions(Array.isArray(result.questions)?result.questions:[]);
   })
   .catch(()=>{if(!controller.signal.aborted)setSuggestedQuestions([]);});
  return ()=>controller.abort();
 },[isOpen]);
 useEffect(()=>{if(currentView==='wizard'){setGuidedSector(null);setDiagnosticStage(null);setCommercialStage('audience');setAccessStage(null);setSowingStage(false);setCaseStage(null);setMentionedField(null);}},[currentView]);
 useEffect(()=>{
  if(!isOpen)return;
  const closeOutside=(event:PointerEvent)=>{
   if(event.target instanceof Node&&!drawerRef.current?.contains(event.target))onClose();
  };
  document.addEventListener('pointerdown',closeOutside);
  return ()=>document.removeEventListener('pointerdown',closeOutside);
 },[isOpen,onClose]);
 function startNewConversation(){
  setMessages([]);
  setContactMessage('');
  setGuidedSector(null);
  setDiagnosticStage(null);
  setCommercialStage('audience');
  setAccessStage(null);
  setSowingStage(false);
  setCaseStage(null);
  setMentionedField(null);
 }
 if(!isOpen)return null;
 async function ask(question:string){
  const sector=suggestSector(question);
  const intent=basicIntent(question);
  const fieldAsked=leadOpen&&leadStep===1?mentionedDiagnosticField(question):null;
  if(fieldAsked)setMentionedField(fieldAsked);
  const activeField=fieldAsked||mentionedField||leadField;
  const standardQuestion=explicitStandardQuestion(question);
  const submittedAnswer=submittedProjectGuide(question);
  const artAnswer=artGuide(question,messages.map(message=>message.question));
  const decimalAnswer=decimalGuide(question,messages.map(message=>message.question));
  const transferAnswer=transferGuide(question);
  const privilegedAnswer=privilegedGuide(question);
  const wizardAnswer=currentView==='wizard'&&!leadOpen?wizardGuide(question,wizardStep,messages.map(message=>message.question),wizardStandard):null;
  let answer:Answer;
  if(containsPrivateData(question)){
   answer={short:'Para cuidar la privacidad, reformulá tu pregunta sin nombres, contactos, direcciones de wallet ni datos de un expediente.',more:'Podés describir un caso ficticio y preguntar por el sector, el estándar o el siguiente paso del formulario.'};
  }else if(submittedAnswer){
   answer=submittedAnswer;
  }else if(artAnswer){
   answer=artAnswer;
  }else if(standardQuestion){
   answer=(mode==='educativo'?educational:operational)[standardQuestion];
  }else if(decimalAnswer){
   answer=decimalAnswer;
  }else if(transferAnswer){
   answer=transferAnswer;
  }else if(privilegedAnswer){
   answer=privilegedAnswer;
  }else if(wizardAnswer){
   answer=wizardAnswer;
  }else if(currentView==='wizard'&&isTaxIdQuestion(question)){
   answer={short:'En «RUC / Identificación Fiscal» va el número fiscal oficial de la organización emisora, tal como figura en su registro tributario. Si todavía no lo tenés a mano, este campo no es obligatorio: podés seguir y completarlo o aclararlo después.',more:'No inventes un número ni escribas un documento personal en este chat. Cargá el dato de la empresa directamente en el formulario. El nombre del identificador cambia según el país.'};
  }else if(isMiningProposal(question)){
   const q=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   const profits=/ganancia|utilidad|rendimiento|ingreso|particip|inversor/.test(q);
   const location=countryFromLocation(question);
   if(leadOpen&&leadStep===1&&activeField==='objective'){
    answer={short:'Si el token daría participación en ganancias de la mina, la opción más cercana es «Levantamiento de capital privado mediante cuotapartes reguladas». Si todavía no está definido qué derecho recibiría el titular, elegí «Por definir con TOKVANT».',more:'Esta elección solo completa el diagnóstico preliminar. TOKVANT revisará la estructura y los derechos antes de definir un estándar o una oferta.'};
   }else if(leadOpen&&leadStep===1){
    answer={short:`En este diagnóstico elegí «Otro sector» en «Sector Económico» y escribí «Minería / extracción de oro» si corresponde. En «Descripción Específica del Activo» describí la explotación${profits?' y que querés proponer una participación en ganancias':''}. ${location?`En «País de Radicación del Activo» elegí «${location}». ¿Qué volumen aproximado querés representar?`:'¿En qué país está el yacimiento?'}`,more:'La orientación técnica y los derechos económicos se revisarán después. No elijas «Agropecuario» ni «Infraestructura» solo para poder avanzar.'};
    setGuidedSector('Otro');setDiagnosticStage(location?'volume':'country');
   }else answer=profits
    ?{short:'Para una explotación minera con participación en ganancias, en «Tipo de Activo Subyacente» elegí «Otro tipo de activo» y especificá «Actividad minera y participación en resultados». En «Memoria Descriptiva» explicá qué recibiría el titular y cómo se calcularía. ¿En qué país está el proyecto?',more:'El token no otorga por sí solo derechos sobre la mina ni sobre sus ganancias. El equipo deberá revisar la estructura, los documentos y la oferta antes de definir el estándar.'}
    :{short:`Entiendo que el activo es una explotación minera${/alta montana/.test(q)?' de alta montaña':''}. En «Tipo de Activo Subyacente» elegí «Otro tipo de activo» y escribí «Actividad minera». ${location?`Indicá «${location}» como referencia de ubicación en la memoria.`:'¿En qué país está el yacimiento?'}`,more:'En «Memoria Descriptiva del Activo» contá qué se extrae y qué derecho recibiría quien tenga el token. Si buscás repartir ganancias, explicá cómo se calcularían; TOKVANT revisará el alcance jurídico.'};
  }else if(intent==='token'){
   setGuidedSector(null);
   setDiagnosticStage(null);
   setAccessStage(null);
   setSowingStage(false);
   setCaseStage(null);
   answer={short:'Un token es una unidad digital registrada en una blockchain. Puede representar acceso, una pieza única o unidades de un proyecto, según las reglas que se definan. ¿Qué te gustaría representar con el tuyo?',more:'Tener un token no demuestra por sí solo propiedad ni derechos legales sobre un activo. Eso se define en el proyecto y sus documentos.'};
  }else if(intent==='tokvant_start'){
   setGuidedSector(null);setDiagnosticStage(null);setAccessStage(null);setSowingStage(false);setCaseStage(null);
   answer=leadOpen
    ?{short:'Estás en el diagnóstico breve de tres etapas. Empezá por «Sector Económico»: ¿qué activo o servicio querés representar?',more:'Después verás una orientación preliminar y podrás abrir la solicitud completa de cinco pasos. Si un dato aún no está definido, no hace falta inventarlo.'}
    :currentView==='wizard'
    ?{short:'Ya estás en la solicitud completa de cinco pasos. El diagnóstico breve era opcional. Completá el campo que tenés delante; si alguno te genera dudas, decime su nombre.',more:'Al terminar esta solicitud podrás enviarla a TOKVANT para revisión. El simulador también puede traer parámetros directamente a este formulario.'}
    :{short:'En la página inicial pulsá «Empezar con un diagnóstico» para una orientación breve de tres etapas. Después podrás abrir la solicitud completa de cinco pasos. ¿Qué activo o servicio querés representar?',more:'También podés entrar al simulador y pasar directamente a la solicitud completa. Ambos caminos llegan al mismo formulario final.'};
  }else if(intent==='trust'){
   setGuidedSector(null);setDiagnosticStage(null);setAccessStage(null);setSowingStage(false);setCaseStage(null);
   answer={short:'Un fideicomiso es una estructura en la que se destinan bienes a una finalidad y una persona o entidad los administra para beneficiarios definidos. ¿Querés entender el concepto o usarlo en un proyecto?',more:'Los roles, efectos y requisitos dependen del país y del contrato. En Argentina, el Código Civil y Comercial describe el contrato de fideicomiso en su artículo 1666; para un caso concreto hace falta revisión profesional.'};
  }else if(intent==='bees'||intent==='wine'||intent==='farm_stay'){
   setGuidedSector(null);setDiagnosticStage(null);setAccessStage(null);setSowingStage(false);setCaseStage(intent);
   answer=intent==='bees'
    ?{short:'Entiendo un proyecto apícola: colmenas y miel. ¿El token representaría una colmena concreta, kilos de miel o un derecho sobre los ingresos?',more:'Son modelos distintos. En el diagnóstico, el sector parece agropecuario; el estándar se decide después de definir qué recibe el titular.'}
    :intent==='wine'
    ?{short:'Entiendo una bodega y vino. ¿Querés representar botellas o lotes de vino, acceso a experiencias de la bodega o un derecho económico?',more:'La producción parece agropecuaria, pero un pase para experiencias es un servicio distinto. Primero definamos el derecho del titular.'}
    :{short:'Entiendo estadías de fin de semana en una finca. ¿El token daría una reserva concreta, varias noches de uso o una participación en los ingresos?',more:'Si es acceso a hospedaje, no lo clasificaría automáticamente como propiedad de la finca. El cobro, calendario y canje de noches necesitan funciones adicionales.'};
  }else if(intent==='start'){
   setGuidedSector(null);
   setDiagnosticStage(null);
   setAccessStage(null);
   setSowingStage(false);
   setCaseStage(null);
   answer={short:'Empezá por contar qué querés representar con el token y qué recibiría quien lo tenga. ¿Se trata de un producto, un acceso, una obra o un derecho económico?',more:'Con esa respuesta podemos orientar el diagnóstico de TOKVANT. Después se revisan el activo, la jurisdicción, los documentos y el estándar apropiado; no hace falta elegir ERC-20, 721, 1155 o 3643 todavía.'};
  }else if(intent==='sowing_lot'){
   setGuidedSector(null);
   setDiagnosticStage(null);
   setAccessStage(null);
   setSowingStage(true);
   setCaseStage(null);
   answer={short:'Entiendo un proyecto agropecuario, pero «lote de siembra» puede significar cosas distintas. ¿Querés representar la parcela de tierra, la cosecha de ese lote o un derecho sobre sus resultados?',more:'Si es una parcela individual, un lote de productos o un derecho económico, la estructura cambia. Primero definamos qué recibiría el titular; luego veremos el estándar. En el diagnóstico, «Sector Económico» sería «Agropecuario / Silvopastoril / Forestal».'};
  }else if(isAccessPassProposal(question)){
   setGuidedSector(null);
   setDiagnosticStage(null);
   setAccessStage('usage');
   setSowingStage(false);
   setCaseStage(null);
   answer={short:'Entiendo la idea: el cliente paga antes, recibe un pase digital en su celular y muestra un QR en la entrada del club. ¿El pase sirve una sola vez o permite varios ingresos?',more:'El token podría representar el derecho de acceso, pero el cobro, el QR y la validación en la puerta necesitan funciones adicionales. Primero definamos cómo se usa el pase; después vemos el estándar.'};
  }else if(caseStage){
   const q=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   const individual=/colmena|botella|reserva concreta|una reserva|una cata|individual|unica|unico/.test(q);
   const units=/kilos|miel|lote|varias noches|noches de uso|abono|membresia|varios accesos|varias catas/.test(q);
   const returns=/ingreso|ganancia|rendimiento|participacion|derecho economico/.test(q);
   if(individual||units||returns){
    answer=returns
     ?{short:'Entonces hablás de un derecho económico. Describí quién pagaría, cómo se calcularía y qué documentos lo respaldan. ¿En qué país está el proyecto?',more:'Ese derecho requiere revisión legal antes de elegir un estándar; el bot no puede inferirlo solo por el activo.'}
     :individual
     ?{short:'Si cada unidad es única, ERC-721 puede ser una opción para explorar. ¿En qué país está el activo o se presta el servicio?',more:'Antes de elegirlo hay que definir qué derecho concreto aporta el token y cómo se verifica o canjea.'}
     :{short:'Si habrá varias unidades de un mismo tipo, ERC-1155 puede ser una opción para explorar. ¿En qué país está el activo o se presta el servicio?',more:'La cantidad, el derecho de entrega o canje y los controles del servicio se definen aparte.'};
    setCaseStage(null);
    if(caseStage!=='farm_stay'){setGuidedSector('Agropecuario / Forestal');setDiagnosticStage('country');}
   }else answer={short:caseStage==='bees'?'¿Representaría una colmena concreta, kilos de miel o ingresos?':caseStage==='wine'&&/experiencia|cata|visita|acceso/.test(q)?'Si es acceso a experiencias de la bodega, ¿sería una cata concreta o varios accesos?':caseStage==='wine'?'¿Serían botellas o lotes, acceso a experiencias o ingresos?':'¿Sería una reserva, varias noches de uso o participación en ingresos?',more:'Esa respuesta define qué recibe el titular. Recién después conviene explorar el estándar.'};
  }else if(sowingStage){
   const q=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   if(/parcela|tierra|terreno|campo/.test(q))answer={short:'Si querés representar una parcela concreta, describí su ubicación y el derecho que recibiría el titular. ¿En qué país está?',more:'La parcela puede requerir documentación de titularidad y revisión del derecho ofrecido. Un token no transfiere por sí solo la propiedad de la tierra.'};
   else if(/cosecha|producto|grano|bolsa|produccion/.test(q))answer={short:'Si querés representar productos de esa cosecha, describí el producto, la cantidad y cómo se identifica el lote. ¿En qué país está?',more:'Si habrá distintos lotes o productos con varias unidades, ERC-1155 puede ser una opción; primero hay que precisar qué recibe cada titular.'};
   else if(/derecho|resultado|ganancia|rendimiento|ingreso|participacion/.test(q))answer={short:'Si representa un derecho sobre resultados, describí qué se cobraría, quién pagaría y bajo qué condiciones. ¿En qué país está el proyecto?',more:'Los derechos económicos requieren revisión jurídica antes de elegir el estándar o plantear una oferta.'};
   else answer={short:'¿Te referís a la parcela de tierra, a los productos de la cosecha o a un derecho sobre sus resultados?',more:'Elegí la opción más cercana; después podemos precisar los detalles.'};
   if(!answer.short.startsWith('¿Te referís')){setSowingStage(false);setGuidedSector('Agropecuario / Forestal');setDiagnosticStage('country');}
  }else if(accessStage==='usage'){
   const q=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   const single=/una (sola )?vez|un (solo )?ingreso|un (solo )?uso|se (quema|consume)|descartable/.test(q);
   const recurring=/varias veces|muchas veces|reutiliz|recurrent|mensual|abono|membresia|socio/.test(q);
   if(single||recurring){
    answer={short:`Entonces sería un pase ${single?'de un solo ingreso':'reutilizable'}. ¿Cada pase debe identificar a una persona concreta o todos los pases del mismo tipo pueden ser iguales?`,more:single?'Para impedir un segundo uso, la puerta debe comprobar y registrar que el pase ya fue utilizado; quemarlo es una opción, pero requiere que el contrato y el flujo de validación lo permitan.':'La validez por período y la renovación necesitan reglas adicionales; el token por sí solo no controla la puerta.'};
    setAccessStage('individual');
   }else answer={short:'Para orientar el diseño, decime primero si cada pase permite un solo ingreso o si puede usarse varias veces.',more:'Con esa respuesta podremos distinguir la validación en la puerta del tipo de token.'};
  }else if(accessStage==='individual'){
   const q=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   if(/persona|individual|unico|unica|identific|nombre|intransferible/.test(q)){
    answer={short:'Si cada pase es individual y único, ERC-721 es una opción para explorar. ¿Querés que el titular pueda transferirlo a otra persona?',more:'El QR y la comprobación de identidad se diseñan aparte. La revisión del proyecto deberá definir también privacidad, vencimiento y cómo impedir usos repetidos.'};
    setAccessStage(null);
   }else if(/iguales|identicos|mismo tipo|intercambiables|todos|varios/.test(q)){
    answer={short:'Si emitís muchos pases iguales del mismo tipo, ERC-1155 es una opción para explorar. ¿Habrá distintas categorías de acceso, como día o temporada?',more:'Cada categoría puede ser un ID con varias unidades. El pago y la lectura del QR se integran aparte; la puerta debe comprobar que el pase sigue vigente.'};
    setAccessStage(null);
   }else answer={short:'¿Cada pase identifica a una persona concreta o todos los pases de una categoría pueden ser iguales?',more:'Esa diferencia ayuda a decidir si conviene explorar ERC-721 o ERC-1155.'};
  }else if(leadOpen&&leadStep===2){
   const normalized=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   if(/(complete|llene|cargue|termine|listo|finalice).*(campo|dato|formulario)|^listo[.! ]*$/.test(normalized)){
    answer={short:'Si ya completaste los campos de «Entidad & Contacto», pulsá «Generar Diagnóstico Institucional» para ver la orientación de TOKVANT.',more:'Antes de continuar, revisá los datos obligatorios y el consentimiento en el formulario. Los dos campos de estrategia comercial son opcionales.'};
    setCommercialStage('contact');
   }else if(/que (significa|es|son)|como (completo|funciona)/.test(normalized)){
    answer={short:'«Estrategia comercial» pregunta a quién querés llegar y por qué canales. Son dos campos opcionales.',more:'Por ejemplo: clientes actuales y nuevos clientes; canales: equipo comercial o redes sociales, si realmente los usás.'};
   }else if(/canal|redes|instagram|whatsapp|equipo comercial|aliad|distribuid|vendedor/.test(normalized)||commercialStage==='channels'){
    answer={short:/equipo comercial/.test(normalized)?'Perfecto: en «¿Qué canales comerciales tiene actualmente?» escribí «Equipo comercial ya definido». Después completá los datos de contacto directamente en el formulario.':'Entendido. Anotá en «¿Qué canales comerciales tiene actualmente?» los canales que acabás de indicar. Después completá los datos de contacto directamente en el formulario.',more:'Nombre, organización y correo van en el formulario, no en este chat. Cuando termines, pulsá «Generar Diagnóstico Institucional».'};
    setCommercialStage('contact');
   }else if(/client|usuario|inversor|empresa|publico|comprador|destinad|dirigid/.test(normalized)){
    answer={short:'En «¿A quién estaría dirigido el token?» podés escribir «Clientes actuales y nuevos clientes». Ahora, ¿qué canales comerciales usás para llegar a ellos?',more:'Si todavía no tenés canales definidos, el segundo campo es opcional. Luego completá los datos de contacto directamente en el formulario.'};
    setCommercialStage('channels');
   }else{
    answer={short:'En «¿A quién estaría dirigido el token?» describí el público previsto con tus palabras. Si aún no lo sabés, podés dejarlo vacío.',more:'Después indicá tus canales comerciales actuales, si los hay. Ambos campos son opcionales.'};
   }
  }else if(leadOpen&&leadStep===1&&fieldAsked){
   const field=nextDiagnosticField({leadOpen,leadStep,diagnosticStage,commercialStage,activeField:fieldAsked});
   answer=fieldAsked==='sector'||fieldAsked==='sectorOther'
    ?{short:'«Sector Económico» está al comienzo del diagnóstico. Para una mina elegí «Otro sector» y en «Especificá el sector» escribí «Minería / extracción de oro».',more:'Después completá país, volumen estimado y descripción. El sector escrito se conservará al abrir la solicitud completa.'}
    :fieldAsked==='objective'
    ?{short:'En «Objetivo Principal de la Tokenización», si el token daría participación en ganancias, la opción más cercana es «Levantamiento de capital privado mediante cuotapartes reguladas». Si todavía no podés definir el derecho, elegí «Por definir con TOKVANT».',more:'«Titularización de cartera de crédito / factoring» corresponde a derechos de cobro de una cartera; no se elige solo porque el proyecto espera ganancias. La selección queda sujeta a revisión.'}
    :{short:`Estás en «${field?.label}». ${field?.guidance}`,more:'Si necesitás revisar una opción concreta, escribime el nombre del campo y lo que querés representar.'};
  }else if(leadOpen&&guidedSector&&diagnosticStage==='country'){
   const country=countryFromLocation(question);
   if(country){
    answer={short:`En «País de Radicación del Activo» elegí «${country}». Ahora, ¿cuál es el valor aproximado en USD de lo que querés tokenizar?`,more:'Ese valor sirve para elegir una franja en «Volumen Estimado de Emisión». Si todavía no tenés una estimación, podés dejarlo «Por definir con TOKVANT».'};
    setDiagnosticStage('volume');
   }else if(/no s[eé]|por definir|todav[ií]a no/i.test(question)){
    answer={short:'En «País de Radicación del Activo» dejá «Por definir con TOKVANT». ¿Cuál es el valor aproximado en USD de lo que querés tokenizar?',more:'El país del activo se revisará más adelante; no hace falta adivinarlo para seguir con el diagnóstico.'};
    setDiagnosticStage('volume');
   }else answer={short:'¿En qué país está el activo? Si todavía no lo sabés, elegí «Por definir con TOKVANT» en «País de Radicación del Activo».',more:'Indicá el país donde se encuentra el activo. La revisión de países de oferta y residencia de inversores viene después.'};
  }else if(leadOpen&&guidedSector&&diagnosticStage==='volume'){
   const band=volumeBandFromText(question);
   answer=band
    ?{short:`En «Volumen Estimado de Emisión» elegí «${band.replace(' - ',' a ')}». Ahora describí el activo en una frase en «Descripción Específica del Activo».`,more:'Usá una estimación de lo que pensás tokenizar, no una cifra inventada por el bot. El equipo podrá revisar la valuación y el alcance más adelante.'}
    :{short:'Si no tenés una estimación confiable, elegí «Por definir con TOKVANT» en «Volumen Estimado de Emisión». Ahora describí el activo en una frase.',more:'Las franjas del diagnóstico comienzan en USD 1 millón. Si tu proyecto vale menos o todavía no tiene valuación, dejá el dato por definir para revisión.'};
   setDiagnosticStage('description');
  }else if(leadOpen&&guidedSector&&diagnosticStage==='description'){
   answer={short:'En «Descripción Específica del Activo» escribí con tus palabras lo que acabás de contar. Ahora, ¿qué querés que reciba quien tenga el token?',more:'Ese dato ayuda a elegir «Objetivo Principal de la Tokenización». Puede ser un servicio, un derecho de cobro, unidades de un lote o una participación; el equipo revisará el alcance concreto.'};
   setDiagnosticStage('objective');
  }else if(leadOpen&&guidedSector&&diagnosticStage==='objective'){
   const objective=suggestObjective(question,guidedSector),needsMore=objective.startsWith('Para elegir');
   answer={short:needsMore?objective:`${objective} Después pulsá «Continuar a Datos de Contacto».`,more:'Esta orientación ayuda a completar el diagnóstico preliminar; TOKVANT revisará los derechos, el estándar y las reglas antes de preparar un proyecto.'};
   if(!needsMore){setGuidedSector(null);setDiagnosticStage(null);}
  }else if(leadOpen&&sector){
   const country=countryFromLocation(question);
   answer=country
    ?{short:`${sector.short} En «País de Radicación del Activo» elegí «${country}». ¿Cuál es el valor aproximado en USD de lo que querés tokenizar?`,more:'El volumen es una estimación del valor que pensás representar. Si no la tenés, elegí «Por definir con TOKVANT».'}
    :{short:`${sector.short} ¿En qué país está el activo?`,more:'Ese dato va en «País de Radicación del Activo». Después veremos el volumen, la descripción y el objetivo, uno por vez.'};
   setGuidedSector(sector.sector);
   setDiagnosticStage(country?'volume':'country');
   // En el diagnóstico, el orden del formulario tiene prioridad sobre las FAQ generales.
  }else{
   const topic=topicFor(question);
   const libraryAnswer=await publicAnswer(question);
   answer=libraryAnswer||(topic==='inicio'?(currentView==='wizard'?wizardFallback(wizardStep):unresolvedDiagnosticAnswer({leadOpen,leadStep,diagnosticStage,commercialStage,activeField})):(mode==='educativo'?educational:operational)[topic]);
  }
  setMessages(previous=>[...previous,{id:crypto.randomUUID(),question,answer,expanded:false}]);
 }
 function openWhatsapp(){
  const message=contactMessage.trim();
  if(!whatsappReady||!message)return;
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
 }
 function chooseSuggestion(item:SuggestedQuestion){
  setMessages(previous=>[...previous,{id:crypto.randomUUID(),question:item.question,answer:{short:item.short,more:item.more},expanded:false}]);
 }
 const nextField=nextDiagnosticField({leadOpen,leadStep,diagnosticStage,commercialStage,activeField:mentionedField||leadField});
 const showNextField=Boolean(nextField&&!accessStage&&!sowingStage&&!caseStage);
 const contextualQuestions=questionsForScreen(suggestedQuestions,currentView,leadOpen,leadStep,leadField,wizardStep,wizardStandard);
 return <div ref={drawerRef} role="dialog" aria-modal="false" aria-label="TOKVANT AI" className="fixed inset-y-0 right-0 z-[70] flex w-full flex-col border-l border-[#34517B] bg-[#101725] text-white shadow-2xl sm:w-[430px]">
  <header className="flex items-center justify-between border-b border-[#273246] p-4"><div className="flex items-center gap-2"><TokvanLogo variant="mark-only" size="sm"/><div><h2 className="font-bold">TOKVANT AI</h2><p className="text-xs text-[#AFC2E0]">Preguntas según tu pantalla</p></div></div><div className="flex items-center gap-2"><button type="button" onClick={startNewConversation} className="rounded-lg border border-[#45628B] px-2 py-1.5 text-xs text-[#D9E6FA] hover:bg-[#273246]">Limpiar respuestas</button><button type="button" onClick={onClose} aria-label="Cerrar asistente" className="rounded-lg p-2 hover:bg-[#273246]"><X size={18}/></button></div></header>
  <div className="grid grid-cols-2 gap-2 border-b border-[#273246] p-3 text-sm"><button type="button" aria-pressed={mode==='educativo'} onClick={()=>setMode('educativo')} className={`rounded-lg px-3 py-2 ${mode==='educativo'?'bg-[#316BFA]':'bg-[#1D2A40]'}`}>Aprender</button><button type="button" aria-pressed={mode==='operativo'} onClick={()=>setMode('operativo')} className={`rounded-lg px-3 py-2 ${mode==='operativo'?'bg-[#316BFA]':'bg-[#1D2A40]'}`}>Guía de operación</button></div>
  {contextualQuestions.length>0&&<div className="shrink-0 border-b border-[#273246] px-3 py-3"><p className="mb-2 text-xs font-semibold text-[#AFC2E0]">Tres preguntas para esta pantalla</p><div className="grid gap-2" aria-label="Preguntas educativas para esta pantalla">{contextualQuestions.map(item=><button type="button" key={item.question} onClick={()=>chooseSuggestion(item)} className="rounded-full border border-[#45628B] bg-[#1D2A40] px-4 py-2 text-left text-xs leading-snug text-[#E1ECFC] hover:border-[#78A8FF] hover:bg-[#244168] focus-visible:outline-2 focus-visible:outline-[#78A8FF]">{item.question}</button>)}</div></div>}
  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm">{messages.length===0&&<p className="rounded-xl bg-[#1D2A40] p-3 text-[#D9E6FA]">{hint(currentView,leadOpen,leadStep,commercialStage,diagnosticStage,mentionedField||leadField,accessStage,sowingStage,caseStage,wizardStep)}</p>}{messages.length===0&&suggestedQuestions.length===0&&<div className="flex flex-wrap gap-2">{(leadOpen&&leadStep===2?['Mis clientes actuales y nuevos clientes','¿Qué son los canales comerciales?']:leadOpen?['Tengo vacas','Tengo una flota de camiones','Quiero tokenizar un inmueble']:['¿Qué es ERC-20?','¿Qué es un NFT?','¿Qué es ERC-1155?','¿Qué es ERC-3643?']).map(question=><button type="button" key={question} onClick={()=>ask(question)} className="rounded-full border border-[#45628B] px-3 py-2 text-xs hover:bg-[#203A69]">{question}</button>)}</div>}
   {messages.slice(-1).map(message=><section key={message.id} className="space-y-3"><p className="rounded-xl bg-[#316BFA] p-3 text-sm font-semibold">{message.question}</p><div className="rounded-xl border border-[#334765] bg-[#0B0D12] p-4 text-base leading-relaxed"><p>{message.answer.short}</p>{message.expanded&&<p className="mt-3 text-[#B8C9E1]">{message.answer.more}</p>}{showNextField&&nextField&&<p className="mt-4 rounded-lg border border-[#45628B] bg-[#1D2A40] p-3 text-sm text-[#D9E6FA]"><strong>Campo actual: {nextField.label}.</strong> {nextField.guidance}</p>}<button type="button" className="mt-4 text-sm font-semibold text-[#9BBCFF] underline" onClick={()=>setMessages(previous=>previous.map(item=>item.id===message.id?{...item,expanded:!item.expanded}:item))}>{message.expanded?'Ver menos':'Explicame más'}</button></div></section>)}
   {messages.length===0&&<p className="text-xs text-[#8FA6C8]">Respuestas públicas revisadas por TOKVANT. Esta guía no consulta expedientes ni datos de clientes.</p>}
  </div>
  <div className="shrink-0 space-y-2 border-t border-[#273246] p-3"><label htmlFor="tokvant-contact-message" className="block text-xs font-semibold text-[#D9E6FA]">Escribí tu consulta para WhatsApp de administración</label><textarea id="tokvant-contact-message" maxLength={1000} rows={2} className="w-full resize-y rounded-lg border border-[#45628B] bg-[#0B0D12] p-2 text-sm" placeholder="Tu mensaje…" value={contactMessage} onChange={event=>setContactMessage(event.target.value)}/>{whatsappReady&&<button type="button" onClick={openWhatsapp} disabled={!contactMessage.trim()} className="inline-flex items-center gap-2 rounded-lg bg-[#316BFA] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"><MessageCircle size={17}/>Abrir WhatsApp</button>}</div>
 </div>;
};
