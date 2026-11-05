import React from 'react';
import { 
  Building2, 
  Coins, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { TokenProject, OrganizationTenant } from '../../types';
import { SUPPORTED_NETWORKS } from '../../constants/networks';

interface DashboardOverviewProps {
  organization: OrganizationTenant;
  projects: TokenProject[];
  onNavigate: (view: string) => void;
  onSelectProject: (project: TokenProject) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  organization,
  projects,
  onNavigate,
  onSelectProject,
}) => {
  // Aggregate stats
  const activeProjects = projects.filter((p) => p.status !== 'Desplegado' && p.status !== 'Archivado');
  const deployedProjects = projects.filter((p) => p.status === 'Desplegado');
  const totalValuationUsd = projects.reduce((acc, p) => acc + p.targetValuationUsd, 0);
  const pendingApprovalsCount = projects.reduce(
    (acc, p) => acc + p.approvals.filter((a) => a.status === 'Pendiente').length,
    0
  );

  return (
    <div className="space-y-8">
      
      {/* Top Banner with Org Context & Demonstrative Tag */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#141A27] border border-[#273246]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
            <Building2 className="w-4 h-4" />
            <span>Organización Activa: {organization.legalName}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9BA6BD]">Tenant ID: {organization.id}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-1">
            Panel Ejecutivo de Activos Digitales y Gobernanza EVM
          </h1>
          <p className="text-xs text-[#9BA6BD] mt-1">
            Supervisión institucional de contratos, valuaciones periciales y aprobaciones colegiadas bajo legislación paraguaya e internacional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('wizard')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Expediente</span>
          </button>

          <button
            onClick={() => onNavigate('simulator')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0B0D12] hover:bg-[#1B2335] border border-[#273246] rounded-lg transition-colors cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-[#7096FF]" />
            <span>Simulador EVM</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Projects */}
        <div className="rounded-xl bg-[#141A27] border border-[#273246] p-5 space-y-1">
          <div className="flex items-center justify-between text-[#9BA6BD]">
            <span className="text-xs font-semibold uppercase tracking-wider">Expedientes Activos</span>
            <Layers className="w-4 h-4 text-[#316BFA]" />
          </div>
          <div className="font-mono text-2xl font-bold text-white tabular-nums pt-1">
            {activeProjects.length}
          </div>
          <div className="text-[11px] text-[#9BA6BD]">
            En estructuración, simulación y revisión
          </div>
        </div>

        {/* KPI 2: Total Valuation */}
        <div className="rounded-xl bg-[#141A27] border border-[#273246] p-5 space-y-1">
          <div className="flex items-center justify-between text-[#9BA6BD]">
            <span className="text-xs font-semibold uppercase tracking-wider">Valuación en Cartera</span>
            <Coins className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="font-mono text-2xl font-bold text-white tabular-nums pt-1">
            ${(totalValuationUsd / 1000000).toFixed(1)}M USD
          </div>
          <div className="text-[11px] text-[#9BA6BD]">
            Activos respaldados por escrituras y peritajes
          </div>
        </div>

        {/* KPI 3: Deployed Contracts */}
        <div className="rounded-xl bg-[#141A27] border border-[#273246] p-5 space-y-1">
          <div className="flex items-center justify-between text-[#9BA6BD]">
            <span className="text-xs font-semibold uppercase tracking-wider">Contratos Desplegados</span>
            <ShieldCheck className="w-4 h-4 text-[#7096FF]" />
          </div>
          <div className="font-mono text-2xl font-bold text-white tabular-nums pt-1">
            {deployedProjects.length}
          </div>
          <div className="text-[11px] text-[#9BA6BD]">
            Auditados en Polygon & Arbitrum
          </div>
        </div>

        {/* KPI 4: Pending Approvals */}
        <div className="rounded-xl bg-[#141A27] border border-[#273246] p-5 space-y-1">
          <div className="flex items-center justify-between text-[#9BA6BD]">
            <span className="text-xs font-semibold uppercase tracking-wider">Firmas Pendientes</span>
            <FileCheck2 className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#D97706] tabular-nums pt-1">
            {pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-[#9BA6BD]">
            Requiere acción de la mesa de revisión
          </div>
        </div>

      </div>

      {/* Main Grid: Projects in progress & Risk Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Priority Projects */}
        <div className="lg:col-span-8 rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#273246]">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Expedientes con Mayor Prioridad Operativa
              </h2>
              <span className="text-xs text-[#9BA6BD]">Avance de estructuración y estado de revisión colegiada</span>
            </div>

            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-[#7096FF] hover:text-white transition-colors cursor-pointer"
            >
              Ver todos ({projects.length}) &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => {
              const net = SUPPORTED_NETWORKS[project.network] || SUPPORTED_NETWORKS.polygon;
              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] hover:border-[#316BFA] transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#7096FF]">{project.id}</span>
                        <span aria-hidden="true" className="text-[#273246]">·</span>
                        <span className="font-mono text-xs font-semibold text-white">{project.parameters.tokenSymbol}</span>
                        <span aria-hidden="true" className="text-[#273246]">·</span>
                        <span className="text-xs text-[#9BA6BD]">{project.standard}</span>
                      </div>
                      <h3 className="font-bold text-white text-sm group-hover:text-[#7096FF] transition-colors mt-0.5">
                        {project.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          project.status === 'Desplegado'
                            ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20'
                            : project.status === 'Listo para despliegue'
                            ? 'bg-[#316BFA]/10 text-[#7096FF] border border-[#316BFA]/30'
                            : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/30'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Quick stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#273246]/60 text-xs">
                    <div>
                      <span className="text-[11px] text-[#9BA6BD] block">Valuación:</span>
                      <span className="text-white font-mono tabular-nums font-medium">
                        ${project.targetValuationUsd.toLocaleString()} USD
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#9BA6BD] block">Red Destino:</span>
                      <span className="text-white font-medium">{net.name}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#9BA6BD] block">Seguridad Pre-Flight:</span>
                      <span className="text-[#16A34A] font-semibold">{project.securityScore} / 100</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#9BA6BD] block">Avance de Flujo:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-full h-1.5 rounded-full bg-[#141A27] overflow-hidden border border-[#273246]">
                          <div
                            className="h-full bg-[#316BFA]"
                            style={{ width: `${project.progressPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-white tabular-nums">{project.progressPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Security Alerts & Compliance Watchlist */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Compliance & Approvals Radar */}
          <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#273246]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Gobernanza & Firmas
              </h3>
              <span className="text-xs text-[#D97706] font-semibold">3 Firmas Pendientes</span>
            </div>

            <p className="text-xs text-[#9BA6BD]">
              El motor de aprobación exige que ningún contrato toque la blockchain sin la firma de los 3 revisores independientes:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B0D12] border border-[#273246]">
                <span className="text-slate-300">1. Revisor Técnico (Bytecode)</span>
                <span className="text-[#16A34A] font-semibold text-[11px]">Verificado</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B0D12] border border-[#273246]">
                <span className="text-slate-300">2. Oficial Compliance (KYC/AML)</span>
                <span className="text-[#D97706] font-semibold text-[11px]">1 Pendiente</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B0D12] border border-[#273246]">
                <span className="text-slate-300">3. Directorio Emisor (Poder Legal)</span>
                <span className="text-[#D97706] font-semibold text-[11px]">2 Pendientes</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('approvals')}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer"
            >
              <span>Abrir Consola de Aprobaciones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zero-Trust Security Sentinel */}
          <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#16A34A]">
              <ShieldCheck className="w-4 h-4" />
              <span>Firewall Lógico Pre-Deploy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Estado del sistema: Todos los artefactos coinciden con las plantillas auditadas por ConsenSys y Trail of Bits registradas en el Registry SHA-256.
            </p>
            <div className="pt-2 text-[11px] text-[#9BA6BD] font-mono">
              Última verificación de integridad: Hoy 07:30 UTC
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
