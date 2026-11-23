import {db,OWNER,projectHash,reply,staff} from './governance.js';
import type {TokenProject} from '../src/types';

const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(request:Request){
 try{
  if(Number(request.headers.get('content-length')||0)>10000)return reply({error:'Solicitud demasiado grande.'},413);
  const body=await request.json();
  if(body?.action!=='read'||!uuid(body.submissionId))return reply({error:'Expediente inválido.'},400);
  const actor=staff(request,'read');
  if(actor.wallet!==OWNER)return reply({error:'Solo la wallet 047 puede consultar la ficha integral.'},403);
  const client=db();
  const row=await client.from('client_submissions').select('id,request_id,status,received_at,project').eq('id',body.submissionId).eq('status','received').single();
  if(row.error||!row.data)return reply({error:'Expediente recibido no encontrado.'},404);
  const id=row.data.id as string;
  const [contact,reviews,payments,authorizations,operatorAuthorizations,issuance,collection,regulatedIssuance]=await Promise.all([
   client.from('submission_private_contacts').select('contact,tax_id').eq('submission_id',id).maybeSingle(),
   client.from('submission_reviews').select('id,role,decision,project_hash,signer_wallet,created_at,proof').eq('submission_id',id).order('created_at',{ascending:false}),
   client.from('submission_payments').select('id,status,amount,currency,reference,file_name,file_sha256,signer_wallet,verified_at,created_at').eq('submission_id',id).order('created_at',{ascending:false}),
   client.from('submission_authorizations').select('id,project_hash,review_ids,payment_id,signer_wallet,created_at').eq('submission_id',id).order('created_at',{ascending:false}),
   client.from('submission_operator_authorizations').select('id,project_hash,payment_id,decision,rationale,signer_wallet,signed_at,created_at').eq('submission_id',id).order('created_at',{ascending:false}),
   client.from('submission_issuances').select('id,standard,chain_id,factory_address,token_address,transaction_hash,block_number,token_name,token_symbol,admin_wallet,treasury_wallet,created_at').eq('submission_id',id).maybeSingle(),
   client.from('submission_collections').select('id,standard,chain_id,factory_address,collection_address,transaction_hash,block_number,collection_name,collection_symbol,admin_wallet,max_items,created_at').eq('submission_id',id).maybeSingle(),
   client.from('submission_regulated_issuances').select('id,standard,chain_id,factory_address,token_address,transaction_hash,block_number,token_name,token_symbol,admin_wallet,dossier_hash,created_at').eq('submission_id',id).maybeSingle(),
  ]);
  const missingCollections=collection.error&&/relation .* does not exist|schema cache|Could not find the table/i.test(collection.error.message);
  const missingRegulated=regulatedIssuance.error&&/relation .* does not exist|schema cache|Could not find the table/i.test(regulatedIssuance.error.message);
  const missingOperator=operatorAuthorizations.error&&/relation .* does not exist|schema cache|Could not find the table/i.test(operatorAuthorizations.error.message);
  const error=contact.error||reviews.error||payments.error||authorizations.error||(missingOperator?null:operatorAuthorizations.error)||issuance.error||(missingCollections?null:collection.error)||(missingRegulated?null:regulatedIssuance.error);
  if(error)throw error;
  const project=row.data.project as TokenProject;
  return reply({
   submission:{id,requestId:row.data.request_id,receivedAt:row.data.received_at,projectHash:projectHash(project),project},
   privateContact:contact.data||null,
   reviews:reviews.data||[],payments:payments.data||[],authorizations:authorizations.data||[],operatorAuthorizations:operatorAuthorizations.data||[],issuance:issuance.data||null,collection:collection.data||null,regulatedIssuance:regulatedIssuance.data||null,collectionStorageReady:!missingCollections,regulatedStorageReady:!missingRegulated,
  });
 }catch(e){
  const message=e instanceof Error?e.message:'Error de consulta.';
  if(/firma|autorización/i.test(message))return reply({error:'Firma de acceso inválida.'},403);
  console.error('Dossier API error',e);
  return reply({error:'No se pudo cargar la ficha integral. Intentá nuevamente.'},500);
 }
}
