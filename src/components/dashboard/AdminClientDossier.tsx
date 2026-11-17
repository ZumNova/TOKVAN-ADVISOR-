import {useState} from 'react';
import {loadAdminDossier,type AdminDossier} from '../../lib/dossiers';

const date=(value:string|null|undefined)=>value?new Date(value).toLocaleString('es-AR'):'Sin fecha';
const explorer='https://sepolia.etherscan.io';

export default function AdminClientDossier({account,submissionId}:{account:string;submissionId:string}){
 const [data,setData]=useState<AdminDossier>();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const load=async()=>{setBusy(true);setError('');try{setData(await loadAdminDossier(account,submissionId));}catch(e){setError(e instanceof Error?e.message:'No se pudo consultar la ficha.');}finally{setBusy(false);}};
 const project=data?.submission.project;
 return <section className="rounded-xl border border-blue-500/40 bg-blue-500/5 p-4 text-sm space-y-3">
  <h3 className="font-semibold text-white">Ficha integral del expediente · solo wallet 047</h3>
  <p className="text-[#B8C9E1]">Consulta de lectura de Supabase. Cada dato conserva su origen: solicitud, contacto privado, documentos, dictámenes, pago, autorización y emisión vinculada.</p>
  <button type="button" disabled={busy} onClick={()=>void load()} className="rounded-lg border border-blue-400 px-3 py-2 text-blue-200 disabled:opacity-50">{busy?'Consultando…':data?'Actualizar ficha integral':'Cargar ficha integral'}</button>
  {error&&<p role="alert" className="text-red-300">{error}</p>}
  {data&&project&&<div className="space-y-4 break-words">
   <div><p><strong>Solicitud:</strong> {data.submission.requestId} · recibida {date(data.submission.receivedAt)}</p><p><strong>Comprobante:</strong> {data.submission.id}</p><p><strong>Empresa:</strong> {project.organizationName} · <strong>Proyecto:</strong> {project.title}</p><p><strong>Estándar y red:</strong> {project.standard} · {project.network}</p><p><strong>Wallet propuesta:</strong> {project.clientWalletAddress||'No informada'}</p><p className="text-xs text-[#9BA6BD]">Hash de la versión del expediente: {data.submission.projectHash}</p></div>
   <div><h4 className="font-semibold">Contacto privado</h4><p>{data.privateContact?.contact?.fullName||'Sin nombre'} · {data.privateContact?.contact?.email||'Sin correo'} · {data.privateContact?.contact?.phone||'Sin teléfono'}</p><p>Identificación fiscal: {data.privateContact?.tax_id||'No informada'}</p></div>
   <div><h4 className="font-semibold">Parámetros solicitados</h4><p>{project.parameters.tokenName} ({project.parameters.tokenSymbol}) · cantidad propuesta {project.parameters.initialSupply} · decimales {project.parameters.decimals}</p><p>Activo: {project.assetType==='Otro'?project.assetTypeOther||'Otro':project.assetType} · jurisdicción: {project.jurisdiction}</p><p>Descripción: {project.assetDescription}</p></div>
   <div><h4 className="font-semibold">Adjuntos privados · {project.documents.length}</h4>{project.documents.map(doc=><p key={doc.id}>{doc.category} · {doc.name} ({doc.fileName}) · SHA-256: <span className="font-mono text-xs">{doc.sha256||'Sin hash'}</span></p>)}<p className="text-xs text-[#9BA6BD]">Los archivos se descargan desde la sección «Documentación adjunta» de este expediente.</p></div>
   <div><h4 className="font-semibold">Dictámenes · {data.reviews.length}</h4>{data.reviews.length?data.reviews.map(review=><p key={review.id}>{review.role}: {review.decision} · {review.signer_wallet} · {date(review.created_at)}{review.proof?.comments?` · ${review.proof.comments}`:''}</p>):<p>Sin dictámenes guardados.</p>}</div>
   <div><h4 className="font-semibold">Pagos · {data.payments.length}</h4>{data.payments.length?data.payments.map(payment=><p key={payment.id}>{payment.amount} {payment.currency} · referencia {payment.reference} · {payment.status==='verified'?'Verificado':'Pendiente'} · {payment.file_name} · firma {payment.signer_wallet||'Sin firmar'}</p>):<p>Sin pagos guardados.</p>}</div>
   <div><h4 className="font-semibold">Autorizaciones TOKVANT · {data.authorizations.length}</h4>{data.authorizations.length?data.authorizations.map(auth=><p key={auth.id}>{date(auth.created_at)} · {auth.signer_wallet} · pago {auth.payment_id}</p>):<p>Sin autorización guardada.</p>}</div>
   <div><h4 className="font-semibold">Despliegue vinculado</h4>{data.issuance?<p>{data.issuance.standard} · {data.issuance.token_name} ({data.issuance.token_symbol}) · bloque {data.issuance.block_number} · <a className="text-blue-300 underline" href={`${explorer}/address/${data.issuance.token_address}`} target="_blank" rel="noreferrer">contrato</a> · <a className="text-blue-300 underline" href={`${explorer}/tx/${data.issuance.transaction_hash}`} target="_blank" rel="noreferrer">transacción</a></p>:<p>Sin despliegue vinculado en Supabase. La bitácora de Sepolia puede mostrar operaciones; ERC-721 y ERC-1155 aún requieren vincular su colección al expediente.</p>}</div>
  </div>}
 </section>;
}
