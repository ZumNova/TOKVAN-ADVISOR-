import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {decimalGuide,explicitStandardQuestion,privilegedGuide,submittedProjectGuide,transferGuide,wizardGuide,wizardFallback} from '../src/components/ai/wizardGuide';

test('tras recibir el comprobante explica próximos pasos sin prometer plazo ni presupuesto',()=>{
 const answer=submittedProjectGuide('Una vez terminada la carga se generó un comprobante. ¿Qué hago ahora, cuánto tardan en contestar y dónde veo el valor del servicio?')!;
 assert.match(answer.short,/recibió tu solicitud.*Resumen JSON.*presupuesto/);
 assert.match(answer.more,/celular.*avisos automáticos aún no están activos/);
 assert.equal(submittedProjectGuide('¿Qué es un token?'),null);
});

test('explica cada función privilegiada sin prometer UUPS ni doble firma automática',()=>{
 assert.match(privilegedGuide('¿Qué son las funcionalidades privilegiadas?')!.short,/pausa.*quema.*emisión adicional.*UUPS/);
 assert.match(privilegedGuide('¿Qué es pausabilidad de emergencia?')!.more,/ERC-3643.*agentes/);
 assert.match(privilegedGuide('¿Qué es quema de tokens?')!.more,/sin su firma/);
 assert.match(privilegedGuide('¿Qué es emisión adicional?')!.short,/porcentaje relativo/);
 assert.match(privilegedGuide('¿Qué es Proxy UUPS?')!.short,/no lo implementan/);
 assert.match(privilegedGuide('¿Qué significa doble firma multi-sig?')!.short,/no instala una bóveda/);
});

test('explica las tres opciones y sus límites reales en TOKVANT v1',()=>{
 const comparison=transferGuide('¿Qué significa régimen de transferencia y controles?')!;
 assert.match(comparison.short,/ERC-3643.*lista blanca.*sin restricción/);
 assert.match(comparison.more,/whitelist no está implementada/);
 assert.match(transferGuide('¿Qué es lista blanca?')!.more,/no implementan whitelist/);
 assert.match(transferGuide('¿Qué es sin restricción?')!.more,/pausa activa/);
 assert.match(transferGuide('¿Qué son permisos ERC-3643?')!.more,/acreditaciones son ficticias/);
 assert.equal(transferGuide('quiero tokenizar una mina'),null);
});

test('la precisión decimal tiene prioridad sobre el caso minero',()=>{
 const answer=wizardGuide('PARA un token de mineria erc 3643 que presicion decimal usaria una de 2, 0, 6 o 18',3,[]);
 assert.match(answer!.short,/0 decimales.*2 decimales/);
 assert.match(answer!.short,/participación entera/);
 assert.doesNotMatch(answer!.short,/yacimiento/);
 assert.match(answer!.short,/¿Qué derecho representa 1 token/);
 const followUp=wizardGuide('si fuera un token minero que conviene poner',3,['qué precisión decimal uso']);
 assert.match(followUp!.short,/0 decimales/);
 assert.match(decimalGuide('qué decimales uso')!.short,/0 = solo unidades enteras.*2 = centésimos/);
 assert.equal(decimalGuide('quiero tokenizar una mina'),null);
});

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
 assert.match(wizardGuide('en documentacion que pongo para un proyecto inmobiliario',4,[])!.short,/respaldos|categoría/i);
 assert.match(wizardGuide('DERECHO DE COBRO',3,['quiero tokenizar un hotel'])!.short,/ingresos futuros.*créditos ya existentes/i);
});

test('guía de documentos ERC-3643 y revisión final respeta el paso del wizard',()=>{
 const documents=wizardGuide('¿Qué cargo en categoría?',4,[],'ERC-3643')!;
 assert.match(documents.short,/emisora.*activo.*derechos.*valuación/);
 assert.match(documents.short,/varios archivos/);
 assert.match(documents.more,/No subas documentos personales de inversores/);
 const final=wizardGuide('Estoy en paso 5 revisar y finalizar',5,[],'ERC-3643')!;
 assert.match(final.short,/comprobá.*datos.*estándar.*adjuntos/i);
 assert.match(final.more,/wallets receptoras.*sin que eso las acredite/);
});

test('continuación y fallback mantienen el paso actual',()=>{
 assert.match(wizardGuide('LISTO YA ESTA',4,[])!.short,/paso 4 de 5/);
 assert.match(wizardFallback(3).short,/paso 3/);
});
