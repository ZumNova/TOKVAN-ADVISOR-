import {createClient} from '@supabase/supabase-js';
import WebSocket from 'ws';
import {getAddress,isAddress,verifyMessage} from 'ethers';

const OWNER=getAddress('0x521125be95c5679539aB07582F55F0040975A047');
const COMPLIANCE=getAddress('0xeFcA0FAFd073A7B5EBb044A83fA449A79835FB24');
const FACTORY=getAddress('0x873Cd8e429c677e678b4C5970e28492585403774');
type Action='list'|'register'|'propose';
const actions:Action[]=['list','register','propose'];
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const lower=(value:string)=>getAddress(value).toLowerCase();
const db=()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Registro compartido no configurado.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},realtime:{transport:WebSocket as never}});
};
function actor(request:Request,action:Action){
 const h=request.headers,address=h.get('x-tokvant-wallet')||'',time=h.get('x-tokvant-time')||'',nonce=h.get('x-tokvant-nonce')||'',signature=h.get('x-tokvant-signature')||'',origin=new URL(request.url).origin;
 if(!isAddress(address)||!/^[-0-9a-f]{36}$/i.test(nonce)||!Number.isFinite(Date.parse(time))||Math.abs(Date.now()-Date.parse(time))>120000)throw new Error('Firma de acceso inválida.');
 const wallet=getAddress(address),message=`TOKVANT expediente access\nOrigin: ${origin}\nAction: ${action}\nTimestamp: ${time}\nNonce: ${nonce}\nWallet: ${wallet}`;
 if(verifyMessage(message,signature)!==wallet)throw new Error('Firma de acceso inválida.');
 if(wallet===OWNER)return {wallet,role:'owner'};
 let grant;try{grant=JSON.parse(h.get('x-tokvant-grant')||'null');}catch{throw new Error('Autorización inválida.');}
 if(!grant||!isAddress(grant.address)||getAddress(grant.address)!==wallet||!['token_operator','compliance'].includes(grant.role)||!Number.isSafeInteger(grant.expires)||grant.expires<=Date.now()||(grant.role==='compliance'&&wallet!==COMPLIANCE))throw new Error('Autorización inválida.');
 const grantMessage=`TOKVANT staff access\nOrigin: ${origin}\nWallet: ${wallet}\nRole: ${grant.role}\nExpires: ${grant.expires}`;
 if(verifyMessage(grantMessage,String(grant.signature||''))!==OWNER)throw new Error('Autorización inválida.');
 return {wallet,role:grant.role as string};
}
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>5000)return reply({error:'Solicitud demasiado grande.'},413);
  const body=await request.json(),action=body?.action as Action;
  if(!actions.includes(action))return reply({error:'Operación desconocida.'},400);
  const user=actor(request,action),client=db();
  if(!isAddress(body.tokenAddress))return reply({error:'Token inválido.'},400);
  const tokenAddress=lower(body.tokenAddress);
  if(action==='register'){
   if(user.wallet!==OWNER)return reply({error:'Solo la 047 puede vincular un token al registro.'},403);
   if(!isAddress(body.factoryAddress)||getAddress(body.factoryAddress)!==FACTORY||!isAddress(body.adminWallet)||!isAddress(body.claimAuthority)||getAddress(body.claimAuthority)!==COMPLIANCE||typeof body.projectReference!=='string'||body.projectReference.length<4||body.projectReference.length>120||typeof body.tokenName!=='string'||body.tokenName.length<1||body.tokenName.length>64||typeof body.tokenSymbol!=='string'||body.tokenSymbol.length<1||body.tokenSymbol.length>16)return reply({error:'Datos del token inválidos.'},400);
   const row={token_address:tokenAddress,factory_address:lower(body.factoryAddress),chain_id:11155111,token_name:body.tokenName,token_symbol:body.tokenSymbol,admin_wallet:lower(body.adminWallet),claim_authority:lower(body.claimAuthority),project_reference:body.projectReference,registered_by:lower(user.wallet)};
   const existing=await client.from('regulated_tokens').select('*').eq('token_address',tokenAddress).maybeSingle();if(existing.error)throw existing.error;
   if(existing.data&&Object.entries(row).some(([key,value])=>existing.data[key]!==value))return reply({error:'El token ya fue vinculado con otros parámetros.'},409);
   let registered=existing.data;
   if(!registered){const saved=await client.from('regulated_tokens').insert(row).select('*').single();if(saved.error)throw saved.error;registered=saved.data;}
   const submission=await client.from('client_submissions').select('project').eq('request_id',body.projectReference).eq('status','received').maybeSingle();if(submission.error)throw submission.error;
   const proposed=(submission.data?.project as {proposedRecipients?:{walletAddress:string}[]}|undefined)?.proposedRecipients||[];
   if(proposed.length){const rows=proposed.filter(p=>isAddress(p.walletAddress)).slice(0,100).map((p,index)=>({token_address:tokenAddress,wallet_address:lower(p.walletAddress),internal_reference:`INITIAL_${String(index+1).padStart(3,'0')}`,proposed_country:null,proposed_by:OWNER.toLowerCase()}));const seeded=await client.from('regulated_participants').upsert(rows,{onConflict:'token_address,wallet_address',ignoreDuplicates:true});if(seeded.error)throw seeded.error;}
   return reply({token:registered,initialProposals:proposed.length});
  }
  const found=await client.from('regulated_tokens').select('*').eq('token_address',tokenAddress).maybeSingle();if(found.error)throw found.error;
  const token=found.data;
  if(!token)return reply({token:null,items:[]});
  if(user.wallet!==OWNER&&user.wallet!==COMPLIANCE&&lower(user.wallet)!==token.admin_wallet)return reply({error:'Esta wallet no administra el token.'},403);
  if(action==='list'){
   const rows=await client.from('regulated_participants').select('id,wallet_address,internal_reference,proposed_country,proposed_by,created_at,updated_at').eq('token_address',tokenAddress).order('created_at',{ascending:true}).limit(100);
   if(rows.error)throw rows.error;return reply({token,items:rows.data});
  }
  if(!['token_operator','owner'].includes(user.role)||lower(user.wallet)!==token.admin_wallet)return reply({error:'Solo la propietaria del token puede proponer wallets.'},403);
  if(!isAddress(body.walletAddress)||!/^[-A-Z0-9_]{4,40}$/.test(String(body.internalReference||'')))return reply({error:'Wallet o referencia interna inválida. Usá un código sin nombres ni datos personales.'},400);
  const country=body.proposedCountry==null?null:Number(body.proposedCountry);
  if(country!==null&&(!Number.isInteger(country)||country<1||country>999))return reply({error:'País propuesto inválido.'},400);
  const walletAddress=lower(body.walletAddress);
  const existing=await client.from('regulated_participants').select('id').eq('token_address',tokenAddress).eq('wallet_address',walletAddress).maybeSingle();if(existing.error)throw existing.error;
  if(existing.data)return reply({error:'Esta wallet ya figura en el registro.'},409);
  const saved=await client.from('regulated_participants').insert({token_address:tokenAddress,wallet_address:walletAddress,internal_reference:body.internalReference,proposed_country:country,proposed_by:lower(user.wallet)}).select('id').single();if(saved.error)throw saved.error;
  return reply({id:saved.data.id});
 }catch(error){
  const message=error instanceof Error?error.message:'Error del registro.';
  if(/firma|autorización|administra|propietaria/i.test(message))return reply({error:message},403);
  console.error('Participants API error',error);return reply({error:'No se pudo completar el registro.'},500);
 }
}
