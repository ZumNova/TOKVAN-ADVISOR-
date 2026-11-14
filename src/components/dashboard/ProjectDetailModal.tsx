import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, AlertTriangle, ExternalLink, Cpu, Copy } from 'lucide-react';
import { TokenProject, ProjectDocument } from '../../types';
import { SUPPORTED_NETWORKS } from '../../constants/networks';

interface ProjectDetailModalProps {
  project: TokenProject | null;
  onClose: () => void;
  onNavigateToApprovals?: (project: TokenProject) => void;
  onDownloadDocument?: (project:TokenProject,doc:ProjectDocument)=>void;
  onLoadPrivateContact?:()=>Promise<{contact:TokenProject['contact']|null;taxId:string|null}>;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onNavigateToApprovals,
  onDownloadDocument,
  onLoadPrivateContact,
}) => {
  const [privateContact,setPrivateContact]=React.useState<{projectId:string;contact:TokenProject['contact']|null;taxId:string|null}|null>(null);
  const [privateError,setPrivateError]=React.useState('');
  if (!project) return null;

  const net = SUPPORTED_NETWORKS[project.network] || SUPPORTED_NETWORKS.polygon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#141A27] border border-[#273246] shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9BA6BD] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#273246] cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
            <span>Expediente {project.id}</span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-mono">{project.standard}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9BA6BD]">{net.name}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white font-display mt-1">
            {project.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#9BA6BD] mt-2">
            <span>Organización: <strong className="text-white">{project.organizationName}</strong></span>
            <span>Jurisdicción: <strong className="text-white">{project.jurisdiction}</strong></span>
            <span>Activo: <strong className="text-white">{project.assetType === 'Otro' ? project.assetTypeOther || 'Otro' : project.assetType}</strong></span>
            <span>Estado: <strong className="text-[#7096FF]">{project.status}</strong></span>
          </div>
        </div>

        {project.submissionId&&<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3.5 text-sm text-emerald-100">Solicitud recibida por TOKVANT el {project.receivedAt?new Date(project.receivedAt).toLocaleString('es-AR'):'día de recepción'}. Los datos y adjuntos fueron aportados por el cliente; la revisión técnica, legal y de cumplimiento está pendiente.</div>}
        {onLoadPrivateContact&&<section className="rounded-xl border border-[#39547C] p-4 text-sm"><h3 className="font-semibold">Contacto privado del expediente · solo 047</h3><button className="mt-2 text-[#9BBCFF] underline" onClick={()=>void onLoadPrivateContact().then(data=>{setPrivateContact({projectId:project.id,...data});setPrivateError('');}).catch(e=>setPrivateError(e instanceof Error?e.message:'No se pudo consultar el contacto.'))}>Consultar contacto con firma</button>{privateContact?.projectId===project.id&&<p className="mt-2 break-words">{privateContact.contact?.fullName||'Sin nombre'} · {privateContact.contact?.email||'Sin email'} · {privateContact.contact?.phone||'Sin teléfono'}{privateContact.taxId?` · ID fiscal: ${privateContact.taxId}`:''}</p>}{privateError&&<p role="alert" className="mt-2 text-red-300">{privateError}</p>}</section>}
        {project.standard==='ERC-3643'&&!!project.proposedRecipients?.length&&<section className="rounded-xl border border-[#39547C] p-4 text-sm"><h3 className="font-semibold">Wallets receptoras propuestas · pendientes de acreditación</h3>{project.proposedRecipients.map(row=><p className="break-all font-mono text-xs mt-2" key={row.walletAddress}>{row.walletAddress}</p>)}</section>}

        {/* Simulation Notice */}
        {project.isSimulationOnly && (
          <div className="rounded-xl bg-[#0B0D12] border border-[#316BFA]/30 p-3.5 flex items-center gap-3 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-[#316BFA] shrink-0" />
            <span>
              <strong>Expediente Demostrativo:</strong> Parámetros y auditorías simulados en entorno sandbox. Listo para migración a testnet/mainnet una vez completadas las firmas requeridas.
            </span>
          </div>
        )}

        {/* Contract & Token Parameters Grid */}
        <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-[#273246]">
            Especificaciones del Token Smart Contract
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#9BA6BD] block">Nombre del Token:</span>
              <span className="text-white font-medium">{project.parameters.tokenName}</span>
            </div>
            <div>
              <span className="text-[#9BA6BD] block">Símbolo (Ticker):</span>
              <span className="text-[#7096FF] font-mono font-bold text-sm">{project.parameters.tokenSymbol}</span>
            </div>
            <div>
              <span className="text-[#9BA6BD] block">Suministro Total:</span>
              <span className="text-white font-mono font-bold tabular-nums">
                {project.parameters.initialSupply.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#9BA6BD] block">Decimales:</span>
              <span className="text-white font-mono">{project.parameters.decimals}</span>
            </div>

            <div>
              <span className="text-[#9BA6BD] block">Régimen de Transferencia:</span>
              <span className="text-white font-medium">{project.parameters.transferRestrictions}</span>
            </div>
            <div>
              <span className="text-[#9BA6BD] block">Modelo de Custodia:</span>
              <span className="text-white font-medium">{project.parameters.custodyModel}</span>
            </div>
            <div>
              <span className="text-[#9BA6BD] block">Pausable de Emergencia:</span>
              <span className={project.parameters.isPausable ? 'text-[#16A34A] font-semibold' : 'text-[#9BA6BD]'}>
                {project.parameters.isPausable ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
            <div>
              <span className="text-[#9BA6BD] block">Upgradeability (UUPS):</span>
              <span className={project.parameters.isUpgradeabilityEnabled ? 'text-[#16A34A] font-semibold' : 'text-[#9BA6BD]'}>
                {project.parameters.isUpgradeabilityEnabled ? 'Habilitado' : 'Inmutable'}
              </span>
            </div>
          </div>

          {project.deployedContractAddress && (
            <div className="pt-3 border-t border-[#273246] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#9BA6BD]">Dirección de Contrato Desplegado:</span>
              <div className="flex items-center gap-2 font-mono text-white bg-[#141A27] px-2.5 py-1 rounded border border-[#273246]">
                <span className="truncate max-w-[260px] sm:max-w-none">{project.deployedContractAddress}</span>
                <a
                  href={`${net.blockExplorer}/address/${project.deployedContractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#7096FF] hover:text-white"
                  title="Ver en Block Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Approvals Chain */}
        <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#273246]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Cadena Colegiada de Aprobaciones (Maker-Checker)
            </h3>
            <span className="text-[11px] font-mono text-[#7096FF]">Segregación de Roles Estricta</span>
          </div>

          <div className="space-y-3">
            {project.approvals.map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-[#141A27] border border-[#273246] text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <span className="text-[#7096FF]">{app.role}:</span>
                    <span>{app.label}</span>
                  </div>
                  {app.approverName && (
                    <div className="text-[11px] text-[#9BA6BD] mt-0.5">
                      {app.signerWallet?'Firmado por wallet: ':'Dato de ejemplo: '}{app.approverName} ({app.timestamp})
                    </div>
                  )}
                  {app.comments && (
                    <p className="text-[11px] text-slate-300 italic mt-1">"{app.comments}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                      app.status === 'Aprobado'
                        ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20'
                        : app.status === 'Rechazado'
                        ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                        : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-[#273246]">
            Documentación adjunta · pendiente de revisión
          </h3>

          {project.documents.length === 0 ? (
            <div className="text-xs text-[#9BA6BD] py-2">No hay documentos registrados para este expediente.</div>
          ) : (
            <div className="space-y-2">
              {project.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#141A27] border border-[#273246] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#316BFA]" />
                    <span className="text-white font-medium">{doc.name}</span>
                    <span className="text-[11px] text-[#9BA6BD] font-mono">({doc.fileName} · {doc.fileSize})</span>
                  </div>
                  <div className="flex gap-2 items-center">{doc.storage==='remote'&&onDownloadDocument&&<button onClick={()=>onDownloadDocument(project,doc)} className="text-[#9BBCFF] underline">Descargar privado</button>}<span className="text-[10px] text-[#16A34A] font-semibold">{doc.status}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#273246]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#9BA6BD] hover:text-white rounded-lg border border-[#273246] hover:bg-[#273246] transition-colors cursor-pointer"
          >
            Cerrar Expediente
          </button>

          {onNavigateToApprovals && (
            <button
              onClick={() => {
                onClose();
                onNavigateToApprovals(project);
              }}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Gestionar Aprobaciones Colegiadas
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
