export type DiagnosticStage='country'|'volume'|'description'|'objective'|null;
export type CommercialStage='audience'|'channels'|'contact';
export type LeadField='sector'|'sectorOther'|'country'|'volume'|'description'|'objective';
export type FormPosition={leadOpen:boolean;leadStep:1|2|3;diagnosticStage:DiagnosticStage;commercialStage:CommercialStage;activeField?:LeadField};

export function mentionedDiagnosticField(question:string):LeadField|null{
 const q=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/objetiv|tokenisacion|tokenizacion/.test(q)&&/principal|objetiv/.test(q))return 'objective';
 if(/sector|econ[o]?mico/.test(q))return 'sector';
 if(/pais|radicacion|yacimiento/.test(q))return 'country';
 if(/volumen|emision|valuacion/.test(q))return 'volume';
 if(/descripcion|activo especifico/.test(q))return 'description';
 return null;
}

export function nextDiagnosticField(position:FormPosition):{label:string;guidance:string}|null{
 if(!position.leadOpen)return null;
 if(position.leadStep===3)return {label:'Abrir borrador de proyecto',guidance:'Revisá la orientación preliminar y abrí el borrador para continuar.'};
 if(position.leadStep===2){
  if(position.commercialStage==='audience')return {label:'¿A quién estaría dirigido el token?',guidance:'Describí el público previsto; este campo es opcional.'};
  if(position.commercialStage==='channels')return {label:'¿Qué canales comerciales tiene actualmente?',guidance:'Indicá solo los canales que ya usás; este campo es opcional.'};
  return {label:'Entidad & Contacto',guidance:'Completá nombre, organización y correo directamente en el formulario; después generá el diagnóstico.'};
 }
 if(position.activeField==='sectorOther')return {label:'Especificá el sector',guidance:'Escribí el sector que falta en la lista, por ejemplo «Minería / extracción de oro».'};
 if(position.activeField==='sector')return {label:'Sector Económico',guidance:'Elegí una opción de la lista; para minería, elegí «Otro sector».'};
 if(position.activeField==='country')return {label:'País de Radicación del Activo',guidance:'Elegí el país del activo o «Por definir con TOKVANT».'};
 if(position.activeField==='volume')return {label:'Volumen Estimado de Emisión',guidance:'Elegí una franja aproximada o «Por definir con TOKVANT».'};
 if(position.activeField==='description')return {label:'Descripción Específica del Activo',guidance:'Escribí qué activo, producto o servicio querés representar.'};
 if(position.activeField==='objective')return {label:'Objetivo Principal de la Tokenización',guidance:'Elegí la finalidad más cercana o «Por definir con TOKVANT» si ninguna corresponde.'};
 if(position.diagnosticStage==='country')return {label:'País de Radicación del Activo',guidance:'Elegí el país del activo o «Por definir con TOKVANT».'};
 if(position.diagnosticStage==='volume')return {label:'Volumen Estimado de Emisión',guidance:'Elegí una franja aproximada o «Por definir con TOKVANT».'};
 if(position.diagnosticStage==='description')return {label:'Descripción Específica del Activo',guidance:'Escribí qué activo, producto o servicio querés representar.'};
 if(position.diagnosticStage==='objective')return {label:'Objetivo Principal de la Tokenización',guidance:'Elegí la finalidad más cercana o «Por definir con TOKVANT» si ninguna corresponde.'};
 return {label:'Sector Económico',guidance:'Elegí el sector que mejor describa el activo o actividad y contame qué querés representar.'};
}

export function unresolvedDiagnosticAnswer(position:FormPosition):{short:string;more:string}{
 const next=nextDiagnosticField(position);
 if(!next)return {short:'Para orientar tu caso, abrí «Empezar con un diagnóstico» y contame qué activo, producto o servicio querés representar.',more:'Si tu pregunta necesita una revisión específica, dejala planteada en la solicitud. Podemos avanzar con los datos que sí conocés.'};
 return {short:`Esta duda necesita más contexto. Sigamos con «${next.label}»: ${next.guidance}`,more:'Si no sabés un dato, usá «Por definir» cuando el formulario lo ofrezca. Si ninguna opción describe tu caso, no inventes una respuesta: explicá la diferencia para que TOKVANT la revise.'};
}
