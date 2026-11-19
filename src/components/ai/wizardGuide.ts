export type WizardGuideAnswer={short:string;more:string};
import {isArtFinancialRights,isArtProposal} from '../../lib/diagnosticAssistant';
const norm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const stepNames=['','organización y activo','estándar y red','parámetros del token','documentación','revisión y envío'];

export function decimalGuide(question:string,previousQuestions:string[]=[]):WizardGuideAnswer|null{
 const q=norm(question),history=norm(previousQuestions.join(' '));
 const asksDecimals=/decim|precision|presicion/.test(q);
 const mining=/miner|mina|oro/.test(q+' '+history);
 if(!asksDecimals&&!(mining&&/conviene poner|que pongo|cual elijo|cual uso/.test(q)&&/decim|precision|presicion/.test(history)))return null;
 if(mining)return {short:'Para una prueba de token minero ERC-3643, elegiría 0 decimales si cada token representa una participación entera. Si querés vender o transferir fracciones, 2 decimales permite, por ejemplo, mover 0,25 tokens. ¿Qué derecho representa 1 token y se podrá dividir?',more:'6 o 18 decimales solo aportan fracciones aún más pequeñas; no son obligatorios para ERC-3643. La precisión no determina el valor del mineral ni crea por sí sola el derecho económico. Definí la fracción mínima que tendrá sentido para el proyecto y dejá la estructura jurídica para revisión.'};
 return {short:'La precisión decimal indica en cuántas fracciones se puede dividir 1 token: 0 = solo unidades enteras; 2 = centésimos; 6 = millonésimos; 18 = fracciones muy pequeñas. ERC-20 y ERC-3643 permiten elegirla; no exigen 18 ni 6. ¿El titular podrá transferir fracciones de una unidad?',more:'Para un token minero, la elección depende del derecho que representa cada unidad y de la fracción mínima que querés permitir, no de que el activo sea oro. ERC-721 y ERC-1155 usan unidades enteras (0). Un token 1:1 con USD o EUR no obtiene su respaldo ni su paridad por elegir 2 o 6 decimales: eso requiere reglas y reservas aparte. Definí la unidad económica antes de elegir la precisión.'};
}

export function transferGuide(question:string):WizardGuideAnswer|null{
 const q=norm(question);
 const asksRegime=/regimen de transferencia|controles de transferencia|opciones de transferencia|lista blanca|whitelist|sin restriccion|identity registry|permisos erc.?3643/.test(q);
 if(!asksRegime)return null;
 if(/lista blanca|whitelist/.test(q)&&!/tres opciones|diferencias|compar|regimen de transferencia/.test(q))return {short:'«Lista blanca» significa que una administradora autoriza direcciones concretas. Es útil cuando solo determinadas wallets pueden recibir o transferir. ¿Necesitás controlar direcciones, o verificar identidad y acreditaciones?',more:'Estar en una lista no demuestra KYC por sí solo. Los factories v1 actuales de TOKVANT no implementan whitelist: elegirla en la solicitud deja un requisito para diseñar y revisar, no activa ese control on-chain.'};
 if(/sin restriccion/.test(q)&&!/tres opciones|diferencias|compar|regimen de transferencia/.test(q))return {short:'«Sin restricción» permite transferencias sin comprobar una lista de wallets ni acreditaciones en cada envío. ¿El token puede circular libremente entre titulares?',more:'Si el contrato tiene pausa de emergencia, una pausa activa igualmente puede detener transferencias. Elegir esta opción en el formulario no determina por sí solo la clasificación jurídica del activo. En ERC-3643, el contrato de prueba sigue comprobando identidades aunque se marque otra opción.'};
 if(/identity registry|permisos erc.?3643/.test(q)&&!/tres opciones|diferencias|compar|regimen de transferencia/.test(q))return {short:'«Permisos ERC-3643» significa que el contrato consulta identidad y acreditaciones antes de permitir transferencias. Sirve para una circulación controlada entre wallets elegibles. ¿Tus destinatarios necesitan ser acreditados antes de recibir?',more:'En la prueba de TOKVANT en Sepolia, las acreditaciones son ficticias y se consultan junto con reglas como país y cupo. Registrar una wallet en una lista operativa no la acredita automáticamente.'};
 return {short:'En «Régimen de Transferencia y Controles» elegí según quién podrá recibir: ERC-3643 verifica identidad y acreditaciones; lista blanca autorizaría direcciones concretas; sin restricción no exige esas habilitaciones para transferir. ¿Qué control necesita tu proyecto?',more:'En TOKVANT v1, el factory ERC-3643 sí ejecuta controles de identidad ficticios en Sepolia. La whitelist no está implementada en los factories actuales. «Sin restricción» no elimina una pausa de emergencia si el token la tiene, y ninguna opción sustituye la revisión del derecho ofrecido.'};
}

export function privilegedGuide(question:string):WizardGuideAnswer|null{
 const q=norm(question);
 if(!/funcionalidad(?:es)? privilegiad|doble firma|multi.?sig|pausab|pausa de emergencia|proxy uups|actualizable|upgrade|quema de tokens|burnable|emision adicional|mintable/.test(q))return null;
 if(/doble firma|multi.?sig/.test(q)&&!/funcionalidad(?:es)? privilegiad/.test(q))return {short:'La doble firma significa que una operación sensible necesita autorización de más de una cuenta. Marcar estas casillas no instala una bóveda Multi-Sig ni exige dos firmas para cada acción futura.',more:'TOKVANT pide tres aprobaciones para crear ciertos tokens desde el factory, pero eso es distinto del control continuo de la wallet administradora. Si el proyecto requiere Multi-Sig real para pausar, emitir o actualizar, debe configurarse y verificarse aparte.'};
 if(/proxy uups|actualizable|upgrade/.test(q)&&!/funcionalidad(?:es)? privilegiad/.test(q))return {short:'«Actualizable mediante Proxy UUPS» permitiría cambiar la lógica del contrato conservando su dirección. Los factories v1 actuales de TOKVANT no lo implementan: marcarlo deja un requisito para diseño y revisión, pero no crea un proxy.',more:'Una actualización podría modificar reglas importantes. Para plantearla hacen falta gobierno, permisos, pruebas y auditoría específicos. En Sepolia v1 elegí esta opción solo si querés documentar esa necesidad, no para desplegar con los factories actuales.'};
 if(/quema de tokens|burnable/.test(q)&&!/funcionalidad(?:es)? privilegiad/.test(q))return {short:'«Quema de Tokens» destruye unidades de forma irreversible. Ejemplo: cancelar un pase usado o retirar una participación según reglas documentadas. ¿Quién tendría permitido quemar y en qué circunstancia?',more:'En ERC-20 v1 puede quemar el titular; en ERC-721/1155, el titular o autorizado. En el ERC-3643 de prueba un agente puede quemar saldo de otra wallet sin su firma, incluso pausado: esa facultad requiere un procedimiento especialmente claro.'};
 if(/emision adicional|mintable/.test(q)&&!/funcionalidad(?:es)? privilegiad/.test(q))return {short:'«Emisión adicional» permite crear más unidades después de la primera emisión, dentro de los límites del contrato. Ejemplo: sumar nuevas unidades de una serie; si representan participaciones, podría reducir el porcentaje relativo de los titulares anteriores. ¿El proyecto prevé nuevas unidades?',more:'La facultad corresponde a quien tenga el rol habilitado y depende del estándar y del factory. En ERC-1155 puede emitirse más de un ID existente dentro de su cupo histórico; en ERC-3643 de prueba emite un agente sujeto al máximo circulante. Documentá el límite y la autorización.'};
 if(/pausab|pausa de emergencia/.test(q)&&!/funcionalidad(?:es)? privilegiad/.test(q))return {short:'«Pausabilidad de Emergencia» permite detener operaciones normales ante un incidente y reanudarlas después. Ejemplo: suspender transferencias mientras se investiga un error. ¿Quién podría pausar y bajo qué procedimiento?',more:'En ERC-20, ERC-721 y ERC-1155 v1 la pausa también bloquea emisión y quema. En el ERC-3643 de prueba bloquea transferencias normales, pero los agentes aún pueden emitir, quemar y ejecutar acciones extraordinarias.'};
 return {short:'Estas casillas definen capacidades especiales: pausa detiene operaciones normales; quema destruye unidades; emisión adicional crea nuevas unidades; UUPS permitiría actualizar la lógica. ¿Cuál querés evaluar para tu proyecto?',more:'No todas funcionan igual: en ERC-3643 de prueba un agente puede emitir o quemar aun pausado. Los factories v1 no implementan UUPS. La doble firma Multi-Sig del título no se activa al marcar una casilla; requiere una configuración de gobierno separada.'};
}

export function explicitStandardQuestion(question:string):'erc20'|'erc721'|'erc1155'|'erc3643'|null{
 const q=norm(question).replace(/[¿?¡!.,]/g,'').trim();
 if(!/^(que es|explicame|que significa)\s+(un\s+)?(erc[ -]?(20|721|1155|3643)|nft)$/.test(q))return null;
 if(/3643$/.test(q))return 'erc3643';
 if(/1155$/.test(q))return 'erc1155';
 if(/721$|nft$/.test(q))return 'erc721';
 return 'erc20';
}

export function wizardFallback(step:number):WizardGuideAnswer{
 const name=stepNames[step]||'solicitud';
 return {short:`Estás en el paso ${step} de la solicitud completa: ${name}. Decime el nombre del campo que te genera dudas o qué querés representar; seguimos desde acá.`,more:'Si todavía no podés definir una respuesta, dejala indicada para revisión de TOKVANT y avanzá con los demás campos. No hace falta volver al diagnóstico breve.'};
}

export function submittedProjectGuide(question:string):WizardGuideAnswer|null{
 const q=norm(question);
 const submitted=/comprobante|solicitud (?:enviada|recibida)|expediente (?:enviado|recibido)|termine (?:la carga|de cargar)|ya (?:envie|mande) (?:la solicitud|el expediente)|despues de enviar/.test(q);
 const next=/que hago ahora|como sigo|siguiente paso|esper|cuanto tard|cuando (?:contest|respond)|presupuesto|precio|valor del servicio|cuanto cuesta|descarg|resumen json|contact|correo|mail/.test(q);
 if(!submitted&&!/presupuesto|precio|valor del servicio|cuanto cuesta|cuanto tardan en (?:contest|respond)/.test(q))return null;
 if(!next&&!/presupuesto|precio|valor del servicio|cuanto cuesta/.test(q))return null;
 return {short:'Si ya apareció el comprobante, TOKVANT recibió tu solicitud. Guardá su número y descargá «Resumen JSON» y los adjuntos desde «Tus borradores y solicitudes». Ahora corresponde la revisión del equipo; el presupuesto se define para tu expediente y todavía no hay un plazo de respuesta publicado.',more:'Podés descargar el JSON también desde un celular; el navegador te ofrecerá guardarlo o compartirlo según el dispositivo. Revisá el email y teléfono que cargaste: son los datos para que el equipo pueda contactarte, pero los avisos automáticos aún no están activos. El comprobante de recepción no indica que el servicio esté presupuestado, aprobado o pagado. Cuando TOKVANT publique sus canales oficiales, también podrás consultarlos allí.'};
}

export function artGuide(question:string,previousQuestions:string[]=[]):WizardGuideAnswer|null{
 const q=norm(question),context=previousQuestions.slice(-4).join(' ');
 if(!isArtProposal(question)&&!(/^(una|unica|original|una sola|varias|edicion|serie|copias|ejemplares)/.test(q)&&isArtProposal(context)))return null;
 if(isArtFinancialRights(question))return {short:'Si el token representaría ganancias, regalías o una participación en la obra, primero describí ese derecho. No alcanza con que sea arte para elegir ERC-721. ¿Venderías la pieza única o un derecho económico sobre ella?',more:'La estructura económica y sus restricciones necesitan revisión antes de recomendar el estándar.'};
 if(/\b(ediciones?|serie|copias|ejemplares|multiples unidades|varias iguales)\b/.test(q))return {short:'Si vendés una edición con varias unidades iguales, contá cuántas copias tendrá. ERC-1155 puede servir para tipos o ediciones con varias unidades; si cada pieza es distinta, ERC-721 sigue siendo una opción. ¿Son copias de una edición o piezas únicas?',more:'Definí por separado imagen, descripción y cantidad de cada pieza o edición. El derecho que recibe el comprador debe quedar escrito en el expediente.'};
 return {short:'Si querés representar una obra única —pintura, dibujo, escultura, fotografía o pieza textil— explorá un NFT ERC-721. En el diagnóstico elegí «Otro sector» y escribí «Arte»; describí la obra y, en la solicitud completa, seleccioná ERC-721. ¿Es una sola pieza o una edición con varias copias?',more:'Para una sola pieza, proponé 1 unidad y 0 decimales. Adjuntá su imagen y explicá qué recibe el titular: obra física, archivo digital, acceso o certificado. El NFT no transfiere automáticamente la propiedad física ni derechos de autor. Si hay participaciones económicas, el equipo debe revisar el modelo antes de elegir estándar.'};
}

export function wizardGuide(question:string,step:number,previousQuestions:string[],standard?:string):WizardGuideAnswer|null{
 const q=norm(question), history=norm(previousQuestions.join(' '));
 const decimalAnswer=decimalGuide(question,previousQuestions);
 if(decimalAnswer)return decimalAnswer;
 const transferAnswer=transferGuide(question);
 if(transferAnswer)return transferAnswer;
 const privilegedAnswer=privilegedGuide(question);
 if(privilegedAnswer)return privilegedAnswer;
 const asksFinal=/paso 5|revisar y finalizar|revisa(r)? (mi |el )?expediente|finalizar (la )?solicitud|enviar solicitud/.test(q);
 if(asksFinal)return {short:'En «Revisar y finalizar» comprobá los datos del proyecto, el estándar y la red, la cantidad propuesta y los adjuntos. Si algo está mal, tocá «Revisar» junto al dato y corregilo. Después enviá la solicitud; solo queda recibida cuando aparece el comprobante.',more:'La wallet del cliente es opcional; si la cargás, debe coincidir con la red propuesta. Para ERC-3643 también podés proponer wallets receptoras, sin que eso las acredite. Enviar la solicitud no despliega el token ni aprueba los documentos.'};
 const asksDocuments=/documentac|adjunt|archiv|categor[ií]a|que (cargo|subo|pongo)|paso 4/.test(q);
 if((step===4||/documentac|adjunt|archiv|categor[ií]a|paso 4/.test(q))&&asksDocuments){
  if(standard==='ERC-3643'||/erc.?3643/.test(q))return {short:'En «Documentación», para ERC-3643 cargá los respaldos que ya tengas sobre la emisora y el activo, el documento que define los derechos del titular, una valuación o sustento económico y las reglas previstas de identidad y transferencias. Podés adjuntar varios archivos, uno por vez. ¿Cuál de esos respaldos tenés disponible?',more:'Elegí «Legal» para contratos y derechos, «Financiero» para valuaciones, «Técnico» para la operación y «Compliance» para políticas o referencias de elegibilidad. La categoría solo organiza; no verifica. No subas documentos personales de inversores en este flujo: su verificación requiere un circuito privado separado. Los archivos quedan en este navegador hasta enviar la solicitud.'};
  return {short:'En «Documentación» podés agregar varios respaldos o imágenes, uno por vez. Poné un título y elegí la categoría que mejor describa cada archivo; después adjuntalo. ¿Qué tipo de archivo querés cargar?',more:'Legal reúne contratos y derechos; Financiero, valuaciones; Técnico, especificaciones; Compliance, políticas y referencias; «Imagen del token», logos o ilustraciones. La categoría no verifica el contenido. Los archivos quedan en este navegador hasta enviar la solicitud.'};
 }
 const hotel=/hotel|hospedaje|habitacion/.test(q+' '+history);
 const realEstate=/hotel|inmueble|inmobiliari|propiedad|titularidad/.test(q+' '+history);
 const ownership=/titularidad|copropiedad|parte de la propiedad|parte del inmueble/.test(q+' '+history);
 const compare=/erc.?1155/.test(q)&&/erc.?3643/.test(q);
 if(/escritura|registro de propiedad/.test(q)&&realEstate)return {short:'Para un inmueble, adjuntá los respaldos que ya tengas: título o referencia registral, valuación y documento que explique el derecho ofrecido. Si falta alguno, indicá que está pendiente de revisión.',more:'También pueden corresponder contratos de administración y custodia. Cargá archivos en el formulario, no pegues datos personales en este chat.'};
 if(/cantidad propuesta|cuantas? (unidades|tokens)|numero de unidades|supply/.test(q))return {short:'«Cantidad propuesta de unidades» es cuántos tokens planeás emitir; no equivale automáticamente a habitaciones ni a metros cuadrados. Definí primero qué derecho representa cada unidad y recién entonces la cantidad.',more:'Si explorás ERC-1155, distinguí cantidad de tipos o IDs de las unidades de cada tipo. Si explorás ERC-3643, definí el total de unidades y las condiciones para tenerlas o transferirlas.'};
 if(/derecho de cobro/.test(q)&&hotel)return {short:'Para el hotel, aclará si hablás de cobrar una parte de ingresos futuros o de ceder créditos ya existentes. Son derechos distintos. Escribí esa diferencia en la memoria del activo; no elijas «factoring» solo por decir «derecho de cobro».',more:'El equipo deberá revisar quién paga, cómo se calcula el cobro, qué documentos lo respaldan y dónde se ofrecería el token antes de decidir estándar y controles.'};
 if(compare||((hotel||realEstate)&&/que seria mejor|cual.*estandar|me recomienda|erc.?1155|erc.?3643/.test(q)))return {short:'Para un hotel, el estándar depende del derecho ofrecido. Si cada token representa una participación sujeta a identidad y elegibilidad, explorá ERC-3643; si habrá varios tipos de unidades o servicios dentro de una colección, explorá ERC-1155. ¿El titular tendría propiedad, ingresos o derecho a estadías?',more:'Un ERC-3643 puede controlar quién recibe y transfiere; ERC-1155 organiza varios IDs con cantidades. Ninguno crea por sí mismo propiedad inmobiliaria ni resuelve la oferta legal. Anotá tu propuesta en el expediente para revisión.'};
 if(ownership&&hotel)return {short:'Si querés representar una parte de la titularidad del hotel, describí exactamente qué derecho tendría cada titular en «Memoria Descriptiva del Activo». En el paso 2, ERC-3643 puede explorarse si habrá controles de identidad y transferencia.',more:'La titularidad del inmueble no cambia solo por emitir tokens. TOKVANT debe revisar la estructura jurídica, los documentos y las jurisdicciones antes de confirmar el estándar.'};
 if(/hotel/.test(q))return {short:'Para orientar el hotel dentro de esta solicitud, primero definamos qué recibe quien tenga el token: ¿parte de la propiedad, una parte de ingresos o noches de estadía?',more:'Si se trata del inmueble, en «Tipo de Activo Subyacente» podés elegir «Inmobiliario». El estándar y la cantidad se deciden después de definir el derecho; un hotel de cinco estrellas no determina por sí mismo ERC-1155 o ERC-3643.'};
 if(/^(listo|ya esta|termine|complete)([ .!]|$)|ya complete|estoy en expediente|estoy en el expediente/.test(q)){
  const next=step<5?'Cuando termines este paso, pulsá «Continuar» y revisá el siguiente.':'Revisá el resumen y los adjuntos; después podrás enviar la solicitud a TOKVANT.';
  return {short:`Seguimos en el paso ${step} de 5, «${stepNames[step]||'solicitud'}». ${next} Si estás mirando otro campo, decime su nombre.`,more:'El diagnóstico breve ya terminó y no hace falta repetirlo. Si un dato quedó pendiente, indicalo en el expediente para que el equipo lo revise.'};
 }
 return null;
}
