import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {getAddress} from 'ethers';

export const LEGACY_OWNER=getAddress('0x521125be95c5679539aB07582F55F0040975A047');
export type StaffActor={wallet:string;role:string};
const COOKIE='tokvant_staff_session';
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
const db=()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Sesiones administrativas no configuradas.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
};
const cookieValue=(request:Request)=>{
 for(const item of (request.headers.get('cookie')||'').split(';')){const [name,...parts]=item.trim().split('=');if(name===COOKIE)return decodeURIComponent(parts.join('='));}
 return '';
};
export const sessionCookie=(token:string,maxAge:number)=>`${COOKIE}=${encodeURIComponent(token)}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
export const clearSessionCookie=()=>`${COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
export async function requireStaffSession(request:Request):Promise<StaffActor>{
 const expected=(process.env.APP_ORIGIN||'').replace(/\/$/,'');
 const supplied=request.headers.get('origin');
 if(expected&&supplied&&supplied!==expected)throw new Error('Origen administrativo inválido.');
 const token=cookieValue(request);if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Sesión administrativa requerida.');
 const client=db(),found=await client.from('staff_sessions').select('id,wallet,role,expires_at,revoked_at').eq('token_hash',sha(token)).maybeSingle();
 if(found.error||!found.data||found.data.revoked_at||Date.parse(found.data.expires_at)<=Date.now())throw new Error('Sesión administrativa vencida.');
 await client.from('staff_sessions').update({last_seen_at:new Date().toISOString()}).eq('id',found.data.id);
 return {wallet:getAddress(found.data.wallet),role:String(found.data.role)};
}
export async function revokeRequestSession(request:Request){
 const token=cookieValue(request);if(!/^[a-f0-9]{64}$/.test(token))return;
 await db().from('staff_sessions').update({revoked_at:new Date().toISOString()}).eq('token_hash',sha(token)).is('revoked_at',null);
}
