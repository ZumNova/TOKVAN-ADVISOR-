export type SuggestedSector='Agropecuario / Forestal'|'Inmobiliario Corporativo & Residencial'|'Deuda Privada & Factoring Ganadero/Comercial'|'Infraestructura & Logística Hidroviaria'|'Créditos de Carbono & Activos Ambientales'|'Fondo de Inversión Cerrado / Participaciones';
export type SectorHint={sector:SuggestedSector;short:string};
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export type BasicIntent='token'|'start'|'tokvant_start'|'trust'|'sowing_lot'|'bees'|'wine'|'farm_stay';
export function basicIntent(question:string):BasicIntent|null{
 const q=normalize(question).trim();
 if(/\b(finca|estancia|campo|chacra)\b/.test(q)&&/\b(estadia|alojamiento|hospedaje|turismo|fin de semana|vacaciones)\b/.test(q))return 'farm_stay';
 if(/\b(colmenar|colmena|abejas?|miel|apicultura)\b/.test(q)&&/\b(token|tokenizar|representar)\b/.test(q))return 'bees';
 if(/\b(vino|vinos|bodega|viñedo|vinedo)\b/.test(q)&&/\b(token|tokenizar|representar)\b/.test(q))return 'wine';
 if(/\b(lote|parcela)\b.{0,35}\b(siembra|cultivo|cosecha)\b|\b(siembra|cultivo|cosecha)\b.{0,35}\b(lote|parcela)\b/.test(q))return 'sowing_lot';
 if(/\b(que es|que significa|explicame)\b.{0,20}\b(un |el )?fideicomiso\b/.test(q))return 'trust';
 if(!/\b(?:erc.?20|erc.?721|erc.?1155|erc.?3643)\b/.test(q)&&/\b(que es|que significa|explicame)\b.{0,20}\b(un |el )?token\b/.test(q))return 'token';
 if(/\b(como|por donde|donde)\b.{0,25}\b(empiezo|empezar|comienzo|comenzar|inicio)\b.{0,25}\b(usar |mi |un |el )?(tokvant|diagnostico)\b/.test(q))return 'tokvant_start';
 if(/\b(como|por donde|donde)\b.{0,25}\b(empiezo|empezar|comienzo|comenzar|inicio)\b.{0,20}\b(a )?tokeniz|\b(primeros pasos|por donde empezar)\b.{0,20}\b(tokeniz|proyecto)\b/.test(q))return 'start';
 return null;
}

export function isAccessPassProposal(question:string):boolean{
 const q=normalize(question);
 const venue=/\b(club|evento|recital|estadio|gimnasio|socio|socios)\b/.test(q);
 const access=/\b(entrar|entrada|acceso|ingresar|ingreso|pase|pases)\b/.test(q);
 const credential=/\b(token|tokens|qr|celular|movil|boleto|ticket)\b/.test(q);
 return (venue&&access)||(access&&credential&&/\b(pagar|paguen|comprar|compren|validar|entregar|entreguen)\b/.test(q));
}

export function isLocationReply(question:string):boolean{
 const q=normalize(question).trim();
 if(/\b(quiero|representar|comercializar|vender|comprar|emitir)\b/.test(q))return false;
 return /\b(esta|queda|ubicado|ubicada|situado|situada|se encuentra)\b.{0,55}\ben\b/.test(q);
}

export function countryFromLocation(question:string):string|null{
 const q=normalize(question);
 if(/\b(argentina|buenos aires|cordoba|rosario|mendoza|la plata)\b/.test(q))return 'Argentina';
 if(/\b(paraguay|asuncion|encarnacion|ciudad del este)\b/.test(q))return 'Paraguay';
 if(/\b(uruguay|montevideo)\b/.test(q))return 'Uruguay';
 if(/\b(brasil|brazil|sao paulo|rio de janeiro)\b/.test(q))return 'Brasil';
 if(/\b(estados unidos|united states|usa|new york)\b/.test(q))return 'Estados Unidos';
 if(/\b(suiza|switzerland|zurich|union europea)\b/.test(q))return 'Suiza / UE';
 return null;
}

export function volumeBandFromText(question:string):string|null{
 const q=normalize(question).replace(/\b(?:usd|dolares|dolares estadounidenses)\b/g,'');
 const million=q.match(/\b(\d+(?:[.,]\d+)?)\s*(?:millones?|m)\b/);
 let amount:number;
 if(million)amount=Number(million[1].replace(',','.'))*1_000_000;
 else{
  const raw=q.match(/(?:\$|u\$s)?\s*(\d{1,3}(?:[.,]\d{3})+|\d{6,})\b/);
  if(!raw)return null;
  amount=Number(raw[1].replace(/[.,]/g,''));
 }
 if(!Number.isFinite(amount)||amount<1_000_000)return null;
 if(amount<5_000_000)return '$1M - $5M USD';
 if(amount<10_000_000)return '$5M - $10M USD';
 if(amount<25_000_000)return '$10M - $25M USD';
 return '$25M - $50M+ USD';
}

export function suggestSector(question:string):SectorHint|null{
 const q=normalize(question);
 if(/vaca|ganado|bovino|hacienda|agro|cultivo|cosecha|siembra|granja|plantin|colmena|abeja|miel|viñedo|vinedo/.test(q))return {sector:'Agropecuario / Forestal',short:'Tu caso parece agropecuario. En «Sector Económico» elegí «Agropecuario / Silvopastoril / Forestal».'};
 if(/camion|flota|transporte|logistica|energia|puerto|infraestructura/.test(q))return {sector:'Infraestructura & Logística Hidroviaria',short:'Tu caso parece de infraestructura o logística. En «Sector Económico» elegí «Infraestructura, Energía & Logística».'};
 if(/terreno|edificio|departamento|inmueble|vivienda|local comercial|propiedad/.test(q))return {sector:'Inmobiliario Corporativo & Residencial',short:'Tu caso parece inmobiliario. En «Sector Económico» elegí «Inmobiliario Corporativo & Residencial».'};
 if(/factura|factoring|pagare|deuda|derecho de cobro|prestamo/.test(q))return {sector:'Deuda Privada & Factoring Ganadero/Comercial',short:'Tu caso parece de deuda o derechos de cobro. En «Sector Económico» elegí «Deuda Privada & Factoring Comercial».'};
 if(/carbono|credito ambiental|impacto ambiental|reforestacion/.test(q))return {sector:'Créditos de Carbono & Activos Ambientales',short:'Tu caso parece ambiental. En «Sector Económico» elegí «Créditos de Carbono & Activos Ambientales».'};
 if(/fondo de inversion|equity|participacion societaria/.test(q))return {sector:'Fondo de Inversión Cerrado / Participaciones',short:'Tu caso parece un fondo o participación. En «Sector Económico» elegí «Fondo de Inversión / Equity Privado».'};
 return null;
}

export function suggestObjective(question:string,sector:SuggestedSector):string{
 const q=normalize(question);
 if(/prestamo|pagare|factura|deuda|derecho de cobro|cobrar/.test(q))return 'Si el token representa una deuda o un derecho de cobro, explorá «Titularización de cartera de crédito / factoring». Describí quién debe pagar y qué derecho recibiría el titular.';
 if(/lote|bolsa|tipo de producto|varios productos|distintos productos/.test(q))return 'Si querés comercializar productos por lotes, explorá «Mercado de productos por lotes». Indicá qué representa cada lote y cuántas unidades tendría.';
 if(/certific|trazab|ambiental|carbono/.test(q))return 'Si buscás certificar un resultado o seguir su trazabilidad, explorá «Certificación ambiental y trazabilidad en cadena». Indicá qué evidencia lo respaldaría.';
 if(/inversor|capital|participacion|cuotaparte|rendimiento|ganancia/.test(q))return 'Si el token daría participación económica a inversores, explorá «Levantamiento de capital privado». Luego habrá que revisar los derechos ofrecidos y las reglas aplicables.';
 if(sector==='Inmobiliario Corporativo & Residencial'&&/fraccion|parte de|porcentaje|liquidez/.test(q))return 'Si querés fraccionar derechos sobre un inmueble, explorá «Fraccionamiento de activo inmobiliario». Aclarás qué derecho concreto recibiría cada titular.';
 if(/cada vaca|cada camion|cada inmueble|cada edificio|cada activo|uno por/.test(q))return 'Si querés representar cada activo por separado, describilo así en el formulario. La elección técnica se revisará después; el sector por sí solo no decide el estándar.';
 return 'Para elegir «Objetivo Principal», contame qué recibiría quien tenga el token: ¿un activo individual, unidades de un lote, un derecho de cobro o una participación económica?';
}
