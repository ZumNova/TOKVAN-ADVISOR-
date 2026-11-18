import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {suggestObjective,suggestSector} from '../src/lib/diagnosticAssistant';

test('orienta los tres ejemplos del diagnóstico hacia el sector correcto',()=>{
 assert.equal(suggestSector('Tengo un campo con vacas')?.sector,'Agropecuario / Forestal');
 assert.equal(suggestSector('Tengo una flota de camiones')?.sector,'Infraestructura & Logística Hidroviaria');
 assert.equal(suggestSector('Tengo un terreno y quiero hacer un edificio')?.sector,'Inmobiliario Corporativo & Residencial');
});

test('pregunta por el derecho o producto antes de sugerir un objetivo',()=>{
 assert.match(suggestObjective('No sé todavía','Agropecuario / Forestal'),/qué recibiría/);
 assert.match(suggestObjective('Quiero vender cada vaca','Agropecuario / Forestal'),/cada activo/);
 assert.match(suggestObjective('Quiero representar una parte del edificio','Inmobiliario Corporativo & Residencial'),/Fraccionamiento/);
});
