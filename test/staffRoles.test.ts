import {test} from 'node:test';
import assert from 'node:assert/strict';
import {roleCanOpen} from '../src/lib/staffAccess';

test('equipo consulta expedientes y factories; solo administración abre backoffice',()=>{
 for(const role of ['owner','administrator','factory','reviewer','compliance','board'] as const){
  assert.equal(roleCanOpen(role,'projects'),true);
  assert.equal(roleCanOpen(role,'approvals'),true);
  assert.equal(roleCanOpen(role,'factory'),true);
  assert.equal(roleCanOpen(role,'admin'),role==='owner'||role==='administrator');
 }
 assert.equal(roleCanOpen(null,'projects'),false);
 assert.equal(roleCanOpen(null,'factory'),false);
});
