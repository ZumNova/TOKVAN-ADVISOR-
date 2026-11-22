export type PublicAnswer={question:string;short_answer:string;more_answer:string;keywords:string[];category:string};
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const words=(text:string)=>new Set(normalize(text).match(/[a-z0-9]{3,}/g)?.filter(word=>!['quiero','tengo','para','como','puedo','token','tokenizar','sobre','esto','esta','esta','cual','seria','hacer','mis','una','uno','con','del','que','los','las','por'].includes(word))||[]);
export function containsPrivateData(text:string){
 return /@|(?:0x[a-f0-9]{40})|\b(?:\+?\d[\d\s().-]{8,}\d)\b|\b(?:ruc|dni|cuit|cuil|pasaporte|expediente|cliente|contacto)\s*[:#-]/i.test(text);
}
export function publicSuggestions(rows:PublicAnswer[]){
 return rows.filter(row=>!containsPrivateData([row.question,row.short_answer,row.more_answer,row.category,...row.keywords].join(' ')))
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
