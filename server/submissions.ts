import {createHash, timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import WebSocket from 'ws';
import {getAddress,Interface,isAddress,verifyMessage} from 'ethers';
import type {ProjectDocument,TokenProject} from '../src/types';
import {projectHash} from './governance.js';

const BUCKET='tokvant-expedientes';
// Sepolia staff wallets; kept in sync with deployment/sepolia-participants.json.
const deployment={deployer:'0x521125be95c5679539aB07582F55F0040975A047',participants:{technicalReviewer:'0x521125be95c5679539aB07582F55F0040975A047',complianceReviewer:'0xeFcA0FAFd073A7B5EBb044A83fA449A79835FB24',boardReviewer:'0x275fF48842eaf6dFE32B6Cc51713f6CF63841E8D',operator:'0xF3aAD2304F711ad5f400Ad322442D67DeD3E8A25'}};
const TABLE='client_submissions';
const MAX_FILE=25*1024*1024;
const MAX_TOTAL=100*1024*1024;
const allowed=['.pdf','.xlsx','.docx','.png','.jpg','.jpeg','.webp'];
const owner=getAddress(deployment.deployer);
const fixedRoles:Record<string,string>={reviewer:getAddress(deployment.participants.technicalReviewer),compliance:getAddress(deployment.participants.complianceReviewer),board:getAddress(deployment.participants.boardReviewer),factory:getAddress(deployment.participants.operator)};
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const sameSecret=(a:string,b:string)=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const config=()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,publishable=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
 if(!url||!key||!publishable)throw new Error('La recepción privada aún no está configurada en Vercel.');
 return {db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},realtime:{transport:WebSocket as never}}),url,publishable};
};
type Action='start'|'finalize'|'receipt-status'|'list'|'document'|'contact'|'media-list'|'media-document'|'amend-classification';
const multiRead=new Interface(['function typeCount() view returns (uint256)','function mintedCount(uint256) view returns (uint256)']);
async function readMulti(address:string,name:'typeCount'|'mintedCount',args:unknown[]=[]):Promise<bigint>{
 const result=await fetch(process.env.SEPOLIA_RPC_URL||'https://ethereum-sepolia-rpc.publicnode.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_call',params:[{to:address,data:multiRead.encodeFunctionData(name,args)},'latest']}),signal:AbortSignal.timeout(10000)});
 if(!result.ok)throw new Error('No se pudo consultar Sepolia.');
 const body=await result.json() as {result?:string;error?:unknown};
 if(!body.result||body.error)throw new Error('No se pudo consultar Sepolia.');
 return multiRead.decodeFunctionResult(name,body.result)[0] as bigint;
}
const authMessage=(origin:string,action:Action,timestamp:string,nonce:string,address:string)=>`TOKVANT expediente access\nOrigin: ${origin}\nAction: ${action}\nTimestamp: ${timestamp}\nNonce: ${nonce}\nWallet: ${address}`;
function requireStaff(request:Request,action:Action){
 const address=request.headers.get('x-tokvant-wallet')||'',timestamp=request.headers.get('x-tokvant-time')||'',nonce=request.headers.get('x-tokvant-nonce')||'',signature=request.headers.get('x-tokvant-signature')||'';
 if(!/^[-0-9T:.Z]{20,30}$/.test(timestamp)||Math.abs(Date.now()-Date.parse(timestamp))>120000||!/^[-0-9a-f]{36}$/i.test(nonce))throw new Error('Firma de acceso vencida o inválida.');
 const wallet=getAddress(address);
 if(verifyMessage(authMessage(new URL(request.url).origin,action,timestamp,nonce,wallet),signature)!==wallet)throw new Error('La wallet no está autorizada para consultar expedientes.');
 let role='owner';
 if(wallet!==owner){
  let grant;try{grant=JSON.parse(request.headers.get('x-tokvant-grant')||'null');}catch{throw new Error('Autorización del equipo inválida.');}
  if(!grant||getAddress(grant.address)!==wallet||!['administrator','reviewer','compliance','board','factory','accounting','multi_operator','nft_operator'].includes(grant.role)||!Number.isSafeInteger(grant.expires)||grant.expires<=Date.now()||(fixedRoles[grant.role]&&fixedRoles[grant.role]!==wallet))throw new Error('Falta una autorización vigente de la 047 para esta wallet.');
  const message=`TOKVANT staff access\nOrigin: ${new URL(request.url).origin}\nWallet: ${wallet}\nRole: ${grant.role}\nExpires: ${grant.expires}`;
  if(verifyMessage(message,grant.signature)!==owner)throw new Error('La autorización del equipo no está firmada por la 047.');
  role=grant.role;
 }
 return {wallet,role};
}
export function cleanProject(input:unknown):TokenProject{
 if(!input||typeof input!=='object')throw new Error('Expediente inválido.');
 const p=input as TokenProject;
 if(typeof p.id!=='string'||!/^TOKVANT-[A-F0-9-]{36}$/.test(p.id)||!Array.isArray(p.documents)||p.documents.length<1||p.documents.length>20)throw new Error('ID o adjuntos inválidos.');
 let size=0;const ids=new Set<string>();
 for(const d of p.documents){
  if(typeof d.id!=='string'||!/^[-a-f0-9]{36}$/i.test(d.id)||typeof d.name!=='string'||typeof d.category!=='string'||!['Legal','Técnico','Financiero','Compliance','Imagen del token'].includes(d.category)||(d.category==='Imagen del token'&&!/\.(png|jpe?g|webp)$/i.test(d.fileName))||typeof d.fileName!=='string'||d.fileName.length>200||/[\\/\0]/.test(d.fileName)||!allowed.some(ext=>d.fileName.toLowerCase().endsWith(ext))||!Number.isSafeInteger(d.sizeBytes)||d.sizeBytes === undefined||d.sizeBytes<=0||d.sizeBytes>MAX_FILE||!/^[a-f0-9]{64}$/.test(d.sha256||''))throw new Error('Un adjunto no cumple los límites o carece de hash.');
  if(ids.has(d.id))throw new Error('Hay adjuntos repetidos.');ids.add(d.id);
  size+=d.sizeBytes!;
 }
 if(size>MAX_TOTAL)throw new Error('El expediente supera 100 MB.');
 const params=p.parameters;
 const complete=typeof p.organizationName==='string'&&!!p.organizationName.trim()&&typeof p.title==='string'&&!!p.title.trim()&&typeof p.contact?.fullName==='string'&&!!p.contact.fullName.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contact.email||'')&&p.contact.consent===true&&typeof p.assetDescription==='string'&&!!p.assetDescription.trim()&&(p.assetType!=='Otro'||!!p.assetTypeOther?.trim())&&['ERC-20','ERC-721','ERC-1155','ERC-3643'].includes(p.standard)&&['sepolia','polygon','ethereum','arbitrum'].includes(p.network)&&params&&typeof params.tokenName==='string'&&!!params.tokenName.trim()&&typeof params.tokenSymbol==='string'&&!!params.tokenSymbol.trim()&&Number.isFinite(params.initialSupply)&&params.initialSupply>0&&Number.isInteger(params.decimals)&&params.decimals>=0&&params.decimals<=18&&(!['ERC-721','ERC-1155'].includes(p.standard)||(params.decimals===0&&Number.isInteger(params.initialSupply)))&&(!p.clientWalletAddress?.trim()||(isAddress(p.clientWalletAddress.trim())&&p.clientWalletNetwork===p.network));
 if(!complete)throw new Error('Completá el formulario antes de enviarlo.');
 if(p.proposedRecipients!==undefined&&(!Array.isArray(p.proposedRecipients)||p.proposedRecipients.length>100||p.standard!=='ERC-3643'||p.proposedRecipients.some(row=>!row||typeof row.walletAddress!=='string'||!isAddress(row.walletAddress))||new Set(p.proposedRecipients.map(row=>row.walletAddress.toLowerCase())).size!==p.proposedRecipients.length))throw new Error('Wallets receptoras propuestas inválidas.');
 if(JSON.stringify(p).length>120000)throw new Error('El expediente es demasiado grande.');
 const documents:ProjectDocument[]=p.documents.map(d=>({id:d.id,name:d.name.slice(0,160),category:d.category,fileName:d.fileName,fileSize:d.fileSize,sizeBytes:d.sizeBytes,sha256:d.sha256,uploadDate:new Date().toISOString().slice(0,10),status:'Pendiente',storage:'remote'}));
 return {...p,id:p.id,status:'En revisión',isSimulationOnly:false,submissionId:undefined,receivedAt:undefined,documents,approvals:[
  {id:`app-${p.id}-1`,role:'Technical Reviewer',label:'Revisión técnica',status:'Pendiente'},
  {id:`app-${p.id}-2`,role:'Compliance Reviewer',label:'Revisión de cumplimiento',status:'Pendiente'},
  {id:`app-${p.id}-3`,role:'Enterprise Board',label:'Autorización de Directorio',status:'Pendiente'},
 ],securityScore:0,securityChecks:[],deployedContractAddress:undefined};
}
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>160000)return response({error:'Solicitud demasiado grande.'},413);
  const payload=await request.json();
  const action=payload?.action as Action;
  if(!['start','finalize','receipt-status','list','document','contact','media-list','media-document','amend-classification'].includes(action))return response({error:'Operación desconocida.'},400);
  const {db,url,publishable}=config();
  if(action==='start'){
   const project=cleanProject(payload.project);
   const secret=String(payload.receiptSecret||'');
   if(!/^[a-f0-9]{64}$/.test(secret))return response({error:'Comprobante de envío inválido.'},400);
   const secretHash=digest(secret);
   const existing=await db.from(TABLE).select('id,receipt_secret_hash,status,project').eq('request_id',project.id).maybeSingle();
   if(existing.error)throw existing.error;
   let id:string;
   if(existing.data){
    if(!sameSecret(existing.data.receipt_secret_hash,secretHash))return response({error:'Ya existe una solicitud con este identificador.'},409);
    if(existing.data.status==='received')return response({status:'received',id:existing.data.id});
    if(JSON.stringify((existing.data.project as TokenProject).documents.map(d=>[d.id,d.sha256,d.sizeBytes]))!==JSON.stringify(project.documents.map(d=>[d.id,d.sha256,d.sizeBytes])))return response({error:'Los adjuntos cambiaron desde el inicio del envío. Reiniciá con un nuevo expediente.'},409);
    id=existing.data.id;
   }else{
    const {contact:privateContact,taxId:privateTaxId,...operationalProject}=project;
    const inserted=await db.from(TABLE).insert({request_id:project.id,receipt_secret_hash:secretHash,status:'uploading',project:operationalProject}).select('id').single();
    if(inserted.error)throw inserted.error;
    id=inserted.data.id;
   }
   const privateSaved=await db.from('submission_private_contacts').upsert({submission_id:id,contact:project.contact,tax_id:project.taxId||null},{onConflict:'submission_id'});
   if(privateSaved.error)throw privateSaved.error;
   const uploads=[];
   for(const d of project.documents){
    const path=`${id}/${d.id}`;
    const signed=await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if(signed.error)throw signed.error;
    uploads.push({id:d.id,path,token:signed.data.token});
   }
   return response({status:'uploading',id,url,publishable,uploads});
  }
  if(action==='finalize'){
   const id=String(payload.id||''),secret=String(payload.receiptSecret||'');
   if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[a-f0-9]{64}$/.test(secret))return response({error:'Comprobante inválido.'},400);
   const found=await db.from(TABLE).select('id,request_id,receipt_secret_hash,status,project,received_at').eq('id',id).single();
   if(found.error||!found.data)return response({error:'Solicitud no encontrada.'},404);
   const row=found.data;
   if(!sameSecret(row.receipt_secret_hash,digest(secret)))return response({error:'Comprobante inválido.'},403);
   if(row.status==='received')return response({id,requestId:row.request_id,receivedAt:row.received_at});
   for(const d of (row.project as TokenProject).documents){
    const info=await db.storage.from(BUCKET).info(`${id}/${d.id}`);
    if(info.error||info.data?.size!==d.sizeBytes)return response({error:`Falta el archivo ${d.fileName} o su tamaño no coincide.`},409);
   }
   const receivedAt=new Date().toISOString();
   const saved=await db.from(TABLE).update({status:'received',received_at:receivedAt}).eq('id',id).eq('status','uploading').select('id').single();
   if(saved.error)throw saved.error;
   return response({id,requestId:row.request_id,receivedAt});
  }
  if(action==='receipt-status'){
   const id=String(payload.id||''),secret=String(payload.receiptSecret||'');
   if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[a-f0-9]{64}$/.test(secret))return response({error:'Comprobante inválido.'},400);
   const found=await db.from(TABLE).select('id,request_id,receipt_secret_hash,status').eq('id',id).maybeSingle();
   if(found.error)throw found.error;
   if(!found.data||!sameSecret(found.data.receipt_secret_hash,digest(secret)))return response({error:'Comprobante inválido.'},403);
   if(found.data.status!=='received')return response({status:'pending'});
   const [issuance,collection,regulated]=await Promise.all([
    db.from('submission_issuances').select('standard,chain_id,token_address,transaction_hash,block_number,token_symbol,admin_wallet').eq('submission_id',id).maybeSingle(),
    db.from('submission_collections').select('standard,chain_id,collection_address,transaction_hash,block_number,collection_symbol,admin_wallet').eq('submission_id',id).maybeSingle(),
    db.from('submission_regulated_issuances').select('standard,chain_id,factory_address,token_address,transaction_hash,block_number,token_symbol,admin_wallet').eq('submission_id',id).maybeSingle(),
   ]);
   const missingRegulated=regulated.error&&/relation .* does not exist|schema cache|Could not find the table/i.test(regulated.error.message);
   if(issuance.error||collection.error||(missingRegulated?null:regulated.error))throw issuance.error||collection.error||regulated.error;
   const deployment=collection.data?{standard:collection.data.standard,chainId:collection.data.chain_id,address:collection.data.collection_address,transactionHash:collection.data.transaction_hash,blockNumber:collection.data.block_number,symbol:collection.data.collection_symbol,adminWallet:collection.data.admin_wallet}:issuance.data?{standard:issuance.data.standard,chainId:issuance.data.chain_id,address:issuance.data.token_address,transactionHash:issuance.data.transaction_hash,blockNumber:issuance.data.block_number,symbol:issuance.data.token_symbol,adminWallet:issuance.data.admin_wallet}:regulated.data?{standard:regulated.data.standard,chainId:regulated.data.chain_id,address:regulated.data.token_address,transactionHash:regulated.data.transaction_hash,blockNumber:regulated.data.block_number,symbol:regulated.data.token_symbol,adminWallet:regulated.data.admin_wallet,factoryAddress:regulated.data.factory_address}:null;
   if(!deployment)return response({status:'received',deployment:null});
   let types:{id:number;historicalUnits:string}[]|undefined;
   if(deployment.standard==='ERC-1155'&&deployment.chainId===11155111){
    try{const count=Number(await readMulti(deployment.address,'typeCount'));if(count>=0&&count<=100)types=await Promise.all(Array.from({length:count},async(_,index)=>({id:index+1,historicalUnits:(await readMulti(deployment.address,'mintedCount',[index+1])).toString()})));}catch{/* The verified deployment remains visible if Sepolia is temporarily unavailable. */}
   }
   return response({status:'deployed',deployment,types});
  }
  const actor=requireStaff(request,action);
  const staffWallet=actor.wallet;
  if(action==='amend-classification'){
   if(actor.role!=='owner'&&actor.role!=='reviewer')return response({error:'Solo el primer revisor técnico puede corregir estándar y red.'},403);
   const id=String(payload.id||''),reason=String(payload.reason||'').trim(),standard=String(payload.standard||''),network=String(payload.network||'');
   const initialSupply=Number(payload.initialSupply),maxSupply=Number(payload.maxSupply),decimals=Number(payload.decimals),transferRestrictions=String(payload.transferRestrictions||''),removeLegacyControls=payload.removeLegacyControls===true;
   if(!/^[0-9a-f-]{36}$/i.test(id)||reason.length<12||reason.length>1000||!['ERC-20','ERC-721','ERC-1155','ERC-3643'].includes(standard)||!['sepolia','polygon','ethereum','arbitrum'].includes(network)||!Number.isSafeInteger(initialSupply)||initialSupply<1||!Number.isSafeInteger(maxSupply)||maxSupply<initialSupply||!Number.isInteger(decimals)||decimals<0||decimals>18||!['Permisos ERC-3643 (Identity Registry)','Lista blanca (Whitelist)','Sin restricción','Regulada por país'].includes(transferRestrictions))return response({error:'Datos de corrección inválidos.'},400);
   if((standard==='ERC-721'||standard==='ERC-1155')&&decimals!==0)return response({error:'ERC-721 y ERC-1155 requieren cero decimales.'},400);
   if((standard==='ERC-721'||standard==='ERC-1155')&&transferRestrictions!=='Sin restricción')return response({error:'Este factory NFT de prueba solo admite transferencias sin restricción.'},400);
   const found=await db.from(TABLE).select('id,project,status,received_at').eq('id',id).single();
   if(found.error||!found.data||found.data.status!=='received')return response({error:'Expediente recibido no encontrado.'},404);
   const old=found.data.project as TokenProject;
   if(old.deployedContractAddress||old.status==='Desplegado')return response({error:'Este expediente ya figura desplegado y no se puede reclasificar.'},409);
   if((old.classificationHistory?.length||0)>=20)return response({error:'Este expediente alcanzó el límite de correcciones; requiere revisión manual.'},409);
   const nft=standard==='ERC-721'||standard==='ERC-1155';
   const hasLegacyControls=old.parameters.isUpgradeabilityEnabled||old.parameters.complianceRules.requireKYC||old.parameters.complianceRules.requireKYB||old.parameters.complianceRules.restrictSanctionedCountries||(old.parameters.complianceRules.lockupPeriodDays||0)>0;
   if(nft&&hasLegacyControls&&!removeLegacyControls)return response({error:'Confirmá expresamente el retiro de controles que el factory NFT v1 no implementa.'},400);
   const previousHash=projectHash(old);
   if(previousHash!==payload.expectedHash)return response({error:'El expediente cambió. Actualizá la bandeja antes de corregirlo.'},409);
   if(old.standard===standard&&old.network===network&&old.parameters.initialSupply===initialSupply&&(old.parameters.maxSupply??old.parameters.initialSupply)===maxSupply&&old.parameters.decimals===decimals&&old.parameters.transferRestrictions===transferRestrictions)return response({error:'No hay cambios para guardar.'},400);
   const [issuance,collection]=await Promise.all([db.from('submission_issuances').select('id').eq('submission_id',id).limit(1),db.from('submission_collections').select('id').eq('submission_id',id).limit(1)]);
   if(issuance.error||collection.error)throw issuance.error||collection.error;
   if(issuance.data?.length||collection.data?.length)return response({error:'Este expediente ya tiene un despliegue vinculado; no se puede reclasificar.'},409);
   const next:TokenProject={...old,standard:standard as TokenProject['standard'],network:network as TokenProject['network'],parameters:{...old.parameters,initialSupply,maxSupply,decimals,transferRestrictions:transferRestrictions as TokenProject['parameters']['transferRestrictions'],...(nft&&removeLegacyControls?{isUpgradeabilityEnabled:false,complianceRules:{...old.parameters.complianceRules,requireKYC:false,requireKYB:false,restrictSanctionedCountries:false,lockupPeriodDays:0}}:{})},proposedRecipients:standard==='ERC-3643'?old.proposedRecipients:undefined,status:'En revisión',progressPercent:50,updatedAt:new Date().toISOString().slice(0,10),approvals:old.approvals.map(step=>({id:step.id,role:step.role,label:step.label,status:'Pendiente'}))};
   const newHash=projectHash(next);
   next.classificationHistory=[...(old.classificationHistory||[]),{at:new Date().toISOString(),by:staffWallet,reason,previousHash,newHash,before:{standard:old.standard,network:old.network,parameters:old.parameters,proposedRecipients:old.proposedRecipients},after:{standard:next.standard,network:next.network,legacyControlsRemoved:nft&&removeLegacyControls}}];
   const saved=await db.from(TABLE).update({project:next}).eq('id',id).eq('status','received').select('project').single();
   if(saved.error)throw saved.error;
   return response({project:{...saved.data.project,submissionId:id,receivedAt:found.data.received_at}});
  }
  if(['multi_operator','nft_operator'].includes(actor.role)&&action!=='media-list'&&action!=='media-document')return response({error:'Este rol solo puede consultar las imágenes de su expediente NFT.'},403);
  if(action==='media-list'||action==='media-document'){
   if(!['owner','factory','multi_operator','nft_operator'].includes(actor.role))return response({error:'Este rol no puede abrir las imágenes del expediente.'},403);
   const projectReference=String(payload.projectReference||'');
   if(!/^TOKVANT-[A-F0-9-]{36}$/.test(projectReference))return response({error:'Expediente inválido.'},400);
   const found=await db.from(TABLE).select('id,project').eq('request_id',projectReference).eq('status','received').maybeSingle();
   if(found.error)throw found.error;
   if(!found.data)return response({error:'Expediente no encontrado.'},404);
   const project=found.data.project as TokenProject;
   const expectedStandard=actor.role==='nft_operator'?'ERC-721':actor.role==='multi_operator'?'ERC-1155':null;
   if(!['ERC-721','ERC-1155'].includes(project.standard)||project.network!=='sepolia'||(expectedStandard&&project.standard!==expectedStandard)||(expectedStandard&&(!project.clientWalletAddress||getAddress(project.clientWalletAddress)!==staffWallet)))return response({error:'Esta wallet no tiene acceso a las imágenes de este expediente NFT.'},403);
   if(actor.role==='factory'){
    const authorization=await db.from('submission_authorizations').select('id').eq('submission_id',found.data.id).eq('project_hash',projectHash(project)).limit(1).maybeSingle();
    if(authorization.error)throw authorization.error;
    if(!authorization.data)return response({error:'Este expediente NFT aún no tiene preparación autorizada para esta versión.'},403);
   }
   const images=project.documents.filter(d=>d.category==='Imagen del token'&&/\.(png|jpe?g|webp)$/i.test(d.fileName));
   if(action==='media-list')return response({images:images.map(d=>({id:d.id,name:d.name,fileName:d.fileName,sha256:d.sha256,sizeBytes:d.sizeBytes}))});
   const doc=images.find(d=>d.id===payload.documentId);
   if(!doc)return response({error:'Imagen no encontrada.'},404);
   const signed=await db.storage.from(BUCKET).createSignedUrl(`${found.data.id}/${doc.id}`,60);
   if(signed.error)throw signed.error;
   return response({url:signed.data.signedUrl,sha256:doc.sha256,fileName:doc.fileName});
  }
  if(action==='contact'){
   if(staffWallet!==owner)return response({error:'Solo la administración 047 puede consultar el contacto privado.'},403);
   const id=String(payload.id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return response({error:'Expediente inválido.'},400);
   const result=await db.from('submission_private_contacts').select('contact,tax_id').eq('submission_id',id).maybeSingle();
   if(result.error)throw result.error;return response({contact:result.data?.contact||null,taxId:result.data?.tax_id||null});
  }
  if(action==='list'){
   const found=await db.from(TABLE).select('id,request_id,project,received_at').eq('status','received').order('received_at',{ascending:false}).limit(100);
   if(found.error)throw found.error;
   const ids=(found.data||[]).map(row=>row.id);
   if(!ids.length)return response({items:[]});
   const [issuances,collections,regulated]=await Promise.all([
    db.from('submission_issuances').select('submission_id').in('submission_id',ids),
    db.from('submission_collections').select('submission_id').in('submission_id',ids),
    db.from('submission_regulated_issuances').select('submission_id').in('submission_id',ids),
   ]);
   if(issuances.error)throw issuances.error;
   if(collections.error)throw collections.error;
   const missingRegulated=regulated.error&&/relation .* does not exist|schema cache|Could not find the table/i.test(regulated.error.message);
   if(regulated.error&&!missingRegulated)throw regulated.error;
   const deployed=new Set([...(issuances.data||[]),...(collections.data||[]),...(regulated.data||[])].map(row=>row.submission_id));
   return response({items:found.data.map(row=>({...row,deployed:deployed.has(row.id)}))});
  }
  const id=String(payload.id||''),documentId=String(payload.documentId||'');
  if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[0-9a-f-]{36}$/i.test(documentId))return response({error:'Documento inválido.'},400);
  const found=await db.from(TABLE).select('project').eq('id',id).eq('status','received').single();
  if(found.error||!found.data)return response({error:'Expediente no encontrado.'},404);
  const doc=(found.data.project as TokenProject).documents.find(d=>d.id===documentId);
  if(!doc)return response({error:'Documento no encontrado.'},404);
  const signed=await db.storage.from(BUCKET).createSignedUrl(`${id}/${documentId}`,60,{download:doc.fileName});
  if(signed.error)throw signed.error;
  return response({url:signed.data.signedUrl});
 }catch(e){
  const message=e instanceof Error?e.message:'Error de recepción.';
  if(/Firma de acceso|wallet no está autorizada|autorización.*inválida|Falta una autorización|autorización del equipo no está firmada/i.test(message))return response({error:message},403);
  if(/La recepción privada aún no/.test(message))return response({error:message},503);
  if(/inválid|Completá|supera|demasiado/.test(message))return response({error:message},400);
  console.error('Submission API error',e);
  return response({error:'No se pudo completar la operación. Intentá nuevamente.'},500);
 }
}

export async function GET(){
 try{
  const {db}=config();
  const table=await db.from(TABLE).select('id').limit(1);
  const bucket=await db.storage.getBucket(BUCKET);
  const ready=!table.error&&!bucket.error&&bucket.data?.public===false;
  return response({ready},ready?200:503);
 }catch{return response({ready:false},503);}
}
