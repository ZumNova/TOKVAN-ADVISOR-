import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import WebSocket from 'ws';
import {getAddress,isAddress,keccak256,toUtf8Bytes,verifyMessage} from 'ethers';
import type {TokenProject} from '../src/types';

const OWNER=getAddress('0x521125be95c5679539aB07582F55F0040975A047');
const REVIEWERS={
 'Technical Reviewer':OWNER,
 'Compliance Reviewer':getAddress('0xeFcA0FAFd073A7B5EBb044A83fA449A79835FB24'),
 'Enterprise Board':getAddress('0x275fF48842eaf6dFE32B6Cc51713f6CF63841E8D'),
} as const;
const FIXED:Record<string,string>={reviewer:OWNER,compliance:REVIEWERS['Compliance Reviewer'],board:REVIEWERS['Enterprise Board'],factory:getAddress('0xF3aAD2304F711ad5f400Ad322442D67DeD3E8A25')};
const ACTIONS=['list','review','payment-start','payment-finalize','payment-document','authorize'] as const;
type Action=typeof ACTIONS[number];
type ReviewRole=keyof typeof REVIEWERS;
type ReviewProof={projectId:string;stepId:string;role:ReviewRole;decision:'Aprobado'|'Rechazado'|'Corrección solicitada';comments:string;projectHash:string;timestamp:string;nonce:string;signer:string;signature:string};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
const db=()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Gobernanza compartida no configurada.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},realtime:{transport:WebSocket as never}});
};
const staffMessage=(origin:string,action:Action,time:string,nonce:string,wallet:string)=>`TOKVANT expediente access\nOrigin: ${origin}\nAction: ${action}\nTimestamp: ${time}\nNonce: ${nonce}\nWallet: ${wallet}`;
function staff(request:Request,action:Action){
 const h=request.headers,address=h.get('x-tokvant-wallet')||'';
 if(!isAddress(address))throw new Error('Firma de acceso inválida.');
 const wallet=getAddress(address),time=h.get('x-tokvant-time')||'',nonce=h.get('x-tokvant-nonce')||'',sig=h.get('x-tokvant-signature')||'',origin=new URL(request.url).origin;
 if(!uuid(nonce)||!Number.isFinite(Date.parse(time))||Math.abs(Date.now()-Date.parse(time))>120000||verifyMessage(staffMessage(origin,action,time,nonce,wallet),sig)!==wallet)throw new Error('Firma de acceso inválida.');
 if(wallet===OWNER)return {wallet,role:'owner'};
 let grant;try{grant=JSON.parse(h.get('x-tokvant-grant')||'null');}catch{throw new Error('Autorización del equipo inválida.');}
 if(!grant||getAddress(grant.address)!==wallet||!['administrator','factory','reviewer','compliance','board','accounting'].includes(grant.role)||!Number.isSafeInteger(grant.expires)||grant.expires<=Date.now()||(FIXED[grant.role]&&FIXED[grant.role]!==wallet))throw new Error('Autorización del equipo inválida.');
 const message=`TOKVANT staff access\nOrigin: ${origin}\nWallet: ${wallet}\nRole: ${grant.role}\nExpires: ${grant.expires}`;
 if(verifyMessage(message,grant.signature)!==OWNER)throw new Error('Autorización del equipo inválida.');
 return {wallet,role:grant.role as string};
}
const stable=(value:unknown):unknown=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,stable(v)])):value;
export const projectHash=(p:TokenProject)=>keccak256(toUtf8Bytes(JSON.stringify(stable({id:p.id,title:p.title,organizationName:p.organizationName,assetType:p.assetType,assetTypeOther:p.assetTypeOther,assetDescription:p.assetDescription,jurisdiction:p.jurisdiction,standard:p.standard,network:p.network,parameters:p.parameters,documents:p.documents.map(d=>({id:d.id,sha256:d.sha256,fileName:d.fileName})),clientWalletAddress:p.clientWalletAddress,clientWalletNetwork:p.clientWalletNetwork}))));
const reviewMessage=(p:ReviewProof,origin:string)=>`TOKVANT dictamen de expediente\nOrigen: ${origin}\nExpediente: ${p.projectId}\nPaso: ${p.stepId}\nRol: ${p.role}\nDecisión: ${p.decision}\nObservaciones: ${p.comments}\nVersión: ${p.projectHash}\nFecha: ${p.timestamp}\nNonce: ${p.nonce}\nWallet: ${p.signer}`;
const paymentMessage=(origin:string,id:string,submissionId:string,amount:string,currency:string,reference:string,fileHash:string,wallet:string)=>`TOKVANT recibo de pago\nOrigen: ${origin}\nExpediente: ${submissionId}\nPago: ${id}\nImporte: ${amount} ${currency}\nReferencia: ${reference}\nComprobante SHA-256: ${fileHash}\nWallet: ${wallet}`;
const authMessage=(origin:string,submissionId:string,hash:string,reviewIds:string[],paymentId:string,wallet:string)=>`TOKVANT autorización para preparar token\nOrigen: ${origin}\nExpediente: ${submissionId}\nVersión: ${hash}\nDictámenes: ${reviewIds.join(',')}\nPago: ${paymentId}\nWallet: ${wallet}`;
async function submission(client:ReturnType<typeof db>,id:unknown){
 if(!uuid(id))throw new Error('Expediente inválido.');
 const found=await client.from('client_submissions').select('id,project,status').eq('id',id).single();
 if(found.error||!found.data||found.data.status!=='received')throw new Error('Expediente recibido no encontrado.');
 return found.data as {id:string;project:TokenProject;status:string};
}
async function latestReviews(client:ReturnType<typeof db>,id:string){
 const result=await client.from('submission_reviews').select('*').eq('submission_id',id).order('created_at',{ascending:false});
 if(result.error)throw result.error;
 const seen=new Set<string>();return (result.data||[]).filter(row=>{if(seen.has(row.role))return false;seen.add(row.role);return true;});
}
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>160000)return reply({error:'Solicitud demasiado grande.'},413);
  const body=await request.json();const action=body?.action as Action;
  if(!ACTIONS.includes(action))return reply({error:'Operación desconocida.'},400);
  const actor=staff(request,action),client=db();
  if(action==='list'){
   const row=await submission(client,body.submissionId);
   const reviews=await latestReviews(client,row.id);
   const payments=await client.from('submission_payments').select('id,status,amount,currency,reference,file_name,file_size,file_sha256,signer_wallet,signature,verified_at,created_at').eq('submission_id',row.id).order('created_at',{ascending:false});
   const authorizations=await client.from('submission_authorizations').select('*').eq('submission_id',row.id).order('created_at',{ascending:false});
   if(payments.error||authorizations.error)throw payments.error||authorizations.error;
   const hash=projectHash(row.project),roles=Object.keys(REVIEWERS) as ReviewRole[];
   const currentIds=roles.map(role=>reviews.find(review=>review.role===role&&review.decision==='Aprobado'&&review.project_hash===hash)?.id);
   const authorized=currentIds.every(Boolean)&&!!authorizations.data?.some(auth=>auth.project_hash===hash&&Array.isArray(auth.review_ids)&&auth.review_ids.length===3&&auth.review_ids.every((id:string,index:number)=>id===currentIds[index])&&payments.data?.some(payment=>payment.id===auth.payment_id&&payment.status==='verified'));
   return reply({reviews,payments:payments.data,authorizations:authorizations.data,projectHash:hash,authorized});
  }
  if(action==='review'){
   const row=await submission(client,body.submissionId);const p=body.proof as ReviewProof;
   const requiredRole=p?.role==='Technical Reviewer'?'owner':p?.role==='Compliance Reviewer'?'compliance':'board';
   if(!p||!Object.hasOwn(REVIEWERS,p.role)||!['Aprobado','Rechazado','Corrección solicitada'].includes(p.decision)||typeof p.comments!=='string'||p.comments.trim().length<5||p.comments.length>3000||p.projectId!==row.project.id||p.projectHash!==projectHash(row.project)||!uuid(p.nonce)||!Number.isFinite(Date.parse(p.timestamp))||Math.abs(Date.now()-Date.parse(p.timestamp))>600000||!row.project.approvals.some(step=>step.id===p.stepId&&step.role===p.role)||getAddress(p.signer)!==actor.wallet||actor.wallet!==REVIEWERS[p.role]||actor.role!==requiredRole||verifyMessage(reviewMessage(p,new URL(request.url).origin),p.signature)!==actor.wallet)throw new Error('Dictamen o firma inválidos para este expediente.');
   const saved=await client.from('submission_reviews').insert({submission_id:row.id,role:p.role,decision:p.decision,project_hash:p.projectHash,signer_wallet:actor.wallet,signature:p.signature,proof:p}).select('id').single();
   if(saved.error)throw saved.error;return reply({id:saved.data.id});
  }
  if(action==='payment-start'){
   if(!['owner','accounting'].includes(actor.role))throw new Error('Solo Contaduría puede verificar pagos.');
   const row=await submission(client,body.submissionId);
   const amount=String(body.amount||''),currency=String(body.currency||''),reference=String(body.reference||''),name=String(body.fileName||''),size=Number(body.fileSize),fileHash=String(body.fileHash||'');
   if(!/^\d{1,12}(\.\d{1,2})?$/.test(amount)||Number(amount)<=0||!['USD','PYG','ARS','EUR'].includes(currency)||reference.length<4||reference.length>120||name.length>180||/[\\/\0]/.test(name)||!(/\.(pdf|png|jpg|jpeg|webp)$/i.test(name))||!Number.isSafeInteger(size)||size<1||size>25*1024*1024||!/^[a-f0-9]{64}$/.test(fileHash))throw new Error('Datos del pago o comprobante inválidos.');
   const inserted=await client.from('submission_payments').insert({submission_id:row.id,amount,currency,reference,file_name:name,file_size:size,file_sha256:fileHash,status:'uploading'}).select('id').single();
   if(inserted.error)throw inserted.error;
   const path=`${row.id}/payments/${inserted.data.id}`;const signed=await client.storage.from('tokvant-expedientes').createSignedUploadUrl(path);
   if(signed.error)throw signed.error;
   return reply({id:inserted.data.id,path,token:signed.data.token,url:process.env.SUPABASE_URL,publishable:process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY});
  }
  if(action==='payment-finalize'){
   if(!['owner','accounting'].includes(actor.role))throw new Error('Solo Contaduría puede verificar pagos.');
   if(!uuid(body.paymentId))throw new Error('Pago inválido.');
   const payment=await client.from('submission_payments').select('*').eq('id',body.paymentId).single();
   if(payment.error||!payment.data||payment.data.status!=='uploading')throw new Error('Pago pendiente no encontrado.');
   const p=payment.data;await submission(client,p.submission_id);
   const path=`${p.submission_id}/payments/${p.id}`;const downloaded=await client.storage.from('tokvant-expedientes').download(path);
   if(downloaded.error||!downloaded.data)throw new Error('Falta el comprobante privado.');
   const data=new Uint8Array(await downloaded.data.arrayBuffer());
   if(data.length!==p.file_size||sha(data)!==p.file_sha256)throw new Error('El comprobante no coincide con su hash o tamaño.');
   const message=paymentMessage(new URL(request.url).origin,p.id,p.submission_id,p.amount,p.currency,p.reference,p.file_sha256,actor.wallet);
   if(verifyMessage(message,String(body.signature||''))!==actor.wallet)throw new Error('Firma del recibo inválida.');
   const saved=await client.from('submission_payments').update({status:'verified',signer_wallet:actor.wallet,signature:body.signature,verified_at:new Date().toISOString()}).eq('id',p.id).eq('status','uploading').select('id').single();
   if(saved.error)throw saved.error;return reply({id:p.id,status:'verified'});
  }
  if(action==='payment-document'){
   if(!uuid(body.paymentId))throw new Error('Pago inválido.');
   const p=await client.from('submission_payments').select('id,submission_id,file_name,status').eq('id',body.paymentId).single();
   if(p.error||!p.data||p.data.status!=='verified')throw new Error('Comprobante no encontrado.');
   const signed=await client.storage.from('tokvant-expedientes').createSignedUrl(`${p.data.submission_id}/payments/${p.data.id}`,60,{download:p.data.file_name});
   if(signed.error)throw signed.error;return reply({url:signed.data.signedUrl});
  }
  if(actor.wallet!==OWNER)throw new Error('Solo la administración 047 puede autorizar la preparación.');
  const row=await submission(client,body.submissionId);const reviews=await latestReviews(client,row.id);
  const roles=Object.keys(REVIEWERS) as ReviewRole[];
  if(roles.some(role=>!reviews.some(r=>r.role===role&&r.decision==='Aprobado'&&r.project_hash===projectHash(row.project))))throw new Error('Faltan tres dictámenes aprobados para esta versión.');
  const payment=await client.from('submission_payments').select('id').eq('submission_id',row.id).eq('status','verified').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(payment.error||!payment.data)throw new Error('Falta un pago verificado por Contaduría.');
  const reviewIds=roles.map(role=>reviews.find(r=>r.role===role)!.id);
  if(verifyMessage(authMessage(new URL(request.url).origin,row.id,projectHash(row.project),reviewIds,payment.data.id,actor.wallet),String(body.signature||''))!==OWNER)throw new Error('Firma de autorización inválida.');
  const saved=await client.from('submission_authorizations').insert({submission_id:row.id,project_hash:projectHash(row.project),review_ids:reviewIds,payment_id:payment.data.id,signer_wallet:actor.wallet,signature:body.signature}).select('id').single();
  if(saved.error)throw saved.error;return reply({id:saved.data.id,status:'authorized'});
 }catch(e){
  const message=e instanceof Error?e.message:'Error de gobernanza.';
  if(/firma|autorización|solo (contaduría|la administración)/i.test(message))return reply({error:message},403);
  if(/inválid|faltan|falta|no encontrado|no coincide/i.test(message))return reply({error:message},400);
  console.error('Governance API error',e);return reply({error:'No se pudo completar la operación.'},500);
 }
}
