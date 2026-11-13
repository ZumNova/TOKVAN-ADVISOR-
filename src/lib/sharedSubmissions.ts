import {getAddress,hexlify,toUtf8Bytes} from 'ethers';
import type {TokenProject,ProjectDocument} from '../types';
import {getClientDocument,downloadClientFile,sha256} from './clientDocuments';
import {OWNER,readGrants} from './staffAccess';

type Receipt={id:string;requestId:string;receivedAt:string};
const SECRET_PREFIX='tokvant:submission-secret:';
const RECEIPT_PREFIX='tokvant:submission-receipt:';
const api='/api/submissions';
const parse=async (response:Response)=>{const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo conectar con recepción TOKVANT.');return result;};
const secretFor=(id:string)=>{let secret=localStorage.getItem(SECRET_PREFIX+id);if(!secret){secret=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem(SECRET_PREFIX+id,secret);}return secret;};
export const readReceipt=(id:string):Receipt|undefined=>{try{return JSON.parse(localStorage.getItem(RECEIPT_PREFIX+id)||'null')||undefined;}catch{return undefined;}};
export async function submitClientProject(project:TokenProject,onProgress?:(text:string)=>void):Promise<Receipt>{
 const existing=readReceipt(project.id);if(existing)return existing;
 const receiptSecret=secretFor(project.id);
 onProgress?.('Solicitando recepción privada…');
 const started=await parse(await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',project,receiptSecret})}));
 if(started.status==='uploading'){
  const {createClient}=await import('@supabase/supabase-js');
  const storage=createClient(started.url,started.publishable,{auth:{persistSession:false,autoRefreshToken:false}});
  for(const [index,item] of (started.uploads as {id:string;path:string;token:string}[]).entries()){
   const doc=project.documents.find(d=>d.id===item.id);
   if(!doc)throw new Error('Falta un documento de la solicitud.');
   onProgress?.(`Subiendo archivo ${index+1} de ${started.uploads.length}: ${doc.fileName}`);
   const blob=await getClientDocument(project.id,doc);
   const uploaded=await storage.storage.from('tokvant-expedientes').uploadToSignedUrl(item.path,item.token,blob,{contentType:blob.type,upsert:false});
   if(uploaded.error && !/already exists|already present|duplicate/i.test(uploaded.error.message))throw new Error(`No se pudo subir ${doc.fileName}: ${uploaded.error.message}`);
  }
 }
 onProgress?.('Verificando adjuntos y confirmando recepción…');
 const receipt=await parse(await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'finalize',id:started.id,receiptSecret})})) as Receipt;
 localStorage.setItem(RECEIPT_PREFIX+project.id,JSON.stringify(receipt));
 return receipt;
}
const staffMessage=(origin:string,action:string,timestamp:string,nonce:string,address:string)=>`TOKVANT expediente access\nOrigin: ${origin}\nAction: ${action}\nTimestamp: ${timestamp}\nNonce: ${nonce}\nWallet: ${address}`;
export async function staffRequest(action:string,account:string,body:Record<string,unknown>={},endpoint=api){
 const wallet=(window as Window & {ethereum?:{request:(args:{method:string;params?:unknown[]})=>Promise<unknown>}}).ethereum;
 if(!wallet)throw new Error('Conectá la wallet del equipo.');
 const accounts=await wallet.request({method:'eth_accounts'}) as string[];
 const address=getAddress(account);
 if(!accounts?.[0]||getAddress(accounts[0])!==address)throw new Error('Seleccioná la wallet con la que ingresaste al equipo.');
 const timestamp=new Date().toISOString(),nonce=crypto.randomUUID();
 const signature=await wallet.request({method:'personal_sign',params:[hexlify(toUtf8Bytes(staffMessage(location.origin,action,timestamp,nonce,address))),address]}) as string;
 const grant=address===getAddress(OWNER)?null:readGrants().find(g=>getAddress(g.address)===address);
 if(address!==getAddress(OWNER)&&!grant)throw new Error('Importá primero la autorización firmada por la 047.');
 return parse(await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-tokvant-wallet':address,'x-tokvant-time':timestamp,'x-tokvant-nonce':nonce,'x-tokvant-signature':signature,...(grant?{'x-tokvant-grant':JSON.stringify(grant)}:{})},body:JSON.stringify({action,...body})}));
}
export async function listSharedSubmissions(account:string):Promise<TokenProject[]>{
 const result=await staffRequest('list',account);
 return (result.items as {id:string;project:TokenProject;received_at:string}[]).map(row=>({...row.project,submissionId:row.id,receivedAt:row.received_at}));
}
export async function downloadSharedDocument(account:string,project:TokenProject,doc:ProjectDocument){
 if(!project.submissionId||!doc.sha256)throw new Error('Documento remoto inválido.');
 const result=await staffRequest('document',account,{id:project.submissionId,documentId:doc.id});
 const response=await fetch(result.url);
 if(!response.ok)throw new Error('El enlace privado venció. Intentá nuevamente.');
 const blob=await response.blob();
 if(await sha256(await blob.arrayBuffer())!==doc.sha256)throw new Error('El archivo descargado no coincide con el hash declarado por el cliente.');
 downloadClientFile(blob,doc.fileName);
}
