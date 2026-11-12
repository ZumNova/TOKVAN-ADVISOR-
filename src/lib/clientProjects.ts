import type {TokenProject} from '../types';

const PREFIX='tokvant:client-project:v1:';
export interface ClientProjectRecord {project:TokenProject;step:number;stage:'draft'|'prepared';savedAt:string;}
export function newClientProjectId(){return `TOKVANT-${crypto.randomUUID().toUpperCase()}`;}
export function saveClientProject(project:TokenProject,step:number,stage:ClientProjectRecord['stage']='draft'){
 const record:ClientProjectRecord={project,step,stage,savedAt:new Date().toISOString()};
 localStorage.setItem(PREFIX+project.id,JSON.stringify(record));
 return record;
}
export function listClientProjects():ClientProjectRecord[]{
 const result:ClientProjectRecord[]=[];
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;
  try{
   const r=JSON.parse(localStorage.getItem(key)||'null');
   const p=r?.project;
   const validFields=p&&['id','title','organizationName','assetType','jurisdiction'].every(k=>typeof p[k]==='string')&&['assetDescription','assetTypeOther','taxId'].every(k=>p[k]===undefined||typeof p[k]==='string')&&(!p.contact||(['fullName','email','phone'].every(k=>typeof p.contact[k]==='string')&&typeof p.contact.consent==='boolean'));
   if(validFields&&['draft','prepared'].includes(r.stage)&&Number.isInteger(r.step)&&r.step>=1&&r.step<=5&&typeof r.savedAt==='string'&&Array.isArray(p.documents)&&p.documents.every((d:unknown)=>d&&typeof d==='object'&&['id','name','fileName'].every(k=>typeof (d as Record<string,unknown>)[k]==='string'))&&Array.isArray(p.approvals)&&Array.isArray(p.securityChecks)&&p.parameters&&typeof p.parameters.tokenName==='string'&&typeof p.parameters.tokenSymbol==='string'&&typeof p.parameters.initialSupply==='number'&&typeof p.parameters.decimals==='number'&&['ERC-20','ERC-721','ERC-1155','ERC-3643'].includes(p.standard)&&['sepolia','polygon','ethereum','arbitrum'].includes(p.network))result.push(r);
  }catch{/* Ignore a damaged record without deleting it. */}
 }
 return result.sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
}
export function clientProjectChecks(project:TokenProject){
 return [
  {step:1,label:'Empresa y título del proyecto',ok:Boolean(project.organizationName.trim()&&project.title.trim())},
  {step:1,label:'Responsable y email de contacto',ok:Boolean(project.contact?.fullName.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project.contact?.email||''))},
  {step:1,label:'Consentimiento para revisar la solicitud',ok:project.contact?.consent===true},
  {step:1,label:'Descripción del activo',ok:Boolean(project.assetDescription?.trim()&&(project.assetType!=='Otro'||project.assetTypeOther?.trim()))},
  {step:2,label:'Estándar y red propuestos',ok:Boolean(project.standard&&project.network)},
  {step:3,label:'Nombre, símbolo y cantidades del token',ok:Boolean(project.parameters.tokenName.trim()&&project.parameters.tokenSymbol.trim()&&Number.isFinite(project.parameters.initialSupply)&&project.parameters.initialSupply>0&&Number.isInteger(project.parameters.decimals)&&project.parameters.decimals>=0&&project.parameters.decimals<=18&&(!(project.standard==='ERC-721'||project.standard==='ERC-1155')||(project.parameters.decimals===0&&Number.isInteger(project.parameters.initialSupply))))},
  {step:4,label:'Al menos un adjunto con hash calculado',ok:project.documents.some(d=>d.storage==='browser'&&/^[a-f0-9]{64}$/.test(d.sha256||''))},
 ];
}
export function clientCompleteness(project:TokenProject){const checks=clientProjectChecks(project);return Math.round(100*checks.filter(c=>c.ok).length/checks.length);}
