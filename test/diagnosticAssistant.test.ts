import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {basicIntent,countryFromLocation,isAccessPassProposal,isArtFinancialRights,isArtProposal,isLocationReply,isMiningProposal,isTaxIdQuestion,isUniqueArtProposal,suggestObjective,suggestSector,volumeBandFromText} from '../src/lib/diagnosticAssistant';

test('detecta arte sin confundir una participación económica con una obra única',()=>{
 assert.equal(isArtProposal('quiero digitalizar una pintura original'),true);
 assert.equal(isArtProposal('dibujo y arte textil'),true);
 assert.equal(isArtProposal('una prenda de autor'),true);
 assert.equal(isArtFinancialRights('participación en regalías de la obra'),true);
 assert.equal(isArtProposal('quiero tokenizar un hotel'),false);
 assert.equal(isUniqueArtProposal('Una pintura original','Arte','Por definir con TOKVANT'),true);
 assert.equal(isUniqueArtProposal('Serie de 50 copias de la pintura','Arte','Por definir con TOKVANT'),false);
 assert.equal(isUniqueArtProposal('Obra de arte','Arte','Levantamiento de capital privado mediante cuotapartes reguladas'),false);
 assert.equal(isUniqueArtProposal('Obras de arte','Arte','Mercado de productos por lotes con varios tipos y cantidades'),false);
});

test('resuelve preguntas básicas y distingue un lote de siembra de una solicitud genérica',()=>{
 assert.equal(basicIntent('que es un token'),'token');
 assert.equal(basicIntent('qué es un token ERC-20'),null);
 assert.equal(basicIntent('como empiezo a tokenizar'),'start');
 assert.equal(basicIntent('tokenizar un lote de siembra'),'sowing_lot');
 assert.equal(basicIntent('como empiezo a usar tokvant'),'tokvant_start');
 assert.equal(basicIntent('como empiezo mi diagnostico'),'tokvant_start');
 assert.equal(basicIntent('que es un fideicomiso'),'trust');
 assert.equal(basicIntent('quiero representar un colmenar abejas kilos de miel'),'bees');
 assert.equal(basicIntent('quiero tokenizar vino una bodega'),'wine');
 assert.equal(basicIntent('tengo una finca y quiero tokenizar la estadia de los fines de semana'),'farm_stay');
 assert.equal(basicIntent('el inmueble está en Buenos Aires'),null);
});

test('distingue un pase de acceso de un inmueble aunque la conversación anterior fuera inmobiliaria',()=>{
 assert.equal(isAccessPassProposal('Quiero tokenizar un club: usuarios pagan antes y presentan desde el celular un QR en la entrada'),true);
 assert.equal(isAccessPassProposal('Tengo un terreno y quiero hacer un edificio'),false);
});

test('reconoce preguntas del campo fiscal y proyectos mineros sin confundirlos con sectores disponibles',()=>{
 assert.equal(isTaxIdQuestion('¿Qué es RUC / Identificación Fiscal?'),true);
 assert.equal(isTaxIdQuestion('¿Qué número va ahí?'),false);
 assert.equal(isMiningProposal('Somos una empresa minera; queremos tokenizar participación en ganancias'),true);
 assert.equal(isMiningProposal('minería de alta montaña'),true);
 assert.equal(isMiningProposal('extracción minera'),true);
 assert.equal(isMiningProposal('sector econmico mina y extarcion de oro elegi'),true);
 assert.equal(isMiningProposal('extracion de oro'),true);
 assert.equal(suggestSector('extracción minera'),null);
});

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
