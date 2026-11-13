import {getAddress,hexlify,toUtf8Bytes} from 'ethers';
import {sha256,downloadClientFile} from './clientDocuments';
import {staffRequest} from './sharedSubmissions';
import type {ReviewProof} from './reviewSignatures';

const endpoint='/api/governance';
export type SharedReview={id:string;submission_id:string;role:ReviewProof['role'];decision:ReviewProof['decision'];project_hash:string;signer_wallet:string;signature:string;proof:ReviewProof;created_at:string};
export type SharedPayment={id:string;status:'uploading'|'verified';amount:string;currency:string;reference:string;file_name:string;file_size:number;file_sha256:string;signer_wallet?:string;signature?:string;verified_at?:string};
export type SharedAuthorization={id:string;project_hash:string;review_ids:string[];payment_id:string;signer_wallet:string;signature:string;created_at:string};
export type GovernanceState={reviews:SharedReview[];payments:SharedPayment[];authorizations:SharedAuthorization[];projectHash:string;authorized:boolean};
const wallet=()=>{const injected=(window as Window & {ethereum?:{request:(args:{method:string;params?:unknown[]})=>Promise<unknown>}}).ethereum;if(!injected)throw new Error('Abrí la wallet del equipo.');return injected;};
async function sign(account:string,message:string){const address=getAddress(account);return wallet().request({method:'personal_sign',params:[hexlify(toUtf8Bytes(message)),address]}) as Promise<string>;}
export const loadGovernance=(account:string,submissionId:string)=>staffRequest('list',account,{submissionId},endpoint) as Promise<GovernanceState>;
export const saveSharedReview=(account:string,submissionId:string,proof:ReviewProof)=>staffRequest('review',account,{submissionId,proof},endpoint);
export const paymentMessage=(origin:string,id:string,submissionId:string,amount:string,currency:string,reference:string,fileHash:string,account:string)=>`TOKVANT recibo de pago\nOrigen: ${origin}\nExpediente: ${submissionId}\nPago: ${id}\nImporte: ${amount} ${currency}\nReferencia: ${reference}\nComprobante SHA-256: ${fileHash}\nWallet: ${getAddress(account)}`;
export async function verifyPayment(account:string,submissionId:string,amount:string,currency:string,reference:string,file:File){
 const hash=await sha256(await file.arrayBuffer());
 const started=await staffRequest('payment-start',account,{submissionId,amount,currency,reference,fileName:file.name,fileSize:file.size,fileHash:hash},endpoint);
 const {createClient}=await import('@supabase/supabase-js');
 const storage=createClient(started.url,started.publishable,{auth:{persistSession:false,autoRefreshToken:false}});
 const uploaded=await storage.storage.from('tokvant-expedientes').uploadToSignedUrl(started.path,started.token,file,{contentType:file.type||'application/pdf',upsert:false});
 if(uploaded.error)throw new Error(`No se pudo cargar el comprobante: ${uploaded.error.message}`);
 const signature=await sign(account,paymentMessage(location.origin,started.id,submissionId,amount,currency,reference,hash,account));
 return staffRequest('payment-finalize',account,{paymentId:started.id,signature},endpoint);
}
export async function downloadPaymentDocument(account:string,payment:SharedPayment){
 const result=await staffRequest('payment-document',account,{paymentId:payment.id},endpoint);
 const response=await fetch(result.url);if(!response.ok)throw new Error('El enlace privado venció.');
 const blob=await response.blob();
 if(await sha256(await blob.arrayBuffer())!==payment.file_sha256)throw new Error('El comprobante descargado no coincide con el hash registrado.');
 downloadClientFile(blob,payment.file_name);
}
export const authorizationMessage=(origin:string,submissionId:string,hash:string,reviewIds:string[],paymentId:string,account:string)=>`TOKVANT autorización para preparar token\nOrigen: ${origin}\nExpediente: ${submissionId}\nVersión: ${hash}\nDictámenes: ${reviewIds.join(',')}\nPago: ${paymentId}\nWallet: ${getAddress(account)}`;
export async function authorizePreparation(account:string,submissionId:string,state:GovernanceState){
 const roles=['Technical Reviewer','Compliance Reviewer','Enterprise Board'];
 const reviews=roles.map(role=>state.reviews.find(r=>r.role===role&&r.decision==='Aprobado'&&r.project_hash===state.projectHash));
 const payment=state.payments.find(p=>p.status==='verified');
 if(reviews.some(r=>!r)||!payment)throw new Error('Se requieren tres dictámenes aprobados y un pago verificado.');
 const signature=await sign(account,authorizationMessage(location.origin,submissionId,state.projectHash,reviews.map(r=>r!.id),payment.id,account));
 return staffRequest('authorize',account,{submissionId,signature},endpoint);
}
