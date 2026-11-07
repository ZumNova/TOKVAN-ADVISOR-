import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {factory721CreationData} from '../src/lib/erc721Workflow';
import {setTimeout} from 'node:timers/promises';
import {JsonRpcProvider, Contract, ZeroAddress} from 'ethers';
import {DEPLOYER,PARTICIPANTS,type WalletProvider} from '../src/lib/factoryWallet';
import {MULTI_DEFAULTS,prepareCollection,metadataURI,reviewMultiOperation,sendMultiOperation,confirmMultiOperation,readMultiState,readMultiJournal,recoverMultiCollection,verifyMultiFactory,readMultiType,multiInterface,type MultiOperation,type MultiFactoryRecord} from '../src/lib/erc1155Workflow';
test('validates Multi parameters and binds approvals to factory, project and every option',()=>{
 const base=prepareCollection(MULTI_DEFAULTS,DEPLOYER);
 for(const patch of [{name:''},{maxTypes:'0'},{maxTypes:'1.5'},{admin:ZeroAddress},{symbol:'a'.repeat(17)}])assert.throws(()=>prepareCollection({...MULTI_DEFAULTS,...patch},DEPLOYER));
 for(const patch of [{name:'Other'},{symbol:'OTHER'},{admin:PARTICIPANTS.operator},{maxTypes:'2'},{projectReference:'OTHER'},{burnable:false},{pausable:false}])assert.notEqual(prepareCollection({...MULTI_DEFAULTS,...patch},DEPLOYER).digest,base.digest);
 assert.notEqual(prepareCollection(MULTI_DEFAULTS,PARTICIPANTS.operator).digest,base.digest);
 assert.equal(metadataURI('ipfs://bafytest/1.json'),'ipfs://bafytest/1.json');
 for(const uri of ['javascript:alert(1)','http://example.com','https://user:pass@example.com',''])assert.throws(()=>metadataURI(uri));
});
test('browser workflow deploys, approves, creates, mints, pauses, burns and journals locally', {timeout:60000},async()=>{
 const node=spawn('anvil',['--port','18547','--chain-id','11155111','--silent'],{stdio:'ignore'});
 let launchError:Error|undefined;node.on('error',e=>{launchError=e;});
 const provider=new JsonRpcProvider('http://127.0.0.1:18547',11155111,{staticNetwork:true,cacheTimeout:-1});
 try{
  let ready=false;for(let i=0;i<40;i++){if(launchError)throw launchError;if(node.exitCode!==null)throw new Error('Anvil exited');try{await provider.send('eth_blockNumber',[]);ready=true;break;}catch{await setTimeout(100);}}
  assert.ok(ready);
  for(const address of Object.values(PARTICIPANTS)){await provider.send('anvil_impersonateAccount',[address]);await provider.send('anvil_setBalance',[address,'0x56bc75e2d63100000']);}
  let account=DEPLOYER;
  const wallet:WalletProvider={request:({method,params})=>method==='eth_accounts'?Promise.resolve([account]):provider.send(method,params??[])};
  let record:MultiFactoryRecord|undefined;
  const input={...MULTI_DEFAULTS,maxTypes:'2'};
  async function execute(operation:MultiOperation){const review=await reviewMultiOperation(wallet,{record,operation});const pending=await sendMultiOperation(wallet,review);const result=await confirmMultiOperation(wallet,pending);assert.equal(result.status,'confirmed');return result;}
  const deployment=await execute({kind:'factory'});assert.ok('record' in deployment&&deployment.record);record=deployment.record;
  assert.equal((await verifyMultiFactory(wallet,record.hash)).status,'confirmed');
  await assert.rejects(verifyMultiFactory(wallet,'bad'));
  const otherFactory=await provider.send('eth_sendTransaction',[{from:DEPLOYER,data:await factory721CreationData(),gas:'0x989680'}]);
  await assert.rejects(verifyMultiFactory(wallet,otherFactory),/nuestro factory ERC-1155/);
  const oldReview=await reviewMultiOperation(wallet,{record,operation:{kind:'approve',input}});
  account=PARTICIPANTS.complianceReviewer;await assert.rejects(sendMultiOperation(wallet,oldReview),/Cambió/);
  account=PARTICIPANTS.operator;await assert.rejects(reviewMultiOperation(wallet,{record,operation:{kind:'create',input}}));
  for(const reviewer of [DEPLOYER,PARTICIPANTS.complianceReviewer,PARTICIPANTS.boardReviewer]){account=reviewer;await execute({kind:'approve',input});await assert.rejects(reviewMultiOperation(wallet,{record,operation:{kind:'approve',input}}),/ya aprobó/);}
  await execute({kind:'revoke',input});assert.equal((await readMultiState(wallet,record,input)).approvals,3);
  await execute({kind:'approve',input});assert.equal((await readMultiState(wallet,record,input)).approvals,7);
  assert.equal((await readMultiState(wallet,record,{...input,name:'Changed'})).approvals,0);
  account=PARTICIPANTS.operator;await execute({kind:'create',input});
  const state=await readMultiState(wallet,record,input);assert.notEqual(state.collection,ZeroAddress);assert.equal(state.multi?.supply,0n);
  const multi=new Contract(state.collection,multiInterface,provider);
  const mint:MultiOperation={kind:'mint',input,recipient:DEPLOYER,uri:'ipfs://bafytest/1.json',amount:'10',cap:'20'};
  await assert.rejects(reviewMultiOperation(wallet,{record,operation:mint}),/permiso/);
  account=DEPLOYER;const minted=await execute(mint);assert.ok('tokenId' in minted);assert.equal(minted.tokenId,'1');
  assert.equal(await multi.balanceOf(DEPLOYER,1),10n);assert.equal(await multi.uri(1),'ipfs://bafytest/1.json');
  await execute({...mint,uri:'ipfs://bafytest/2.json',amount:'1',cap:'1'});
  await assert.rejects(reviewMultiOperation(wallet,{record,operation:mint}),/máximo de tipos/);
  await execute({kind:'issue',input,recipient:DEPLOYER,tokenId:'1',amount:'5'});
  await execute({kind:'transfer',input,recipient:PARTICIPANTS.complianceReviewer,tokenId:'1',amount:'3'});
  account=PARTICIPANTS.complianceReviewer;
  await execute({kind:'burn',input,tokenId:'1',amount:'1'});
  const type=await readMultiType(wallet,record,input,'1');
  assert.equal(type.balance,2n);assert.equal(type.supply,14n);assert.equal(type.minted,15n);assert.equal(type.cap,20n);
  await assert.rejects(reviewMultiOperation(wallet,{record,operation:{kind:'burn',input,tokenId:'1',amount:'3'}}),/saldo/);
  await assert.rejects(reviewMultiOperation(wallet,{record,operation:{kind:'issue',input,recipient:DEPLOYER,tokenId:'1',amount:'1'}}),/permiso/);
  account=DEPLOYER;await execute({kind:'pause',input});
  for(const operation of [mint,{kind:'issue',input,recipient:DEPLOYER,tokenId:'1',amount:'1'},{kind:'transfer',input,recipient:PARTICIPANTS.operator,tokenId:'1',amount:'1'},{kind:'burn',input,tokenId:'1',amount:'1'}] as MultiOperation[])await assert.rejects(reviewMultiOperation(wallet,{record,operation}),/pausada/);
  await execute({kind:'unpause',input});
  await execute({kind:'issue',input,recipient:DEPLOYER,tokenId:'1',amount:'5'});
  await execute({kind:'burn',input,tokenId:'1',amount:'1'});
  await assert.rejects(reviewMultiOperation(wallet,{record,operation:{kind:'issue',input,recipient:DEPLOYER,tokenId:'1',amount:'1'}}),/máximo histórico/);
  for(const amount of ['0','1.5',(2n**256n).toString()])await assert.rejects(reviewMultiOperation(wallet,{record,operation:{kind:'burn',input,tokenId:'1',amount}}),/entero/);
  await assert.rejects(readMultiType(wallet,record,input,'99'));
  const batchHash=await provider.send('eth_sendTransaction',[{from:DEPLOYER,to:state.collection,gas:'0x493e0',data:multiInterface.encodeFunctionData('safeBatchTransferFrom',[DEPLOYER,PARTICIPANTS.operator,[1,2],[1,1],'0x'])}]);
  await provider.send('anvil_mine',['0x3']);
  const journal=await readMultiJournal(wallet,record);
  for(const kind of ['Factory ERC-1155','Colección ERC-1155','Aprobación ERC-1155','Revocación ERC-1155','Tipo creado','Unidades emitidas','Unidades quemadas','Unidades transferidas','Colección pausada','Colección reanudada'])assert.ok(journal.some(e=>e.kind===kind),kind);
  assert.equal(journal.filter(e=>e.hash===batchHash).length,2);
  assert.ok(journal.filter(e=>e.hash===batchHash).every(e=>e.amount==='1'));
  const collectionEntry=journal.find(e=>e.kind==='Colección ERC-1155')!;
  assert.equal(collectionEntry.collectionName,input.name);
  const recovered=await recoverMultiCollection(wallet,record,collectionEntry.hash,state.collection);
  assert.equal(recovered.state.collection,state.collection);
  assert.equal(recovered.state.multi?.minted,2n);
  assert.equal(recovered.state.multi?.supply,19n);
  assert.equal(prepareCollection(recovered.input,record.address).digest,prepareCollection(input,record.address).digest);
  await assert.rejects(recoverMultiCollection(wallet,record,collectionEntry.hash,PARTICIPANTS.operator));
  await assert.rejects(recoverMultiCollection(wallet,record,record.hash,state.collection));
  // Recovery retains permissions and configuration after transfers and burns.
  await execute({kind:'pause',input:recovered.input});
  assert.equal((await readMultiState(wallet,record,recovered.input)).multi?.paused,true);
  await execute({kind:'unpause',input:recovered.input});
  assert.equal(new Set(journal.map(e=>e.id)).size,journal.length);
  assert.ok(journal.every(e=>[record!.address,state.collection].includes(e.address)));
  const wrongNetwork:WalletProvider={request:({method,params})=>method==='eth_chainId'?Promise.resolve('0x89'):wallet.request({method,params})};
  await assert.rejects(readMultiState(wrongNetwork,record,input),/Sepolia/);
 }finally{provider.destroy();node.kill();}
});

test('failed wallet wrapper clears pending state without accepting wrapped success or another sender',async()=>{
 const pending={hash:'0x'+'ab'.repeat(32),from:DEPLOYER,to:PARTICIPANTS.operator,data:'0x8456cb59',context:{operation:{kind:'pause' as const,input:MULTI_DEFAULTS}}};
 let status='0x0',from=DEPLOYER;
 const wallet:WalletProvider={request:async({method})=>{
  if(method==='eth_chainId')return '0xaa36a7';
  if(method==='eth_getTransactionReceipt')return {status,logs:[],blockNumber:'0x1'};
  if(method==='eth_getTransactionByHash')return {from,to:PARTICIPANTS.boardReviewer,input:'0xcef6d209',value:'0x0'};
  throw new Error(method);
 }};
 assert.equal((await confirmMultiOperation(wallet,pending)).status,'failed');
 status='0x1';await assert.rejects(confirmMultiOperation(wallet,pending),/no coincide/);
 status='0x0';from=PARTICIPANTS.boardReviewer;await assert.rejects(confirmMultiOperation(wallet,pending),/wallet/);
});

 test('browser ABI and creation bytecode match both compiled ERC1155 contracts',()=>{
 for(const [contract,artifact] of [['TokvanERC1155Factory','erc1155FactoryArtifact'],['TokvanERC1155','erc1155Artifact']]){
  const compiled=JSON.parse(readFileSync(`out/${contract}.sol/${contract}.json`,'utf8'));
  const browser=JSON.parse(readFileSync(`src/generated/${artifact}.json`,'utf8'));
  assert.deepEqual(browser.abi,compiled.abi);assert.equal(browser.bytecode,compiled.bytecode.object);
 }
});
