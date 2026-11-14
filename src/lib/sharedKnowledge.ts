import {staffRequest} from './sharedSubmissions';
export type SharedKnowledgeNote={id:string;title:string;body:string;source_reference:string;standard:string;status:'draft'|'approved';author_wallet:string;approved_by?:string;approved_at?:string;created_at:string};
const endpoint='/api/knowledge';
export const listKnowledge=(account:string)=>staffRequest('list',account,{},endpoint) as Promise<{items:SharedKnowledgeNote[]}>;
export const createKnowledge=(account:string,title:string,body:string,sourceReference:string,standard:string)=>staffRequest('create',account,{title,body,sourceReference,standard},endpoint);
export const approveKnowledge=(account:string,id:string)=>staffRequest('approve',account,{id},endpoint);
