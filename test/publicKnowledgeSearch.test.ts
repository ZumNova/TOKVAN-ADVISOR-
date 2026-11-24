import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {bestPublicAnswer,containsPrivateData,publicSuggestions,type PublicAnswer} from '../server/publicKnowledgeSearch';

const answers:PublicAnswer[]=[
 {question:'¿Cómo puedo representar una flota de camiones?',short_answer:'Elegí el sector de logística.',more_answer:'Describí cada activo y qué recibe el titular.',keywords:['flota','camiones','transporte'],category:'Logística'},
 {question:'¿Qué significa ERC-721?',short_answer:'Representa piezas individuales.',more_answer:'Cada NFT tiene un ID.',keywords:['nft','único'],category:'ERC-721'},
];
test('recupera una respuesta pública pertinente y evita coincidencias débiles',()=>{
 assert.equal(bestPublicAnswer('Tengo camiones en una flota',answers)?.category,'Logística');
 assert.equal(bestPublicAnswer('No entiendo nada',answers),null);
});
test('excluye contenido con datos identificables aunque estuviera publicado',()=>{
 assert.equal(containsPrivateData('Escribime a persona@example.com'),true);
 assert.equal(containsPrivateData('Wallet 0x521125be95c5679539aB07582F55F0040975A047'),true);
 const unsafe={...answers[0],short_answer:'Consultá a persona@example.com'};
 assert.equal(bestPublicAnswer('Tengo camiones en una flota',[unsafe]),null);
});
test('la tira muestra preguntas y respuestas públicas sin datos privados ni etiquetas internas',()=>{
 const unsafe={...answers[0],more_answer:'Contactá a persona@example.com'};
 assert.deepEqual(publicSuggestions([answers[1],unsafe]),[{question:'¿Qué significa ERC-721?',short:'Representa piezas individuales.',more:'Cada NFT tiene un ID.'}]);
});
test('la tira inicia con conceptos básicos aunque las preguntas se publiquen después',()=>{
 const example={...answers[0],question:'Caso agropecuario',source_reference:'TOKVANT-RWA-02'};
 const advanced={...answers[1],question:'¿Para qué sirve un oráculo?',source_reference:'BD-V1 FAQ-0006'};
 const basic={...answers[1],question:'¿Qué es una blockchain?',source_reference:'BD-V1 FAQ-0001'};
 const future={...answers[1],question:'Pregunta futura',source_reference:'NUEVA-FAQ'};
 assert.deepEqual(publicSuggestions([advanced,example,future,basic]).map(row=>row.question),[
  '¿Qué es una blockchain?','Caso agropecuario','¿Para qué sirve un oráculo?','Pregunta futura',
 ]);
});
