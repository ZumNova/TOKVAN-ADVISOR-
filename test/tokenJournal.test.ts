import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FACTORY_REGISTRY,journalFromLogs,readJournal,workflowInterface,type ChainLog} from '../src/lib/tokenWorkflow';
import {prepareFactoryRequest} from '../src/lib/erc20Factory';
import {PARTICIPANTS,type WalletProvider} from '../src/lib/factoryWallet';
const request=prepareFactoryRequest({projectId:'TOKVAN-SEPOLIA-TKN-001',factory:FACTORY_REGISTRY.address,name:'TOKVAN Test Token',symbol:'TKN',decimals:'18',initialSupply:'1000000',maxSupply:'1000000',admin:PARTICIPANTS.technicalReviewer,treasury:PARTICIPANTS.technicalReviewer,mintable:false,burnable:true,pausable:true});
const hash='0x'+'ab'.repeat(32);
const token='0x0000000000000000000000000000000000000010';
function event(name:string,values:unknown[]):ChainLog {
  const encoded=workflowInterface.encodeEventLog(workflowInterface.getEvent(name)!,values);
  return {...encoded,address:FACTORY_REGISTRY.address,transactionHash:hash,blockNumber:'0x'+(FACTORY_REGISTRY.blockNumber+1).toString(16),logIndex:'0x0'};
}
test('ignores removed logs and events emitted by another contract',()=>{
  const log=event('TokenCreated',[request.projectId,token,request.digest,request.config.admin,request.config.treasury]);
  assert.equal(journalFromLogs([{...log,removed:true},{...log,address:token}]).length,0);
});
test('journal can be rebuilt without localStorage and includes TKN metadata',async()=>{
  const log=event('TokenCreated',[request.projectId,token,request.digest,request.config.admin,request.config.treasury]);
  let logQueries=0;
  const wallet:WalletProvider={request:async({method,params})=>{
    if(method==='eth_chainId')return '0xaa36a7';
    if(method==='eth_blockNumber')return '0x'+(BigInt(log.blockNumber)+2n).toString(16);
    if(method==='eth_getLogs') {logQueries++;return (params![0] as {address:string}).address===FACTORY_REGISTRY.address?[log]:[];}
    if(method==='eth_getTransactionByHash')return {to:FACTORY_REGISTRY.address,input:request.deployment.data};
    throw new Error('Unexpected RPC: '+method);
  }};
  const entries=await readJournal(wallet);
  assert.equal(logQueries,2);assert.equal(entries.length,2);
  assert.equal(entries[0].kind,'Factory');assert.equal(entries[1].tokenSymbol,'TKN');
  assert.equal(entries[1].initialSupplyBaseUnits,'1000000000000000000000000');assert.equal(entries[1].decimals,18);
});
test('journal rejects a wrong network',async()=>{
  await assert.rejects(readJournal({request:async()=> '0x1'}),/Sepolia/);
});
