import {AbiCoder,ContractFactory,getAddress,id,Interface,isAddress,keccak256,parseUnits} from 'ethers';
import artifact from '../src/generated/factoryArtifact.json' with {type:'json'};
import factoryV2Artifact from '../src/generated/factoryV2Artifact.json' with {type:'json'};
import registry from '../deployment/sepolia-registry.json' with {type:'json'};
import {db,OWNER,projectHash,reply,staff,submission} from './governance.js';

const factory=new Interface(artifact.abi);
const factoryV2=new Interface(factoryV2Artifact.abi);
const tuple='tuple(string name,string symbol,uint8 decimals,uint256 initialSupply,uint256 maxSupply,address admin,address treasury,bool mintable,bool burnable,bool pausable)';
type RpcReceipt={status:string;blockNumber:string;contractAddress:string|null;logs:{address:string;topics:string[];data:string}[]};
type RpcTransaction={to:string|null;from:string;input:string;value:string};
async function rpc(method:string,params:unknown[]){
 const response=await fetch(process.env.SEPOLIA_RPC_URL||'https://ethereum-sepolia-rpc.publicnode.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('No se pudo consultar Sepolia. Intentá de nuevo.');
 const body=await response.json() as {result?:unknown;error?:{message:string}};
 if(body.error)throw new Error('Sepolia rechazó la consulta. Intentá de nuevo.');
 return body.result;
}
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>10000)return reply({error:'Solicitud demasiado grande.'},413);
  const body=await request.json() as {action?:string;submissionId?:string;transactionHash?:string;factoryDeploymentHash?:string};
  if(body.action!=='list'&&body.action!=='link')return reply({error:'Operación desconocida.'},400);
  const actor=await staff(request,body.action),client=db(),row=await submission(client,body.submissionId);
  if(row.project.standard!=='ERC-20'||row.project.network!=='sepolia')throw new Error('El expediente debe ser ERC-20 en Sepolia.');
  const existing=await client.from('submission_issuances').select('*').eq('submission_id',row.id).maybeSingle();
  if(existing.error)throw existing.error;
  if(body.action==='list')return reply({issuance:existing.data});
  if(actor.wallet!==OWNER&&actor.role!=='factory')throw new Error('Solo la administración o el operador del factory pueden vincular una emisión.');
  if(!/^0x[0-9a-f]{64}$/i.test(body.transactionHash||''))throw new Error('Hash de transacción inválido.');
  if(existing.data){
   if(existing.data.transaction_hash.toLowerCase()===body.transactionHash!.toLowerCase())return reply({issuance:existing.data});
   throw new Error('Este expediente ya tiene una emisión vinculada.');
  }
  const hash=projectHash(row.project);
  if(BigInt(await rpc('eth_chainId',[]) as string)!==11155111n)throw new Error('El RPC configurado no es Sepolia.');
  const [receipt,tx]=await Promise.all([
   rpc('eth_getTransactionReceipt',[body.transactionHash]) as Promise<RpcReceipt|null>,
   rpc('eth_getTransactionByHash',[body.transactionHash]) as Promise<RpcTransaction|null>,
  ]);
  if(!receipt||!tx||BigInt(receipt.status)!==1n||!tx.to||BigInt(tx.value)!==0n)throw new Error('La transacción no es una creación confirmada del factory ERC-20.');
  const isV1=getAddress(tx.to)===getAddress(registry.address);
  const factoryAddress=getAddress(tx.to);
  const activeFactory=isV1?factory:factoryV2;
  if(!isV1){
   if(actor.wallet!==OWNER)throw new Error('Solo la wallet 047 puede vincular emisiones v2.');
   if(!/^0x[0-9a-f]{64}$/i.test(body.factoryDeploymentHash||''))throw new Error('Falta el hash de despliegue del factory v2.');
   const [factoryReceipt,factoryTx]=await Promise.all([
    rpc('eth_getTransactionReceipt',[body.factoryDeploymentHash]) as Promise<RpcReceipt|null>,
    rpc('eth_getTransactionByHash',[body.factoryDeploymentHash]) as Promise<RpcTransaction|null>,
   ]);
   const expected=(await new ContractFactory(factoryV2Artifact.abi,factoryV2Artifact.bytecode).getDeployTransaction(OWNER)).data!;
   if(!factoryReceipt||BigInt(factoryReceipt.status)!==1n||!factoryReceipt.contractAddress||getAddress(factoryReceipt.contractAddress)!==factoryAddress||!factoryTx||getAddress(factoryTx.from)!==OWNER||factoryTx.to!==null||factoryTx.input.toLowerCase()!==expected.toLowerCase())throw new Error('El factory v2 no coincide con el despliegue verificado de la 047.');
   const approvals=await client.from('submission_operator_authorizations').select('project_hash,payment_id,decision').eq('submission_id',row.id).order('created_at',{ascending:false});
   const payments=await client.from('submission_payments').select('id,status').eq('submission_id',row.id);
   if(approvals.error||payments.error)throw approvals.error||payments.error;
   const latest=approvals.data?.find(a=>a.project_hash===hash);
   if(latest?.decision!=='approved'||!payments.data?.some(p=>p.id===latest.payment_id&&p.status==='verified'))throw new Error('Falta la decisión integral vigente y el pago verificado.');
  }else{
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
  }
  const decoded=activeFactory.parseTransaction({data:tx.input});
  if(decoded?.name!=='createToken'||decoded.args.projectId!==id(row.project.id))throw new Error('La transacción corresponde a otro expediente.');
  if(!isV1&&(getAddress(tx.from)!==OWNER||decoded.args.projectHash!==hash))throw new Error('La creación v2 no corresponde a la 047 y a esta versión del expediente.');
  const c=decoded.args.config,p=row.project.parameters;
  const decimals=Number(c.decimals),initialSupply=String(c.initialSupply),maxSupply=String(c.maxSupply);
  if(c.name.trim()!==p.tokenName.trim()||c.symbol.trim()!==p.tokenSymbol.trim()||decimals!==p.decimals||initialSupply!==parseUnits(String(p.initialSupply),decimals).toString()||maxSupply!==parseUnits(String(p.maxSupply??p.initialSupply),decimals).toString()||c.mintable!==p.isMintable||c.burnable!==p.isBurnable||c.pausable!==p.isPausable)throw new Error('Los parámetros creados no coinciden con el expediente aprobado.');
  if(row.project.clientWalletAddress&&row.project.clientWalletNetwork==='sepolia'&&isAddress(row.project.clientWalletAddress)&&getAddress(c.admin)!==getAddress(row.project.clientWalletAddress))throw new Error('La wallet administradora no coincide con la propuesta del cliente.');
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(isV1?['uint256','address','bytes32',tuple]:['uint256','address','bytes32','bytes32',tuple],isV1?[11155111,factoryAddress,decoded.args.projectId,c]:[11155111,factoryAddress,decoded.args.projectId,hash,c]));
  const event=receipt.logs.filter(l=>getAddress(l.address)===factoryAddress).map(l=>{try{return activeFactory.parseLog(l);}catch{return null;}}).find(l=>l?.name==='TokenCreated'&&l.args.projectId===decoded.args.projectId&&(isV1?l.args.digest===digest:l.args.configDigest===digest&&l.args.projectHash===hash)&&getAddress(l.args.admin)===getAddress(c.admin)&&getAddress(l.args.treasury)===getAddress(c.treasury));
  if(!event)throw new Error('No se encontró el evento de creación con el hash aprobado.');
  const latest=BigInt(await rpc('eth_blockNumber',[]) as string);
  if(latest-BigInt(receipt.blockNumber)<2n)throw new Error('Esperá dos bloques y volvé a verificar la emisión.');
  const record={submission_id:row.id,project_hash:hash,standard:'ERC-20',chain_id:11155111,factory_address:factoryAddress,token_address:getAddress(event.args.token),transaction_hash:body.transactionHash!.toLowerCase(),block_number:Number(BigInt(receipt.blockNumber)),project_id_hash:decoded.args.projectId,config_digest:digest,token_name:c.name,token_symbol:c.symbol,admin_wallet:getAddress(c.admin),treasury_wallet:getAddress(c.treasury),initial_supply_base_units:initialSupply,max_supply_base_units:maxSupply,recorded_by:actor.wallet};
  const saved=await client.from('submission_issuances').insert(record).select('*').single();
  if(saved.error)throw saved.error;
  return reply({issuance:saved.data});
 }catch(e){
  const message=e instanceof Error?e.message:'No se pudo vincular la emisión.';
  if(/permission|relation .* does not exist|schema cache|Could not find the table/i.test(message))return reply({error:'Falta aplicar la migración de emisiones en Supabase.'},503);
  if(/firma|sesión|origen administrativo|autorizad|operador/i.test(message))return reply({error:message},403);
  if(/inválid|faltan|falta|no coincide|corresponde|ya tiene|no es una|no se encontró|esperá/i.test(message))return reply({error:message},400);
  console.error('Issuance API error',e);return reply({error:'No se pudo verificar o guardar la emisión.'},500);
 }
}
