import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {getAddress,isAddress,verifyMessage} from 'ethers';
import participants from '../deployment/sepolia-participants.json' with {type:'json'};
import {clearSessionCookie,CONTROL_OWNER,LEGACY_OWNER,legacyOwnerSuspended,revokeRequestSession,sessionCookie} from './staffSession.js';

const reply=(body:unknown,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
const ADMIN_SESSION_DURATION_MS=4*60*60*1000;
const db=()=>{const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Sesiones administrativas no configuradas.');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});};
const configuredOrigin=(request:Request)=>{const raw=(process.env.APP_ORIGIN||new URL(request.url).origin).replace(/\/$/,'');const url=new URL(raw);if(url.protocol!=='https:'&&url.hostname!=='localhost')throw new Error('Origen administrativo inválido.');const supplied=request.headers.get('origin');if(supplied&&supplied!==url.origin)throw new Error('Origen administrativo inválido.');return url;};
export const buildSiweMessage=(domain:string,address:string,uri:string,chainId:number,nonce:string,issuedAt:string,expiresAt:string,requestId:string)=>`${domain} wants you to sign in with your Ethereum account:\n${address}\n\nAcceso administrativo a TOKVANT.\n\nURI: ${uri}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expiresAt}\nRequest ID: ${requestId}`;
const validGrant=(grant:unknown,wallet:string,origin:string)=>{
 if(!grant||typeof grant!=='object')return null;const g=grant as {address?:string;role?:string;expires?:number;signature?:string};
 const roles=['administrator','factory','reviewer','compliance','board','accounting','token_operator','nft_operator','multi_operator'];
 const fixed:Record<string,string>={reviewer:participants.participants.technicalReviewer,compliance:participants.participants.complianceReviewer,board:participants.participants.boardReviewer,factory:participants.participants.operator};
 if(!isAddress(g.address)||getAddress(g.address)!==wallet||!roles.includes(String(g.role))||!Number.isSafeInteger(g.expires)||Number(g.expires)<=Date.now()||(fixed[String(g.role)]&&getAddress(fixed[String(g.role)])!==wallet))return null;
 const message=`TOKVANT staff access\nOrigin: ${origin}\nWallet: ${wallet}\nRole: ${g.role}\nExpires: ${g.expires}`;
 return verifyMessage(message,String(g.signature||''))===LEGACY_OWNER?{role:String(g.role),expires:Number(g.expires)}:null;
};
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>20000)return reply({error:'Solicitud demasiado grande.'},413);
  const body=await request.json().catch(()=>({})),action=String(body.action||''),client=db(),origin=configuredOrigin(request);
  if(action==='nonce'){
   if(!isAddress(body.address))return reply({error:'Wallet inválida.'},400);
   const address=getAddress(body.address),nonce=randomBytes(12).toString('hex'),issuedAt=new Date(),expiresAt=new Date(issuedAt.getTime()+300000),id=randomUUID(),chainId=11155111;
   if(address===LEGACY_OWNER&&await legacyOwnerSuspended())return reply({error:'El acceso de la 047 está suspendido por control institucional.'},403);
   const saved=await client.from('staff_auth_challenges').insert({id,wallet:address.toLowerCase(),nonce_hash:sha(nonce),domain:origin.host,uri:origin.origin,chain_id:chainId,issued_at:issuedAt.toISOString(),expires_at:expiresAt.toISOString()});if(saved.error)throw saved.error;
   const issuedAtText=issuedAt.toISOString(),expiresAtText=expiresAt.toISOString();
   return reply({challengeId:id,nonce,issuedAt:issuedAtText,expiresAt:expiresAtText,message:buildSiweMessage(origin.host,address,origin.origin,chainId,nonce,issuedAtText,expiresAtText,id)});
  }
  if(action==='verify'){
   if(typeof body.challengeId!=='string'||typeof body.nonce!=='string'||typeof body.signature!=='string'||typeof body.issuedAt!=='string'||typeof body.expiresAt!=='string')return reply({error:'Firma SIWE incompleta.'},400);
   const challenge=await client.from('staff_auth_challenges').select('*').eq('id',body.challengeId).maybeSingle();
   if(challenge.error||!challenge.data||challenge.data.consumed_at||Date.parse(challenge.data.expires_at)<=Date.now()||challenge.data.nonce_hash!==sha(body.nonce)||challenge.data.domain!==origin.host||challenge.data.uri!==origin.origin)return reply({error:'Desafío SIWE vencido o inválido.'},403);
   if(Date.parse(body.issuedAt)!==Date.parse(challenge.data.issued_at)||Date.parse(body.expiresAt)!==Date.parse(challenge.data.expires_at))return reply({error:'Las fechas del desafío SIWE no coinciden.'},403);
   const address=getAddress(challenge.data.wallet),message=buildSiweMessage(challenge.data.domain,address,challenge.data.uri,Number(challenge.data.chain_id),body.nonce,body.issuedAt,body.expiresAt,challenge.data.id);
   if(verifyMessage(message,body.signature)!==address)return reply({error:'Firma SIWE inválida.'},403);
   let role='owner',expiresAt=Date.now()+ADMIN_SESSION_DURATION_MS;
   if(address===LEGACY_OWNER){if(await legacyOwnerSuspended())return reply({error:'El acceso de la 047 está suspendido por control institucional.'},403);}
   else if(address===CONTROL_OWNER){role='administrator';}
   else {const grant=validGrant(body.grant,address,origin.origin);if(!grant)return reply({error:'La wallet no tiene una autorización TOKVANT vigente.'},403);role=grant.role;expiresAt=Math.min(expiresAt,grant.expires);}
   const consumed=await client.from('staff_auth_challenges').update({consumed_at:new Date().toISOString()}).eq('id',challenge.data.id).is('consumed_at',null).select('id').maybeSingle();if(consumed.error||!consumed.data)return reply({error:'El desafío SIWE ya fue utilizado.'},409);
   const token=randomBytes(32).toString('hex'),session=await client.from('staff_sessions').insert({token_hash:sha(token),wallet:address.toLowerCase(),role,expires_at:new Date(expiresAt).toISOString()});if(session.error)throw session.error;
   return reply({wallet:address,role,expiresAt:new Date(expiresAt).toISOString()},200,{'Set-Cookie':sessionCookie(token,Math.max(1,Math.floor((expiresAt-Date.now())/1000)))});
  }
  if(action==='logout'){await revokeRequestSession(request);return reply({ok:true},200,{'Set-Cookie':clearSessionCookie()});}
  return reply({error:'Operación de autenticación desconocida.'},400);
 }catch(error){console.error('Staff auth error',error);return reply({error:'No se pudo completar el acceso administrativo.'},500);}
}
