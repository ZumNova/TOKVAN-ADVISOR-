import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  ExternalLink, 
  Layers, 
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { TokenProject, ProjectStatus, StandardType } from '../../types';
import { SUPPORTED_NETWORKS } from '../../constants/networks';

interface ProjectsListProps {
  projects: TokenProject[];
  onSelectProject: (project: TokenProject) => void;
  onCreateNew: () => void;
  onNavigateToApprovals: (project: TokenProject) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  onSelectProject,
  onCreateNew,
  onNavigateToApprovals,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [standardFilter, setStandardFilter] = useState<string>('all');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.parameters.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${p.assetType} ${p.assetTypeOther || ''}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (p.status === 'Listo para despliegue' || p.status === 'En revisión' || p.status === 'En configuración')) ||
      (statusFilter === 'deployed' && p.status === 'Desplegado') ||
      (statusFilter === 'draft' && (p.status === 'Borrador' || p.status === 'Preliminar'));

    const matchesStandard = standardFilter === 'all' || p.standard === standardFilter;

    return matchesSearch && matchesStatus && matchesStandard;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
            <span>Portafolio de Activos Tokenizados</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9BA6BD]">Datos de Demostración Verificados</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
            Expedientes y Contratos de la Organización
          </h2>
        </div>

        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Expediente de Tokenización</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-[#141A27] border border-[#273246]">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9BA6BD] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ID (TOKVAN-PY-...), activo, título o ticker..."
            className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] pl-9 pr-4 py-2 text-xs text-white placeholder-[#9BA6BD]/60 focus:outline-none focus:border-[#316BFA]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#0B0D12] rounded-lg border border-[#273246]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#141A27] text-white shadow-sm font-semibold' : 'text-[#9BA6BD] hover:text-white'
              }`}
            >
              Todos ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'active' ? 'bg-[#141A27] text-white shadow-sm font-semibold' : 'text-[#9BA6BD] hover:text-white'
              }`}
            >
              En Curso
            </button>
            <button
              onClick={() => setStatusFilter('deployed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'deployed' ? 'bg-[#141A27] text-white shadow-sm font-semibold' : 'text-[#9BA6BD] hover:text-white'
              }`}
            >
              Desplegados
            </button>
          </div>

          <select
            value={standardFilter}
            onChange={(e) => setStandardFilter(e.target.value)}
            className="rounded-lg bg-[#0B0D12] border border-[#273246] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#316BFA]"
          >
            <option value="all">Todos los Estándares</option>
            <option value="ERC-3643">ERC-3643 (RWA)</option>
            <option value="ERC-20">ERC-20 (Fungible)</option>
            <option value="ERC-721">ERC-721 (NFT)</option>
            <option value="ERC-1155">ERC-1155 (Multi-Tramo)</option>
          </select>
        </div>

      </div>

      {/* Projects Table */}
      <div className="rounded-xl bg-[#141A27] border border-[#273246] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#273246] bg-[#0B0D12]/70 text-[#9BA6BD]">
                <th className="py-3.5 px-4 font-semibold">Identificador & Proyecto</th>
                <th className="py-3.5 px-4 font-semibold">Estándar / Red</th>
                <th className="py-3.5 px-4 font-semibold">Activo / Valuación</th>
                <th className="py-3.5 px-4 font-semibold">Estado de Avance</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#273246] text-slate-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9BA6BD]">
                    No se encontraron expedientes con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const net = SUPPORTED_NETWORKS[p.network] || SUPPORTED_NETWORKS.polygon;
                  return (
                    <tr 
                      key={p.id}
                      className="hover:bg-[#1B2335]/60 transition-colors group"
                    >
                      {/* ID and Title */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-[#316BFA] shrink-0 mt-0.5" />
                          <div>
                            <button
                              onClick={() => onSelectProject(p)}
                              className="font-bold text-white hover:text-[#7096FF] transition-colors text-left cursor-pointer text-sm font-display block"
                            >
                              {p.title}
                            </button>
                            <div className="flex items-center gap-2 text-[11px] text-[#9BA6BD] font-mono mt-0.5">
                              <span>{p.id}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#7096FF] font-semibold">{p.parameters.tokenSymbol}</span>
                              <span aria-hidden="true">·</span>
                              <span>{p.createdAt}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Standard and Network */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white">{p.standard}</div>
                        <div className="text-[11px] text-[#9BA6BD] flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#316BFA]" />
                          <span>{net.name}</span>
                        </div>
                      </td>

                      {/* Asset & Valuation */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-medium text-white">{p.assetType === 'Otro' ? p.assetTypeOther || 'Otro' : p.assetType}</div>
                        <div className="text-[11px] text-[#9BA6BD] font-mono tabular-nums mt-0.5">
                          ${p.targetValuationUsd.toLocaleString()} USD
                        </div>
                      </td>

                      {/* Progress & Status */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                              p.status === 'Desplegado'
                                ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20'
                                : p.status === 'Listo para despliegue'
                                ? 'bg-[#316BFA]/10 text-[#7096FF] border border-[#316BFA]/30'
                                : p.status === 'En revisión'
                                ? 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/30'
                                : 'bg-[#273246] text-[#9BA6BD]'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-28 h-1.5 rounded-full bg-[#0B0D12] overflow-hidden mt-1.5 border border-[#273246]/60">
                          <div
                            className="h-full bg-[#316BFA]"
                            style={{ width: `${p.progressPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectProject(p)}
                            className="px-2.5 py-1 text-xs text-[#9BA6BD] hover:text-white rounded border border-[#273246] hover:bg-[#0B0D12] transition-colors cursor-pointer"
                          >
                            Inspeccionar
                          </button>
                          <button
                            onClick={() => onNavigateToApprovals(p)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded transition-colors cursor-pointer shadow-sm"
                          >
                            Firmas
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
