import {AbiCoder,getAddress,id,Interface,isAddress,keccak256,parseUnits,ZeroAddress} from 'ethers';
import factoryArtifact from '../src/generated/erc3643FactoryArtifact.json' with {type:'json'};
import suite from '../src/generated/erc3643Suite.json' with {type:'json'};
import {db,OWNER,projectHash,reply,staff,submission} from './governance.js';

const FACTORY=getAddress('0x873Cd8e429c677e678b4C5970e28492585403774');
const OPERATOR=getAddress('0xF3aAD2304F711ad5f400Ad322442D67DeD3E8A25');
const COMPLIANCE=getAddress('0xeFcA0FAFd073A7B5EBb044A83fA449A79835FB24');
const BOARD=getAddress('0x275fF48842eaf6dFE32B6Cc51713f6CF63841E8D');
const factory=new Interface(factoryArtifact.abi),token=new Interface(suite.implementations[0].abi);
const tuple='tuple(string name,string symbol,uint8 decimals,address admin,address claimAuthority,uint256 supplyCap,uint256 walletCap,uint16[] countries,bytes32 dossierHash)';
type Receipt={status:string;blockNumber:string;logs:{address:string;topics:string[];data:string}[]};
type Transaction={to:string|null;from:string;input:string;value:string};
async function rpc(method:string,params:unknown[]){
 const response=await fetch(process.env.SEPOLIA_RPC_URL||'https://ethereum-sepolia-rpc.publicnode.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('No se pudo consultar Sepolia. Intentá de nuevo.');
 const body=await response.json() as {result?:unknown;error?:unknown};
 if(body.error||body.result===undefined)throw new Error('Sepolia rechazó la consulta. Intentá de nuevo.');
 return body.result;
}
async function call(address:string,iface:Interface,name:string,args:unknown[]=[]){
 const result=await rpc('eth_call',[{to:address,data:iface.encodeFunctionData(name,args)},'latest']);
 return iface.decodeFunctionResult(name,result as string)[0];
}
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>10000)return reply({error:'Solicitud demasiado grande.'},413);
  const body=await request.json() as {action?:string;submissionId?:string;transactionHash?:string};
  if(body.action!=='link'||!/^0x[0-9a-f]{64}$/i.test(body.transactionHash||''))return reply({error:'Hash de creación inválido.'},400);
  const actor=staff(request,'link');
  if(actor.wallet!==OWNER)return reply({error:'Solo la 047 puede vincular el token al expediente.'},403);
  const client=db(),row=await submission(client,body.submissionId);
  if(row.project.standard!=='ERC-3643'||row.project.network!=='sepolia')throw new Error('El expediente debe ser ERC-3643 en Sepolia.');
  const existing=await client.from('submission_regulated_issuances').select('*').eq('submission_id',row.id).maybeSingle();
  if(existing.error)throw existing.error;
  if(existing.data){if(existing.data.transaction_hash.toLowerCase()===body.transactionHash!.toLowerCase())return reply({issuance:existing.data});throw new Error('Este expediente ya tiene un token vinculado.');}
  const hash=projectHash(row.project);
  const [reviews,payments,authorizations]=await Promise.all([
   client.from('submission_reviews').select('id,role,decision,project_hash').eq('submission_id',row.id).order('created_at',{ascending:false}),
   client.from('submission_payments').select('id,status').eq('submission_id',row.id),
   client.from('submission_authorizations').select('project_hash,review_ids,payment_id').eq('submission_id',row.id),
  ]);
  if(reviews.error||payments.error||authorizations.error)throw reviews.error||payments.error||authorizations.error;
  const current=['Technical Reviewer','Compliance Reviewer','Enterprise Board'].map(role=>reviews.data?.find(r=>r.role===role));
  if(current.some(r=>!r||r.decision!=='Aprobado'||r.project_hash!==hash))throw new Error('Faltan dictámenes vigentes para esta versión del expediente.');
  const authorized=authorizations.data?.some(a=>a.project_hash===hash&&Array.isArray(a.review_ids)&&a.review_ids.length===3&&a.review_ids.every((v:string,i:number)=>v===current[i]?.id)&&payments.data?.some(p=>p.id===a.payment_id&&p.status==='verified'));
  if(!authorized)throw new Error('Falta autorización vigente y pago verificado.');
  if(BigInt(await rpc('eth_chainId',[]) as string)!==11155111n)throw new Error('El RPC configurado no es Sepolia.');
  const [receipt,tx]=await Promise.all([rpc('eth_getTransactionReceipt',[body.transactionHash]) as Promise<Receipt|null>,rpc('eth_getTransactionByHash',[body.transactionHash]) as Promise<Transaction|null>]);
  if(!receipt||!tx||BigInt(receipt.status)!==1n||!tx.to||getAddress(tx.to)!==FACTORY||getAddress(tx.from)!==OPERATOR||BigInt(tx.value)!==0n)throw new Error('La transacción no es una creación confirmada del factory ERC-3643.');
  const decoded=factory.parseTransaction({data:tx.input});
  const projectId=id(row.project.id);
  if(decoded?.name!=='createToken'||decoded.args.projectId!==projectId)throw new Error('La transacción corresponde a otro expediente.');
  const c=decoded.args.c,p=row.project.parameters;
  if(c.name.trim()!==p.tokenName.trim()||c.symbol.trim()!==p.tokenSymbol.trim()||Number(c.decimals)!==p.decimals)throw new Error('Nombre, símbolo o decimales no coinciden con el expediente aprobado.');
  if(p.maxSupply!==undefined&&BigInt(c.supplyCap)!==parseUnits(String(p.maxSupply),p.decimals))throw new Error('El máximo de tokens no coincide con el expediente aprobado.');
  if(row.project.clientWalletAddress&&row.project.clientWalletNetwork==='sepolia'&&isAddress(row.project.clientWalletAddress)&&getAddress(c.admin)!==getAddress(row.project.clientWalletAddress))throw new Error('La propietaria del token no coincide con la wallet del expediente.');
  if(c.dossierHash===ZeroAddress||BigInt(c.dossierHash)===0n)throw new Error('Falta el hash del expediente educativo.');
  const [version,technical,compliance,board,operator,linkedToken,code]=await Promise.all([
   call(FACTORY,factory,'VERSION'),call(FACTORY,factory,'technicalReviewer'),call(FACTORY,factory,'complianceReviewer'),call(FACTORY,factory,'boardReviewer'),call(FACTORY,factory,'operator'),call(FACTORY,factory,'tokenByProject',[projectId]),rpc('eth_getCode',[FACTORY,'latest']),
  ]);
  if(version!==id('TOKVAN_3643_SEPOLIA_EDUCATIONAL_V1')||getAddress(technical)!==OWNER||getAddress(compliance)!==COMPLIANCE||getAddress(board)!==BOARD||getAddress(operator)!==OPERATOR||code==='0x')throw new Error('El factory no coincide con la instalación educativa TOKVANT de Sepolia.');
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','uint256','address','bytes32',tuple],[version,11155111,FACTORY,projectId,c]));
  const event=receipt.logs.filter(l=>getAddress(l.address)===FACTORY).map(l=>{try{return factory.parseLog(l);}catch{return null;}}).find(l=>l?.name==='TokenCreated'&&l.args.projectId===projectId&&l.args.digest===digest&&l.args.dossierHash===c.dossierHash);
  if(!event||getAddress(event.args.token)!==getAddress(linkedToken)||event.args.name!==c.name)throw new Error('No se encontró un token creado para este factory y expediente.');
  const address=getAddress(event.args.token);
  const [tokenCode,name,symbol,decimals,owner]=await Promise.all([rpc('eth_getCode',[address,'latest']),call(address,token,'name'),call(address,token,'symbol'),call(address,token,'decimals'),call(address,token,'owner')]);
  if(tokenCode==='0x'||name!==c.name||symbol!==c.symbol||Number(decimals)!==Number(c.decimals)||getAddress(owner)!==getAddress(c.admin))throw new Error('El contrato del token no coincide con la creación verificada.');
  const latest=BigInt(await rpc('eth_blockNumber',[]) as string);
  if(latest-BigInt(receipt.blockNumber)<2n)throw new Error('Esperá dos bloques y volvé a verificar.');
  const record={submission_id:row.id,project_hash:hash,standard:'ERC-3643',chain_id:11155111,factory_address:FACTORY.toLowerCase(),token_address:address.toLowerCase(),transaction_hash:body.transactionHash!.toLowerCase(),block_number:Number(BigInt(receipt.blockNumber)),project_id_hash:projectId,config_digest:digest,dossier_hash:c.dossierHash,token_name:c.name,token_symbol:c.symbol,admin_wallet:getAddress(c.admin).toLowerCase(),recorded_by:actor.wallet.toLowerCase()};
  const saved=await client.from('submission_regulated_issuances').insert(record).select('*').single();
  if(saved.error)throw saved.error;
  return reply({issuance:saved.data});
 }catch(e){
  const message=e instanceof Error?e.message:'No se pudo vincular el token.';
  if(/relation .* does not exist|schema cache|Could not find the table/i.test(message))return reply({error:'Falta aplicar la migración de emisiones ERC-3643 en Supabase.'},503);
  if(/firma|autorización del equipo|Solo la 047/i.test(message))return reply({error:message},403);
  if(/inválid|faltan|falta|no coincide|corresponde|ya tiene|no es una|no se encontró|esperá/i.test(message))return reply({error:message},400);
  console.error('Regulated issuance link error',e);
  return reply({error:'No se pudo verificar o guardar el token.'},500);
 }
}
