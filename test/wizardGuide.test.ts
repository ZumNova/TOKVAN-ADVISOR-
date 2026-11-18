import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {explicitStandardQuestion,wizardGuide,wizardFallback} from '../src/components/ai/wizardGuide';

test('las cuatro burbujas identifican su estándar exacto',()=>{
 assert.equal(explicitStandardQuestion('¿Qué es ERC-20?'),'erc20');
 assert.equal(explicitStandardQuestion('¿Qué es un NFT?'),'erc721');
 assert.equal(explicitStandardQuestion('¿Qué es ERC-1155?'),'erc1155');
 assert.equal(explicitStandardQuestion('¿Qué es ERC-3643?'),'erc3643');
});

test('hotel en expediente: aclara el derecho antes de elegir estándar',()=>{
 const answer=wizardGuide('yo quiero tokenizar un hotel 5 estrellas',1,[]);
 assert.match(answer!.short,/propiedad.*ingresos.*estadía/i);
 assert.doesNotMatch(answer!.short,/diagnóstico breve/i);
});

test('comparación de estándares conserva el contexto del hotel',()=>{
 const answer=wizardGuide('me recomienda un ERC 1155 pero creo que mejor ERC 3643',2,['yo quiero tokenizar un hotel']);
 assert.match(answer!.short,/ERC-3643/);
 assert.match(answer!.short,/ERC-1155/);
});

test('paso tres atiende funcionalidades y cantidad',()=>{
 assert.match(wizardGuide('estoy en funcionalidades privilegiadas',3,[])!.short,/pausa.*quema.*emisión adicional/i);
 assert.match(wizardGuide('qué es cantidad propuesta de unidades',3,[])!.short,/tokens/);
});

test('documentación inmobiliaria y derecho de cobro no se desvían al diagnóstico',()=>{
 assert.match(wizardGuide('en documentacion que pongo para un proyecto inmobiliario',4,[])!.short,/título|registral/i);
 assert.match(wizardGuide('DERECHO DE COBRO',3,['quiero tokenizar un hotel'])!.short,/ingresos futuros.*créditos ya existentes/i);
});

test('continuación y fallback mantienen el paso actual',()=>{
 assert.match(wizardGuide('LISTO YA ESTA',4,[])!.short,/paso 4 de 5/);
 assert.match(wizardFallback(3).short,/paso 3/);
});
