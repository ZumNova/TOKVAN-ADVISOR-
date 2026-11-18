import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mentionedDiagnosticField,nextDiagnosticField,unresolvedDiagnosticAnswer} from '../src/components/ai/diagnosticFlow';

test('una duda sin respuesta lleva al campo real de la etapa, sin detener el diagnóstico',()=>{
 const base={leadOpen:true,leadStep:1 as const,commercialStage:'audience' as const};
 assert.equal(nextDiagnosticField({...base,diagnosticStage:null})?.label,'Sector Económico');
 assert.equal(nextDiagnosticField({...base,diagnosticStage:'country'})?.label,'País de Radicación del Activo');
 assert.match(unresolvedDiagnosticAnswer({...base,diagnosticStage:'volume'}).short,/Volumen Estimado de Emisión/);
 assert.equal(nextDiagnosticField({...base,leadStep:2,diagnosticStage:null,commercialStage:'channels'})?.label,'¿Qué canales comerciales tiene actualmente?');
 assert.match(unresolvedDiagnosticAnswer({...base,leadStep:3,diagnosticStage:null}).short,/Abrir borrador/);
});

test('reconoce títulos escritos con errores y prioriza el campo que la persona está completando',()=>{
 assert.equal(mentionedDiagnosticField('estoy en objetivo principal de la tokenisacion'),'objective');
 assert.equal(mentionedDiagnosticField('donde esta sector economico no lo veo'),'sector');
 assert.equal(mentionedDiagnosticField('sector econmico mina y extarcion de oro elegi'),'sector');
 assert.equal(nextDiagnosticField({leadOpen:true,leadStep:1,diagnosticStage:null,commercialStage:'audience',activeField:'objective'})?.label,'Objetivo Principal de la Tokenización');
});
