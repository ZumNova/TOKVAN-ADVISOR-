import {AbiCoder,ContractFactory,Interface,getAddress,id,keccak256,toUtf8Bytes,ZeroAddress,formatEther} from 'ethers';
import factoryArtifact from '../generated/erc1155FactoryArtifact.json';
import multiArtifact from '../generated/erc1155Artifact.json';
import {DEPLOYER,PARTICIPANTS,SEPOLIA_HEX,type WalletProvider} from './factoryWallet';

export const MULTI_STORAGE_PREFIX='tokvan:erc1155:sepolia:v1';
export const multiFactoryInterface=new Interface(factoryArtifact.abi);
export const multiInterface=new Interface(multiArtifact.abi);
const tuple='tuple(string name,string symbol,address admin,uint256 maxTypes,bool burnable,bool pausable)';
export interface CollectionInput {recoveredProjectId?:string;projectReference:string;name:string;symbol:string;admin:string;maxTypes:string;burnable:boolean;pausable:boolean;}
export const MULTI_DEFAULTS:CollectionInput={projectReference:'TOKVAN-SEPOLIA-1155-001',name:'TOKVAN Multi Token Test',symbol:'TK1155',admin:DEPLOYER,maxTypes:'100',burnable:true,pausable:true};
export interface MultiFactoryRecord {address:string;hash:string;blockNumber:number;}
export async function requireMultiChain(wallet:WalletProvider) {
  const chain=await wallet.request({method:'eth_chainId'});
  if(typeof chain!=='string'||BigInt(chain)!==11155111n)throw new Error('Seleccione Sepolia en la wallet.');
}
async function activeAccount(wallet:WalletProvider) {
  await requireMultiChain(wallet);
  const accounts=await wallet.request({method:'eth_accounts'});
  if(!Array.isArray(accounts)||typeof accounts[0]!=='string')throw new Error('Conecte una wallet.');
  return getAddress(accounts[0]);
}
function address(value:string) {
  const result=getAddress(value.trim());if(result===ZeroAddress)throw new Error('La dirección no puede ser cero.');return result;
}
export function multiInteger(value:string) {
  if(!/^\d+$/.test(value)||BigInt(value)===0n||BigInt(value)>=2n**256n)throw new Error('Ingrese un entero positivo, sin decimales.');
  return BigInt(value);
}
export function prepareCollection(input:CollectionInput,factory:string) {
  const name=input.name.trim(),symbol=input.symbol.trim();
  if(!input.projectReference.trim()||!name||toUtf8Bytes(name).length>64||!symbol||toUtf8Bytes(symbol).length>16)throw new Error('Complete expediente, nombre (hasta 64 bytes) y símbolo (hasta 16 bytes).');
  if(typeof input.burnable!=='boolean'||typeof input.pausable!=='boolean')throw new Error('Opciones de colección inválidas.');
  const config={name,symbol,admin:address(input.admin),maxTypes:multiInteger(input.maxTypes),burnable:input.burnable,pausable:input.pausable};
  if(input.recoveredProjectId && (!/^0x[0-9a-fA-F]{64}$/.test(input.recoveredProjectId)||input.projectReference!==input.recoveredProjectId))throw new Error('El expediente recuperado no puede modificarse. Prepare otra colección.');
  const projectId=input.recoveredProjectId || id(input.projectReference.trim());
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','uint256','address','bytes32',tuple],[id('TOKVAN_ERC1155_FACTORY_V1'),11155111,address(factory),projectId,config]));
  return {config,projectId,digest};
}
export function metadataURI(value:string) {
  const uri=value.trim();
  if(toUtf8Bytes(uri).length>2048)throw new Error('La URI no puede superar 2048 bytes.');
  let parsed:URL;try{parsed=new URL(uri);}catch{throw new Error('Ingrese una URI de metadatos HTTPS o IPFS válida.');}
  if(!['https:','ipfs:'].includes(parsed.protocol)||!parsed.hostname||parsed.username||parsed.password)throw new Error('Use metadatos HTTPS o IPFS, sin credenciales.');
  return uri;
}
async function rpcCall(wallet:WalletProvider,to:string,iface:Interface,method:string,args:unknown[]=[]) {
  const data=iface.encodeFunctionData(method,args);
  const result=await wallet.request({method:'eth_call',params:[{to,data},'latest']});
  return iface.decodeFunctionResult(method,result as string)[0];
}
export async function factory1155CreationData() {
  return (await new ContractFactory(factoryArtifact.abi,factoryArtifact.bytecode).getDeployTransaction(...Object.values(PARTICIPANTS))).data!;
}
export async function verifyMultiFactory(wallet:WalletProvider,hash:string) {
  await requireMultiChain(wallet);
  if(!/^0x[0-9a-fA-F]{64}$/.test(hash))throw new Error('Ingrese el hash de la transacción de despliegue ERC-1155.');
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[hash]}) as null|{status:string;contractAddress:string|null;blockNumber:string};
  if(!receipt)return {status:'pending' as const};
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[hash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!tx||getAddress(tx.from)!==DEPLOYER||tx.to!==null||tx.input.toLowerCase()!==(await factory1155CreationData()).toLowerCase()||BigInt(tx.value)!==0n)throw new Error('Este hash no corresponde a nuestro factory ERC-1155 con estas cuatro wallets.');
  if(BigInt(receipt.status)===0n)return {status:'failed' as const};
  if(BigInt(receipt.status)!==1n||!receipt.contractAddress)throw new Error('Receipt de despliegue inválido.');
  const factory=address(receipt.contractAddress);
  if(await wallet.request({method:'eth_getCode',params:[factory,'latest']})==='0x')throw new Error('El factory todavía no tiene código disponible.');
  await requireMultiChain(wallet);
  return {status:'confirmed' as const,record:{address:factory,hash,blockNumber:Number(BigInt(receipt.blockNumber))}};
}
async function verifiedFactory(wallet:WalletProvider,record:MultiFactoryRecord) {
  const result=await verifyMultiFactory(wallet,record.hash);
  if(result.status!=='confirmed'||result.record.address!==getAddress(record.address))throw new Error('Verifique primero el despliegue del factory ERC-1155.');
  return result.record;
}
export async function readMultiState(wallet:WalletProvider,record:MultiFactoryRecord,input:CollectionInput) {
  const checked=await verifiedFactory(wallet,record);
  const prepared=prepareCollection(input,checked.address);
  const [hash,mask,collection]=await Promise.all([
    rpcCall(wallet,checked.address,multiFactoryInterface,'hashConfig',[prepared.projectId,prepared.config]),
    rpcCall(wallet,checked.address,multiFactoryInterface,'approvals',[prepared.digest]),
    rpcCall(wallet,checked.address,multiFactoryInterface,'collectionByProject',[prepared.projectId]),
  ]);
  if(hash!==prepared.digest)throw new Error('Los parámetros no coinciden con el factory ERC-1155.');
  const accounts=await wallet.request({method:'eth_accounts'});
  const account=Array.isArray(accounts)&&typeof accounts[0]==='string'?getAddress(accounts[0]):'';
  const collectionAddress=getAddress(collection as string);
  let multi=null;
  if(collectionAddress!==ZeroAddress) {
    const [name,symbol,cap,minted,supply,paused,burnable,pausable,canMint,canPause]=await Promise.all([
      rpcCall(wallet,collectionAddress,multiInterface,'name'),rpcCall(wallet,collectionAddress,multiInterface,'symbol'),
      rpcCall(wallet,collectionAddress,multiInterface,'maxTypes'),rpcCall(wallet,collectionAddress,multiInterface,'typeCount'),
      rpcCall(wallet,collectionAddress,multiInterface,'totalSupply()'),rpcCall(wallet,collectionAddress,multiInterface,'paused'),
      rpcCall(wallet,collectionAddress,multiInterface,'burnable'),rpcCall(wallet,collectionAddress,multiInterface,'pausable'),
      account?rpcCall(wallet,collectionAddress,multiInterface,'hasRole',[id('MINTER_ROLE'),account]):false,
      account?rpcCall(wallet,collectionAddress,multiInterface,'hasRole',[id('PAUSER_ROLE'),account]):false,
    ]);
    multi={name:String(name),symbol:String(symbol),cap:BigInt(cap),minted:BigInt(minted),supply:BigInt(supply),paused:Boolean(paused),burnable:Boolean(burnable),pausable:Boolean(pausable),canMint:Boolean(canMint),canPause:Boolean(canPause)};
  }
  await requireMultiChain(wallet);
  return {account,collection:collectionAddress,approvals:Number(mask),multi,...prepared};
}
export type MultiOperation=
  | {kind:'factory'}
  | {kind:'approve'|'revoke'|'create';input:CollectionInput}
  | {kind:'mint';input:CollectionInput;recipient:string;uri:string;amount:string;cap:string}
  | {kind:'issue';input:CollectionInput;recipient:string;tokenId:string;amount:string}
  | {kind:'transfer';input:CollectionInput;recipient:string;tokenId:string;amount:string}
  | {kind:'burn';input:CollectionInput;tokenId:string;amount:string}
  | {kind:'pause'|'unpause';input:CollectionInput};
export interface MultiContext {record?:MultiFactoryRecord;operation:MultiOperation;}
export async function reviewMultiOperation(wallet:WalletProvider,context:MultiContext) {
  const account=await activeAccount(wallet);const op=context.operation;
  let to:string|undefined;let data:string;let summary:string;
  if(op.kind==='factory') {
    if(account!==DEPLOYER)throw new Error('Despliegue el factory ERC-1155 desde A047.');
    data=await factory1155CreationData();summary='Crear un factory ERC-1155 con las cuatro wallets indicadas. No crea tipos de token todavía.';
  } else {
    if(!context.record)throw new Error('Falta el factory ERC-1155 confirmado.');
    const state=await readMultiState(wallet,context.record,op.input);
    if(state.account!==account)throw new Error('Cambió la cuenta. Vuelva a consultar.');
    if(op.kind==='approve'||op.kind==='revoke'||op.kind==='create') {
      if(state.collection!==ZeroAddress)throw new Error('Este expediente ya tiene una colección. Use sus controles de tokens.');
      to=context.record.address;
      if(op.kind==='create') {
        if(account!==PARTICIPANTS.operator||state.approvals!==7)throw new Error('La colección requiere tres aprobaciones y la firma del Operador 8A25.');
        data=multiFactoryInterface.encodeFunctionData('createCollection',[state.projectId,state.config]);
        summary=`Crear colección ${state.config.name} (${state.config.symbol}), máximo histórico ${state.config.maxTypes} tipos de token. Administradora: ${state.config.admin}.`;
      } else {
        const index=[PARTICIPANTS.technicalReviewer,PARTICIPANTS.complianceReviewer,PARTICIPANTS.boardReviewer].indexOf(account);
        if(index<0)throw new Error('Conecte una wallet revisora: A047, FB24 o 1E8D.');
        const approved=Boolean(state.approvals&(1<<index));
        if(approved===(op.kind==='approve'))throw new Error(approved?'Esta wallet ya aprobó.':'Esta wallet no tiene una aprobación para revocar.');
        data=multiFactoryInterface.encodeFunctionData('setApproval',[state.digest,op.kind==='approve']);
        summary=`${op.kind==='approve'?'Aprobar':'Revocar aprobación de'} ${state.config.name} (${state.config.symbol}), máximo ${state.config.maxTypes}. Hash: ${state.digest}.`;
      }
    } else {
      if(!state.multi)throw new Error('Cree primero la colección aprobada.');
      to=state.collection;
      if(op.kind==='mint') {
        if(!state.multi.canMint)throw new Error('Esta wallet no tiene permiso para crear tipos de token.');
        if(state.multi.paused)throw new Error('La colección está pausada.');
        if(state.multi.minted>=state.multi.cap)throw new Error('La colección alcanzó su máximo de tipos.');
        const recipient=address(op.recipient),uri=metadataURI(op.uri),amount=multiInteger(op.amount),cap=multiInteger(op.cap);
        if(amount>cap)throw new Error('La cantidad inicial supera el máximo histórico del tipo.');
        data=multiInterface.encodeFunctionData('createType',[recipient,amount,cap,uri]);
        summary=`Crear un tipo nuevo en ${state.multi.name}: emitir ${amount} unidades a ${recipient}, máximo histórico ${cap}. URI fija: ${uri}.`;
      } else if(op.kind==='issue') {
        if(!state.multi.canMint||state.multi.paused)throw new Error('No tiene permiso de emisión o la colección está pausada.');
        const tokenId=multiInteger(op.tokenId),amount=multiInteger(op.amount),recipient=address(op.recipient);
        const [cap,minted]=await Promise.all([rpcCall(wallet,to,multiInterface,'maxSupply',[tokenId]),rpcCall(wallet,to,multiInterface,'mintedCount',[tokenId])]);
        if(BigInt(cap)===0n)throw new Error('Ese tipo de token no existe.');
        if(amount>BigInt(cap)-BigInt(minted))throw new Error('La emisión supera el máximo histórico del tipo.');
        data=multiInterface.encodeFunctionData('mint',[recipient,tokenId,amount]);
        summary=`Emitir ${amount} unidades adicionales del tipo #${tokenId} de ${state.multi.name} a ${recipient}. Conserva su imagen y URI.`;
      } else if(op.kind==='burn'||op.kind==='transfer') {
        if(state.multi.paused)throw new Error('La colección está pausada.');
        if(op.kind==='burn'&&!state.multi.burnable)throw new Error('La quema está deshabilitada.');
        const tokenId=multiInteger(op.tokenId),amount=multiInteger(op.amount);
        const balance=BigInt(await rpcCall(wallet,to,multiInterface,'balanceOf',[account,tokenId]));
        if(amount>balance)throw new Error('La cantidad supera el saldo de esta wallet para ese ID.');
        if(op.kind==='burn') {
          data=multiInterface.encodeFunctionData('burn',[account,tokenId,amount]);
          summary=`Quemar ${amount} unidades del tipo #${tokenId} de ${state.multi.name} desde ${account}. Es irreversible y no libera cupo de emisión.`;
        } else {
          const recipient=address(op.recipient);
          data=multiInterface.encodeFunctionData('safeTransferFrom',[account,recipient,tokenId,amount,'0x']);
          summary=`Transferir ${amount} unidades del tipo #${tokenId} de ${state.multi.name} desde ${account} a ${recipient}.`;
        }
      } else {
        if(!state.multi.canPause||!state.multi.pausable)throw new Error('Esta wallet no tiene permiso de pausa para esta colección.');
        if(state.multi.paused===(op.kind==='pause'))throw new Error('El estado cambió. Actualice la colección antes de continuar.');
        data=multiInterface.encodeFunctionData(op.kind,[]);
        summary=op.kind==='pause'?'Pausar transferencias, emisión y quema de esta colección. No elimina tipos de token.':'Reanudar transferencias, emisión y quema de esta colección.';
      }
    }
  }
  const tx={from:account,...(to?{to}:{}),data,value:'0x0',chainId:SEPOLIA_HEX};
  await wallet.request({method:'eth_call',params:[tx,'latest']});
  const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[tx]}) as string)*120n/100n;
  const [price,balance]=await Promise.all([wallet.request({method:'eth_gasPrice'}),wallet.request({method:'eth_getBalance',params:[account,'latest']})]);
  if(BigInt(balance as string)<gas*BigInt(price as string))throw new Error('No hay suficiente ETH Sepolia en esta wallet para el gas estimado.');
  return {context,tx,summary,gas,estimatedEth:formatEther(gas*BigInt(price as string))};
}
export type MultiReview=Awaited<ReturnType<typeof reviewMultiOperation>>;
export interface MultiPending {hash:string;context:MultiContext;from:string;to?:string;data:string;}
export async function sendMultiOperation(wallet:WalletProvider,review:MultiReview):Promise<MultiPending> {
  const fresh=await reviewMultiOperation(wallet,review.context);
  if(fresh.tx.from!==review.tx.from||fresh.tx.to!==review.tx.to||fresh.tx.data!==review.tx.data)throw new Error('Cambió la cuenta o la operación. Vuelva a simular.');
  if(await activeAccount(wallet)!==review.tx.from)throw new Error('Cambió la cuenta. Vuelva a simular.');
  const hash=await wallet.request({method:'eth_sendTransaction',params:[{...fresh.tx,gas:'0x'+fresh.gas.toString(16)}]});
  if(typeof hash!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(hash))throw new Error('La wallet no devolvió un hash válido. Revise su historial antes de reintentar.');
  return {hash,context:review.context,from:fresh.tx.from,to:fresh.tx.to,data:fresh.tx.data};
}
export interface MultiLog {address:string;data:string;topics:string[];transactionHash:string;blockNumber:string;logIndex:string;removed?:boolean;}
export async function confirmMultiOperation(wallet:WalletProvider,pending:MultiPending) {
  if(pending.context.operation.kind==='factory')return verifyMultiFactory(wallet,pending.hash);
  await requireMultiChain(wallet);
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[pending.hash]}) as null|{status:string;logs:MultiLog[];blockNumber:string};
  if(!receipt)return {status:'pending' as const};
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[pending.hash]}) as {from:string;to:string|null;input:string;value:string}|null;
  // A reverted wallet wrapper is terminal too; only successful operations
  // must match our direct calldata and emit the expected event.
  if(!tx || getAddress(tx.from)!==getAddress(pending.from))throw new Error('La transacción no corresponde a la wallet que envió la operación.');
  if(BigInt(receipt.status)===0n){await requireMultiChain(wallet);return {status:'failed' as const};}
  if(!tx?.to||!pending.to||getAddress(tx.to)!==getAddress(pending.to)||getAddress(tx.from)!==getAddress(pending.from)||tx.input.toLowerCase()!==pending.data.toLowerCase()||BigInt(tx.value)!==0n)throw new Error('La transacción no coincide con la operación ERC-1155 guardada.');
  if(BigInt(receipt.status)!==1n)throw new Error('Receipt inválido.');
  const op=pending.context.operation;
  const isFactory=['approve','revoke','create'].includes(op.kind);
  const iface=isFactory?multiFactoryInterface:multiInterface;
  const logs=receipt.logs.filter(l=>!l.removed&&getAddress(l.address)===getAddress(pending.to!)).map(l=>iface.parseLog(l)).filter(Boolean);
  const prepared=prepareCollection(op.input,pending.context.record!.address);
  const matching=logs.find(l=>{
    if(op.kind==='approve'||op.kind==='revoke')return l!.name==='ApprovalChanged'&&l!.args.digest===prepared.digest&&getAddress(l!.args.reviewer)===getAddress(pending.from)&&l!.args.approved===(op.kind==='approve');
    if(op.kind==='create')return l!.name==='CollectionCreated'&&l!.args.projectId===prepared.projectId&&l!.args.digest===prepared.digest;
    if(op.kind==='mint'||op.kind==='issue')return l!.name==='TransferSingle'&&l!.args.from===ZeroAddress&&getAddress(l!.args.to)===address(op.recipient)&&l!.args.value===multiInteger(op.amount)&&(op.kind==='mint'||l!.args.id===multiInteger(op.tokenId));
    if(op.kind==='burn')return l!.name==='TransferSingle'&&l!.args.to===ZeroAddress&&getAddress(l!.args.from)===getAddress(pending.from)&&l!.args.id===multiInteger(op.tokenId)&&l!.args.value===multiInteger(op.amount);
    if(op.kind==='transfer')return l!.name==='TransferSingle'&&getAddress(l!.args.from)===getAddress(pending.from)&&getAddress(l!.args.to)===address(op.recipient)&&l!.args.id===multiInteger(op.tokenId)&&l!.args.value===multiInteger(op.amount);
    return l!.name===(op.kind==='pause'?'Paused':'Unpaused')&&getAddress(l!.args.account)===getAddress(pending.from);
  });
  if(!matching)throw new Error('No se encontró el evento esperado de esta operación.');
  return {status:'confirmed' as const,tokenId:(op.kind==='mint'||op.kind==='issue')?String(matching.args.id):undefined};
}
export interface MultiJournalEntry {collectionName?:string;symbol?:string;tokenName?:string;amount?:string;tokenURI?:string;id:string;kind:string;address:string;hash:string;block:number;tokenId?:string;from?:string;to?:string;digest?:string;projectId?:string;}
async function getLogs(wallet:WalletProvider,address:string,from:number,to:number,topics:string[]) {
  const logs:MultiLog[]=[];
  for(let start=from;start<=to;start+=5000) {
    await requireMultiChain(wallet);
    const batch=await wallet.request({method:'eth_getLogs',params:[{address,fromBlock:'0x'+start.toString(16),toBlock:'0x'+Math.min(to,start+4999).toString(16),topics:[topics]}]});
    if(!Array.isArray(batch))throw new Error('El RPC no devolvió eventos válidos.');logs.push(...batch);
  }
  return logs.filter(l=>!l.removed&&getAddress(l.address)===getAddress(address));
}
export async function recoverMultiCollection(wallet:WalletProvider,record:MultiFactoryRecord,hash:string,expectedAddress:string) {
  const factory=await verifiedFactory(wallet,record);
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[hash]}) as {to:string|null;input:string}|null;
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[hash]}) as {status:string;logs:MultiLog[]}|null;
  if(!tx?.to||getAddress(tx.to)!==factory.address||!receipt||BigInt(receipt.status)!==1n)throw new Error('No se pudo verificar la creación de esta colección en el factory seleccionado.');
  const decoded=multiFactoryInterface.parseTransaction({data:tx.input});
  if(decoded?.name!=='createCollection')throw new Error('El hash no corresponde a la creación de una colección.');
  const projectId=String(decoded.args.projectId),config=decoded.args.config;
  const input:CollectionInput={projectReference:projectId,recoveredProjectId:projectId,name:config.name,symbol:config.symbol,admin:getAddress(config.admin),maxTypes:String(config.maxTypes),burnable:config.burnable,pausable:config.pausable};
  const prepared=prepareCollection(input,factory.address);
  const event=receipt.logs.filter(l=>!l.removed&&getAddress(l.address)===factory.address).map(l=>multiFactoryInterface.parseLog(l)).find(l=>l?.name==='CollectionCreated'&&getAddress(l.args.collection)===getAddress(expectedAddress)&&l.args.projectId===projectId&&l.args.digest===prepared.digest);
  if(!event)throw new Error('La colección no coincide con el evento de creación.');
  const state=await readMultiState(wallet,factory,input);
  if(state.collection!==getAddress(expectedAddress)||!state.multi)throw new Error('La colección no pertenece a este expediente.');
  return {input,state};
}
async function journalTokenName(_wallet:WalletProvider,entry:MultiJournalEntry) {
  try {
    const uri=entry.tokenURI;
    if(!uri||!/^ipfs:\/\/[a-zA-Z0-9]+$/.test(uri))return;
    const response=await fetch('https://gateway.pinata.cloud/ipfs/'+uri.slice(7),{signal:AbortSignal.timeout(4000)});
    if(!response.ok)return;
    const reader=response.body?.getReader();if(!reader)return;
    let text='',size=0;const decoder=new TextDecoder();
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();return;}text+=decoder.decode(value,{stream:true});}
    text+=decoder.decode();const metadata=JSON.parse(text);
    if(typeof metadata.name==='string')entry.tokenName=metadata.name.slice(0,200);
  }catch{ /* Metadata is optional; IDs and recovery are verified on-chain. */ }
}
export async function readMultiType(wallet:WalletProvider,record:MultiFactoryRecord,input:CollectionInput,tokenId:string) {
  const state=await readMultiState(wallet,record,input);
  if(!state.multi)throw new Error('Recupere primero una colección.');
  const id=multiInteger(tokenId);
  const [cap,minted,supply,uri,balance]=await Promise.all([
    rpcCall(wallet,state.collection,multiInterface,'maxSupply',[id]),rpcCall(wallet,state.collection,multiInterface,'mintedCount',[id]),
    rpcCall(wallet,state.collection,multiInterface,'totalSupply(uint256)',[id]),rpcCall(wallet,state.collection,multiInterface,'uri',[id]),
    state.account?rpcCall(wallet,state.collection,multiInterface,'balanceOf',[state.account,id]):0n,
  ]);
  if(BigInt(cap)===0n)throw new Error('Ese tipo no existe.');
  await requireMultiChain(wallet);
  return {tokenId,cap:BigInt(cap),minted:BigInt(minted),supply:BigInt(supply),balance:BigInt(balance),uri:String(uri)};
}
export async function readMultiJournal(wallet:WalletProvider,record:MultiFactoryRecord) {
  const factory=await verifiedFactory(wallet,record);
  const latest=Math.max(0,Number(BigInt(await wallet.request({method:'eth_blockNumber'}) as string))-2);
  const entries:MultiJournalEntry[]=[{id:factory.hash,kind:'Factory ERC-1155',address:factory.address,hash:factory.hash,block:factory.blockNumber}];
  const collections:{address:string;block:number}[]=[];
  for(const log of await getLogs(wallet,factory.address,factory.blockNumber,latest,['ApprovalChanged','CollectionCreated'].map(n=>multiFactoryInterface.getEvent(n)!.topicHash))) {
    const event=multiFactoryInterface.parseLog(log);if(!event)continue;
    const base={id:log.transactionHash+':'+log.logIndex,address:factory.address,hash:log.transactionHash,block:Number(BigInt(log.blockNumber)),digest:String(event.args.digest)};
    if(event.name==='ApprovalChanged')entries.push({...base,kind:event.args.approved?'Aprobación ERC-1155':'Revocación ERC-1155',from:getAddress(event.args.reviewer)});
    if(event.name==='CollectionCreated') {
      const address=getAddress(event.args.collection);collections.push({address,block:base.block});
      entries.push({...base,kind:'Colección ERC-1155',address,projectId:String(event.args.projectId)});
    }
  }
  for(const collection of collections)for(const log of await getLogs(wallet,collection.address,collection.block,latest,['TransferSingle','TransferBatch','TypeCreated','Paused','Unpaused'].map(n=>multiInterface.getEvent(n)!.topicHash))) {
    const event=multiInterface.parseLog(log);if(!event)continue;
    const base={id:log.transactionHash+':'+log.logIndex,address:collection.address,hash:log.transactionHash,block:Number(BigInt(log.blockNumber))};
    if(event.name==='TypeCreated')entries.push({...base,kind:'Tipo creado',tokenId:String(event.args.tokenId),tokenURI:String(event.args.tokenURI)});
    else if(event.name==='TransferSingle'||event.name==='TransferBatch') {
      const ids=event.name==='TransferSingle'?[event.args.id]:Array.from(event.args.ids);
      const amounts=event.name==='TransferSingle'?[event.args.value]:Array.from(event.args[4]);
      ids.forEach((tokenId,index)=>entries.push({...base,id:base.id+':'+index,kind:event.args.from===ZeroAddress?'Unidades emitidas':event.args.to===ZeroAddress?'Unidades quemadas':'Unidades transferidas',tokenId:String(tokenId),amount:String(amounts[index]),from:getAddress(event.args.from),to:getAddress(event.args.to)}));
    } else entries.push({...base,kind:event.name==='Paused'?'Colección pausada':'Colección reanudada',from:getAddress(event.args.account)});
  }
  await Promise.all(collections.map(async collection=>{
    const [name,symbol]=await Promise.all([rpcCall(wallet,collection.address,multiInterface,'name'),rpcCall(wallet,collection.address,multiInterface,'symbol')]);
    for(const entry of entries)if(entry.address===collection.address){entry.collectionName=String(name);entry.symbol=String(symbol);}
  }));
  // Small batches keep gateway requests bounded. Names are optional, IDs remain authoritative.
  const mints=entries.filter(entry=>entry.kind==='Tipo creado');
  for(let i=0;i<mints.length;i+=4)await Promise.all(mints.slice(i,i+4).map(entry=>journalTokenName(wallet,entry)));
  for(const entry of entries)if(entry.tokenId)entry.tokenName=mints.find(m=>m.address===entry.address&&m.tokenId===entry.tokenId)?.tokenName;
  await requireMultiChain(wallet);
  return [...new Map(entries.map(e=>[e.id,e])).values()].sort((a,b)=>a.block-b.block);
}
