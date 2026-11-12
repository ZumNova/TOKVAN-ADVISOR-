import {test} from 'node:test';
import assert from 'node:assert/strict';
import {File} from 'node:buffer';
import {MOCK_PROJECTS} from '../src/constants/mockData';
import {clientCompleteness,clientProjectChecks,listClientProjects,saveClientProject,newClientProjectId,markClientProjectSubmitted} from '../src/lib/clientProjects';
import {MAX_DOCUMENT_BYTES,readClientFile,sha256,validateClientFile} from '../src/lib/clientDocuments';

test('borrador conserva contacto, paso, descripción y adjuntos; preparar reemplaza el mismo registro',()=>{
 const data=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{get length(){return data.size;},key:(i:number)=>[...data.keys()][i]??null,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}});
 const p={...MOCK_PROJECTS[0],id:newClientProjectId(),assetDescription:'Proyecto de prueba',contact:{fullName:'Ana Prueba',email:'ana@example.test',phone:'+5951234',consent:true}};
 saveClientProject(p,4);
 const restored=listClientProjects();assert.equal(restored.length,1);assert.deepEqual(restored[0].project.contact,p.contact);assert.equal(restored[0].step,4);assert.equal(restored[0].project.assetDescription,p.assetDescription);
 saveClientProject(p,5,'prepared');assert.equal(listClientProjects().length,1);assert.equal(listClientProjects()[0].stage,'prepared');
 markClientProjectSubmitted(p.id,'11111111-2222-3333-4444-555555555555','2026-11-12T12:00:00.000Z');assert.equal(listClientProjects()[0].stage,'submitted');assert.equal(listClientProjects()[0].submissionId,'11111111-2222-3333-4444-555555555555');
 data.set('tokvant:client-project:v1:broken','{');assert.equal(listClientProjects().length,1);
 const key=[...data.keys()][0];const damaged=JSON.parse(data.get(key)!);damaged.project.organizationName=null;data.set(key,JSON.stringify(damaged));assert.equal(listClientProjects().length,0);
});
test('fallo de almacenamiento se propaga y no confirma un guardado',()=>{
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{setItem:()=>{throw new Error('quota');}}});
 assert.throws(()=>saveClientProject(MOCK_PROJECTS[0],1),/quota/);
});
test('completitud no toma documentos ficticios como evidencia adjunta',()=>{
 const p={...MOCK_PROJECTS[0],assetDescription:'Activo de prueba',contact:{fullName:'Ana',email:'ana@example.test',phone:'',consent:true}};
 assert.equal(clientProjectChecks(p).find(c=>c.step===4)?.ok,false);
 const complete={...p,documents:[{...p.documents[0],storage:'browser' as const,sha256:'a'.repeat(64)}]};
 assert.equal(clientCompleteness(complete),100);
 const withWallet={...complete,clientWalletAddress:'0x521125be95c5679539aB07582F55F0040975A047',clientWalletNetwork:complete.network};
 assert.equal(clientCompleteness(withWallet),100);
 assert.equal(clientProjectChecks({...withWallet,clientWalletNetwork:'sepolia'}).find(c=>c.step===5)?.ok,complete.network==='sepolia');
 assert.equal(clientProjectChecks({...withWallet,clientWalletAddress:'0x123'}).find(c=>c.step===5)?.ok,false);
 assert.equal(clientProjectChecks({...complete,clientWalletAddress:''}).find(c=>c.step===5),undefined);
 assert.equal(clientProjectChecks({...complete,contact:{...p.contact,email:'invalido'}}).find(c=>c.label.includes('email'))?.ok,false);
 assert.equal(clientProjectChecks({...complete,standard:'ERC-721' as const,parameters:{...complete.parameters,decimals:2}}).find(c=>c.step===3)?.ok,false);
});
test('validación de formato y límite; hash comprobable y rechazo de extensión falsa',async()=>{
 assert.throws(()=>validateClientFile({name:'archivo.exe',size:20,type:''}),/Formatos/);
 assert.throws(()=>validateClientFile({name:'archivo.pdf',size:MAX_DOCUMENT_BYTES+1,type:'application/pdf'}),/25 MB/);
 assert.throws(()=>validateClientFile({name:'archivo.pdf',size:0,type:''}),/contenido/);
 const bytes=new TextEncoder().encode('abc');assert.equal(await sha256(bytes.buffer),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 const file=new File(['%PDF-1.4\nprueba'],'prueba.pdf',{type:'application/pdf'});
 const result=await readClientFile(file as unknown as globalThis.File);assert.equal(result.hash.length,64);assert.equal(await result.blob.text(),'%PDF-1.4\nprueba');
 await assert.rejects(readClientFile(new File(['otro contenido'],'falso.pdf',{type:'application/pdf'}) as unknown as globalThis.File),/contenido/);
});
