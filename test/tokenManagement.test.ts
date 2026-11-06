import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ZeroAddress} from 'ethers';
import {burnUnits} from '../src/lib/tokenManagement';
import {tokenInterface} from '../src/lib/tokenContract';
import {tokenOperationsFromLogs,type JournalEntry,type ChainLog} from '../src/lib/tokenWorkflow';
test('burn amounts are positive, exact, and bounded by wallet balance',()=>{
  assert.equal(burnUnits('1.000000000000000001',18,2n*10n**18n),1000000000000000001n);
  for(const value of ['0','-1','1e18','1,5','0.0000000000000000001','3'])assert.throws(()=>burnUnits(value,18,2n*10n**18n));
});
test('journal only records burns and pause changes from the managed token',()=>{
  const address='0x0000000000000000000000000000000000000010';
  const actor='0x0000000000000000000000000000000000000020';
  const token:JournalEntry={id:'token',kind:'Token',address,transactionHash:'0x'+'ab'.repeat(32),blockNumber:1,tokenSymbol:'TKN',decimals:18};
  const log=(name:string,args:unknown[],index:number):ChainLog=>({...tokenInterface.encodeEventLog(tokenInterface.getEvent(name)!,args),address,transactionHash:token.transactionHash,blockNumber:'0x2',logIndex:'0x'+index.toString(16)});
  const burn=log('Transfer',[actor,ZeroAddress,10n**18n],0);
  const entries=tokenOperationsFromLogs([burn,burn,log('Transfer',[ZeroAddress,actor,10n**18n],1),log('Transfer',[actor,address,1n],2),log('Paused',[actor],3),log('Unpaused',[actor],4),{...burn,removed:true},{...burn,address:actor}],token);
  assert.deepEqual(entries.map(e=>e.kind),['Quema','Pausa','Reanudación']);
  assert.equal(entries[0].amountBaseUnits,'1000000000000000000');
});
