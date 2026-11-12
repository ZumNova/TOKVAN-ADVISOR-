import type {WalletProvider} from './factoryWallet';

export type Standard='ERC-20'|'ERC-721'|'ERC-1155'|'ERC-3643';
export interface UsageEvent {id:string;standard:Standard;kind:string;description:string;hash:string;block:number;address:string;search:string;}
export interface UsageNote {id:string;createdAt:string;standard:Standard;title:string;body:string;}
export const NOTES_KEY='tokvan:ia:usage-notes:v1';
const standards:Standard[]=['ERC-20','ERC-721','ERC-1155','ERC-3643'];
const hashPattern=/^0x[\da-fA-F]{64}$/;
const addressPattern=/^0x[\da-fA-F]{40}$/;
const publicReg={address:'0x873Cd8e429c677e678b4C5970e28492585403774',hash:'0x845833377ea3047b1ca6d9e68b0a7d67a0305872985005b209a44aac06d16536',blockNumber:0};

export function loadNotes():UsageNote[]{
 try {const value:unknown=JSON.parse(localStorage.getItem(NOTES_KEY)||'[]');return validateNotes(value);} catch{return [];}
}
export function validateNotes(value:unknown):UsageNote[]{
 if(!Array.isArray(value)||value.length>100)throw new Error('La bitácora admite hasta 100 notas.');
 return value.map((note:unknown)=>{
  if(!note||typeof note!=='object')throw new Error('Nota inválida.');
  const n=note as Record<string,unknown>;
  if(typeof n.id!=='string'||n.id.length>100||typeof n.createdAt!=='string'||!Number.isFinite(Date.parse(n.createdAt))||!standards.includes(n.standard as Standard)||typeof n.title!=='string'||!n.title.trim()||n.title.length>120||typeof n.body!=='string'||!n.body.trim()||n.body.length>2000)throw new Error('Una nota tiene campos inválidos.');
  return {id:n.id,createdAt:n.createdAt,standard:n.standard as Standard,title:n.title,body:n.body};
 });
}
export function saveNotes(notes:UsageNote[]){localStorage.setItem(NOTES_KEY,JSON.stringify(validateNotes(notes)));}
function savedRecord(key:string){
 try {const r=JSON.parse(localStorage.getItem(key)||'null');return r&&typeof r==='object'&&addressPattern.test(r.address)&&hashPattern.test(r.hash)&&Number.isSafeInteger(r.blockNumber)&&r.blockNumber>=0?r:null;}catch{return null;}
}
function entry(standard:Standard,id:string,kind:string,description:string,hash:string,block:number,address:string):UsageEvent{
 return {id:`${standard}:${id}`,standard,kind,description,hash,block,address,search:`${standard} ${kind} ${description} ${hash} ${address}`.toLowerCase()};
}
export async function syncUsageJournal(wallet:WalletProvider){
 const chain=await wallet.request({method:'eth_chainId'});
 if(typeof chain!=='string'||BigInt(chain)!==11155111n)throw new Error('Seleccione Sepolia en la wallet para consultar la bitácora.');
 const tasks:[Standard,()=>Promise<UsageEvent[]>][]=[
  ['ERC-20',async()=>{const {readJournal}=await import('./tokenWorkflow');return (await readJournal(wallet)).map(e=>entry('ERC-20',e.id,e.kind,`${e.tokenName||''} ${e.tokenSymbol||''} ${e.actor||''} ${e.admin||''} ${e.treasury||''} ${e.amountBaseUnits||''}`.trim(),e.transactionHash,e.blockNumber,e.address));}],
  ['ERC-721',async()=>{const r=savedRecord('tokvan:erc721:sepolia:v1:factory');if(!r)throw new Error('Recupere el factory ERC-721 en su panel para incluirlo.');const {readNFTJournal}=await import('./erc721Workflow');return (await readNFTJournal(wallet,r)).map(e=>entry('ERC-721',e.id,e.kind,`${e.collectionName||''} ${e.tokenName||''} ${e.tokenId||''} ${e.from||''} ${e.to||''}`.trim(),e.hash,e.block,e.address));}],
  ['ERC-1155',async()=>{const r=savedRecord('tokvan:erc1155:sepolia:v1:factory');if(!r)throw new Error('Recupere el factory ERC-1155 en su panel para incluirlo.');const {readMultiJournal}=await import('./erc1155Workflow');return (await readMultiJournal(wallet,r)).map(e=>entry('ERC-1155',e.id,e.kind,`${e.collectionName||''} ${e.tokenName||''} ${e.tokenId||''} ${e.amount||''} ${e.from||''} ${e.to||''}`.trim(),e.hash,e.block,e.address));}],
  ['ERC-3643',async()=>{const {readRegJournal}=await import('./erc3643Workflow');const r=savedRecord('tokvan:erc3643:sepolia:educational:v1:factory')||publicReg;return (await readRegJournal(wallet,r)).map(e=>entry('ERC-3643',e.id,e.kind,`${e.name||''} ${e.token||''} ${e.detail}`.trim(),e.hash,e.block,e.address));}],
 ];
 const results=await Promise.allSettled(tasks.map(([,run])=>run()));
 const events:UsageEvent[]=[];const status:Record<Standard,string>={'ERC-20':'','ERC-721':'','ERC-1155':'','ERC-3643':''};
 results.forEach((result,index)=>{const standard=tasks[index][0];if(result.status==='fulfilled'){events.push(...result.value);status[standard]=`${result.value.length} eventos`;}
 else status[standard]=result.reason instanceof Error?result.reason.message:'No se pudo consultar';});
 return {events:[...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>b.block-a.block),status,syncedAt:new Date().toISOString()};
}

const lessons=[
 {terms:['3643','tkreg','identidad','kyc','kyb','acreditacion','registro'],text:'ERC-3643 usa un registro de identidad para decidir quién puede recibir tokens. En esta prueba las acreditaciones son ficticias. Antes de transferir, consulte la wallet receptora en el panel de identidad y compruebe KYC/KYB, AML, elegibilidad, país y vencimiento. La acreditación real y la revisión legal deben gestionarse fuera de esta demo.'},
 {terms:['congelar','congelamiento','freeze','descongelar','liberar'],text:'En TKREG, un agente como A047 puede congelar toda una wallet o una cantidad de su saldo. Para probar con 1E8D: consulte esa wallet, congele 2 de sus 3 TKREG, confirme la transacción y pruebe una transferencia normal de 2 desde 1E8D; debería rechazarse. Una transferencia de 1 puede pasar si los demás controles lo permiten. Luego libere las 2 unidades desde A047. El congelamiento no impide las facultades extraordinarias del agente.'},
 {terms:['emitir','emision','mint','crear','transferir','transferencia','supply','quemar','quema','burn'],text:'Emitir crea unidades nuevas y aumenta el supply circulante; transferir mueve unidades existentes sin cambiar ese supply. En esta demo, el agente puede emitir incluso con transferencias pausadas, siempre dentro de los límites y para una identidad válida. Quemar destruye unidades y reduce el supply; la quema por agente requiere especial cuidado y queda registrada en cadena.'},
 {terms:['721','nft','imagen','coleccion','pase'],text:'ERC-721 representa unidades únicas. Cada NFT tiene un ID y una URI de metadatos; el JSON debe incluir una imagen accesible para que las wallets puedan mostrarla. Quemar un NFT invalida ese ID, pero no elimina la colección.'},
 {terms:['1155','multitoken','bolsas','cafe','cacao'],text:'ERC-1155 permite varios tipos o IDs dentro de una colección y múltiples unidades por ID. Un ID puede representar, por ejemplo, un lote homogéneo de bolsas de café. Transferir unidades cambia tenencia; emitir aumenta las unidades de ese ID.'},
 {terms:['20','tkn','fungible'],text:'ERC-20 representa unidades fungibles: una unidad equivale a otra del mismo token. Su factory crea un contrato para cada emisión y la bitácora permite localizar el contrato y su transacción.'},
 {terms:['pausa','pausar','reanudar','despausar'],text:'La pausa bloquea transferencias normales. En ERC-3643 de esta demo, la emisión, la quema por agente, la recuperación y la transferencia forzada pueden seguir disponibles; revise cada operación antes de firmar.'},
];
export function answerFromJournal(question:string,events:UsageEvent[],notes:UsageNote[],syncedAt?:string){
 const normalized=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const words=normalized.match(/[a-z0-9]{3,}/g)||[];
 const lesson=lessons.map(l=>({l,score:l.terms.reduce((n,t)=>n+(normalized.includes(t)?1:0),0)})).sort((a,b)=>b.score-a.score)[0];
 const relevant=events.filter(e=>{const s=e.search.normalize('NFD').replace(/[\u0300-\u036f]/g,'');return words.some(w=>s.includes(w))||/que hicimos|historial|bitacora|ultimo/.test(normalized);}).slice(0,3);
 const relatedNotes=notes.filter(n=>words.some(w=>`${n.title} ${n.body} ${n.standard}`.toLowerCase().includes(w))).slice(0,2);
 const text=lesson?.score?lesson.l.text:'Puedo explicar ERC-20, ERC-721, ERC-1155, ERC-3643, emisión, transferencia, quema, pausa, identidad y congelamiento. También puedo consultar los eventos sincronizados de Sepolia y las notas del administrador.';
 const notice=syncedAt?`Eventos consultados hasta ${new Date(syncedAt).toLocaleString('es-AR')}; la lectura deja dos bloques de espera.`:'Todavía no se sincronizó Sepolia; no puedo afirmar qué operaciones están confirmadas.';
 return {text,notice,events:relevant,notes:relatedNotes};
}
