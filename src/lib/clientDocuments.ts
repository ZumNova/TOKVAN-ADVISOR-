import type {ProjectDocument} from '../types';
export const MAX_DOCUMENT_BYTES=25*1024*1024;
export const DOCUMENT_ACCEPT='.pdf,.xlsx,.docx,.png,.jpg,.jpeg,.webp';
const formats:Record<string,string>={pdf:'application/pdf',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'};
export function validateClientFile(file:Pick<File,'name'|'size'|'type'>){
 const ext=file.name.split('.').pop()?.toLowerCase()||'',mime=formats[ext];
 if(!mime)throw new Error('Formatos admitidos: PDF, XLSX, DOCX, PNG, JPG y WEBP.');
 if(!Number.isSafeInteger(file.size)||file.size<=0||file.size>MAX_DOCUMENT_BYTES)throw new Error('El archivo debe tener contenido y no superar 25 MB.');
 if(file.type&&file.type!=='application/octet-stream'&&file.type!==mime)throw new Error('El formato declarado no coincide con la extensión del archivo.');
 return mime;
}
export async function sha256(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function readClientFile(file:File){
 const mime=validateClientFile(file),bytes=await file.arrayBuffer(),b=new Uint8Array(bytes),text=new TextDecoder().decode(b.slice(0,12));
 const valid=mime==='application/pdf'?text.startsWith('%PDF-'):mime==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v):mime==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:mime==='image/webp'?text.startsWith('RIFF')&&text.slice(8,12)==='WEBP':b[0]===80&&b[1]===75&&b[2]===3&&b[3]===4;
 if(!valid)throw new Error('El contenido no coincide con el formato esperado.');
 return {blob:new Blob([bytes],{type:mime}),hash:await sha256(bytes)};
}
interface Stored {id:string;projectId:string;blob:Blob;}
function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('tokvant-client-documents',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('No se pudo abrir el almacenamiento de archivos del navegador.'));});}
async function tx<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction('files',mode),r=action(t.objectStore('files'));t.oncomplete=()=>{db.close();resolve(r.result);};t.onabort=t.onerror=()=>{db.close();reject(new Error('No se pudo guardar o leer el archivo. Compruebe el espacio disponible.'));};});}
export async function addClientDocument(projectId:string,file:File,name:string,category:ProjectDocument['category'],existing:ProjectDocument[]){
 validateClientFile(file);
 if(existing.length>=20||existing.reduce((sum,d)=>sum+(d.sizeBytes||0),0)+file.size>100*1024*1024)throw new Error('Límite del borrador: 20 adjuntos y 100 MB en total.');
 const {blob,hash}=await readClientFile(file);
 if(existing.some(d=>d.sha256===hash))throw new Error('Este archivo ya está adjuntado.');
 const document:ProjectDocument={id:crypto.randomUUID(),name:(name.trim()||file.name).slice(0,160),category,fileName:file.name,fileSize:`${(file.size/1024/1024).toFixed(2)} MB`,sizeBytes:file.size,uploadDate:new Date().toISOString().slice(0,10),status:'Pendiente',storage:'browser',sha256:hash};
 await tx('readwrite',s=>s.put({id:document.id,projectId,blob} satisfies Stored));return document;
}
export async function getClientDocument(projectId:string,doc:ProjectDocument){const record=await tx('readonly',s=>s.get(doc.id)) as Stored|undefined;if(!record||record.projectId!==projectId)throw new Error('Archivo no disponible en este navegador. Vuelva a adjuntarlo.');if(await sha256(await record.blob.arrayBuffer())!==doc.sha256)throw new Error('El archivo no coincide con el hash registrado.');return record.blob;}
export async function deleteClientDocument(projectId:string,doc:ProjectDocument){const record=await tx('readonly',s=>s.get(doc.id)) as Stored|undefined;if(record&&record.projectId!==projectId)throw new Error('El archivo pertenece a otro expediente.');await tx('readwrite',s=>s.delete(doc.id));}
export function downloadClientFile(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
