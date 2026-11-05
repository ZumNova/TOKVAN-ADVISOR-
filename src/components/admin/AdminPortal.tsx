import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Layers, 
  ShieldAlert, 
  Server, 
  FileCheck, 
  Cpu, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Code2,
  Lock
} from 'lucide-react';
import { OrganizationTenant, LeadSubmission, ContractTemplate } from '../../types';
import { AUDITED_TEMPLATES } from '../../constants/templates';
import { SUPPORTED_NETWORKS } from '../../constants/networks';

interface AdminPortalProps {
  organizations: OrganizationTenant[];
  leads: LeadSubmission[];
  onNavigate: (view: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  organizations,
  leads,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'templates' | 'organizations' | 'networks' | 'security'>('leads');
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(AUDITED_TEMPLATES[0]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#273246]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
            <Lock className="w-4 h-4" />
            <span>TOKVAN Backoffice & Compliance Console</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9BA6BD]">Supervisión Administrativa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
            Panel de Operaciones, Plantillas y Clientes Institucionales
          </h1>
          <p className="text-xs text-[#9BA6BD] mt-1">
            Gestión interna de organizaciones emisoras, pipeline de estructuración, control de versiones de smart contracts y observabilidad de redes EVM.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1 bg-[#141A27] border border-[#273246] rounded-md text-slate-300 self-start sm:self-auto">
          Mesa de Revisión TOKVAN: En Línea
        </span>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-[#141A27] border border-[#273246] rounded-xl text-xs font-medium">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'leads' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          Pipeline de Leads ({leads.length})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'templates' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          Contract Template Registry ({AUDITED_TEMPLATES.length})
        </button>

        <button
          onClick={() => setActiveTab('organizations')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'organizations' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          Organizaciones Clientes ({organizations.length})
        </button>

        <button
          onClick={() => setActiveTab('networks')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'networks' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          Redes EVM & RPCs
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'security' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          Auditoría & Zero-Trust
        </button>
      </div>

      {/* TAB 1: LEADS PIPELINE */}
      {activeTab === 'leads' && (
        <div className="rounded-xl bg-[#141A27] border border-[#273246] overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Solicitudes de Tokenización Entrantes
              </h2>
              <p className="text-xs text-[#9BA6BD] mt-0.5">
                Leads capturados desde el portal institucional listos para diagnóstico técnico.
              </p>
            </div>
            <span className="text-xs font-mono text-[#7096FF]">3 expedientes en seguimiento</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#273246] bg-[#0B0D12]/70 text-[#9BA6BD]">
                  <th className="py-3 px-4 font-semibold">Código / Solicitante</th>
                  <th className="py-3 px-4 font-semibold">Organización & Sector</th>
                  <th className="py-3 px-4 font-semibold">Volumen Estimado</th>
                  <th className="py-3 px-4 font-semibold">Asesor Asignado</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#273246] text-slate-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#1B2335]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">{lead.id}</div>
                      <div className="text-[11px] text-[#9BA6BD]">{lead.fullName}</div>
                      <div className="text-[10px] text-[#7096FF]">{lead.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{lead.companyName}</div>
                      <div className="text-[11px] text-[#9BA6BD]">{lead.assetSector} ({lead.country})</div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-white">
                      {lead.estimatedVolume}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#9BA6BD]">
                      {lead.assignedAdvisor || 'Mesa General'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#316BFA]/10 text-[#7096FF] border border-[#316BFA]/20">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate('wizard')}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded transition-colors cursor-pointer"
                      >
                        Convertir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CONTRACT TEMPLATE REGISTRY */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-5 rounded-2xl bg-[#141A27] border border-[#273246] p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-[#273246]">
              Plantillas Inmutables Certificadas
            </h2>

            <div className="space-y-2">
              {AUDITED_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTemplate?.id === tmpl.id
                      ? 'border-[#316BFA] bg-[#316BFA]/10 text-white'
                      : 'border-[#273246] bg-[#0B0D12] text-[#9BA6BD] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-white">{tmpl.standard} v{tmpl.version}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tmpl.status === 'Certified'
                          ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20'
                          : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'
                      }`}
                    >
                      {tmpl.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">{tmpl.name}</div>
                  <div className="text-[10px] text-[#9BA6BD] font-mono mt-0.5 truncate">
                    Auditoría: {tmpl.auditFirm} ({tmpl.auditDate})
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Details */}
          {selectedTemplate && (
            <div className="lg:col-span-7 rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#273246]">
                <div>
                  <div className="text-xs font-mono text-[#7096FF]">ID: {selectedTemplate.id}</div>
                  <h3 className="text-lg font-bold text-white font-display mt-0.5">
                    {selectedTemplate.name}
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#16A34A] px-2.5 py-1 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-md">
                  {selectedTemplate.status}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#9BA6BD] block font-semibold">Descripción del Módulo:</span>
                  <p className="text-slate-200 mt-1 leading-relaxed">{selectedTemplate.description}</p>
                </div>

                <div className="p-3 rounded-lg bg-[#0B0D12] border border-[#273246] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9BA6BD] font-semibold">Checksum SHA-256 (Bytecode Inmutable):</span>
                    <span className="text-[#16A34A] font-semibold">Integridad Verificada</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#7096FF] break-all bg-[#141A27] p-2 rounded border border-[#273246]">
                    {selectedTemplate.bytecodeHash}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#9BA6BD] block">Compilador Solidity:</span>
                    <span className="text-white font-mono">{selectedTemplate.compiler}</span>
                  </div>
                  <div>
                    <span className="text-[#9BA6BD] block">Firma Auditora:</span>
                    <span className="text-white font-medium">{selectedTemplate.auditFirm}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#9BA6BD] block font-semibold mb-1">Riesgos Conocidos y Reglas Operativas:</span>
                  <ul className="space-y-1">
                    {selectedTemplate.knownRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <span className="text-[#D97706]">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: ORGANIZATIONS */}
      {activeTab === 'organizations' && (
        <div className="rounded-xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display">
            Directorio de Organizaciones Clientes (Multi-Tenant)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#7096FF] font-bold">{org.id}</span>
                  <span className="text-[#16A34A] text-[10px] font-semibold px-2 py-0.5 rounded bg-[#16A34A]/10">
                    KYB {org.kybStatus}
                  </span>
                </div>
                <div className="font-bold text-white text-sm">{org.legalName}</div>
                <div className="text-[11px] text-[#9BA6BD]">RUC: {org.taxId}</div>
                <div className="pt-2 border-t border-[#273246] flex items-center justify-between text-[11px] text-[#9BA6BD]">
                  <span>{org.activeProjectsCount} Proyectos Activos</span>
                  <span>{org.deployedContractsCount} Desplegados</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NETWORKS & RPC */}
      {activeTab === 'networks' && (
        <div className="rounded-xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display">
            Estado de Nodos RPC y Redes EVM
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(SUPPORTED_NETWORKS).map((net) => (
              <div key={net.id} className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{net.name}</span>
                  <span className="text-[#16A34A] text-[10px] font-semibold">Nominal</span>
                </div>
                <div className="text-[11px] text-[#9BA6BD] font-mono">Chain ID: {net.chainId}</div>
                <div className="text-[11px] text-[#7096FF] font-mono truncate">{net.rpcUrl}</div>
                <div className="pt-2 border-t border-[#273246] text-[11px] text-[#9BA6BD] flex justify-between">
                  <span>Bloque: {net.avgBlockTimeSeconds}s</span>
                  <span>Gas: {net.avgGasPriceGwei} Gwei</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ZERO TRUST SECURITY */}
      {activeTab === 'security' && (
        <div className="rounded-xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display">
            Matriz de Seguridad Zero-Trust y Auditoría de Acceso
          </h2>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-[#0B0D12] border border-[#273246] flex items-center justify-between">
              <span>Aislamiento de Tenant en Base de Datos (Row Level Security activo)</span>
              <span className="text-[#16A34A] font-semibold">Cumple</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0D12] border border-[#273246] flex items-center justify-between">
              <span>Segregación Maker-Checker (Bloqueo de auto-aprobaciones)</span>
              <span className="text-[#16A34A] font-semibold">Cumple</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0D12] border border-[#273246] flex items-center justify-between">
              <span>Firewall Lógico Pre-Deploy (Verificación de hash SHA-256)</span>
              <span className="text-[#16A34A] font-semibold">Cumple</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0D12] border border-[#273246] flex items-center justify-between">
              <span>Gestión de Claves: Sin seed phrases en navegador ni base de datos</span>
              <span className="text-[#16A34A] font-semibold">Cumple</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
