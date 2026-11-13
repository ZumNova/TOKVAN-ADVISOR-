import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  Clock, 
  PenTool, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { TokenProject, ApprovalStep } from '../../types';
import {getAddress,hexlify,toUtf8Bytes} from 'ethers';
import {projectReviewHash,reviewMessage,reviewRoleForWallet,reviewWallets,validReview,type ReviewProof,type ReviewDecision} from '../../lib/reviewSignatures';
import {loadGovernance,verifyPayment,downloadPaymentDocument,authorizePreparation,type GovernanceState,type SharedReview} from '../../lib/governance';

interface ApprovalWorkflowViewProps {
  projects: TokenProject[];
  initialProjectId?: string;
  onUpdateApproval: (proof: ReviewProof) => Promise<void>;
  onApplySharedReviews: (projectId:string,reviews:SharedReview[]) => void;
  staffAccount: string | null;
  staffRole: string | null;
  onNavigate: (view: string) => void;
}

export const ApprovalWorkflowView: React.FC<ApprovalWorkflowViewProps> = ({
  projects,
  initialProjectId,
  onUpdateApproval,
  onApplySharedReviews,
  staffAccount,
  staffRole,
  onNavigate,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const [commentsInput, setCommentsInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionError,setActionError]=useState<string | null>(null);
  const [busy,setBusy]=useState(false);
  const [governance,setGovernance]=useState<GovernanceState|null>(null);
  const [paymentAmount,setPaymentAmount]=useState('');
  const [paymentCurrency,setPaymentCurrency]=useState('USD');
  const [paymentReference,setPaymentReference]=useState('');
  const [paymentFile,setPaymentFile]=useState<File|null>(null);
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const activeRole=reviewRoleForWallet(staffAccount);
  const handleExecuteApproval = async (status: ReviewDecision) => {
    if (!activeProject || !activeRole || !staffAccount || busy) return;
    const step = activeProject.approvals.find(s => s.role === activeRole);
    if (!step) return;
    setBusy(true);setActionError(null);setActionSuccessMessage(null);
    try {
      const wallet=(window as Window & {ethereum?:{request:(args:{method:string;params?:unknown[]})=>Promise<unknown>}}).ethereum;
      if(!wallet)throw new Error('Abrí la wallet autorizada en el navegador.');
      const accounts=await wallet.request({method:'eth_accounts'}) as string[];
      if(!accounts?.[0]||getAddress(accounts[0])!==getAddress(staffAccount)||getAddress(accounts[0])!==getAddress(reviewWallets[activeRole]))throw new Error('Seleccioná la wallet asignada a este rol en el factory de Sepolia.');
      const unsigned={projectId:activeProject.id,stepId:step.id,role:activeRole,decision:status,comments:commentsInput.trim(),projectHash:projectReviewHash(activeProject),timestamp:new Date().toISOString(),nonce:crypto.randomUUID(),signer:getAddress(staffAccount)};
      if(!unsigned.comments)throw new Error('Escribí el fundamento del dictamen antes de firmar.');
      const signature=await wallet.request({method:'personal_sign',params:[hexlify(toUtf8Bytes(reviewMessage(unsigned))),staffAccount]}) as string;
      const proof:ReviewProof={...unsigned,signature};
      if(!validReview(activeProject,proof))throw new Error('La firma no corresponde al expediente o a la wallet del rol.');
      await onUpdateApproval(proof);
      setActionSuccessMessage(activeProject.submissionId?`Dictamen de ${activeRole} guardado en Supabase.`:`Dictamen de ${activeRole} firmado en esta sesión de demostración.`);
      if(activeProject.submissionId)setGovernance(null);
      setCommentsInput('');
    }catch(e){setActionError(e instanceof Error?e.message:'No se pudo firmar el dictamen.');}
    finally{setBusy(false);}
  };
  const refreshGovernance=async()=>{
    if(!activeProject?.submissionId||!staffAccount)return;
    setBusy(true);setActionError(null);
    try{const state=await loadGovernance(staffAccount,activeProject.submissionId);setGovernance(state);onApplySharedReviews(activeProject.id,state.reviews);}
    catch(e){setActionError(e instanceof Error?e.message:'No se pudo cargar la bitácora.');}
    finally{setBusy(false);}
  };
  const recordPayment=async()=>{
    if(!activeProject?.submissionId||!staffAccount||!paymentFile)return;
    setBusy(true);setActionError(null);setActionSuccessMessage(null);
    try{await verifyPayment(staffAccount,activeProject.submissionId,paymentAmount,paymentCurrency,paymentReference,paymentFile);setGovernance(null);setActionSuccessMessage('Pago y comprobante verificados, firmados y guardados en Supabase. Pulsá «Cargar bitácora compartida» para verlos.');}
    catch(e){setActionError(e instanceof Error?e.message:'No se pudo registrar el pago.');}
    finally{setBusy(false);}
  };
  const authorize=async()=>{
    if(!activeProject?.submissionId||!staffAccount||!governance)return;
    setBusy(true);setActionError(null);setActionSuccessMessage(null);
    try{await authorizePreparation(staffAccount,activeProject.submissionId,governance);setGovernance(null);setActionSuccessMessage('Preparación autorizada y guardada en Supabase. Pulsá «Cargar bitácora compartida» para verla. Aún faltan las aprobaciones on-chain del factory.');}
    catch(e){setActionError(e instanceof Error?e.message:'No se pudo autorizar la preparación.');}
    finally{setBusy(false);}
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#273246]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
            <FileCheck2 className="w-4 h-4" />
            <span>Motor de Aprobaciones Colegiadas</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9BA6BD]">Segregación Maker-Checker</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
            Gobernanza, Dictámenes y Autorización de Despliegue
          </h1>
          <p className="text-xs text-[#9BA6BD] mt-1">
            {activeProject?'Los dictámenes firmados se guardan en la bitácora compartida. El factory exige sus aprobaciones on-chain por separado.':'Cargá un expediente recibido desde «Expedientes de emisión» para iniciar el circuito real.'}
          </p>
        </div>

        <div className="rounded-xl border border-[#39547C] bg-[#141A27] px-4 py-2 text-sm text-white">Rol firmante: <strong>{activeRole ? (activeRole==='Enterprise Board'?'Directorio':activeRole==='Technical Reviewer'?'Técnico':'Compliance') : 'Solo lectura'}</strong><span className="block font-mono text-[10px] text-[#9BA6BD]">{staffAccount||'Sin wallet'}</span></div>
      </div>

      {actionError&&<p role="alert" className="rounded-lg border border-red-500 p-3 text-sm text-red-200">{actionError}</p>}
      {actionSuccessMessage && (
        <div className="rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/30 p-4 text-xs font-semibold text-[#16A34A] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Grid: Project Selector & Workflow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Project Selector List */}
        <div className="lg:col-span-4 rounded-2xl bg-[#141A27] border border-[#273246] p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-[#273246]">
            Expedientes en Circuito Colegiado
          </h2>

          <div className="space-y-2">
            {projects.length===0&&<p className="rounded-lg border border-[#273246] p-3 text-xs text-[#9BA6BD]">No hay expedientes recibidos cargados. Abrí «Expedientes de emisión» y pulsá «Cargar expedientes recibidos».</p>}
            {projects.map((p) => {
              const pendingCount = p.approvals.filter((a) => a.status !== 'Aprobado').length;
              return (
                <button
                  key={p.id}
                  onClick={() => {setSelectedProjectId(p.id);setGovernance(null);}}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeProject?.id === p.id
                      ? 'border-[#316BFA] bg-[#316BFA]/10 text-white'
                      : 'border-[#273246] bg-[#0B0D12] text-[#9BA6BD] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#7096FF]">{p.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        pendingCount === 0
                          ? 'bg-[#16A34A]/10 text-[#16A34A]'
                          : 'bg-[#D97706]/10 text-[#D97706]'
                      }`}
                    >
                      {pendingCount === 0 ? 'Tres dictámenes aprobados' : `${pendingCount} por resolver`}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-1 truncate">{p.title}</div>
                  <div className="text-[11px] text-[#9BA6BD] mt-0.5 font-mono">
                    {p.standard} · ${p.targetValuationUsd.toLocaleString()} USD
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Project Approval Workspace */}
        {activeProject && (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Project Summary Box */}
            <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#273246]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#7096FF]">
                    <span>{activeProject.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeProject.parameters.tokenSymbol}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white font-display mt-0.5">
                    {activeProject.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9BA6BD]">Estado:</span>
                  <span className="text-xs font-bold text-white px-2.5 py-1 bg-[#0B0D12] border border-[#273246] rounded-md">
                    {activeProject.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[#9BA6BD] block">Emisor:</span>
                  <span className="text-white font-medium truncate block">{activeProject.organizationName}</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Normativa:</span>
                  <span className="text-white font-medium">{activeProject.jurisdiction}</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Estándar EVM:</span>
                  <span className="text-[#7096FF] font-mono font-bold">{activeProject.standard}</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Valuación Auditada:</span>
                  <span className="text-white font-mono tabular-nums font-bold">
                    ${activeProject.targetValuationUsd.toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>

            {activeProject.submissionId&&<div className="rounded-2xl border border-[#39547C] bg-[#101A2A] p-5 space-y-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-white">Bitácora compartida · Supabase</h3><p className="mt-1 text-xs text-[#9BA6BD]">Las firmas de este expediente recibido se verifican y conservan para todo el equipo.</p></div><button type="button" disabled={busy} onClick={()=>void refreshGovernance()} className="rounded-lg border border-[#567EFF] px-3 py-2 text-xs text-white disabled:opacity-50">{governance?'Actualizar bitácora':'Cargar bitácora compartida'}</button></div>
              {governance&&<div className="space-y-3">
                <p className="text-xs text-[#B8C9E1]">Dictámenes aprobados: {governance.reviews.filter(row=>row.decision==='Aprobado'&&row.project_hash===governance.projectHash).length} / 3 · Pago: {governance.payments.some(row=>row.status==='verified')?'verificado':'pendiente'} · Autorización TOKVANT: {governance.authorized?'vigente':'pendiente'}</p>
                {governance.payments.filter(row=>row.status==='verified').map(row=><div key={row.id} className="break-all rounded-lg border border-[#273246] p-3 text-xs text-[#B8C9E1]">Pago {row.amount} {row.currency} · Referencia {row.reference} · Firmado por {row.signer_wallet} · <button type="button" className="text-[#7096FF] underline" onClick={()=>{if(staffAccount)void downloadPaymentDocument(staffAccount,row).catch(e=>setActionError(e instanceof Error?e.message:'No se pudo descargar.'));}}>Descargar comprobante: {row.file_name}</button></div>)}
              </div>}
              {(staffRole==='accounting'||staffRole==='owner')&&<div className="space-y-3 border-t border-[#39547C] pt-4"><h4 className="font-semibold text-white">Contaduría · verificar pago recibido</h4><p className="text-xs text-[#9BA6BD]">Confirmá el cobro fuera de la dapp antes de firmar. El comprobante quedará privado y vinculado a este expediente.</p><div className="grid gap-3 sm:grid-cols-3"><label className="text-xs">Importe<input value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} inputMode="decimal" placeholder="1500.00" className="mt-1 w-full rounded-lg border border-[#39547C] bg-[#0B0D12] p-2 text-white" /></label><label className="text-xs">Moneda<select value={paymentCurrency} onChange={e=>setPaymentCurrency(e.target.value)} className="mt-1 w-full rounded-lg border border-[#39547C] bg-[#0B0D12] p-2 text-white"><option>USD</option><option>PYG</option><option>ARS</option><option>EUR</option></select></label><label className="text-xs">Referencia del pago<input value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="Transferencia / recibo" className="mt-1 w-full rounded-lg border border-[#39547C] bg-[#0B0D12] p-2 text-white" /></label></div><label className="block text-xs">Comprobante privado PDF o imagen<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={e=>setPaymentFile(e.target.files?.[0]||null)} className="mt-1 block w-full text-[#B8C9E1]" /></label><button type="button" disabled={busy||!paymentFile||!paymentAmount||!paymentReference.trim()} onClick={()=>void recordPayment()} className="rounded-lg bg-[#316BFA] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Firmar recibo de pago verificado</button></div>}
              {staffRole==='owner'&&governance&&<div className="border-t border-[#39547C] pt-4"><button type="button" disabled={busy||governance.reviews.filter(row=>row.decision==='Aprobado'&&row.project_hash===governance.projectHash).length!==3||!governance.payments.some(row=>row.status==='verified')} onClick={()=>void authorize()} className="rounded-lg bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Autorizar preparación del token</button><p className="mt-2 text-xs text-[#9BA6BD]">Esta firma habilita la preparación administrativa; no despliega un token ni sustituye las firmas on-chain del factory.</p></div>}
            </div>}

            {/* Approval Steps Progression */}
            <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 pb-2 border-b border-[#273246]">
Circuito de cuatro etapas · recepción y tres dictámenes
              </h3>

              <div className="space-y-4">
                <div className="rounded-xl border border-[#39547C] bg-[#0B0D12] p-4 text-sm"><div className="font-semibold text-white">1 · Administración · recepción del expediente</div><p className="mt-2 text-[#9BA6BD]">{activeProject.submissionId?'Expediente recibido en Supabase. La recepción no equivale a una aprobación; cada revisor firma su propio dictamen.':'Este ejemplo no representa un expediente recibido. Sus dictámenes son locales a esta sesión.'}</p></div>
                {activeProject.approvals.map((step, idx) => {
                  const isCurrentSimulatedRole = step.role === activeRole;
                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrentSimulatedRole
                          ? 'border-[#316BFA] bg-[#141A27] ring-1 ring-[#316BFA]'
                          : 'border-[#273246] bg-[#0B0D12]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#273246] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                            {idx + 2}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{step.role}</span>
                              {isCurrentSimulatedRole && (
                                <span className="text-[10px] font-semibold text-[#7096FF] px-2 py-0.5 rounded bg-[#316BFA]/20">
                                  Su rol actual
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#9BA6BD]">{step.label}</div>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold self-start sm:self-auto ${
                            step.status === 'Aprobado'
                              ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20'
                              : step.status === 'Rechazado'
                              ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                              : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>

                      {step.approverName && (
                        <div className="mt-3 pt-3 border-t border-[#273246]/60 text-xs text-[#9BA6BD] flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span>{step.signerWallet?'Firmado por wallet: ':'Dato de ejemplo: '}</span>
                            <strong className="text-white">{step.approverName}</strong>
                            <span className="text-[10px] ml-2 font-mono">({step.timestamp})</span>
                          </div>
                          {step.signerWallet && <span className="block font-mono text-[10px] break-all">Wallet: {step.signerWallet}</span>}
                          {step.signatureHash && (
                            <div className="min-w-0 max-w-full break-all font-mono text-[10px] text-[#7096FF]">
                              {step.signerWallet?'Firma: ':'Referencia ficticia: '}{step.signatureHash}
                            </div>
                          )}
                        </div>
                      )}

                      {step.comments && (
                        <p className="mt-2 text-xs text-slate-300 bg-[#0B0D12] p-2.5 rounded border border-[#273246]/50 italic">
                          "{step.comments}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Box for the Simulated Role */}
            <div className="rounded-2xl bg-[#0B0D12] border border-[#316BFA]/40 p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
                <PenTool className="w-4 h-4" />
                <span>Dictamen {activeRole ? `como ${activeRole}` : '· consulta de todos los pasos'}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Observaciones Técnicas / Fundamento del Dictamen
                </label>
                <textarea
                  rows={2}
                  value={commentsInput}
                  onChange={(e) => setCommentsInput(e.target.value)}
                  placeholder="Ingrese el dictamen pericial, notas de cumplimiento o salvedades antes de firmar..."
                  className="w-full rounded-lg bg-[#141A27] border border-[#273246] p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#316BFA]"
                />
              </div>

              {!activeRole && <p className="text-sm text-amber-200">Podés consultar todo el expediente. Las firmas corresponden exclusivamente a las wallets de Técnico, Compliance y Directorio fijadas en los factories de Sepolia.</p>}
              <p className="text-xs leading-relaxed text-[#9BA6BD]">«Solicitar Corrección» deja el dictamen observado; «Rechazar» lo marca rechazado. Ambos requieren observación y firma de la wallet del rol, y señalan el expediente como «Requiere atención» en esta sesión. Ninguno modifica el factory ni inicia una transacción on-chain.</p>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-[#9BA6BD]">
                  Wallet autorizada: <strong className="text-white font-mono break-all">{activeRole ? reviewWallets[activeRole] : 'Esta wallet puede consultar, pero no firmar los tres dictámenes.'}</strong>
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void handleExecuteApproval('Corrección solicitada')} disabled={!activeRole||busy}
                    className="px-4 py-2 text-xs font-semibold text-[#D97706] hover:bg-[#D97706]/10 border border-[#D97706]/30 rounded-lg transition-colors cursor-pointer"
                  >
                    Solicitar Corrección
                  </button>

                  <button
                    onClick={() => void handleExecuteApproval('Rechazado')} disabled={!activeRole||busy}
                    className="px-4 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg transition-colors cursor-pointer"
                  >
                    Rechazar
                  </button>

                  <button
                    onClick={() => void handleExecuteApproval('Aprobado')} disabled={!activeRole||busy}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#16A34A]/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Firmar Aprobación</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
