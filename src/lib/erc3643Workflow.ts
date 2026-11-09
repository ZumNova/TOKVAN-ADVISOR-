import {AbiCoder,ContractFactory,Interface,getAddress,id,keccak256,toUtf8Bytes,ZeroAddress,parseUnits,formatUnits,formatEther} from 'ethers';
import suite from '../generated/erc3643Suite.json';
import artifact from '../generated/erc3643FactoryArtifact.json';
import claimArtifact from '../generated/erc3643ClaimArtifact.json';
import complianceArtifact from '../generated/erc3643ComplianceArtifact.json';
import {DEPLOYER,PARTICIPANTS,SEPOLIA_HEX,type WalletProvider} from './factoryWallet';
export {suite};
export const REG_PREFIX='tokvan:erc3643:sepolia:educational:v1';
export const factoryInterface=new Interface(artifact.abi);
export const tokenInterface=new Interface(suite.implementations[0].abi);
export const registryInterface=new Interface(suite.implementations[1].abi);
export const claimInterface=new Interface(claimArtifact.abi);
export const complianceInterface=new Interface(complianceArtifact.abi);
export interface RegInput {projectReference:string;recoveredProjectId?:string;name:string;symbol:string;decimals:string;admin:string;claimAuthority:string;supplyCap:string;walletCap:string;countries:string;dossierHash:string;}
export const REG_DEFAULTS:RegInput={projectReference:'TOKVAN-SEPOLIA-3643-001',name:'TOKVAN Regulated Test',symbol:'TKREG',decimals:'0',admin:DEPLOYER,claimAuthority:PARTICIPANTS.complianceReviewer,supplyCap:'1000',walletCap:'500',countries:'600,032',dossierHash:''};
export interface RegRecord {address:string;hash:string;blockNumber:number;}
export interface ImplementationRecord extends RegRecord {index:number;}
const tuple='tuple(string name,string symbol,uint8 decimals,address admin,address claimAuthority,uint256 supplyCap,uint256 walletCap,uint16[] countries,bytes32 dossierHash)';
export async function requireRegChain(wallet:WalletProvider){const chain=await wallet.request({method:'eth_chainId'});if(typeof chain!=='string'||BigInt(chain)!==11155111n)throw new Error('Solo Sepolia. Mainnet está bloqueada para esta versión con KYC ficticio.');}
export async function regAccount(wallet:WalletProvider){await requireRegChain(wallet);const accounts=await wallet.request({method:'eth_accounts'});if(!Array.isArray(accounts)||!accounts[0])throw new Error('Conecte una wallet.');return getAddress(accounts[0]);}
function address(value:string){const a=getAddress(value.trim());if(a===ZeroAddress)throw new Error('La wallet no puede ser cero.');return a;}
function hash(value:string){if(!/^0x[\da-fA-F]{64}$/.test(value)||BigInt(value)===0n)throw new Error('Falta el hash del expediente o referencia.');return value.toLowerCase();}
export function quantity(value:string,decimals:number){if(!/^\d+(\.\d+)?$/.test(value))throw new Error('Ingrese una cantidad positiva.');const result=parseUnits(value,decimals);if(result<=0n||result>=2n**256n)throw new Error('Cantidad fuera de rango.');return result;}
export function prepareReg(input:RegInput,factory:string){
 const name=input.name.trim(),symbol=input.symbol.trim();if(!name||toUtf8Bytes(name).length>64||!symbol||toUtf8Bytes(symbol).length>16||!input.projectReference.trim())throw new Error('Complete expediente, nombre (64 bytes) y símbolo (16 bytes).');
 if(!/^\d+$/.test(input.decimals)||Number(input.decimals)>18)throw new Error('Decimales: entero entre 0 y 18.');
 const decimals=Number(input.decimals),countries=input.countries.split(',').map(v=>{if(!/^\d{1,3}$/.test(v.trim())||Number(v)<1||Number(v)>999)throw new Error('Países: códigos numéricos ISO separados por coma, por ejemplo 600,032.');return Number(v);});
 if(countries.length>20||new Set(countries).size!==countries.length)throw new Error('Indique entre 1 y 20 países, sin repetir.');
 const config={name,symbol,decimals,admin:address(input.admin),claimAuthority:address(input.claimAuthority),supplyCap:quantity(input.supplyCap,decimals),walletCap:quantity(input.walletCap,decimals),countries,dossierHash:hash(input.dossierHash)};
 if(config.walletCap>config.supplyCap)throw new Error('El máximo por wallet no puede superar el supply máximo.');
 if(input.recoveredProjectId&&(input.projectReference!==input.recoveredProjectId||hash(input.recoveredProjectId)!==input.recoveredProjectId))throw new Error('No modifique el expediente recuperado.');
 const projectId=input.recoveredProjectId||id(input.projectReference.trim());
 return {config,projectId,digest:keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','uint256','address','bytes32',tuple],[id('TOKVAN_3643_SEPOLIA_EDUCATIONAL_V1'),11155111,address(factory),projectId,config]))};
}
async function call(wallet:WalletProvider,to:string,iface:Interface,method:string,args:unknown[]=[]){return iface.decodeFunctionResult(method,await wallet.request({method:'eth_call',params:[{to,data:iface.encodeFunctionData(method,args)},'latest']}) as string);}
async function scalar(wallet:WalletProvider,to:string,iface:Interface,method:string,args:unknown[]=[]){return (await call(wallet,to,iface,method,args))[0];}
async function checkImplementations(wallet:WalletProvider,addresses:string[]){if(addresses.length!==5)throw new Error('Faltan los cinco componentes oficiales.');await Promise.all(addresses.map(async(a,i)=>{const code=await wallet.request({method:'eth_getCode',params:[address(a),'latest']}) as string;if(keccak256(code)!==suite.implementations[i].runtimeHash)throw new Error('El código no coincide con el componente oficial '+suite.implementations[i].name);}));}
export async function regCreationData(implementations:string[]){return (await new ContractFactory(artifact.abi,artifact.bytecode).getDeployTransaction(...Object.values(PARTICIPANTS),implementations)).data!;}
type Receipt={status:string;contractAddress:string|null;blockNumber:string;logs:Log[]};
type Transaction={from:string;to:string|null;input:string;value:string};
async function transaction(wallet:WalletProvider,txHash:string){if(!/^0x[\da-fA-F]{64}$/.test(txHash))throw new Error('Hash de transacción inválido.');await requireRegChain(wallet);const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[txHash]}) as Receipt|null;const tx=receipt?await wallet.request({method:'eth_getTransactionByHash',params:[txHash]}) as Transaction|null:null;return {receipt,tx};}
export async function verifyRegDeployment(wallet:WalletProvider,txHash:string,index?:number){
 const {receipt,tx}=await transaction(wallet,txHash);if(!receipt)return {status:'pending' as const};
 if(!tx||getAddress(tx.from)!==DEPLOYER)throw new Error('El despliegue no corresponde a A047.');
 if(BigInt(receipt.status)===0n)return {status:'failed' as const};
 if(tx.to!==null||BigInt(tx.value)!==0n||!receipt.contractAddress||BigInt(receipt.status)!==1n)throw new Error('Despliegue inválido.');
 const a=getAddress(receipt.contractAddress);
 if(index!==undefined){
  const impl=suite.implementations[index];if(!impl||tx.input.toLowerCase()!==impl.bytecode.toLowerCase())throw new Error('Hash de otro componente.');
  if(keccak256(await wallet.request({method:'eth_getCode',params:[a,'latest']}) as string)!==impl.runtimeHash)throw new Error('Código oficial incorrecto.');
 }else{
  if(!tx.input.toLowerCase().startsWith(artifact.bytecode.toLowerCase()))throw new Error('No es el factory educativo ERC-3643.');
  const args=AbiCoder.defaultAbiCoder().decode(['address','address','address','address','address[5]'],'0x'+tx.input.slice(artifact.bytecode.length));
  const implementations=Array.from(args[4]) as string[];
  if(tx.input.toLowerCase()!==(await regCreationData(implementations)).toLowerCase())throw new Error('Participantes diferentes.');
  await checkImplementations(wallet,implementations);
  if(await wallet.request({method:'eth_getCode',params:[a,'latest']})==='0x')throw new Error('Factory sin código.');
 }
 await requireRegChain(wallet);return {status:'confirmed' as const,record:{address:a,hash:txHash,blockNumber:Number(BigInt(receipt.blockNumber))}};
}
async function verified(wallet:WalletProvider,record:RegRecord){const r=await verifyRegDeployment(wallet,record.hash);if(r.status!=='confirmed'||r.record.address!==getAddress(record.address))throw new Error('Verifique el factory.');return r.record;}
export async function readRegState(wallet:WalletProvider,record:RegRecord,input:RegInput){
 const checked=await verified(wallet,record),prepared=prepareReg(input,checked.address),account=await regAccount(wallet);
 const [digest,approvals,token]=await Promise.all([scalar(wallet,checked.address,factoryInterface,'hashConfig',[prepared.projectId,prepared.config]),scalar(wallet,checked.address,factoryInterface,'approvals',[prepared.digest]),scalar(wallet,checked.address,factoryInterface,'tokenByProject',[prepared.projectId])]);
 if(digest!==prepared.digest)throw new Error('Parámetros incompatibles.');
 let details:null|{name:string;symbol:string;decimals:number;supply:bigint;paused:boolean;owner:string;isAgent:boolean;registry:string;storageContract:string;topics:string;issuers:string;claimIssuer:string;compliance:string;authority:string;onchainID:string}=null;
 if(token!==ZeroAddress){
  const s=await call(wallet,checked.address,factoryInterface,'suites',[token]);
  const [name,symbol,decimals,supply,paused,owner,isAgent,registry,compliance,onchainID,authority]=await Promise.all([
   ...['name','symbol','decimals','totalSupply','paused','owner'].map(m=>scalar(wallet,token,tokenInterface,m)),scalar(wallet,token,tokenInterface,'isAgent',[account]),scalar(wallet,token,tokenInterface,'identityRegistry'),scalar(wallet,token,tokenInterface,'compliance'),scalar(wallet,token,tokenInterface,'onchainID'),scalar(wallet,s.claimIssuer,claimInterface,'authority')]);
  if(registry!==s.registry||compliance!==s.compliance)throw new Error('La administración cambió los módulos. Esta interfaz de prueba no puede operar esa configuración.');
  const topicInterface=new Interface(suite.implementations[3].abi),issuersInterface=new Interface(suite.implementations[4].abi);
  const [storage,topicsRegistry,issuersRegistry,topics,trusted,issuerTopics]=await Promise.all([
   scalar(wallet,String(registry),registryInterface,'identityStorage'),scalar(wallet,String(registry),registryInterface,'topicsRegistry'),scalar(wallet,String(registry),registryInterface,'issuersRegistry'),
   scalar(wallet,s.topics,topicInterface,'getClaimTopics'),scalar(wallet,s.issuers,issuersInterface,'getTrustedIssuers'),scalar(wallet,s.issuers,issuersInterface,'getTrustedIssuerClaimTopics',[s.claimIssuer])]);
  const expectedTopics=(values:Iterable<unknown>)=>Array.from(values,v=>Number(v)).sort().join(',')==='1,2,3';
  if(storage!==s.storageContract||topicsRegistry!==s.topics||issuersRegistry!==s.issuers||!expectedTopics(topics)||trusted.length!==1||trusted[0]!==s.claimIssuer||!expectedTopics(issuerTopics))throw new Error('Cambió la política de identidad de la suite. Revise los módulos antes de operar; esta versión exige sus tres acreditaciones de prueba.');
  details={name:String(name),symbol:String(symbol),decimals:Number(decimals),supply:BigInt(supply),paused:Boolean(paused),owner:String(owner),isAgent:Boolean(isAgent),registry:String(registry),storageContract:s.storageContract,topics:s.topics,issuers:s.issuers,claimIssuer:s.claimIssuer,compliance:String(compliance),authority:String(authority),onchainID:String(onchainID)};
 }
 await requireRegChain(wallet);return {account,approvals:Number(approvals),token:String(token),details,...prepared};
}
export async function readRegIdentity(wallet:WalletProvider,state:Awaited<ReturnType<typeof readRegState>>,subject:string){
 if(!state.details)throw new Error('Cree o recupere el token.');const target=address(subject),d=state.details;
 const [identity,verified,country,balance,frozen,locked]=await Promise.all([scalar(wallet,d.registry,registryInterface,'identity',[target]),scalar(wallet,d.registry,registryInterface,'isVerified',[target]),scalar(wallet,d.registry,registryInterface,'investorCountry',[target]),scalar(wallet,state.token,tokenInterface,'balanceOf',[target]),scalar(wallet,state.token,tokenInterface,'isFrozen',[target]),scalar(wallet,state.token,tokenInterface,'getFrozenTokens',[target])]);
 let credential=null;if(identity!==ZeroAddress){const c=await call(wallet,d.claimIssuer,claimInterface,'credentials',[identity]);credential={expiresAt:Number(c.expiresAt),entity:Boolean(c.entity),kyc:Boolean(c.kyc),kyb:Boolean(c.kyb),aml:Boolean(c.aml),eligible:Boolean(c.eligible),revoked:Boolean(c.revoked),evidence:String(c.evidence)};}
 await requireRegChain(wallet);return {target,identity:String(identity),verified:Boolean(verified),country:Number(country),balance:BigInt(balance),frozen:Boolean(frozen),locked:BigInt(locked),credential};
}
export interface TestCredentialInput {country:string;expiresAt:string;entity:boolean;kyc:boolean;kyb:boolean;aml:boolean;eligible:boolean;reference:string;}
export type RegAction='attest'|'revokeIdentity'|'mint'|'transfer'|'burn'|'pause'|'unpause'|'freeze'|'unfreeze'|'freezePartial'|'unfreezePartial'|'forcedTransfer'|'authorizeRecovery'|'recover'|'setIssuerIdentity';
export type RegOperation={kind:'implementation';index:number}|{kind:'factory';implementations:string[]}|{kind:'approve';input:RegInput}|{kind:'revoke';input:RegInput}|{kind:'create';input:RegInput}|{kind:'action';input:RegInput;action:RegAction;target:string;recipient:string;amount:string;reference:string;credential?:TestCredentialInput};
export interface RegContext {record?:RegRecord;operation:RegOperation;}
export async function reviewRegOperation(wallet:WalletProvider,context:RegContext){
 const account=await regAccount(wallet),op=context.operation;let to:string|undefined,data:string,summary:string;
 if(op.kind==='implementation'){if(account!==DEPLOYER)throw new Error('Despliegue con A047.');const impl=suite.implementations[op.index];if(!impl)throw new Error('Componente inválido.');data=impl.bytecode;summary=`Desplegar ${impl.name} de ERC-3643 4.1.3. Componente reutilizable: no emite tokens ni acredita KYC.`;}
 else if(op.kind==='factory'){if(account!==DEPLOYER)throw new Error('Despliegue con A047.');await checkImplementations(wallet,op.implementations);data=await regCreationData(op.implementations);summary='Crear el factory educativo, exclusivo de Sepolia, con las cuatro wallets y los cinco componentes oficiales.';}
 else{
  if(!context.record)throw new Error('Falta el factory.');const s=await readRegState(wallet,context.record,op.input);if(s.account!==account)throw new Error('Cambió la wallet.');to=context.record.address;
  if(op.kind==='approve'||op.kind==='revoke'||op.kind==='create'){
   if(s.token!==ZeroAddress)throw new Error('El expediente ya tiene un token.');
   if(op.kind==='create'){if(account!==PARTICIPANTS.operator||s.approvals!==7)throw new Error('Se requieren tres aprobaciones y el operador 8A25.');data=factoryInterface.encodeFunctionData('createToken',[s.projectId,s.config]);summary=`Crear ${s.config.name}, inicialmente pausado y sin supply. Ninguna wallet queda acreditada automáticamente. Expediente ficticio: ${s.config.dossierHash}.`;}
   else{const index=Object.values(PARTICIPANTS).slice(0,3).indexOf(account);if(index<0)throw new Error('Conecte una revisora.');if(Boolean(s.approvals&(1<<index))===(op.kind==='approve'))throw new Error('La aprobación ya está en ese estado.');data=factoryInterface.encodeFunctionData('setApproval',[s.digest,op.kind==='approve']);summary=`${op.kind==='approve'?'Aprobar':'Revocar'} configuración y expediente de prueba de ${s.config.name}. Hash ${s.digest}.`;}
  }else{
   const d=s.details;if(!d)throw new Error('Cree primero el token.');to=s.token;
   const adminAction=!['transfer','attest','revokeIdentity','authorizeRecovery','setIssuerIdentity'].includes(op.action);
   if(adminAction&&!d.isAgent)throw new Error('Esta acción requiere un agente del token (inicialmente A047).');
   if(['attest','revokeIdentity','authorizeRecovery'].includes(op.action)&&account!==d.authority)throw new Error('Conecte la autoridad de acreditación de prueba (inicialmente FB24).');
   const target=()=>address(op.target),recipient=()=>address(op.recipient),amount=()=>quantity(op.amount,d.decimals);
   const reference=()=>{if(op.reference.trim().length<4||op.reference.length>200)throw new Error('Indique una referencia ficticia de 4 a 200 caracteres.');return id(op.reference.trim());};
   if(op.action==='attest'){
    const c=op.credential;if(!c||!/^\d{1,3}$/.test(c.country)||Number(c.country)<1||Number(c.country)>999)throw new Error('Complete el país numérico.');
    const expiresAt=Number(c.expiresAt);if(!Number.isSafeInteger(expiresAt)||expiresAt<=0)throw new Error('Vencimiento inválido.');if(c.reference.trim().length<4||c.reference.length>200)throw new Error('Complete la referencia ficticia.');
    for(const flag of ['entity','kyc','kyb','aml','eligible'] as const)if(typeof c[flag]!=='boolean')throw new Error('Acreditaciones inválidas.');
    to=d.claimIssuer;data=claimInterface.encodeFunctionData('attest',[target(),{expiresAt,country:Number(c.country),entity:c.entity,kyc:c.kyc,kyb:c.kyb,aml:c.aml,eligible:c.eligible,revoked:false,evidence:id(c.reference.trim())}]);summary=`Registrar/actualizar identidad FICTICIA de ${target()}. País ${c.country}; vence ${new Date(expiresAt*1000).toISOString()}. Identidad: ${c.entity?'KYB de entidad':'KYC de persona'}; AML y elegibilidad también son obligatorias. No constituye una verificación real.`;
   }else if(op.action==='revokeIdentity'||op.action==='authorizeRecovery'||op.action==='recover'||op.action==='setIssuerIdentity'){
    const identity=await scalar(wallet,d.registry,registryInterface,'identity',[target()]);if(identity===ZeroAddress)throw new Error('La wallet no tiene identidad registrada.');
    if(op.action==='revokeIdentity'){to=d.claimIssuer;data=claimInterface.encodeFunctionData('revoke',[identity]);summary=`Revocar acreditación ficticia de ${target()}. Bloquea nuevas recepciones; no borra su saldo ni congela automáticamente sus envíos.`;}
    else if(op.action==='authorizeRecovery'){to=d.claimIssuer;data=claimInterface.encodeFunctionData('authorizeRecovery',[identity,recipient(),reference()]);summary=`Autorizar ${recipient()} como clave de recuperación de la identidad de ${target()}. La autoridad afirma haber verificado ficticiamente al titular. No mueve tokens todavía. Referencia ${op.reference}.`;}
    else if(op.action==='setIssuerIdentity'){if(account!==d.owner||target()!==d.owner)throw new Error('La propietaria debe vincular su propia identidad registrada.');data=tokenInterface.encodeFunctionData('setOnchainID',[identity]);summary=`Vincular la identidad ficticia de la emisora ${target()} al token.`;}
    else{if(target()===recipient()||await scalar(wallet,d.registry,registryInterface,'identity',[recipient()])!==ZeroAddress)throw new Error('La wallet nueva debe ser diferente y no estar registrada.');reference();data=tokenInterface.encodeFunctionData('recoveryAddress',[target(),recipient(),identity]);summary=`RECUPERAR TODO el saldo de ${target()} a ${recipient()}, trasladar congelamientos y retirar la wallet anterior del registro. Requiere clave autorizada por la autoridad de prueba. Referencia ${op.reference} (solo en esta revisión; la transacción oficial no guarda ese texto).`;}
   }else if(op.action==='pause'||op.action==='unpause'){data=tokenInterface.encodeFunctionData(op.action,[]);summary=op.action==='pause'?'Pausar transferencias normales. ERC-3643 permite emisión, quema, recuperación y transferencia forzada por agentes aun pausado.':'Reanudar transferencias normales, siempre sujetas a identidad, congelamientos y reglas.';}
   else if(op.action==='freeze'||op.action==='unfreeze'){data=tokenInterface.encodeFunctionData('setAddressFrozen',[target(),op.action==='freeze']);summary=`${op.action==='freeze'?'Congelar':'Descongelar'} wallet ${target()}. Afecta transferencias normales, no las facultades extraordinarias de agentes.`;}
   else if(op.action==='freezePartial'||op.action==='unfreezePartial'){data=tokenInterface.encodeFunctionData(op.action==='freezePartial'?'freezePartialTokens':'unfreezePartialTokens',[target(),amount()]);summary=`${op.action==='freezePartial'?'Congelar':'Liberar'} ${op.amount} ${d.symbol} de ${target()}. Se modifica el saldo congelado por esa cantidad.`;}
   else if(op.action==='forcedTransfer'){reference();data=tokenInterface.encodeFunctionData('forcedTransfer',[target(),recipient(),amount()]);summary=`TRANSFERENCIA FORZADA: mover ${op.amount} ${d.symbol} de ${target()} a ${recipient()} sin firma del titular. Omite pausa, congelamiento y reglas de límites/país, pero exige identidad válida del receptor. Referencia ${op.reference} (solo revisión local).`;}
   else{const method=op.action==='mint'?'mint':op.action==='burn'?'burn':'transfer';const dest=op.action==='burn'?target():recipient();data=tokenInterface.encodeFunctionData(method,[dest,amount()]);summary=op.action==='burn'?`QUEMA POR AGENTE: destruir ${op.amount} ${d.symbol} de ${dest}, incluso si están congelados o el token pausado. Irreversible. Reduce el supply circulante y libera cupo de emisión.`:`${op.action==='mint'?'Emitir':'Transferir'} ${op.amount} ${d.symbol} a ${dest}. Requiere identidad ficticia válida y reglas de prueba. ${op.action==='mint'?'La emisión por agente es posible aun pausado.':''}`;}
  }
 }
 const tx={from:account,...(to?{to}:{}),data,value:'0x0',chainId:SEPOLIA_HEX};
 try{await wallet.request({method:'eth_call',params:[tx,'latest']});}catch(e){throw new Error('Simulación rechazada. Revise identidad vigente (KYC/KYB, AML y elegibilidad), país permitido, saldos, límites, pausa y permisos. Detalle: '+String((e as {message?:string}).message||e));}
 const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[tx]}) as string)*120n/100n;
 const [price,balance]=await Promise.all([wallet.request({method:'eth_gasPrice'}),wallet.request({method:'eth_getBalance',params:[account,'latest']})]);
 if(BigInt(balance as string)<gas*BigInt(price as string))throw new Error('Saldo ETH Sepolia insuficiente para el gas estimado.');
 await requireRegChain(wallet);return {context,tx,gas,summary,estimatedEth:formatEther(gas*BigInt(price as string))};
}
export type RegReview=Awaited<ReturnType<typeof reviewRegOperation>>;
export interface RegPending {hash:string;context:RegContext;from:string;to?:string;data:string;}
export async function sendRegOperation(wallet:WalletProvider,review:RegReview):Promise<RegPending>{const fresh=await reviewRegOperation(wallet,review.context);if(fresh.tx.from!==review.tx.from||fresh.tx.to!==review.tx.to||fresh.tx.data!==review.tx.data||await regAccount(wallet)!==review.tx.from)throw new Error('Cambió la wallet o la operación. Simule de nuevo.');const h=await wallet.request({method:'eth_sendTransaction',params:[{...fresh.tx,gas:'0x'+fresh.gas.toString(16)}]});if(typeof h!=='string'||!/^0x[\da-fA-F]{64}$/.test(h))throw new Error('La wallet no devolvió hash válido; revise su historial antes de reintentar.');return {hash:h,context:review.context,from:fresh.tx.from,to:fresh.tx.to,data:fresh.tx.data};}
interface Log {address:string;data:string;topics:string[];transactionHash:string;blockNumber:string;logIndex:string;removed?:boolean;}
export async function confirmRegOperation(wallet:WalletProvider,pending:RegPending){
 const op=pending.context.operation;if(op.kind==='factory'||op.kind==='implementation')return verifyRegDeployment(wallet,pending.hash,op.kind==='implementation'?op.index:undefined);
 const {receipt,tx}=await transaction(wallet,pending.hash);if(!receipt)return {status:'pending' as const};
 if(!tx||getAddress(tx.from)!==getAddress(pending.from))throw new Error('Transacción de otra wallet.');
 if(BigInt(receipt.status)===0n)return {status:'failed' as const};
 if(BigInt(receipt.status)!==1n||!tx.to||getAddress(tx.to)!==getAddress(pending.to!)||tx.input.toLowerCase()!==pending.data.toLowerCase()||BigInt(tx.value)!==0n)throw new Error('La transacción no coincide con la revisión.');
 const isClaim=op.kind==='action'&&['attest','revokeIdentity','authorizeRecovery'].includes(op.action);
 const iface=op.kind==='action'?(isClaim?claimInterface:tokenInterface):factoryInterface;
 const expected=op.kind==='create'?'TokenCreated':op.kind==='approve'||op.kind==='revoke'?'ApprovalChanged':({attest:'TestCredential',revokeIdentity:'TestCredentialRevoked',authorizeRecovery:'TestRecoveryAuthorized',recover:'RecoverySuccess',setIssuerIdentity:'UpdatedTokenInformation',pause:'Paused',unpause:'Unpaused',freeze:'AddressFrozen',unfreeze:'AddressFrozen',freezePartial:'TokensFrozen',unfreezePartial:'TokensUnfrozen',mint:'Transfer',transfer:'Transfer',burn:'Transfer',forcedTransfer:'Transfer'} as const)[op.action];
 if(!receipt.logs.some(log=>!log.removed&&getAddress(log.address)===getAddress(pending.to!)&&iface.parseLog(log)?.name===expected))throw new Error('No se encontró el evento esperado.');
 await requireRegChain(wallet);return {status:'confirmed' as const};
}
export interface RegJournalEntry {id:string;hash:string;address:string;block:number;kind:string;name?:string;token?:string;detail:string;}
async function logs(wallet:WalletProvider,address:string,from:number,to:number){const result:Log[]=[];for(let start=from;start<=to;start+=5000){await requireRegChain(wallet);const chunk=await wallet.request({method:'eth_getLogs',params:[{address,fromBlock:'0x'+start.toString(16),toBlock:'0x'+Math.min(start+4999,to).toString(16)}]});if(!Array.isArray(chunk))throw new Error('RPC sin eventos válidos.');result.push(...chunk.filter(l=>!l.removed&&getAddress(l.address)===getAddress(address)));}return result;}
export async function readRegJournal(wallet:WalletProvider,record:RegRecord){
 const factory=await verified(wallet,record),latest=Math.max(0,Number(BigInt(await wallet.request({method:'eth_blockNumber'}) as string))-2);
 const entries:RegJournalEntry[]=[{id:factory.hash,hash:factory.hash,address:factory.address,block:factory.blockNumber,kind:'Factory ERC-3643 educativo',detail:'Sepolia · identidades ficticias'}];
 const created:{token:string;name:string;block:number}[]=[];
 for(const l of await logs(wallet,factory.address,factory.blockNumber,latest)){const e=factoryInterface.parseLog(l);if(!e)continue;const base={id:l.transactionHash+':'+l.logIndex,hash:l.transactionHash,address:factory.address,block:Number(BigInt(l.blockNumber)),kind:e.name,detail:''};if(e.name==='TokenCreated'){created.push({token:e.args.token,name:e.args.name,block:base.block});entries.push({...base,name:e.args.name,token:e.args.token,detail:'Expediente ficticio: '+e.args.dossierHash});}else entries.push({...base,detail:`${e.args.reviewer}: ${e.args.approved?'aprobación':'revocación'} · ${e.args.digest}`});}
 for(const c of created){const s=await call(wallet,factory.address,factoryInterface,'suites',[c.token]);for(const [a,iface] of [[c.token,tokenInterface],[s.registry,registryInterface],[s.claimIssuer,claimInterface],[s.compliance,complianceInterface],[s.storageContract,new Interface(suite.implementations[2].abi)],[s.topics,new Interface(suite.implementations[3].abi)],[s.issuers,new Interface(suite.implementations[4].abi)]] as [string,Interface][]){for(const l of await logs(wallet,a,c.block,latest)){const e=iface.parseLog(l);if(!e)continue;entries.push({id:l.transactionHash+':'+l.logIndex,hash:l.transactionHash,address:a,block:Number(BigInt(l.blockNumber)),kind:e.name,name:c.name,token:c.token,detail:e.args.map(v=>String(v)).join(' · ')});}}}
 await requireRegChain(wallet);return [...new Map(entries.map(e=>[e.id,e])).values()].sort((a,b)=>a.block-b.block);
}
export async function recoverRegToken(wallet:WalletProvider,record:RegRecord,txHash:string,expectedToken:string){
 const factory=await verified(wallet,record),{receipt,tx}=await transaction(wallet,txHash);
 if(!receipt||BigInt(receipt.status)!==1n||!tx?.to||getAddress(tx.to)!==factory.address)throw new Error('Creación no confirmada en este factory.');
 const decoded=factoryInterface.parseTransaction({data:tx.input});if(decoded?.name!=='createToken')throw new Error('No es una creación de token.');
 const projectId=String(decoded.args.projectId),c=decoded.args.c;
 const input:RegInput={projectReference:projectId,recoveredProjectId:projectId,name:c.name,symbol:c.symbol,decimals:String(c.decimals),admin:c.admin,claimAuthority:c.claimAuthority,supplyCap:formatUnits(c.supplyCap,c.decimals),walletCap:formatUnits(c.walletCap,c.decimals),countries:Array.from(c.countries).join(','),dossierHash:c.dossierHash};
 const state=await readRegState(wallet,record,input);
 if(state.token!==getAddress(expectedToken)||!receipt.logs.some(l=>!l.removed&&getAddress(l.address)===factory.address&&factoryInterface.parseLog(l)?.args.digest===state.digest))throw new Error('El token no coincide con la creación.');
 return {input,state};
}
