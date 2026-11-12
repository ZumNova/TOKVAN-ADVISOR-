import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {answerFromJournal,validateNotes,type UsageEvent} from '../src/lib/usageJournal';

const frozen:UsageEvent={id:'ERC-3643:freeze',standard:'ERC-3643',kind:'TokensFrozen',description:'TOKVAN Regulated Test 0x275fF48842eaf6dFE32B6Cc51713f6CF63841E8D · 2',hash:'0x'+'a'.repeat(64),block:123,address:'0x'+'b'.repeat(40),search:'erc-3643 tokensfrozen tokvan regulated test 0x275ff48842eaf6dfe32b6cc51713f6cf63841e8d 2'};
test('sin sincronización no atribuye confirmaciones a la cadena',()=>{
 const reply=answerFromJournal('¿Congelé 2 TKREG?',[],[]);
 assert.match(reply.notice,/no puedo afirmar/i);
 assert.equal(reply.events.length,0);
});
test('cita un congelamiento relacionado y separa la nota humana',()=>{
 const note={id:'n1',createdAt:'2026-11-12T00:00:00.000Z',standard:'ERC-3643' as const,title:'Congelamiento 1E8D',body:'Probamos la función'};
 const reply=answerFromJournal('¿Qué pasó con 1E8D?', [frozen],[note],'2026-11-12T00:00:00.000Z');
 assert.equal(reply.events[0].hash,frozen.hash);
 assert.equal(reply.notes[0].id,note.id);
 assert.match(reply.notice,/dos bloques/);
});
test('rechaza notas inválidas o excesivas',()=>{
 assert.throws(()=>validateNotes(Array(101).fill({})),/100 notas/);
 assert.throws(()=>validateNotes([{id:'n',createdAt:'x',standard:'ERC-3643',title:'a',body:'b'}]),/inválidos/);
});
