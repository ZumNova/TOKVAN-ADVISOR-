export type PublicAnswer={question:string;short_answer:string;more_answer:string;keywords:string[];category:string;source_reference?:string};
// Secuencia de lectura pública: fundamentos, ejemplos, preparación y controles.
// Las referencias nuevas que aún no tienen posición conservan su orden de carga al final.
const learningPath=[
 'BD-V1 FAQ-0001','BD-V1 FAQ-0007','BD-V1 FAQ-0009','BD-V1 FAQ-0008',
 'BD-V1 FAQ-0005','BD-V1 FAQ-0019','BD-V1 FAQ-0020','BD-V1 FAQ-0030',
 'BD-V1 FAQ-0021','BD-V1 FAQ-0010','BD-V1 FAQ-0029','BD-V1 FAQ-0026',
 'TOKVANT ejemplo + BD-V1 FAQ-0007/0026','TOKVANT ejemplo + BD-V1 FAQ-0007/0009',
 'BD-V1 FAQ-0031','BD-V1 FAQ-0025','BD-V1 FAQ-0027',
 'TOKVANT-RWA-10','TOKVANT-RWA-01','TOKVANT-RWA-02','TOKVANT-RWA-03',
 'TOKVANT-RWA-04','TOKVANT-RWA-05','TOKVANT-RWA-06',
 'TOKVANT-PARANA-01','TOKVANT-PARANA-02','TOKVANT-PARANA-03',
 'TOKVANT-PARANA-04','TOKVANT-PARANA-05','TOKVANT-PARANA-06',
 'BD-V1 FAQ-0013','BD-V1 FAQ-0017','TOKVANT-RWA-09','TOKVANT-RWA-08',
 'TOKVANT-RWA-07','BD-V1 FAQ-0018','BD-V1 FAQ-0032',
 'BD-V1 FAQ-0002','BD-V1 FAQ-0006',
];
const learningRank=new Map(learningPath.map((reference,index)=>[reference,index]));
const rank=(row:PublicAnswer)=>learningRank.get(row.source_reference||'')??learningPath.length;
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const words=(text:string)=>new Set(normalize(text).match(/[a-z0-9]{3,}/g)?.filter(word=>!['quiero','tengo','para','como','puedo','token','tokenizar','sobre','esto','esta','esta','cual','seria','hacer','mis','una','uno','con','del','que','los','las','por'].includes(word))||[]);
export function containsPrivateData(text:string){
 return /@|(?:0x[a-f0-9]{40})|\b(?:\+?\d[\d\s().-]{8,}\d)\b|\b(?:ruc|dni|cuit|cuil|pasaporte|expediente|cliente|contacto)\s*[:#-]/i.test(text);
}
export function publicSuggestions(rows:PublicAnswer[]){
 return rows.filter(row=>!containsPrivateData([row.question,row.short_answer,row.more_answer,row.category,...row.keywords].join(' ')))
  .sort((a,b)=>rank(a)-rank(b))
  .map(row=>({question:row.question,short:row.short_answer,more:row.more_answer}));
}
export function bestPublicAnswer(query:string,rows:PublicAnswer[]):PublicAnswer|null{
 const terms=words(query);if(!terms.size)return null;
 let best:PublicAnswer|null=null,bestScore=0;
 for(const row of rows){
  if(containsPrivateData([row.question,row.short_answer,row.more_answer,row.category,...row.keywords].join(' ')))continue;
  const question=words(row.question),keywords=words(row.keywords.join(' ')),category=words(row.category);
  let score=0;for(const term of terms){if(question.has(term))score+=3;if(keywords.has(term))score+=2;if(category.has(term))score+=1;}
  if(score>bestScore){bestScore=score;best=row;}
 }
 return bestScore>=2?best:null;
}
