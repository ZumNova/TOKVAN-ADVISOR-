import {AbiCoder,ContractFactory,Interface,getAddress,id,keccak256,toUtf8Bytes,ZeroAddress,formatEther} from 'ethers';
import factoryArtifact from '../generated/erc721FactoryArtifact.json';
import nftArtifact from '../generated/erc721Artifact.json';
import {DEPLOYER,PARTICIPANTS,SEPOLIA_HEX,type WalletProvider} from './factoryWallet';

export const NFT_STORAGE_PREFIX='tokvan:erc721:sepolia:v1';
export const nftFactoryInterface=new Interface(factoryArtifact.abi);
export const nftInterface=new Interface(nftArtifact.abi);
const tuple='tuple(string name,string symbol,address admin,uint256 maxSupply,bool burnable,bool pausable)';
export interface CollectionInput {recoveredProjectId?:string;projectReference:string;name:string;symbol:string;admin:string;maxSupply:string;burnable:boolean;pausable:boolean;}
export const NFT_DEFAULTS:CollectionInput={projectReference:'TOKVAN-SEPOLIA-NFT-001',name:'TOKVAN NFT Test',symbol:'TKNFT',admin:DEPLOYER,maxSupply:'100',burnable:true,pausable:true};
export interface NFTFactoryRecord {address:string;hash:string;blockNumber:number;}
export async function requireNFTChain(wallet:WalletProvider) {
  const chain=await wallet.request({method:'eth_chainId'});
  if(typeof chain!=='string'||BigInt(chain)!==11155111n)throw new Error('Seleccione Sepolia en la wallet.');
}
async function activeAccount(wallet:WalletProvider) {
  await requireNFTChain(wallet);
  const accounts=await wallet.request({method:'eth_accounts'});
  if(!Array.isArray(accounts)||typeof accounts[0]!=='string')throw new Error('Conecte una wallet.');
  return getAddress(accounts[0]);
}
function address(value:string) {
  const result=getAddress(value.trim());if(result===ZeroAddress)throw new Error('La dirección no puede ser cero.');return result;
}
export function nftInteger(value:string) {
  if(!/^\d+$/.test(value)||BigInt(value)===0n||BigInt(value)>=2n**256n)throw new Error('Ingrese un entero positivo, sin decimales.');
  return BigInt(value);
}
export function prepareCollection(input:CollectionInput,factory:string) {
  const name=input.name.trim(),symbol=input.symbol.trim();
  if(!input.projectReference.trim()||!name||toUtf8Bytes(name).length>64||!symbol||toUtf8Bytes(symbol).length>16)throw new Error('Complete expediente, nombre (hasta 64 bytes) y símbolo (hasta 16 bytes).');
  if(typeof input.burnable!=='boolean'||typeof input.pausable!=='boolean')throw new Error('Opciones de colección inválidas.');
  const config={name,symbol,admin:address(input.admin),maxSupply:nftInteger(input.maxSupply),burnable:input.burnable,pausable:input.pausable};
  if(input.recoveredProjectId && (!/^0x[0-9a-fA-F]{64}$/.test(input.recoveredProjectId)||input.projectReference!==input.recoveredProjectId))throw new Error('El expediente recuperado no puede modificarse. Prepare otra colección.');
  const projectId=input.recoveredProjectId || id(input.projectReference.trim());
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','uint256','address','bytes32',tuple],[id('TOKVAN_ERC721_FACTORY_V1'),11155111,address(factory),projectId,config]));
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
export async function factory721CreationData() {
  return (await new ContractFactory(factoryArtifact.abi,factoryArtifact.bytecode).getDeployTransaction(...Object.values(PARTICIPANTS))).data!;
}
export async function verifyNFTFactory(wallet:WalletProvider,hash:string) {
  await requireNFTChain(wallet);
  if(!/^0x[0-9a-fA-F]{64}$/.test(hash))throw new Error('Ingrese el hash de la transacción de despliegue ERC-721.');
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[hash]}) as null|{status:string;contractAddress:string|null;blockNumber:string};
  if(!receipt)return {status:'pending' as const};
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[hash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!tx||getAddress(tx.from)!==DEPLOYER||tx.to!==null||tx.input.toLowerCase()!==(await factory721CreationData()).toLowerCase()||BigInt(tx.value)!==0n)throw new Error('Este hash no corresponde a nuestro factory ERC-721 con estas cuatro wallets.');
  if(BigInt(receipt.status)===0n)return {status:'failed' as const};
  if(BigInt(receipt.status)!==1n||!receipt.contractAddress)throw new Error('Receipt de despliegue inválido.');
  const factory=address(receipt.contractAddress);
  if(await wallet.request({method:'eth_getCode',params:[factory,'latest']})==='0x')throw new Error('El factory todavía no tiene código disponible.');
  await requireNFTChain(wallet);
  return {status:'confirmed' as const,record:{address:factory,hash,blockNumber:Number(BigInt(receipt.blockNumber))}};
}
async function verifiedFactory(wallet:WalletProvider,record:NFTFactoryRecord) {
  const result=await verifyNFTFactory(wallet,record.hash);
  if(result.status!=='confirmed'||result.record.address!==getAddress(record.address))throw new Error('Verifique primero el despliegue del factory ERC-721.');
  return result.record;
}
export async function readNFTState(wallet:WalletProvider,record:NFTFactoryRecord,input:CollectionInput) {
  const checked=await verifiedFactory(wallet,record);
  const prepared=prepareCollection(input,checked.address);
  const [hash,mask,collection]=await Promise.all([
    rpcCall(wallet,checked.address,nftFactoryInterface,'hashConfig',[prepared.projectId,prepared.config]),
    rpcCall(wallet,checked.address,nftFactoryInterface,'approvals',[prepared.digest]),
    rpcCall(wallet,checked.address,nftFactoryInterface,'collectionByProject',[prepared.projectId]),
  ]);
  if(hash!==prepared.digest)throw new Error('Los parámetros no coinciden con el factory ERC-721.');
  const accounts=await wallet.request({method:'eth_accounts'});
  const account=Array.isArray(accounts)&&typeof accounts[0]==='string'?getAddress(accounts[0]):'';
  const collectionAddress=getAddress(collection as string);
  let nft=null;
  if(collectionAddress!==ZeroAddress) {
    const [name,symbol,cap,minted,supply,paused,burnable,pausable,canMint,canPause]=await Promise.all([
      rpcCall(wallet,collectionAddress,nftInterface,'name'),rpcCall(wallet,collectionAddress,nftInterface,'symbol'),
      rpcCall(wallet,collectionAddress,nftInterface,'maxSupply'),rpcCall(wallet,collectionAddress,nftInterface,'mintedCount'),
      rpcCall(wallet,collectionAddress,nftInterface,'totalSupply'),rpcCall(wallet,collectionAddress,nftInterface,'paused'),
      rpcCall(wallet,collectionAddress,nftInterface,'burnable'),rpcCall(wallet,collectionAddress,nftInterface,'pausable'),
      account?rpcCall(wallet,collectionAddress,nftInterface,'hasRole',[id('MINTER_ROLE'),account]):false,
      account?rpcCall(wallet,collectionAddress,nftInterface,'hasRole',[id('PAUSER_ROLE'),account]):false,
    ]);
    nft={name:String(name),symbol:String(symbol),cap:BigInt(cap),minted:BigInt(minted),supply:BigInt(supply),paused:Boolean(paused),burnable:Boolean(burnable),pausable:Boolean(pausable),canMint:Boolean(canMint),canPause:Boolean(canPause)};
  }
  await requireNFTChain(wallet);
  return {account,collection:collectionAddress,approvals:Number(mask),nft,...prepared};
}
export type NFTOperation=
  | {kind:'factory'}
  | {kind:'approve'|'revoke'|'create';input:CollectionInput}
  | {kind:'mint';input:CollectionInput;recipient:string;uri:string}
  | {kind:'burn';input:CollectionInput;tokenId:string}
  | {kind:'pause'|'unpause';input:CollectionInput};
export interface NFTContext {record?:NFTFactoryRecord;operation:NFTOperation;}
export async function reviewNFTOperation(wallet:WalletProvider,context:NFTContext) {
  const account=await activeAccount(wallet);const op=context.operation;
  let to:string|undefined;let data:string;let summary:string;
  if(op.kind==='factory') {
    if(account!==DEPLOYER)throw new Error('Despliegue el factory ERC-721 desde A047.');
    data=await factory721CreationData();summary='Crear un factory ERC-721 con las cuatro wallets indicadas. No crea NFTs todavía.';
  } else {
    if(!context.record)throw new Error('Falta el factory ERC-721 confirmado.');
    const state=await readNFTState(wallet,context.record,op.input);
    if(state.account!==account)throw new Error('Cambió la cuenta. Vuelva a consultar.');
    if(op.kind==='approve'||op.kind==='revoke'||op.kind==='create') {
      if(state.collection!==ZeroAddress)throw new Error('Este expediente ya tiene una colección. Use sus controles de NFT.');
      to=context.record.address;
      if(op.kind==='create') {
        if(account!==PARTICIPANTS.operator||state.approvals!==7)throw new Error('La colección requiere tres aprobaciones y la firma del Operador 8A25.');
        data=nftFactoryInterface.encodeFunctionData('createCollection',[state.projectId,state.config]);
        summary=`Crear colección ${state.config.name} (${state.config.symbol}), máximo histórico ${state.config.maxSupply} NFTs. Administradora: ${state.config.admin}.`;
      } else {
        const index=[PARTICIPANTS.technicalReviewer,PARTICIPANTS.complianceReviewer,PARTICIPANTS.boardReviewer].indexOf(account);
        if(index<0)throw new Error('Conecte una wallet revisora: A047, FB24 o 1E8D.');
        const approved=Boolean(state.approvals&(1<<index));
        if(approved===(op.kind==='approve'))throw new Error(approved?'Esta wallet ya aprobó.':'Esta wallet no tiene una aprobación para revocar.');
        data=nftFactoryInterface.encodeFunctionData('setApproval',[state.digest,op.kind==='approve']);
        summary=`${op.kind==='approve'?'Aprobar':'Revocar aprobación de'} ${state.config.name} (${state.config.symbol}), máximo ${state.config.maxSupply}. Hash: ${state.digest}.`;
      }
    } else {
      if(!state.nft)throw new Error('Cree primero la colección aprobada.');
      to=state.collection;
      if(op.kind==='mint') {
        if(!state.nft.canMint)throw new Error('Esta wallet no tiene permiso para emitir NFTs. Inicialmente corresponde a A047.');
        if(state.nft.paused)throw new Error('La colección está pausada.');
        if(state.nft.minted>=state.nft.cap)throw new Error('La colección alcanzó su máximo histórico de NFTs.');
        const recipient=address(op.recipient),uri=metadataURI(op.uri);
        data=nftInterface.encodeFunctionData('mint',[recipient,uri]);
        summary=`Emitir un NFT de ${state.nft.name} a ${recipient}. Metadatos: ${uri}. La URI no podrá editarse después.`;
      } else if(op.kind==='burn') {
        if(!state.nft.burnable||state.nft.paused)throw new Error('La quema está deshabilitada o la colección está pausada.');
        const tokenId=nftInteger(op.tokenId);
        data=nftInterface.encodeFunctionData('burn',[tokenId]);
        summary=`Quemar el NFT #${tokenId} de ${state.nft.name}. Es irreversible; debe ser su propietario o estar autorizado.`;
      } else {
        if(!state.nft.canPause||!state.nft.pausable)throw new Error('Esta wallet no tiene permiso de pausa para esta colección.');
        if(state.nft.paused===(op.kind==='pause'))throw new Error('El estado cambió. Actualice la colección antes de continuar.');
        data=nftInterface.encodeFunctionData(op.kind,[]);
        summary=op.kind==='pause'?'Pausar transferencias, emisión y quema de esta colección. No elimina NFTs.':'Reanudar transferencias, emisión y quema de esta colección.';
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
export type NFTReview=Awaited<ReturnType<typeof reviewNFTOperation>>;
export interface NFTPending {hash:string;context:NFTContext;from:string;to?:string;data:string;}
export async function sendNFTOperation(wallet:WalletProvider,review:NFTReview):Promise<NFTPending> {
  const fresh=await reviewNFTOperation(wallet,review.context);
  if(fresh.tx.from!==review.tx.from||fresh.tx.to!==review.tx.to||fresh.tx.data!==review.tx.data)throw new Error('Cambió la cuenta o la operación. Vuelva a simular.');
  if(await activeAccount(wallet)!==review.tx.from)throw new Error('Cambió la cuenta. Vuelva a simular.');
  const hash=await wallet.request({method:'eth_sendTransaction',params:[{...fresh.tx,gas:'0x'+fresh.gas.toString(16)}]});
  if(typeof hash!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(hash))throw new Error('La wallet no devolvió un hash válido. Revise su historial antes de reintentar.');
  return {hash,context:review.context,from:fresh.tx.from,to:fresh.tx.to,data:fresh.tx.data};
}
export interface NFTLog {address:string;data:string;topics:string[];transactionHash:string;blockNumber:string;logIndex:string;removed?:boolean;}
export async function confirmNFTOperation(wallet:WalletProvider,pending:NFTPending) {
  if(pending.context.operation.kind==='factory')return verifyNFTFactory(wallet,pending.hash);
  await requireNFTChain(wallet);
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[pending.hash]}) as null|{status:string;logs:NFTLog[];blockNumber:string};
  if(!receipt)return {status:'pending' as const};
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[pending.hash]}) as {from:string;to:string|null;input:string;value:string}|null;
  // A reverted wallet wrapper is terminal too; only successful operations
  // must match our direct calldata and emit the expected event.
  if(!tx || getAddress(tx.from)!==getAddress(pending.from))throw new Error('La transacción no corresponde a la wallet que envió la operación.');
  if(BigInt(receipt.status)===0n){await requireNFTChain(wallet);return {status:'failed' as const};}
  if(!tx?.to||!pending.to||getAddress(tx.to)!==getAddress(pending.to)||getAddress(tx.from)!==getAddress(pending.from)||tx.input.toLowerCase()!==pending.data.toLowerCase()||BigInt(tx.value)!==0n)throw new Error('La transacción no coincide con la operación ERC-721 guardada.');
  if(BigInt(receipt.status)!==1n)throw new Error('Receipt inválido.');
  const op=pending.context.operation;
  const isFactory=['approve','revoke','create'].includes(op.kind);
  const iface=isFactory?nftFactoryInterface:nftInterface;
  const logs=receipt.logs.filter(l=>!l.removed&&getAddress(l.address)===getAddress(pending.to!)).map(l=>iface.parseLog(l)).filter(Boolean);
  const prepared=prepareCollection(op.input,pending.context.record!.address);
  const matching=logs.find(l=>{
    if(op.kind==='approve'||op.kind==='revoke')return l!.name==='ApprovalChanged'&&l!.args.digest===prepared.digest&&getAddress(l!.args.reviewer)===getAddress(pending.from)&&l!.args.approved===(op.kind==='approve');
    if(op.kind==='create')return l!.name==='CollectionCreated'&&l!.args.projectId===prepared.projectId&&l!.args.digest===prepared.digest;
    if(op.kind==='mint')return l!.name==='Transfer'&&l!.args.from===ZeroAddress&&getAddress(l!.args.to)===address(op.recipient);
    if(op.kind==='burn')return l!.name==='Transfer'&&l!.args.to===ZeroAddress&&l!.args.tokenId===nftInteger(op.tokenId);
    return l!.name===(op.kind==='pause'?'Paused':'Unpaused')&&getAddress(l!.args.account)===getAddress(pending.from);
  });
  if(!matching)throw new Error('No se encontró el evento esperado de esta operación.');
  return {status:'confirmed' as const,tokenId:op.kind==='mint'?String(matching.args.tokenId):undefined};
}
export interface NFTJournalEntry {collectionName?:string;symbol?:string;tokenName?:string;id:string;kind:string;address:string;hash:string;block:number;tokenId?:string;from?:string;to?:string;digest?:string;projectId?:string;}
async function getLogs(wallet:WalletProvider,address:string,from:number,to:number,topics:string[]) {
  const logs:NFTLog[]=[];
  for(let start=from;start<=to;start+=5000) {
    await requireNFTChain(wallet);
    const batch=await wallet.request({method:'eth_getLogs',params:[{address,fromBlock:'0x'+start.toString(16),toBlock:'0x'+Math.min(to,start+4999).toString(16),topics:[topics]}]});
    if(!Array.isArray(batch))throw new Error('El RPC no devolvió eventos válidos.');logs.push(...batch);
  }
  return logs.filter(l=>!l.removed&&getAddress(l.address)===getAddress(address));
}
export async function recoverNFTCollection(wallet:WalletProvider,record:NFTFactoryRecord,hash:string,expectedAddress:string) {
  const factory=await verifiedFactory(wallet,record);
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[hash]}) as {to:string|null;input:string}|null;
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[hash]}) as {status:string;logs:NFTLog[]}|null;
  if(!tx?.to||getAddress(tx.to)!==factory.address||!receipt||BigInt(receipt.status)!==1n)throw new Error('No se pudo verificar la creación de esta colección en el factory seleccionado.');
  const decoded=nftFactoryInterface.parseTransaction({data:tx.input});
  if(decoded?.name!=='createCollection')throw new Error('El hash no corresponde a la creación de una colección.');
  const projectId=String(decoded.args.projectId),config=decoded.args.config;
  const input:CollectionInput={projectReference:projectId,recoveredProjectId:projectId,name:config.name,symbol:config.symbol,admin:getAddress(config.admin),maxSupply:String(config.maxSupply),burnable:config.burnable,pausable:config.pausable};
  const prepared=prepareCollection(input,factory.address);
  const event=receipt.logs.filter(l=>!l.removed&&getAddress(l.address)===factory.address).map(l=>nftFactoryInterface.parseLog(l)).find(l=>l?.name==='CollectionCreated'&&getAddress(l.args.collection)===getAddress(expectedAddress)&&l.args.projectId===projectId&&l.args.digest===prepared.digest);
  if(!event)throw new Error('La colección no coincide con el evento de creación.');
  const state=await readNFTState(wallet,factory,input);
  if(state.collection!==getAddress(expectedAddress)||!state.nft)throw new Error('La colección no pertenece a este expediente.');
  return {input,state};
}
async function journalTokenName(wallet:WalletProvider,entry:NFTJournalEntry) {
  try {
    // Read mint calldata so the name remains available even after burning.
    const tx=await wallet.request({method:'eth_getTransactionByHash',params:[entry.hash]}) as {to:string;input:string}|null;
    if(!tx||getAddress(tx.to)!==getAddress(entry.address))return;
    const decoded=nftInterface.parseTransaction({data:tx.input});
    if(decoded?.name!=='mint')return;
    const uri=String(decoded.args[1]);
    if(!/^ipfs:\/\/[a-zA-Z0-9]+$/.test(uri))return;
    const response=await fetch('https://gateway.pinata.cloud/ipfs/'+uri.slice(7),{signal:AbortSignal.timeout(4000)});
    if(!response.ok)return;
    const reader=response.body?.getReader();if(!reader)return;
    let text='',size=0;const decoder=new TextDecoder();
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();return;}text+=decoder.decode(value,{stream:true});}
    text+=decoder.decode();const metadata=JSON.parse(text);
    if(typeof metadata.name==='string')entry.tokenName=metadata.name.slice(0,200);
  } catch { /* Metadata availability must never prevent collection recovery. */ }
}
export async function readNFTJournal(wallet:WalletProvider,record:NFTFactoryRecord) {
  const factory=await verifiedFactory(wallet,record);
  const latest=Math.max(0,Number(BigInt(await wallet.request({method:'eth_blockNumber'}) as string))-2);
  const entries:NFTJournalEntry[]=[{id:factory.hash,kind:'Factory ERC-721',address:factory.address,hash:factory.hash,block:factory.blockNumber}];
  const collections:{address:string;block:number}[]=[];
  for(const log of await getLogs(wallet,factory.address,factory.blockNumber,latest,['ApprovalChanged','CollectionCreated'].map(n=>nftFactoryInterface.getEvent(n)!.topicHash))) {
    const event=nftFactoryInterface.parseLog(log);if(!event)continue;
    const base={id:log.transactionHash+':'+log.logIndex,address:factory.address,hash:log.transactionHash,block:Number(BigInt(log.blockNumber)),digest:String(event.args.digest)};
    if(event.name==='ApprovalChanged')entries.push({...base,kind:event.args.approved?'Aprobación ERC-721':'Revocación ERC-721',from:getAddress(event.args.reviewer)});
    if(event.name==='CollectionCreated') {
      const address=getAddress(event.args.collection);collections.push({address,block:base.block});
      entries.push({...base,kind:'Colección ERC-721',address,projectId:String(event.args.projectId)});
    }
  }
  for(const collection of collections)for(const log of await getLogs(wallet,collection.address,collection.block,latest,['Transfer','Paused','Unpaused'].map(n=>nftInterface.getEvent(n)!.topicHash))) {
    const event=nftInterface.parseLog(log);if(!event)continue;
    const base={id:log.transactionHash+':'+log.logIndex,address:collection.address,hash:log.transactionHash,block:Number(BigInt(log.blockNumber))};
    if(event.name==='Transfer')entries.push({...base,kind:event.args.from===ZeroAddress?'NFT emitido':event.args.to===ZeroAddress?'NFT quemado':'NFT transferido',tokenId:String(event.args.tokenId),from:getAddress(event.args.from),to:getAddress(event.args.to)});
    else entries.push({...base,kind:event.name==='Paused'?'Colección pausada':'Colección reanudada',from:getAddress(event.args.account)});
  }
  await Promise.all(collections.map(async collection=>{
    const [name,symbol]=await Promise.all([rpcCall(wallet,collection.address,nftInterface,'name'),rpcCall(wallet,collection.address,nftInterface,'symbol')]);
    for(const entry of entries)if(entry.address===collection.address){entry.collectionName=String(name);entry.symbol=String(symbol);}
  }));
  // Small batches keep gateway requests bounded. Names are optional, IDs remain authoritative.
  const mints=entries.filter(entry=>entry.kind==='NFT emitido');
  for(let i=0;i<mints.length;i+=4)await Promise.all(mints.slice(i,i+4).map(entry=>journalTokenName(wallet,entry)));
  for(const entry of entries)if(entry.tokenId)entry.tokenName=mints.find(m=>m.address===entry.address&&m.tokenId===entry.tokenId)?.tokenName;
  await requireNFTChain(wallet);
  return [...new Map(entries.map(e=>[e.id,e])).values()].sort((a,b)=>a.block-b.block);
}
