import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout} from 'node:timers/promises';
import {JsonRpcProvider, Contract, ZeroAddress} from 'ethers';
import {DEPLOYER,PARTICIPANTS,type WalletProvider} from '../src/lib/factoryWallet';
import {NFT_DEFAULTS,prepareCollection,metadataURI,reviewNFTOperation,sendNFTOperation,confirmNFTOperation,readNFTState,readNFTJournal,verifyNFTFactory,nftInterface,type NFTOperation,type NFTFactoryRecord} from '../src/lib/erc721Workflow';
test('validates NFT parameters and binds approvals to factory, project and every option',()=>{
 const base=prepareCollection(NFT_DEFAULTS,DEPLOYER);
 for(const patch of [{name:''},{maxSupply:'0'},{maxSupply:'1.5'},{admin:ZeroAddress},{symbol:'a'.repeat(17)}])assert.throws(()=>prepareCollection({...NFT_DEFAULTS,...patch},DEPLOYER));
 for(const patch of [{name:'Other'},{symbol:'OTHER'},{admin:PARTICIPANTS.operator},{maxSupply:'2'},{projectReference:'OTHER'},{burnable:false},{pausable:false}])assert.notEqual(prepareCollection({...NFT_DEFAULTS,...patch},DEPLOYER).digest,base.digest);
 assert.notEqual(prepareCollection(NFT_DEFAULTS,PARTICIPANTS.operator).digest,base.digest);
 assert.equal(metadataURI('ipfs://bafytest/1.json'),'ipfs://bafytest/1.json');
 for(const uri of ['javascript:alert(1)','http://example.com','https://user:pass@example.com',''])assert.throws(()=>metadataURI(uri));
});
test('browser workflow deploys, approves, creates, mints, pauses, burns and journals locally', {timeout:60000},async()=>{
 const node=spawn('anvil',['--port','18546','--chain-id','11155111','--silent'],{stdio:'ignore'});
 let launchError:Error|undefined;node.on('error',e=>{launchError=e;});
 const provider=new JsonRpcProvider('http://127.0.0.1:18546',11155111,{staticNetwork:true,cacheTimeout:-1});
 try{
  let ready=false;for(let i=0;i<40;i++){if(launchError)throw launchError;if(node.exitCode!==null)throw new Error('Anvil exited');try{await provider.send('eth_blockNumber',[]);ready=true;break;}catch{await setTimeout(100);}}
  assert.ok(ready);
  for(const address of Object.values(PARTICIPANTS)){await provider.send('anvil_impersonateAccount',[address]);await provider.send('anvil_setBalance',[address,'0x56bc75e2d63100000']);}
  let account=DEPLOYER;
  const wallet:WalletProvider={request:({method,params})=>method==='eth_accounts'?Promise.resolve([account]):provider.send(method,params??[])};
  let record:NFTFactoryRecord|undefined;
  const input={...NFT_DEFAULTS,maxSupply:'1'};
  async function execute(operation:NFTOperation){const review=await reviewNFTOperation(wallet,{record,operation});const pending=await sendNFTOperation(wallet,review);const result=await confirmNFTOperation(wallet,pending);assert.equal(result.status,'confirmed');return result;}
  const deployment=await execute({kind:'factory'});assert.ok('record' in deployment&&deployment.record);record=deployment.record;
  assert.equal((await verifyNFTFactory(wallet,record.hash)).status,'confirmed');
  await assert.rejects(verifyNFTFactory(wallet,'bad'));
  const oldReview=await reviewNFTOperation(wallet,{record,operation:{kind:'approve',input}});
  account=PARTICIPANTS.complianceReviewer;await assert.rejects(sendNFTOperation(wallet,oldReview),/Cambió/);
  account=PARTICIPANTS.operator;await assert.rejects(reviewNFTOperation(wallet,{record,operation:{kind:'create',input}}));
  for(const reviewer of [DEPLOYER,PARTICIPANTS.complianceReviewer,PARTICIPANTS.boardReviewer]){account=reviewer;await execute({kind:'approve',input});await assert.rejects(reviewNFTOperation(wallet,{record,operation:{kind:'approve',input}}),/ya aprobó/);}
  await execute({kind:'revoke',input});assert.equal((await readNFTState(wallet,record,input)).approvals,3);
  await execute({kind:'approve',input});assert.equal((await readNFTState(wallet,record,input)).approvals,7);
  assert.equal((await readNFTState(wallet,record,{...input,name:'Changed'})).approvals,0);
  account=PARTICIPANTS.operator;await execute({kind:'create',input});
  const state=await readNFTState(wallet,record,input);assert.notEqual(state.collection,ZeroAddress);assert.equal(state.nft?.supply,0n);
  const nft=new Contract(state.collection,nftInterface,provider);
  const mint:NFTOperation={kind:'mint',input,recipient:DEPLOYER,uri:'ipfs://bafytest/1.json'};
  await assert.rejects(reviewNFTOperation(wallet,{record,operation:mint}),/permiso/);
  account=DEPLOYER;const minted=await execute(mint);assert.ok('tokenId' in minted);assert.equal(minted.tokenId,'1');assert.equal(await nft.ownerOf(1),DEPLOYER);assert.equal(await nft.tokenURI(1),'ipfs://bafytest/1.json');
  await execute({kind:'pause',input});await assert.rejects(reviewNFTOperation(wallet,{record,operation:{kind:'burn',input,tokenId:'1'}}),/pausada/);
  await execute({kind:'unpause',input});
  account=PARTICIPANTS.operator;await assert.rejects(reviewNFTOperation(wallet,{record,operation:{kind:'burn',input,tokenId:'1'}}));
  account=DEPLOYER;await execute({kind:'burn',input,tokenId:'1'});assert.equal(await nft.totalSupply(),0n);assert.equal(await nft.mintedCount(),1n);
  await assert.rejects(reviewNFTOperation(wallet,{record,operation:mint}),/máximo histórico/);
  await provider.send('anvil_mine',['0x3']);
  const journal=await readNFTJournal(wallet,record);
  for(const kind of ['Factory ERC-721','Colección ERC-721','Aprobación ERC-721','Revocación ERC-721','NFT emitido','NFT quemado','Colección pausada','Colección reanudada'])assert.ok(journal.some(e=>e.kind===kind),kind);
  assert.equal(new Set(journal.map(e=>e.id)).size,journal.length);
  assert.ok(journal.every(e=>[record!.address,state.collection].includes(e.address)));
  const wrongNetwork:WalletProvider={request:({method,params})=>method==='eth_chainId'?Promise.resolve('0x89'):wallet.request({method,params})};
  await assert.rejects(readNFTState(wrongNetwork,record,input),/Sepolia/);
 }finally{provider.destroy();node.kill();}
});

test('failed wallet wrapper clears pending state without accepting wrapped success or another sender',async()=>{
 const pending={hash:'0x'+'ab'.repeat(32),from:DEPLOYER,to:PARTICIPANTS.operator,data:'0x8456cb59',context:{operation:{kind:'pause' as const,input:NFT_DEFAULTS}}};
 let status='0x0',from=DEPLOYER;
 const wallet:WalletProvider={request:async({method})=>{
  if(method==='eth_chainId')return '0xaa36a7';
  if(method==='eth_getTransactionReceipt')return {status,logs:[],blockNumber:'0x1'};
  if(method==='eth_getTransactionByHash')return {from,to:PARTICIPANTS.boardReviewer,input:'0xcef6d209',value:'0x0'};
  throw new Error(method);
 }};
 assert.equal((await confirmNFTOperation(wallet,pending)).status,'failed');
 status='0x1';await assert.rejects(confirmNFTOperation(wallet,pending),/no coincide/);
 status='0x0';from=PARTICIPANTS.boardReviewer;await assert.rejects(confirmNFTOperation(wallet,pending),/wallet/);
});
