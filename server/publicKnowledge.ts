import {createClient} from '@supabase/supabase-js';
import WebSocket from 'ws';
import {bestPublicAnswer,containsPrivateData,publicSuggestions,type PublicAnswer} from './publicKnowledgeSearch.js';

const publishedAnswers=async()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return null;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},realtime:{transport:WebSocket as never}});
 const result=await db.from('public_educational_answers').select('question,short_answer,more_answer,keywords,category,source_reference').eq('status','published').order('created_at',{ascending:true}).limit(200);
 if(result.error)throw result.error;
 return result.data as PublicAnswer[];
};

export async function GET(){
 try{
  const rows=await publishedAnswers();
  return Response.json({questions:rows?publicSuggestions(rows):[]},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('Public suggestions error',error);return Response.json({questions:[]});}
}

export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>1000)return Response.json({error:'Pregunta demasiado larga.'},{status:413});
  const body=await request.json(),question=String(body?.question||'').trim();
  if(question.length<3||question.length>300)return Response.json({error:'Pregunta inválida.'},{status:400});
  if(containsPrivateData(question))return Response.json({answer:null});
  const rows=await publishedAnswers();
  const answer=rows?bestPublicAnswer(question,rows):null;
  return Response.json({answer:answer?{short:answer.short_answer,more:answer.more_answer}:null},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error('Public knowledge error',error);return Response.json({answer:null});}
}
