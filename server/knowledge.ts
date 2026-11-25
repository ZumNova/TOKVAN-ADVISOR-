import {createClient} from '@supabase/supabase-js';
import WebSocket from 'ws';
import {getAddress} from 'ethers';
import {requireStaffSession} from './staffSession.js';

const OWNER=getAddress('0x521125be95c5679539aB07582F55F0040975A047');
type Action='list'|'create'|'approve';
const actions:Action[]=['list','create','approve'];
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>10000)return reply({error:'Nota demasiado grande.'},413);
  const body=await request.json(),action=body?.action as Action;if(!actions.includes(action))return reply({error:'Operación desconocida.'},400);
  const actor=await requireStaffSession(request),wallet=actor.wallet;
  if(!['owner','administrator','factory','reviewer','compliance','board','accounting','token_operator'].includes(actor.role))return reply({error:'Esta sesión no puede consultar la biblioteca.'},403);
  if(action!=='list'&&wallet!==OWNER)return reply({error:'Solo la 047 puede publicar notas.'},403);
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error('Biblioteca no configurada.');
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},realtime:{transport:WebSocket as never}});
  if(action==='list'){let query=db.from('educational_notes').select('id,title,body,source_reference,standard,status,author_wallet,approved_by,approved_at,created_at').order('created_at',{ascending:false}).limit(200);if(wallet!==OWNER)query=query.eq('status','approved');else query=query.neq('status','archived');const rows=await query;if(rows.error)throw rows.error;return reply({items:rows.data});}
  if(action==='create'){
   const title=String(body.title||'').trim(),content=String(body.body||'').trim(),source=String(body.sourceReference||'').trim(),standard=String(body.standard||'');
   if(title.length<4||title.length>120||content.length<20||content.length>3000||source.length<4||source.length>300||!['ERC-20','ERC-721','ERC-1155','ERC-3643','General'].includes(standard)||/@|-----BEGIN|\b(?:sk|pk)-[A-Za-z0-9_-]{12,}/i.test(title+' '+content+' '+source))return reply({error:'Nota inválida o contiene datos sensibles evidentes.'},400);
   const saved=await db.from('educational_notes').insert({title,body:content,source_reference:source,standard,status:'draft',author_wallet:OWNER.toLowerCase()}).select('id').single();if(saved.error)throw saved.error;return reply({id:saved.data.id});
  }
  if(typeof body.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(body.id))return reply({error:'Nota inválida.'},400);
  const saved=await db.from('educational_notes').update({status:'approved',approved_by:OWNER.toLowerCase(),approved_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',body.id).eq('status','draft').select('id').maybeSingle();
  if(saved.error)throw saved.error;if(!saved.data)return reply({error:'La nota no está pendiente.'},409);return reply({id:saved.data.id});
 }catch(error){const message=error instanceof Error?error.message:'Error de biblioteca.';if(/firma|autorización|sesión|origen administrativo|solo la 047/i.test(message))return reply({error:message},403);console.error('Knowledge API error',error);return reply({error:'No se pudo completar la operación.'},500);}
}
