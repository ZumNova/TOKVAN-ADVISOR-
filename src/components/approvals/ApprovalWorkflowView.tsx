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
import { TokenProject, ApprovalStep, UserRole } from '../../types';

interface ApprovalWorkflowViewProps {
  projects: TokenProject[];
  onUpdateApproval: (projectId: string, stepId: string, status: 'Aprobado' | 'Rechazado' | 'Corrección solicitada', comments: string) => void;
  onNavigate: (view: string) => void;
}

export const ApprovalWorkflowView: React.FC<ApprovalWorkflowViewProps> = ({
  projects,
  onUpdateApproval,
  onNavigate,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [simulatedRole, setSimulatedRole] = useState<'Technical Reviewer' | 'Compliance Reviewer' | 'Enterprise Board'>('Compliance Reviewer');
  const [reviewerName, setReviewerName] = useState('Dra. María Elena Duarte (CCO)');
  const [commentsInput, setCommentsInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleRoleChange = (role: 'Technical Reviewer' | 'Compliance Reviewer' | 'Enterprise Board') => {
    setSimulatedRole(role);
    if (role === 'Technical Reviewer') setReviewerName('Ing. Carlos Benítez (Lead Auditor)');
    else if (role === 'Compliance Reviewer') setReviewerName('Dra. María Elena Duarte (CCO)');
    else setReviewerName('Lic. Rodrigo Zaldívar (Director Financiero)');
  };

  const handleExecuteApproval = (status: 'Aprobado' | 'Rechazado' | 'Corrección solicitada') => {
    if (!activeProject) return;

    // Find the step corresponding to current role
    const step = activeProject.approvals.find((s) => s.role === simulatedRole);
    if (!step) return;

    const comments = commentsInput || (status === 'Aprobado' ? 'Aprobado conforme a especificaciones normativas y de seguridad.' : 'Requiere revisión.');
    onUpdateApproval(activeProject.id, step.id, status, comments);

    setActionSuccessMessage(`Decisión registrada: ${simulatedRole} marcó '${status}' en el expediente.`);
    setCommentsInput('');
    setTimeout(() => setActionSuccessMessage(null), 4000);
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
            Ningún contrato puede desplegarse en testnet ni mainnet sin el consenso y firma criptográfica de los tres roles independientes.
          </p>
        </div>

        {/* Role Switcher for demonstration testing */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#141A27] border border-[#273246] self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-[#9BA6BD] px-2">Rol Activo:</span>
          {(['Technical Reviewer', 'Compliance Reviewer', 'Enterprise Board'] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                simulatedRole === r
                  ? 'bg-[#316BFA] text-white shadow-sm'
                  : 'text-[#9BA6BD] hover:text-white hover:bg-[#273246]'
              }`}
            >
              {r === 'Technical Reviewer' ? 'Técnico' : r === 'Compliance Reviewer' ? 'Compliance' : 'Directorio'}
            </button>
          ))}
        </div>
      </div>

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
            {projects.map((p) => {
              const pendingCount = p.approvals.filter((a) => a.status === 'Pendiente').length;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
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
                      {pendingCount === 0 ? 'Completado' : `${pendingCount} Pendiente(s)`}
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

            {/* Approval Steps Progression */}
            <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 pb-2 border-b border-[#273246]">
                Circuito de 3 Pasos con Segregación de Funciones
              </h3>

              <div className="space-y-4">
                {activeProject.approvals.map((step, idx) => {
                  const isCurrentSimulatedRole = step.role === simulatedRole;
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
                            {idx + 1}
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
                            <span>Firmado por: </span>
                            <strong className="text-white">{step.approverName}</strong>
                            <span className="text-[10px] ml-2 font-mono">({step.timestamp})</span>
                          </div>
                          {step.signatureHash && (
                            <div className="font-mono text-[10px] text-[#7096FF]">
                              Firma: {step.signatureHash}
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
                <span>Emisión de Dictamen como {simulatedRole}</span>
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-[#9BA6BD]">
                  Firmante activo: <strong className="text-white">{reviewerName}</strong>
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExecuteApproval('Corrección solicitada')}
                    className="px-4 py-2 text-xs font-semibold text-[#D97706] hover:bg-[#D97706]/10 border border-[#D97706]/30 rounded-lg transition-colors cursor-pointer"
                  >
                    Solicitar Corrección
                  </button>

                  <button
                    onClick={() => handleExecuteApproval('Rechazado')}
                    className="px-4 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg transition-colors cursor-pointer"
                  >
                    Rechazar
                  </button>

                  <button
                    onClick={() => handleExecuteApproval('Aprobado')}
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
