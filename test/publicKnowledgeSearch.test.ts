import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {bestPublicAnswer,containsPrivateData,type PublicAnswer} from '../server/publicKnowledgeSearch';

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
