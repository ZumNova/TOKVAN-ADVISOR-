import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Code2, 
  Scale, 
  Cpu, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import { TOKEN_STANDARDS } from '../../constants/standards';
import { StandardType } from '../../types';

interface StandardsCatalogViewProps {
  onNavigateToSimulator: () => void;
  onNavigateToWizardWithStandard?: (std: StandardType) => void;
}

export const StandardsCatalogView: React.FC<StandardsCatalogViewProps> = ({
  onNavigateToSimulator,
  onNavigateToWizardWithStandard,
}) => {
  const [selectedStandard, setSelectedStandard] = useState<StandardType>('ERC-3643');
  const profile = TOKEN_STANDARDS[selectedStandard];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#273246]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
            <BookOpen className="w-4 h-4" />
            <span>Biblioteca Técnica de Estándares EVM</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9BA6BD]">Marco Normativo & Arquitectura</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
            Catálogo Institucional de Smart Contracts para Tokenización
          </h1>
          <p className="text-xs text-[#9BA6BD] mt-1">
            Análisis exhaustivo de interfaces, invariantes de seguridad y consideraciones regulatorias de cada estándar contractual soportado en TOKVAN.
          </p>
        </div>

        <button
          onClick={onNavigateToSimulator}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Cpu className="w-4 h-4 text-[#7096FF]" />
          <span>Abrir Simulador EVM</span>
        </button>
      </div>

      {/* Standard Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['ERC-3643', 'ERC-20', 'ERC-721', 'ERC-1155'] as StandardType[]).map((code) => {
          const item = TOKEN_STANDARDS[code];
          return (
            <button
              key={code}
              onClick={() => setSelectedStandard(code)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedStandard === code
                  ? 'border-[#316BFA] bg-[#141A27] shadow-lg shadow-[#316BFA]/10 ring-1 ring-[#316BFA]'
                  : 'border-[#273246] bg-[#0B0D12] text-[#9BA6BD] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-white">{code}</span>
                {item.isRwaSpecialized && (
                  <span className="text-[10px] font-semibold text-[#7096FF] px-2 py-0.5 rounded bg-[#316BFA]/20">
                    RWA Native
                  </span>
                )}
              </div>
              <div className="text-xs font-medium text-slate-300 mt-1 truncate">{item.title}</div>
              <div className="text-[11px] text-[#9BA6BD] mt-2 line-clamp-2">{item.tagline}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Standard In-Depth Specification */}
      <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 sm:p-8 space-y-6">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#273246]">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono text-white">{profile.code}</span>
              <span className="text-sm font-semibold text-[#7096FF]">— {profile.title}</span>
            </div>
            <p className="text-sm text-slate-300 mt-1">{profile.tagline}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9BA6BD]">Cumplimiento:</span>
            <span className="text-xs font-bold text-white px-3 py-1 bg-[#0B0D12] border border-[#273246] rounded-md">
              {profile.complianceLevel}
            </span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Description & Use Cases */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Arquitectura y Fundamento Técnico
              </h3>
              <p className="text-xs sm:text-sm text-[#9BA6BD] leading-relaxed">
                {profile.description}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Componentes de la Arquitectura
              </h3>
              <div className="space-y-2">
                {profile.architecturalComponents.map((comp, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#0B0D12] border border-[#273246] text-xs text-slate-200 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#316BFA] shrink-0 mt-1.5" />
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Casos de Uso Empresariales Recomendados
              </h3>
              <ul className="space-y-2">
                {profile.primaryUseCases.map((useCase, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Code Methods & Regulatory Notes */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Solidity Methods Preview */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#7096FF]" />
                <span>Interfaces Contractuales Clave (Solidity)</span>
              </h3>
              <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] font-mono text-[11px] text-[#7096FF] space-y-1.5 overflow-x-auto leading-relaxed">
                {profile.smartContractMethods.map((m, idx) => (
                  <div key={idx} className="text-slate-300">
                    <span className="text-[#316BFA]">{m.split('(')[0]}</span>
                    <span>({m.split('(')[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory Considerations */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#D97706]" />
                <span>Consideraciones Regulatorias y Cumplimiento</span>
              </h3>
              <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] text-xs text-[#9BA6BD] leading-relaxed">
                {profile.regulatoryConsiderations}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <button
                onClick={onNavigateToSimulator}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <span>Simular Emisión con {profile.code}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
