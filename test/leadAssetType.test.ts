import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {assetTypeFromLeadSector} from '../src/lib/leadAssetType';

test('el diagnóstico conserva el sector elegido al abrir la solicitud completa',()=>{
 assert.equal(assetTypeFromLeadSector('Otro'),'Otro');
 assert.equal(assetTypeFromLeadSector('Créditos de Carbono & Activos Ambientales'),'Derechos de Emisión');
 assert.equal(assetTypeFromLeadSector('Infraestructura & Logística Hidroviaria'),'Infraestructura');
 assert.equal(assetTypeFromLeadSector('Fondo de Inversión Cerrado / Participaciones'),'Fondo Privado');
 assert.equal(assetTypeFromLeadSector('Agropecuario / Forestal'),'Agropecuario');
});
