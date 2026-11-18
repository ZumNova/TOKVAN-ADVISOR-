export type WizardGuideAnswer={short:string;more:string};
const norm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const stepNames=['','organización y activo','estándar y red','parámetros del token','documentación','revisión y envío'];

export function wizardFallback(step:number):WizardGuideAnswer{
 const name=stepNames[step]||'solicitud';
 return {short:`Estás en el paso ${step} de la solicitud completa: ${name}. Decime el nombre del campo que te genera dudas o qué querés representar; seguimos desde acá.`,more:'Si todavía no podés definir una respuesta, dejala indicada para revisión de TOKVANT y avanzá con los demás campos. No hace falta volver al diagnóstico breve.'};
}

export function wizardGuide(question:string,step:number,previousQuestions:string[]):WizardGuideAnswer|null{
 const q=norm(question), history=norm(previousQuestions.join(' '));
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
