import React from 'react';
import { TokvanLogo } from '../brand/TokvanLogo';
import { Sparkles, Building2, ShieldAlert } from 'lucide-react';
import { OrganizationTenant } from '../../types';

interface TopBarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activeOrg: OrganizationTenant;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  activeOrg,
  onToggleAiDrawer,
  isAiDrawerOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#273246] bg-[#0B0D12]/90 backdrop-blur-md">
      {/* Strict 3-zone Top Bar Contract */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single Brand Wordmark Element */}
        <button
          onClick={() => onNavigate('landing')}
          className="text-left cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#316BFA]"
          aria-label="TOKVAN Consultoría y Tokenización - Inicio"
        >
          <TokvanLogo size="md" variant="standard" />
        </button>

        {/* Zone 2: 4–5 concise, single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9BA6BD]">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 hover:text-white cursor-pointer ${
              currentView === 'landing' ? 'text-white border-b-2 border-[#316BFA] font-semibold' : ''
            }`}
          >
            Portal Institucional
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 hover:text-white cursor-pointer ${
              currentView.startsWith('dashboard') || currentView === 'projects' || currentView === 'approvals'
                ? 'text-white border-b-2 border-[#316BFA] font-semibold'
                : ''
            }`}
          >
            Dashboard Empresa
          </button>

          <button
            onClick={() => onNavigate('simulator')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 hover:text-white cursor-pointer ${
              currentView === 'simulator' ? 'text-white border-b-2 border-[#316BFA] font-semibold' : ''
            }`}
          >
            Simulador EVM
          </button>

          <button
            onClick={() => onNavigate('standards')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 hover:text-white cursor-pointer ${
              currentView === 'standards' ? 'text-white border-b-2 border-[#316BFA] font-semibold' : ''
            }`}
          >
            Catálogo Estándares
          </button>

          <button
            onClick={() => onNavigate('admin')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 hover:text-white cursor-pointer ${
              currentView === 'admin' ? 'text-white border-b-2 border-[#316BFA] font-semibold' : ''
            }`}
          >
            Panel TOKVAN Admin
          </button>

          <button
            onClick={() => onNavigate('architecture')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 hover:text-white cursor-pointer ${
              currentView === 'architecture' ? 'text-white border-b-2 border-[#316BFA] font-semibold' : ''
            }`}
          >
            Arquitectura & ADRs
          </button>
        </nav>

        {/* Zone 3: 1 primary action / Context Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* AI Advisor Button */}
          <button
            onClick={onToggleAiDrawer}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isAiDrawerOpen
                ? 'bg-[#316BFA] text-white shadow-lg shadow-[#316BFA]/20'
                : 'bg-[#141A27] text-[#9BA6BD] hover:text-white border border-[#273246] hover:border-[#316BFA]'
            }`}
            title="Asistente Educativo & TOKVAN Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7096FF]" />
            <span className="hidden sm:inline">TOKVAN AI</span>
          </button>

          {/* Primary CTA: Launch wizard or go to dashboard */}
          {currentView === 'landing' ? (
            <button
              onClick={() => onNavigate('wizard')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors shadow-sm shadow-[#316BFA]/30 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Explorar Tokenización
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-[#141A27] border border-[#273246] text-[#9BA6BD]">
                <Building2 className="w-3.5 h-3.5 text-[#316BFA]" />
                <span className="text-slate-200 font-medium truncate max-w-[140px]">{activeOrg.legalName}</span>
              </div>
              <button
                onClick={() => onNavigate('wizard')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                + Nuevo Proyecto
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
