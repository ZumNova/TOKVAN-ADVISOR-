import {createClient} from '@supabase/supabase-js';
import WebSocket from 'ws';
import {bestPublicAnswer,containsPrivateData,type PublicAnswer} from './publicKnowledgeSearch.js';

export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>1000)return Response.json({error:'Pregunta demasiado larga.'},{status:413});
  const body=await request.json(),question=String(body?.question||'').trim();
  if(question.length<3||question.length>300)return Response.json({error:'Pregunta inválida.'},{status:400});
  if(containsPrivateData(question))return Response.json({answer:null});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return Response.json({answer:null});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},realtime:{transport:WebSocket as never}});
  const result=await db.from('public_educational_answers').select('question,short_answer,more_answer,keywords,category').eq('status','published').limit(200);
  if(result.error){console.error('Public knowledge query failed',result.error);return Response.json({answer:null});}
  const answer=bestPublicAnswer(question,result.data as PublicAnswer[]);
  return Response.json({answer:answer?{short:answer.short_answer,more:answer.more_answer}:null},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('Public knowledge error',error);return Response.json({answer:null});}
}
