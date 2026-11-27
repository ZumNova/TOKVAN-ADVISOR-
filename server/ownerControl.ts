import {createClient} from '@supabase/supabase-js';
import {CONTROL_OWNER,LEGACY_OWNER,requireStaffSession} from './staffSession.js';

const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const db=()=>{const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Control institucional no configurado.');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});};

export async function POST(request:Request){
 try{
  const actor=await requireStaffSession(request);
  if(actor.wallet!==CONTROL_OWNER)return reply({error:'Solo la wallet de control institucional puede cambiar este estado.'},403);
  const body=await request.json().catch(()=>({})) as {action?:string;suspended?:boolean};
  const client=db();
  if(body.action==='status'){
   const state=await client.from('staff_owner_control').select('suspended,updated_by,updated_at').eq('id',true).maybeSingle();
   if(state.error)throw state.error;
   return reply({legacyOwner:LEGACY_OWNER,controller:CONTROL_OWNER,suspended:Boolean(state.data?.suspended),updatedBy:state.data?.updated_by||null,updatedAt:state.data?.updated_at||null});
  }
  if(body.action!=='set'||typeof body.suspended!=='boolean')return reply({error:'Operación de control inválida.'},400);
  const changed=await client.from('staff_owner_control').update({suspended:body.suspended,updated_by:actor.wallet.toLowerCase(),updated_at:new Date().toISOString()}).eq('id',true).select('suspended,updated_by,updated_at').maybeSingle();
  if(changed.error||!changed.data)throw changed.error||new Error('No se encontró el control institucional.');
  const audit=await client.from('staff_owner_control_events').insert({legacy_owner:LEGACY_OWNER.toLowerCase(),suspended:body.suspended,actor_wallet:actor.wallet.toLowerCase()});
  if(audit.error)throw audit.error;
  if(body.suspended){const revoked=await client.from('staff_sessions').update({revoked_at:new Date().toISOString()}).eq('wallet',LEGACY_OWNER.toLowerCase()).is('revoked_at',null);if(revoked.error)throw revoked.error;}
  return reply({legacyOwner:LEGACY_OWNER,controller:CONTROL_OWNER,...changed.data});
 }catch(error){
  const message=error instanceof Error?error.message:'No se pudo actualizar el control institucional.';
  if(/relation .* does not exist|schema cache|Could not find the table/i.test(message))return reply({error:'Falta aplicar la migración de control institucional en Supabase.'},503);
  if(/sesión|suspendido|Solo la wallet/i.test(message))return reply({error:message},403);
  console.error('Owner control error',error);return reply({error:'No se pudo actualizar el control institucional.'},500);
 }
}
