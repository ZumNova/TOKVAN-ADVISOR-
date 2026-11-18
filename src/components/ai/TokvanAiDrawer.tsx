import {useState,type FormEvent} from 'react';
import {X,Send} from 'lucide-react';
import {TokvanLogo} from '../brand/TokvanLogo';
import {basicIntent,countryFromLocation,isAccessPassProposal,suggestObjective,suggestSector,volumeBandFromText,type SuggestedSector} from '../../lib/diagnosticAssistant';
import {containsPrivateData} from '../../../server/publicKnowledgeSearch';
import {nextDiagnosticField,unresolvedDiagnosticAnswer,type CommercialStage,type DiagnosticStage} from './diagnosticFlow';

type Mode='educativo'|'operativo';
type Topic='erc20'|'erc721'|'erc1155'|'erc3643'|'wallet'|'revision'|'pago'|'despliegue'|'imagen'|'inicio';
type Answer={short:string;more:string};
type Message={id:string;question:string;answer:Answer;expanded:boolean};
interface Props {isOpen:boolean;onClose:()=>void;currentView:string;leadOpen:boolean;leadStep:1|2|3;}

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
function hint(view:string,leadOpen:boolean,leadStep:1|2|3,commercialStage:CommercialStage,diagnosticStage:DiagnosticStage,accessStage:'usage'|'individual'|null,sowingStage:boolean,caseStage:'bees'|'wine'|'farm_stay'|null){
 if(caseStage)return 'Caso nuevo: aclaremos qué recibiría quien tenga el token antes de sugerir un estándar.';
 if(sowingStage)return 'Caso: lote de siembra. Aclaremos qué representa el token antes de elegir un estándar.';
 if(accessStage==='usage')return 'Caso: pases de acceso al club. Definamos primero si sirven una vez o varias veces.';
 if(accessStage==='individual')return 'Caso: pases de acceso al club. Ahora definamos si cada pase es individual o intercambiable.';
 if(leadOpen){const next=nextDiagnosticField({leadOpen,leadStep,commercialStage,diagnosticStage});return next?`Sigamos el diagnóstico, un campo por vez. Ahora: «${next.label}». ${next.guidance}`:'Sigamos el diagnóstico, un campo por vez.';}
 if(view==='wizard')return 'Estás cargando una solicitud. Preguntame qué significa cualquier campo.';
 if(view==='factory')return 'Estás en Factories. Puedo explicar qué comprobar antes de firmar.';
 if(view==='projects'||view==='approvals')return 'Estás en la revisión. Puedo explicar qué hace cada rol.';
 if(view==='simulator')return 'Estás en el simulador. Preguntame por los cuatro estándares.';
 return '¿Qué querés tokenizar o qué término te gustaría entender?';
}
async function publicAnswer(question:string):Promise<Answer|null>{
 try{
  const response=await fetch('/api/public-knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});
  if(response.ok){const result=await response.json() as {answer?:Answer|null};return result.answer?.short?result.answer:null;}
 }catch{/* La guía local sigue disponible si la biblioteca no responde. */}
 return null;
}
export const TokvanAiDrawer=({isOpen,onClose,currentView,leadOpen,leadStep}:Props)=>{
 const [mode,setMode]=useState<Mode>('educativo');
 const [query,setQuery]=useState('');
 const [messages,setMessages]=useState<Message[]>([]);
 const [guidedSector,setGuidedSector]=useState<SuggestedSector|null>(null);
 const [diagnosticStage,setDiagnosticStage]=useState<DiagnosticStage>(null);
 const [commercialStage,setCommercialStage]=useState<CommercialStage>('audience');
 const [accessStage,setAccessStage]=useState<'usage'|'individual'|null>(null);
 const [sowingStage,setSowingStage]=useState(false);
 const [caseStage,setCaseStage]=useState<'bees'|'wine'|'farm_stay'|null>(null);
 function startNewConversation(){
  setMessages([]);
  setQuery('');
  setGuidedSector(null);
  setDiagnosticStage(null);
  setCommercialStage('audience');
  setAccessStage(null);
  setSowingStage(false);
  setCaseStage(null);
 }
 if(!isOpen)return null;
 async function ask(question:string){
  const sector=suggestSector(question);
  const intent=basicIntent(question);
  let answer:Answer;
  if(containsPrivateData(question)){
   answer={short:'Para cuidar la privacidad, reformulá tu pregunta sin nombres, contactos, direcciones de wallet ni datos de un expediente.',more:'Podés describir un caso ficticio y preguntar por el sector, el estándar o el siguiente paso del formulario.'};
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
    ?{short:'Ya estás en el diagnóstico de TOKVANT. Empezá por «Sector Económico»: ¿qué activo o servicio querés representar?',more:'Después completás país, volumen estimado, descripción y objetivo. Si un dato aún no está definido, decilo; no hace falta inventarlo.'}
    :{short:'En la página inicial pulsá «Empezar con un diagnóstico». El primer paso es contar qué activo o servicio querés representar. ¿Cuál es tu idea?',more:'El diagnóstico es orientativo. Luego podrás abrir un borrador, completar la solicitud y enviarla a TOKVANT para revisión.'};
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
  }else if(guidedSector&&diagnosticStage==='country'){
   const country=countryFromLocation(question);
   if(country){
    answer={short:`En «País de Radicación del Activo» elegí «${country}». Ahora, ¿cuál es el valor aproximado en USD de lo que querés tokenizar?`,more:'Ese valor sirve para elegir una franja en «Volumen Estimado de Emisión». Si todavía no tenés una estimación, podés dejarlo «Por definir con TOKVANT».'};
    setDiagnosticStage('volume');
   }else if(/no s[eé]|por definir|todav[ií]a no/i.test(question)){
    answer={short:'En «País de Radicación del Activo» dejá «Por definir con TOKVANT». ¿Cuál es el valor aproximado en USD de lo que querés tokenizar?',more:'El país del activo se revisará más adelante; no hace falta adivinarlo para seguir con el diagnóstico.'};
    setDiagnosticStage('volume');
   }else answer={short:'¿En qué país está el activo? Si todavía no lo sabés, elegí «Por definir con TOKVANT» en «País de Radicación del Activo».',more:'Indicá el país donde se encuentra el activo. La revisión de países de oferta y residencia de inversores viene después.'};
  }else if(guidedSector&&diagnosticStage==='volume'){
   const band=volumeBandFromText(question);
   answer=band
    ?{short:`En «Volumen Estimado de Emisión» elegí «${band.replace(' - ',' a ')}». Ahora describí el activo en una frase en «Descripción Específica del Activo».`,more:'Usá una estimación de lo que pensás tokenizar, no una cifra inventada por el bot. El equipo podrá revisar la valuación y el alcance más adelante.'}
    :{short:'Si no tenés una estimación confiable, elegí «Por definir con TOKVANT» en «Volumen Estimado de Emisión». Ahora describí el activo en una frase.',more:'Las franjas del diagnóstico comienzan en USD 1 millón. Si tu proyecto vale menos o todavía no tiene valuación, dejá el dato por definir para revisión.'};
   setDiagnosticStage('description');
  }else if(guidedSector&&diagnosticStage==='description'){
   answer={short:'En «Descripción Específica del Activo» escribí con tus palabras lo que acabás de contar. Ahora, ¿qué querés que reciba quien tenga el token?',more:'Ese dato ayuda a elegir «Objetivo Principal de la Tokenización». Puede ser un servicio, un derecho de cobro, unidades de un lote o una participación; el equipo revisará el alcance concreto.'};
   setDiagnosticStage('objective');
  }else if(guidedSector&&diagnosticStage==='objective'){
   const objective=suggestObjective(question,guidedSector),needsMore=objective.startsWith('Para elegir');
   answer={short:needsMore?objective:`${objective} Después pulsá «Continuar a Datos de Contacto».`,more:'Esta orientación ayuda a completar el diagnóstico preliminar; TOKVANT revisará los derechos, el estándar y las reglas antes de preparar un proyecto.'};
   if(!needsMore){setGuidedSector(null);setDiagnosticStage(null);}
  }else if(sector){
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
   answer=libraryAnswer||(topic==='inicio'?unresolvedDiagnosticAnswer({leadOpen,leadStep,diagnosticStage,commercialStage}):(mode==='educativo'?educational:operational)[topic]);
  }
  setMessages(previous=>[...previous,{id:crypto.randomUUID(),question,answer,expanded:false}]);
 }
 function send(event:FormEvent){event.preventDefault();const question=query.trim();if(!question)return;void ask(question);setQuery('');}
 const nextField=nextDiagnosticField({leadOpen,leadStep,diagnosticStage,commercialStage});
 const showNextField=Boolean(nextField&&!accessStage&&!sowingStage&&!caseStage);
 return <div role="dialog" aria-modal="false" aria-label="TOKVANT AI" className="fixed inset-y-0 right-0 z-[70] flex w-full flex-col border-l border-[#34517B] bg-[#101725] text-white shadow-2xl sm:w-[430px]">
  <header className="flex items-center justify-between border-b border-[#273246] p-4"><div className="flex items-center gap-2"><TokvanLogo variant="mark-only" size="sm"/><div><h2 className="font-bold">TOKVANT AI</h2><p className="text-xs text-[#AFC2E0]">Una respuesta a la vez</p></div></div><div className="flex items-center gap-2"><button type="button" onClick={startNewConversation} className="rounded-lg border border-[#45628B] px-2 py-1.5 text-xs text-[#D9E6FA] hover:bg-[#273246]">Nueva conversación</button><button type="button" onClick={onClose} aria-label="Cerrar asistente" className="rounded-lg p-2 hover:bg-[#273246]"><X size={18}/></button></div></header>
  <div className="grid grid-cols-2 gap-2 border-b border-[#273246] p-3 text-sm"><button type="button" aria-pressed={mode==='educativo'} onClick={()=>setMode('educativo')} className={`rounded-lg px-3 py-2 ${mode==='educativo'?'bg-[#316BFA]':'bg-[#1D2A40]'}`}>Aprender</button><button type="button" aria-pressed={mode==='operativo'} onClick={()=>setMode('operativo')} className={`rounded-lg px-3 py-2 ${mode==='operativo'?'bg-[#316BFA]':'bg-[#1D2A40]'}`}>Guía de operación</button></div>
  <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm"><p className="rounded-xl bg-[#1D2A40] p-3 text-[#D9E6FA]">{hint(currentView,leadOpen,leadStep,commercialStage,diagnosticStage,accessStage,sowingStage,caseStage)}</p>{messages.length===0&&<div className="flex flex-wrap gap-2">{(leadOpen&&leadStep===2?['Mis clientes actuales y nuevos clientes','¿Qué son los canales comerciales?']:leadOpen?['Tengo vacas','Tengo una flota de camiones','Quiero tokenizar un inmueble']:['¿Qué es ERC-20?','¿Qué es un NFT?','¿Qué es ERC-1155?','¿Qué es ERC-3643?']).map(question=><button type="button" key={question} onClick={()=>ask(question)} className="rounded-full border border-[#45628B] px-3 py-2 text-xs hover:bg-[#203A69]">{question}</button>)}</div>}
   {messages.map((message,index)=><section key={message.id} className="space-y-2"><p className="ml-6 rounded-xl bg-[#316BFA] p-3 text-xs">{message.question}</p><div className="mr-6 rounded-xl border border-[#334765] bg-[#0B0D12] p-3"><p>{message.answer.short}</p>{message.expanded&&<p className="mt-2 text-[#B8C9E1]">{message.answer.more}</p>}{index===messages.length-1&&showNextField&&nextField&&<p className="mt-3 rounded-lg border border-[#45628B] bg-[#1D2A40] p-2 text-xs text-[#D9E6FA]"><strong>Siguiente campo: {nextField.label}.</strong> {nextField.guidance}</p>}<button type="button" className="mt-2 text-xs font-semibold text-[#9BBCFF] underline" onClick={()=>setMessages(previous=>previous.map(item=>item.id===message.id?{...item,expanded:!item.expanded}:item))}>{message.expanded?'Ver menos':'Explicame más'}</button></div></section>)}
  </div>
  <form onSubmit={send} className="flex gap-2 border-t border-[#273246] p-3"><input aria-label="Escribí tu pregunta" maxLength={300} className="min-w-0 flex-1 rounded-lg border border-[#45628B] bg-[#0B0D12] p-2 text-sm" placeholder="Escribí tu pregunta…" value={query} onChange={event=>setQuery(event.target.value)}/><button type="submit" disabled={!query.trim()} aria-label="Enviar pregunta" className="rounded-lg bg-[#316BFA] px-3 disabled:opacity-40"><Send size={17}/></button></form>
  <p className="px-4 pb-3 text-[11px] text-[#8FA6C8]">Guía educativa. Consulta solo respuestas públicas revisadas; no accede a expedientes ni datos de clientes.</p>
 </div>;
};
