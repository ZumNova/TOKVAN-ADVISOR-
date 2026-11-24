import {useState} from 'react';
import type {TokenProject} from '../../types';
import {amendClassification} from '../../lib/sharedSubmissions';

const standards:TokenProject['standard'][]=['ERC-20','ERC-721','ERC-1155','ERC-3643'];
const networks:TokenProject['network'][]=['sepolia','polygon','arbitrum','ethereum'];
const restrictions:TokenProject['parameters']['transferRestrictions'][]=['Sin restricción','Permisos ERC-3643 (Identity Registry)','Lista blanca (Whitelist)','Regulada por país'];

export function ClassificationCorrection({project,account,onSaved}:{project:TokenProject;account:string;onSaved:(project:TokenProject)=>void}){
 const [standard,setStandard]=useState(project.standard);
 const [network,setNetwork]=useState(project.network);
 const [initialSupply,setInitialSupply]=useState(String(project.parameters.initialSupply));
 const [maxSupply,setMaxSupply]=useState(String(project.parameters.maxSupply??project.parameters.initialSupply));
 const [decimals,setDecimals]=useState(String(project.parameters.decimals));
 const [transferRestrictions,setTransferRestrictions]=useState(project.parameters.transferRestrictions);
 const [requireKYC,setRequireKYC]=useState(project.parameters.complianceRules.requireKYC);
 const [requireKYB,setRequireKYB]=useState(project.parameters.complianceRules.requireKYB);
 const [restrictSanctionedCountries,setRestrictSanctionedCountries]=useState(project.parameters.complianceRules.restrictSanctionedCountries);
 const [lockupPeriodDays,setLockupPeriodDays]=useState(String(project.parameters.complianceRules.lockupPeriodDays??0));
 const [maxHoldersLimit,setMaxHoldersLimit]=useState(String(project.parameters.complianceRules.maxHoldersLimit??0));
 const [reason,setReason]=useState('');
 const [removeLegacyControls,setRemoveLegacyControls]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const nft=standard==='ERC-721'||standard==='ERC-1155';
 const hasLegacyControls=project.parameters.isUpgradeabilityEnabled||project.parameters.complianceRules.requireKYC||project.parameters.complianceRules.requireKYB||project.parameters.complianceRules.restrictSanctionedCountries||(project.parameters.complianceRules.lockupPeriodDays||0)>0;
 const changed=standard!==project.standard||network!==project.network||Number(initialSupply)!==project.parameters.initialSupply||Number(maxSupply)!==(project.parameters.maxSupply??project.parameters.initialSupply)||Number(decimals)!==project.parameters.decimals||transferRestrictions!==project.parameters.transferRestrictions||requireKYC!==project.parameters.complianceRules.requireKYC||requireKYB!==project.parameters.complianceRules.requireKYB||restrictSanctionedCountries!==project.parameters.complianceRules.restrictSanctionedCountries||Number(lockupPeriodDays)!==(project.parameters.complianceRules.lockupPeriodDays??0)||Number(maxHoldersLimit)!==(project.parameters.complianceRules.maxHoldersLimit??0);
 const save=async()=>{
  setBusy(true);setError('');
  try{onSaved(await amendClassification(account,project,{standard,network,initialSupply:Number(initialSupply),maxSupply:Number(maxSupply),decimals:Number(decimals),transferRestrictions,requireKYC,requireKYB,restrictSanctionedCountries,lockupPeriodDays:Number(lockupPeriodDays),maxHoldersLimit:Number(maxHoldersLimit),removeLegacyControls,reason:reason.trim()}));}
  catch(e){setError(e instanceof Error?e.message:'No se pudo corregir el expediente.');}
  finally{setBusy(false);}
 };
 return <details className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
  <summary className="cursor-pointer font-semibold text-amber-200">Revisión técnica · corregir estándar o red</summary>
  <p className="mt-3 text-slate-300">La corrección queda registrada en el expediente y cambia su hash de versión. Para el factory v2, la 047 debe firmar otra decisión integral. Un pago verificado sigue vinculado al expediente.</p>
  <div className="mt-3 grid gap-3 sm:grid-cols-2">
   <label>Estándar<select value={standard} onChange={event=>{const next=event.target.value as TokenProject['standard'];setStandard(next);if(next==='ERC-721'||next==='ERC-1155'){setDecimals('0');setTransferRestrictions('Sin restricción');}}} className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2">{standards.map(value=><option key={value}>{value}</option>)}</select></label>
   <label>Red<select value={network} onChange={event=>setNetwork(event.target.value as TokenProject['network'])} className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2">{networks.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
   <label>Cantidad propuesta<input type="number" min="1" step="1" value={initialSupply} onChange={event=>setInitialSupply(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2"/></label>
   <label>Máximo de suministro<input type="number" min="1" step="1" value={maxSupply} onChange={event=>setMaxSupply(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2"/></label>
   {standard==='ERC-3643'&&<p className="sm:col-span-2 text-slate-300">Cantidad propuesta: participaciones previstas. Máximo: límite inicial de unidades en circulación del token; el factory v2 lo verifica contra esta versión aprobada.</p>}
   <label>Decimales<input type="number" min="0" max="18" step="1" disabled={nft} value={decimals} onChange={event=>setDecimals(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2 disabled:opacity-60"/></label>
   <label className="sm:col-span-2">Régimen de transferencia<select value={transferRestrictions} onChange={event=>setTransferRestrictions(event.target.value as TokenProject['parameters']['transferRestrictions'])} className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2">{restrictions.map(value=><option key={value}>{value}</option>)}</select></label>
   <fieldset className="sm:col-span-2 rounded-lg border border-[#45628B] p-3"><legend className="px-1 font-semibold">Controles solicitados</legend><p className="mb-3 text-slate-300">Corregí estos datos solo después de confirmar el alcance con el solicitante. Marcar un control no lo incorpora al contrato.</p><div className="grid gap-2 sm:grid-cols-2"><label><input type="checkbox" checked={requireKYC} onChange={event=>setRequireKYC(event.target.checked)}/> KYC</label><label><input type="checkbox" checked={requireKYB} onChange={event=>setRequireKYB(event.target.checked)}/> KYB</label><label><input type="checkbox" checked={restrictSanctionedCountries} onChange={event=>setRestrictSanctionedCountries(event.target.checked)}/> Restricción por países</label><label>Bloqueo (días)<input type="number" min="0" max="36500" step="1" value={lockupPeriodDays} onChange={event=>setLockupPeriodDays(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2"/></label><label>Límite de titulares (0 = sin límite)<input type="number" min="0" step="1" value={maxHoldersLimit} onChange={event=>setMaxHoldersLimit(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2"/></label></div></fieldset>
  </div>
  {project.clientWalletAddress&&project.clientWalletNetwork!==network&&<p className="mt-3 text-amber-200">La wallet informada por el cliente era para {project.clientWalletNetwork}. Confirmá con el cliente si usará la misma dirección en {network}; la factory no la precargará automáticamente.</p>}
  {project.proposedRecipients?.length&&standard!=='ERC-3643'&&<p className="mt-3 text-amber-200">Las {project.proposedRecipients.length} wallets receptoras propuestas para ERC-3643 dejarán de formar parte de la configuración activa. Quedarán en el historial de esta corrección.</p>}
  {nft&&hasLegacyControls&&<label className="mt-3 flex items-start gap-2 text-amber-200"><input type="checkbox" className="mt-1" checked={removeLegacyControls} onChange={event=>setRemoveLegacyControls(event.target.checked)}/><span>Confirmo que este NFT de prueba no implementará KYC, KYB, restricciones de países, plazos de bloqueo ni UUPS. Retirar esos parámetros del expediente corregido y conservar los originales en el historial.</span></label>}
  {network!=='sepolia'&&<p className="mt-3 text-amber-200">Las factories operativas actuales preparan emisiones en Sepolia. Esta red requerirá otra implementación antes de desplegar.</p>}
  <label className="mt-3 block">Motivo de la corrección<textarea value={reason} onChange={event=>setReason(event.target.value)} maxLength={1000} rows={2} placeholder="Ej.: el cliente solicitó una obra única; corresponde evaluar ERC-721 en Sepolia." className="mt-1 block w-full rounded-lg border border-[#45628B] bg-[#0B0D12] p-2"/></label>
  <button type="button" disabled={busy||!changed||reason.trim().length<12||(nft&&hasLegacyControls&&!removeLegacyControls)} onClick={()=>void save()} className="mt-3 rounded-lg bg-[#316BFA] px-4 py-2 font-semibold disabled:opacity-40">{busy?'Guardando…':'Guardar nueva versión para revisión'}</button>
  {error&&<p role="alert" className="mt-2 text-red-300">{error}</p>}
 </details>;
}
