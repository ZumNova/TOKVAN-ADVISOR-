import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {countryFromLocation,isLocationReply,suggestObjective,suggestSector,volumeBandFromText} from '../src/lib/diagnosticAssistant';

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

test('una respuesta de ubicación continúa la conversación sin reiniciar el sector',()=>{
 assert.equal(isLocationReply('El inmueble está en Buenos Aires'),true);
 assert.equal(isLocationReply('El inmueble esta en Buenos Aires'),true);
 assert.equal(isLocationReply('Quiero vender el inmueble en Buenos Aires'),false);
});

test('usa los países y rangos que ofrece el diagnóstico TOKVANT',()=>{
 assert.equal(countryFromLocation('El inmueble está en Buenos Aires'),'Argentina');
 assert.equal(countryFromLocation('La flota está en Asunción'),'Paraguay');
 assert.equal(countryFromLocation('Está en una ciudad que no conozco'),null);
 assert.equal(volumeBandFromText('unos 7 millones de dólares'),'$5M - $10M USD');
 assert.equal(volumeBandFromText('USD 2.500.000'),'$1M - $5M USD');
 assert.equal(volumeBandFromText('no tengo valuación'),null);
});
