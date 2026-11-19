export type WizardGuideAnswer={short:string;more:string};
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

export function wizardGuide(question:string,step:number,previousQuestions:string[]):WizardGuideAnswer|null{
 const q=norm(question), history=norm(previousQuestions.join(' '));
 const decimalAnswer=decimalGuide(question,previousQuestions);
 if(decimalAnswer)return decimalAnswer;
 const transferAnswer=transferGuide(question);
 if(transferAnswer)return transferAnswer;
 const hotel=/hotel|hospedaje|habitacion/.test(q+' '+history);
 const realEstate=/hotel|inmueble|inmobiliari|propiedad|titularidad/.test(q+' '+history);
 const ownership=/titularidad|copropiedad|parte de la propiedad|parte del inmueble/.test(q+' '+history);
 const compare=/erc.?1155/.test(q)&&/erc.?3643/.test(q);
 if(/documentac|adjunt|escritura|registro de propiedad/.test(q)&&realEstate)return {short:'En «Documentación» adjuntá los respaldos que ya tengas del inmueble: título o referencia registral, valuación, descripción del hotel y documento que explique el derecho ofrecido. Si falta alguno, indicá que está pendiente de revisión.',more:'También pueden corresponder contratos de administración, custodia y un análisis profesional de la oferta según los países involucrados. Cargá archivos en el formulario privado; no pegues datos personales en este chat.'};
 if(/funcionalidad|pausab|burn|quem|mint|emision adicional|uups|upgrade/.test(q))return {short:'En «Funcionalidades privilegiadas», elegí solo lo que el proyecto necesita: pausa para emergencias; quema si habrá cancelación de unidades; emisión adicional si podrían crearse más; UUPS solo si está prevista una actualización del contrato. ¿Cuál de esas funciones querés evaluar?',more:'Para participaciones en un hotel, una emisión adicional puede afectar la proporción de cada titular. Documentá quién podría ejecutarla y bajo qué condiciones. Seleccionar una casilla no implementa por sí solo una bóveda multifirma.'};
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
