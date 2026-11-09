import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout} from 'node:timers/promises';
import {readFileSync} from 'node:fs';
import {Contract,JsonRpcProvider,ZeroAddress,id,keccak256,Interface} from 'ethers';
import {DEPLOYER,PARTICIPANTS,type WalletProvider} from '../src/lib/factoryWallet';
import {demoDossier,dossierHash,emptyDossier,productionReadiness,DOSSIER_FIELDS} from '../src/lib/erc3643Dossier';
import {REG_DEFAULTS,suite,prepareReg,quantity,regCreationData,reviewRegOperation,sendRegOperation,confirmRegOperation,verifyRegDeployment,readRegState,readRegIdentity,readRegJournal,recoverRegToken,tokenInterface,registryInterface,claimInterface,factoryInterface,type RegRecord,type RegOperation,type RegAction,type TestCredentialInput} from '../src/lib/erc3643Workflow';
const dossier={...demoDossier(),acknowledged:true};
const input={...REG_DEFAULTS,dossierHash:dossierHash(dossier)};
test('dossier is explicitly fictitious, binds every field and never opens mainnet',()=>{
 assert.throws(()=>dossierHash(emptyDossier()));assert.throws(()=>dossierHash(demoDossier()));
 const base=dossierHash(dossier);
 for(const [key] of DOSSIER_FIELDS)assert.notEqual(dossierHash({...dossier,fields:{...dossier.fields,[key]:dossier.fields[key]+' Changed'}}),base);
 assert.equal(productionReadiness().allowed,false);
 const initial=prepareReg(input,DEPLOYER).digest;
 for(const patch of [{name:'Other'},{symbol:'NEW'},{decimals:'1'},{admin:PARTICIPANTS.operator},{claimAuthority:DEPLOYER},{supplyCap:'1001'},{walletCap:'400'},{countries:'600'},{dossierHash:id('other')},{projectReference:'other'}])assert.notEqual(prepareReg({...input,...patch},DEPLOYER).digest,initial);
 for(const patch of [{decimals:'19'},{decimals:'-1'},{countries:''},{countries:'0'},{countries:'600,600'},{walletCap:'1001'},{admin:ZeroAddress},{dossierHash:''}])assert.throws(()=>prepareReg({...input,...patch},DEPLOYER));
 assert.equal(quantity('9007199254740993',0),9007199254740993n);assert.throws(()=>quantity('0',0));assert.throws(()=>quantity('1.1',0));
});
test('official implementations, claims, ERC3643 operations and journal work together', {timeout:180000},async()=>{
 const node=spawn('anvil',['--port','18548','--chain-id','11155111','--silent'],{stdio:'ignore'});let launchError:Error|undefined;node.on('error',e=>launchError=e);
 const provider=new JsonRpcProvider('http://127.0.0.1:18548',11155111,{staticNetwork:true,cacheTimeout:-1});
 try{
  let ready=false;for(let i=0;i<40;i++){if(launchError)throw launchError;try{await provider.send('eth_blockNumber',[]);ready=true;break;}catch{await setTimeout(100);}}assert.ok(ready);
  for(const a of Object.values(PARTICIPANTS)){await provider.send('anvil_impersonateAccount',[a]);await provider.send('anvil_setBalance',[a,'0x56bc75e2d63100000']);}
  let account=DEPLOYER;const wallet:WalletProvider={request:({method,params})=>method==='eth_accounts'?Promise.resolve([account]):provider.send(method,params??[])};
  let record:RegRecord|undefined;
  async function execute(operation:RegOperation){const review=await reviewRegOperation(wallet,{record,operation});const pending=await sendRegOperation(wallet,review);const result=await confirmRegOperation(wallet,pending);assert.equal(result.status,'confirmed');return result;}
  const addresses:string[]=[];
  for(let index=0;index<5;index++){const r=await execute({kind:'implementation',index});assert.ok('record'in r&&r.record);addresses.push(r.record.address);await assert.rejects(verifyRegDeployment(wallet,r.record.hash,(index+1)%5));}
  const deployed=await execute({kind:'factory',implementations:addresses});assert.ok('record'in deployed&&deployed.record);record=deployed.record;
  assert.equal((await verifyRegDeployment(wallet,record.hash)).status,'confirmed');
  const changed=await reviewRegOperation(wallet,{record,operation:{kind:'approve',input}});account=PARTICIPANTS.complianceReviewer;await assert.rejects(sendRegOperation(wallet,changed),/Cambió/);
  account=PARTICIPANTS.operator;await assert.rejects(reviewRegOperation(wallet,{record,operation:{kind:'create',input}}),/tres aprobaciones/);
  for(const reviewer of Object.values(PARTICIPANTS).slice(0,3)){account=reviewer;await execute({kind:'approve',input});}
  await execute({kind:'revoke',input});assert.equal((await readRegState(wallet,record,input)).approvals,3);await execute({kind:'approve',input});
  assert.equal((await readRegState(wallet,record,{...input,dossierHash:id('other')})).approvals,0);
  account=PARTICIPANTS.operator;await execute({kind:'create',input});let state=await readRegState(wallet,record,input);assert.ok(state.details);assert.equal(state.details.paused,true);assert.equal(state.details.supply,0n);
  const token=new Contract(state.token,tokenInterface,provider),registry=new Contract(state.details.registry,registryInterface,provider),issuer=new Contract(state.details.claimIssuer,claimInterface,provider);
  assert.equal(await token.owner(),DEPLOYER);assert.equal(await issuer.authority(),PARTICIPANTS.complianceReviewer);assert.equal(await token.isAgent(PARTICIPANTS.operator),false);
  const expiry=String(Number((await provider.getBlock('latest'))!.timestamp)+86400);
  const credential:TestCredentialInput={country:'600',expiresAt:expiry,entity:false,kyc:true,kyb:false,aml:true,eligible:true,reference:'TEST-ONLY-001'};
  const action=(action:RegAction,patch:Partial<Extract<RegOperation,{kind:'action'}>>={}):RegOperation=>({kind:'action',input,action,target:DEPLOYER,recipient:DEPLOYER,amount:'100',reference:'TEST-ACTION-001',credential,...patch});
  account=DEPLOYER;await assert.rejects(reviewRegOperation(wallet,{record,operation:action('mint')}));await assert.rejects(reviewRegOperation(wallet,{record,operation:action('attest')}),/autoridad/);
  account=PARTICIPANTS.complianceReviewer;
  await execute(action('attest',{credential:{...credential,entity:true,kyc:true,kyb:false}}));assert.equal(await registry.isVerified(DEPLOYER),false);
  await execute(action('attest',{credential:{...credential,entity:true,kyb:true}}));assert.equal(await registry.isVerified(DEPLOYER),true);
  account=DEPLOYER;await execute(action('setIssuerIdentity'));assert.notEqual(await token.onchainID(),ZeroAddress);
  await execute(action('mint'));assert.equal(await token.balanceOf(DEPLOYER),100n); // Agent mint is allowed while paused.
  await assert.rejects(reviewRegOperation(wallet,{record,operation:action('transfer',{recipient:PARTICIPANTS.boardReviewer,amount:'3'})}));
  await execute(action('unpause'));
  await assert.rejects(reviewRegOperation(wallet,{record,operation:action('transfer',{recipient:PARTICIPANTS.boardReviewer,amount:'3'})}));
  account=PARTICIPANTS.complianceReviewer;await execute(action('attest',{target:PARTICIPANTS.boardReviewer,credential:{...credential,aml:false}}));assert.equal(await registry.isVerified(PARTICIPANTS.boardReviewer),false);
  await execute(action('attest',{target:PARTICIPANTS.boardReviewer}));
  account=DEPLOYER;await execute(action('transfer',{recipient:PARTICIPANTS.boardReviewer,amount:'3'}));assert.equal(await token.balanceOf(PARTICIPANTS.boardReviewer),3n);
  await execute(action('freezePartial',{target:PARTICIPANTS.boardReviewer,amount:'2'}));
  account=PARTICIPANTS.boardReviewer;await assert.rejects(reviewRegOperation(wallet,{record,operation:action('transfer',{amount:'2'})}));await execute(action('transfer',{amount:'1'}));
  account=DEPLOYER;await execute(action('freeze',{target:PARTICIPANTS.boardReviewer}));await assert.rejects(reviewRegOperation(wallet,{record,operation:action('transfer',{recipient:PARTICIPANTS.boardReviewer,amount:'1'})}));
  await execute(action('pause'));await execute(action('burn',{target:PARTICIPANTS.boardReviewer,amount:'1'}));assert.equal(await token.balanceOf(PARTICIPANTS.boardReviewer),1n);assert.equal(await token.getFrozenTokens(PARTICIPANTS.boardReviewer),1n);
  account=PARTICIPANTS.complianceReviewer;await execute(action('revokeIdentity',{target:PARTICIPANTS.boardReviewer}));assert.equal(await registry.isVerified(PARTICIPANTS.boardReviewer),false);
  account=DEPLOYER;await assert.rejects(reviewRegOperation(wallet,{record,operation:action('mint',{recipient:PARTICIPANTS.boardReviewer,amount:'1'})}));
  account=PARTICIPANTS.complianceReviewer;await execute(action('attest',{target:PARTICIPANTS.boardReviewer,credential:{...credential,country:'840'}}));
  account=DEPLOYER;await execute(action('unpause'));await execute(action('unfreeze',{target:PARTICIPANTS.boardReviewer}));await assert.rejects(reviewRegOperation(wallet,{record,operation:action('transfer',{recipient:PARTICIPANTS.boardReviewer,amount:'1'})}));
  await execute(action('forcedTransfer',{recipient:PARTICIPANTS.boardReviewer,amount:'1'})); // Verified receiver, country rule bypassed explicitly by agent.
  await assert.rejects(reviewRegOperation(wallet,{record,operation:action('mint',{amount:'500'})}));
  const identityBefore=await registry.identity(PARTICIPANTS.boardReviewer);
  await assert.rejects(reviewRegOperation(wallet,{record,operation:action('recover',{target:PARTICIPANTS.boardReviewer,recipient:PARTICIPANTS.operator})}));
  account=PARTICIPANTS.complianceReviewer;await execute(action('authorizeRecovery',{target:PARTICIPANTS.boardReviewer,recipient:PARTICIPANTS.operator}));
  account=DEPLOYER;await execute(action('recover',{target:PARTICIPANTS.boardReviewer,recipient:PARTICIPANTS.operator}));
  assert.equal(await registry.identity(PARTICIPANTS.boardReviewer),ZeroAddress);assert.equal(await registry.identity(PARTICIPANTS.operator),identityBefore);assert.equal(await token.balanceOf(PARTICIPANTS.operator),2n);assert.equal(await token.getFrozenTokens(PARTICIPANTS.operator),1n);
  state=await readRegState(wallet,record,input);const identityState=await readRegIdentity(wallet,state,PARTICIPANTS.operator);assert.equal(identityState.verified,true);assert.equal(identityState.country,840);
  // Official batch transfer is atomic and appears as distinct transfer events.
  const batchHash=await provider.send('eth_sendTransaction',[{from:DEPLOYER,to:state.token,gas:'0x493e0',data:tokenInterface.encodeFunctionData('batchTransfer',[[DEPLOYER,DEPLOYER],[1,1]])}]);assert.equal((await provider.getTransactionReceipt(batchHash))?.status,1);
  await provider.send('anvil_mine',['0x3']);const journal=await readRegJournal(wallet,record);
  for(const kind of ['TokenCreated','TestCredential','TestCredentialRevoked','TestRecoveryAuthorized','RecoverySuccess','Transfer','TokensFrozen','AddressFrozen','Paused','Unpaused'])assert.ok(journal.some(e=>e.kind===kind),kind);
  assert.equal(new Set(journal.map(e=>e.id)).size,journal.length);assert.equal(journal.filter(e=>e.hash===batchHash&&e.kind==='Transfer').length,2);
  const entry=journal.find(e=>e.kind==='TokenCreated')!;const recovered=await recoverRegToken(wallet,record,entry.hash,state.token);assert.equal(recovered.state.token,state.token);assert.equal(prepareReg(recovered.input,record.address).digest,prepareReg(input,record.address).digest);
  await assert.rejects(recoverRegToken(wallet,record,entry.hash,DEPLOYER));await assert.rejects(recoverRegToken(wallet,record,record.hash,state.token));
  const topicsInterface=new Interface(suite.implementations[3].abi);
  await provider.send('eth_sendTransaction',[{from:DEPLOYER,to:state.details!.topics,gas:'0x493e0',data:topicsInterface.encodeFunctionData('removeClaimTopic',[1])}]);
  await assert.rejects(readRegState(wallet,record,input),/política de identidad/);
  await provider.send('eth_sendTransaction',[{from:DEPLOYER,to:state.details!.topics,gas:'0x493e0',data:topicsInterface.encodeFunctionData('addClaimTopic',[1])}]);
  assert.ok((await readRegState(wallet,record,input)).details);
  await provider.send('evm_increaseTime',[86401]);await provider.send('evm_mine',[]);assert.equal(await registry.isVerified(DEPLOYER),false);await assert.rejects(reviewRegOperation(wallet,{record,operation:action('mint',{amount:'1'})}));
  const wrongNetwork:WalletProvider={request:({method,params})=>method==='eth_chainId'?Promise.resolve('0x1'):wallet.request({method,params})};await assert.rejects(reviewRegOperation(wrongNetwork,{operation:{kind:'factory',implementations:addresses}}),/Mainnet/);
 }finally{provider.destroy();node.kill();}
});
test('official artifacts and local exported bytecode retain their exact provenance',()=>{
 for(const a of suite.implementations){const dir=a.name==='Token'?'token':'registry/implementation';const source=JSON.parse(readFileSync(`node_modules/@erc3643org/erc-3643/artifacts/contracts/${dir}/${a.name}.sol/${a.name}.json`,'utf8'));assert.equal(a.bytecode,source.bytecode);assert.deepEqual(a.abi,source.abi);assert.equal(a.runtimeHash,keccak256(source.deployedBytecode));}
 for(const [contract,file,source] of [['Tokvan3643TestFactory','erc3643FactoryArtifact','Tokvan3643TestFactory'],['Tokvan3643TestClaimIssuer','erc3643ClaimArtifact','Tokvan3643TestIdentity'],['Tokvan3643TestCompliance','erc3643ComplianceArtifact','Tokvan3643TestCompliance']]){const a=JSON.parse(readFileSync(`src/generated/${file}.json`,'utf8'));const c=JSON.parse(readFileSync(`out/${source}.sol/${contract}.json`,'utf8'));assert.deepEqual(a.abi,c.abi);assert.equal(a.bytecode,c.bytecode.object);}
});
