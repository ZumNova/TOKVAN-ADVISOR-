import {AbiCoder,getAddress,id,Interface,isAddress,keccak256} from 'ethers';
import nftFactoryArtifact from '../src/generated/erc721FactoryArtifact.json' with {type:'json'};
import multiFactoryArtifact from '../src/generated/erc1155FactoryArtifact.json' with {type:'json'};
import nftArtifact from '../src/generated/erc721Artifact.json' with {type:'json'};
import multiArtifact from '../src/generated/erc1155Artifact.json' with {type:'json'};
import {db,OWNER,projectHash,reply,staff,submission} from './governance.js';

const OPERATOR=getAddress('0xF3aAD2304F711ad5f400Ad322442D67DeD3E8A25');
const COMPLIANCE=getAddress('0xeFcA0FAFd073A7B5EBb044A83fA449A79835FB24');
const BOARD=getAddress('0x275fF48842eaf6dFE32B6Cc51713f6CF63841E8D');
const factory721=new Interface(nftFactoryArtifact.abi),factory1155=new Interface(multiFactoryArtifact.abi);
const collection721=new Interface(nftArtifact.abi),collection1155=new Interface(multiArtifact.abi);
const tuple721='tuple(string name,string symbol,address admin,uint256 maxSupply,bool burnable,bool pausable)';
const tuple1155='tuple(string name,string symbol,address admin,uint256 maxTypes,bool burnable,bool pausable)';
type Receipt={status:string;blockNumber:string;logs:{address:string;topics:string[];data:string}[]};
type Transaction={to:string|null;from:string;input:string;value:string};
async function rpc(method:string,params:unknown[]){
 const response=await fetch(process.env.SEPOLIA_RPC_URL||'https://ethereum-sepolia-rpc.publicnode.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('No se pudo consultar Sepolia. Intentá de nuevo.');
 const body=await response.json() as {result?:unknown;error?:unknown};
 if(body.error)throw new Error('Sepolia rechazó la consulta. Intentá de nuevo.');
 return body.result;
}
async function call(to:string,iface:Interface,name:string,args:unknown[]=[]){
 const data=iface.encodeFunctionData(name,args);
 const result=await rpc('eth_call',[{to,data},'latest']);
 return iface.decodeFunctionResult(name,result as string)[0];
}
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>10000)return reply({error:'Solicitud demasiado grande.'},413);
  const body=await request.json() as {action?:string;submissionId?:string;transactionHash?:string};
  if(body.action!=='link'||!/^0x[0-9a-f]{64}$/i.test(body.transactionHash||''))return reply({error:'Hash de creación inválido.'},400);
  const actor=staff(request,'link');
  if(actor.wallet!==OWNER)return reply({error:'Solo la 047 puede vincular una colección al expediente.'},403);
  const client=db(),row=await submission(client,body.submissionId);
  const project=row.project;
  if(!['ERC-721','ERC-1155'].includes(project.standard)||project.network!=='sepolia')throw new Error('El expediente debe ser ERC-721 o ERC-1155 en Sepolia.');
  const existing=await client.from('submission_collections').select('*').eq('submission_id',row.id).maybeSingle();
  if(existing.error)throw existing.error;
  if(existing.data){
   if(existing.data.transaction_hash.toLowerCase()===body.transactionHash!.toLowerCase())return reply({collection:existing.data});
   throw new Error('Este expediente ya tiene una colección vinculada.');
  }
  const hash=projectHash(project);
  const [reviews,payments,authorizations]=await Promise.all([
   client.from('submission_reviews').select('id,role,decision,project_hash').eq('submission_id',row.id).order('created_at',{ascending:false}),
   client.from('submission_payments').select('id,status').eq('submission_id',row.id),
   client.from('submission_authorizations').select('project_hash,review_ids,payment_id').eq('submission_id',row.id),
  ]);
  if(reviews.error||payments.error||authorizations.error)throw reviews.error||payments.error||authorizations.error;
  const roles=['Technical Reviewer','Compliance Reviewer','Enterprise Board'];
  const current=roles.map(role=>reviews.data?.find(r=>r.role===role));
  if(current.some(r=>!r||r.decision!=='Aprobado'||r.project_hash!==hash))throw new Error('Faltan dictámenes vigentes para esta versión del expediente.');
  const authorized=authorizations.data?.some(a=>a.project_hash===hash&&Array.isArray(a.review_ids)&&a.review_ids.length===3&&a.review_ids.every((v:string,i:number)=>v===current[i]?.id)&&payments.data?.some(p=>p.id===a.payment_id&&p.status==='verified'));
  if(!authorized)throw new Error('Falta autorización vigente y pago verificado.');
  if(BigInt(await rpc('eth_chainId',[]) as string)!==11155111n)throw new Error('El RPC configurado no es Sepolia.');
  const [receipt,tx]=await Promise.all([
   rpc('eth_getTransactionReceipt',[body.transactionHash]) as Promise<Receipt|null>,
   rpc('eth_getTransactionByHash',[body.transactionHash]) as Promise<Transaction|null>,
  ]);
  if(!receipt||!tx||BigInt(receipt.status)!==1n||!tx.to||getAddress(tx.from)!==OPERATOR||BigInt(tx.value)!==0n)throw new Error('La transacción no es una creación confirmada de colección TOKVANT.');
  const factoryAddress=getAddress(tx.to);
  const iface=project.standard==='ERC-721'?factory721:factory1155;
  const collectionIface=project.standard==='ERC-721'?collection721:collection1155;
  const decoded=iface.parseTransaction({data:tx.input});
  const projectId=id(project.id);
  if(decoded?.name!=='createCollection'||decoded.args.projectId!==projectId)throw new Error('La transacción corresponde a otro expediente.');
  const config=decoded.args.config,p=project.parameters;
  const cap=BigInt(project.standard==='ERC-721'?config.maxSupply:config.maxTypes);
  const differences=[
   config.name!==p.tokenName?`nombre: expediente «${p.tokenName}», colección «${config.name}»`:null,
   config.symbol!==p.tokenSymbol?`símbolo: expediente «${p.tokenSymbol}», colección «${config.symbol}»`:null,
   cap!==BigInt(p.initialSupply)?`máximo: expediente ${p.initialSupply}, colección ${cap}`:null,
   config.burnable!==p.isBurnable?`quema: expediente ${p.isBurnable?'sí':'no'}, colección ${config.burnable?'sí':'no'}`:null,
   config.pausable!==p.isPausable?`pausa: expediente ${p.isPausable?'sí':'no'}, colección ${config.pausable?'sí':'no'}`:null,
  ].filter(Boolean);
  if(differences.length)throw new Error(`La colección no coincide con los parámetros aprobados: ${differences.join('; ')}. Revisá la solicitud y el despliegue antes de vincularlos.`);
  if(project.clientWalletAddress&&project.clientWalletNetwork==='sepolia'&&isAddress(project.clientWalletAddress)&&getAddress(config.admin)!==getAddress(project.clientWalletAddress))throw new Error('La administradora no coincide con la wallet del expediente.');
  const [technical,compliance,board,operator,version,linkedAddress,code]=await Promise.all([
   call(factoryAddress,iface,'technicalReviewer'),call(factoryAddress,iface,'complianceReviewer'),call(factoryAddress,iface,'boardReviewer'),call(factoryAddress,iface,'operator'),call(factoryAddress,iface,'VERSION'),call(factoryAddress,iface,'collectionByProject',[projectId]),rpc('eth_getCode',[factoryAddress,'latest']),
  ]);
  if(getAddress(technical)!==OWNER||getAddress(compliance)!==COMPLIANCE||getAddress(board)!==BOARD||getAddress(operator)!==OPERATOR||version!==id(project.standard==='ERC-721'?'TOKVAN_ERC721_FACTORY_V1':'TOKVAN_ERC1155_FACTORY_V1')||code==='0x')throw new Error('El contrato no corresponde a un factory TOKVANT con los participantes esperados.');
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','uint256','address','bytes32',project.standard==='ERC-721'?tuple721:tuple1155],[version,11155111,factoryAddress,projectId,config]));
  const event=receipt.logs.filter(l=>getAddress(l.address)===factoryAddress).map(l=>{try{return iface.parseLog(l);}catch{return null;}}).find(l=>l?.name==='CollectionCreated'&&l.args.projectId===projectId&&l.args.digest===digest&&getAddress(l.args.admin)===getAddress(config.admin));
  if(!event||getAddress(event.args.collection)!==getAddress(linkedAddress))throw new Error('No se encontró la colección creada por este factory y expediente.');
  const collectionAddress=getAddress(event.args.collection);
  const [collectionCode,name,symbol,onchainCap,burnable,pausable]=await Promise.all([
   rpc('eth_getCode',[collectionAddress,'latest']),call(collectionAddress,collectionIface,'name'),call(collectionAddress,collectionIface,'symbol'),call(collectionAddress,collectionIface,project.standard==='ERC-721'?'maxSupply':'maxTypes'),call(collectionAddress,collectionIface,'burnable'),call(collectionAddress,collectionIface,'pausable'),
  ]);
  if(collectionCode==='0x'||name!==config.name||symbol!==config.symbol||BigInt(onchainCap)!==cap||burnable!==config.burnable||pausable!==config.pausable)throw new Error('El contrato de colección no coincide con el evento verificado.');
  const latest=BigInt(await rpc('eth_blockNumber',[]) as string);
  if(latest-BigInt(receipt.blockNumber)<2n)throw new Error('Esperá dos bloques y volvé a verificar el despliegue.');
  const record={submission_id:row.id,project_hash:hash,standard:project.standard,chain_id:11155111,factory_address:factoryAddress,collection_address:collectionAddress,transaction_hash:body.transactionHash!.toLowerCase(),block_number:Number(BigInt(receipt.blockNumber)),project_id_hash:projectId,config_digest:digest,collection_name:config.name,collection_symbol:config.symbol,admin_wallet:getAddress(config.admin),max_items:cap.toString(),burnable:config.burnable,pausable:config.pausable,recorded_by:actor.wallet};
  const saved=await client.from('submission_collections').insert(record).select('*').single();
  if(saved.error)throw saved.error;
  return reply({collection:saved.data});
 }catch(e){
  const message=e instanceof Error?e.message:'No se pudo vincular la colección.';
  if(/relation .* does not exist|schema cache|Could not find the table/i.test(message))return reply({error:'Falta aplicar la migración de colecciones en Supabase.'},503);
  if(/firma|autorización del equipo|Solo la 047/i.test(message))return reply({error:message},403);
  if(/inválid|faltan|falta|no coincide|corresponde|ya tiene|no es una|no se encontró|esperá|no corresponde/i.test(message))return reply({error:message},400);
  console.error('Collection link error',e);
  return reply({error:'No se pudo verificar o guardar la colección.'},500);
 }
}
