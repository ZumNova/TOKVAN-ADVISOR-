
import React, { useState } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Building2,
} from 'lucide-react';

import { TokvanLogo } from '../brand/TokvanLogo';
import { OrganizationTenant } from '../../types';

interface TopBarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activeOrg: OrganizationTenant;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
}

const publicLinks = [
  { label: 'Solución', id: 'solucion' },
  { label: 'Casos de uso', id: 'casos' },
  { label: 'Distribución', id: 'distribucion' },
  { label: 'Cómo funciona', id: 'proceso' },
  { label: 'Tecnología', id: 'tecnologia' },
  { label: 'Equipo', id: 'equipo' },
  { label: 'Contacto', id: 'contacto' },
];

const internalLinks = [
  { label: 'Dashboard Empresa', view: 'dashboard' },
  { label: 'Simulador EVM', view: 'simulator' },
  { label: 'Catálogo Estándares', view: 'standards' },
  { label: 'Wizard de proyectos', view: 'wizard' },
  { label: 'Factories', view: 'factory' },
  { label: 'Expedientes', view: 'projects' },
  { label: 'Aprobaciones', view: 'approvals' },
  { label: 'Panel TOKVAN Admin', view: 'admin' },
  { label: 'Arquitectura & ADRs', view: 'architecture' },
];

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  activeOrg,
  onToggleAiDrawer,
  isAiDrawerOpen,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);

  const isPublic = currentView === 'landing';

  const navigate = (view: string) => {
    setMobileOpen(false);
    setModulesOpen(false);
    onNavigate(view);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const scrollToSection = (id: string) => {
    setMobileOpen(false);

    const element = document.getElementById(id);

    if (element) {
      const headerHeight = 90;
      const top =
        element.getBoundingClientRect().top +
        window.scrollY -
        headerHeight;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth',
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2B3E5D] bg-[#080D17]/95 backdrop-blur-xl">

      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">

        {/* LOGO */}
        <button
          type="button"
          onClick={() => navigate('landing')}
          className="shrink-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-[#6CE1E8]"
          aria-label="TOKVANT - Ir al inicio"
        >
          <TokvanLogo size="md" variant="standard" />
        </button>

        {/* NAVEGACIÓN COMERCIAL */}
        {isPublic && (
          <nav
            className="hidden min-w-0 items-center gap-4 xl:flex"
            aria-label="Navegación comercial"
          >
            {publicLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="shrink-0 cursor-pointer whitespace-nowrap text-xs font-medium text-[#B8C9E1] transition-colors hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}

        {/* NAVEGACIÓN DE PLATAFORMA */}
        {!isPublic && (
          <div className="hidden min-w-0 items-center gap-4 md:flex">

            <button
              type="button"
              onClick={() => navigate('landing')}
              className="whitespace-nowrap text-xs text-[#AABBD4] hover:text-white"
            >
              Portal comercial
            </button>

            <button
              type="button"
              onClick={() => navigate('dashboard')}
              className="whitespace-nowrap text-xs font-semibold text-white"
            >
              Dashboard
            </button>

            <div className="relative">

              <button
                type="button"
                onClick={() => setModulesOpen(!modulesOpen)}
                aria-expanded={modulesOpen}
                aria-controls="tokvant-modules"
                className="flex items-center gap-2 rounded-lg border border-[#39547C] px-3 py-2 text-xs text-[#D1E2FC]"
              >
                Módulos
                <ChevronDown size={14} />
              </button>

              {modulesOpen && (
                <nav
                  id="tokvant-modules"
                  aria-label="Módulos de la plataforma"
                  className="absolute left-0 top-full z-50 mt-3 w-64 rounded-xl border border-[#39547C] bg-[#101A2A] p-2 shadow-2xl"
                >
                  {internalLinks.map((link) => (
                    <button
                      key={link.view}
                      type="button"
                      onClick={() => navigate(link.view)}
                      aria-current={
                        currentView === link.view
                          ? 'page'
                          : undefined
                      }
                      className="block w-full rounded-lg px-4 py-3 text-left text-sm text-[#D1E2FC] hover:bg-[#203A69] hover:text-white"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </div>
        )}

        {/* ACCIONES */}
        <div className="ml-auto flex shrink-0 items-center gap-2">

          {isPublic ? (
            <>
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="hidden whitespace-nowrap rounded-lg border border-[#45628B] px-3 py-2 text-xs font-semibold text-[#D1E2FC] hover:bg-[#17253B] sm:inline-flex"
              >
                Explorar demo empresa
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('contacto')}
                className="hidden items-center gap-2 whitespace-nowrap rounded-lg bg-[#567EFF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#4169E1] xl:inline-flex"
              >
                Solicitar diagnóstico
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-2 rounded-lg border border-[#2B3E5D] bg-[#101A2A] px-3 py-2 xl:flex">
                <Building2 size={14} className="text-[#6CE1E8]" />
                <span className="max-w-32 truncate text-xs text-[#D1E2FC]">
                  {activeOrg.legalName}
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleAiDrawer}
                aria-pressed={isAiDrawerOpen}
                className="hidden items-center gap-2 rounded-lg border border-[#39547C] px-3 py-2 text-xs text-[#D1E2FC] hover:bg-[#203A69] lg:inline-flex"
              >
                <Sparkles size={14} />
                TOKVANT AI
              </button>

              <button
                type="button"
                onClick={() => navigate('wizard')}
                className="hidden whitespace-nowrap rounded-lg bg-[#567EFF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#4169E1] xl:inline-flex"
              >
                + Nuevo proyecto
              </button>
            </>
          )}

          {/* MENÚ MÓVIL */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
            aria-controls="tokvant-mobile-menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#45628B] text-white xl:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MENÚ RESPONSIVE */}
      {mobileOpen && (
        <nav
          id="tokvant-mobile-menu"
          aria-label={isPublic ? 'Menú comercial' : 'Menú de plataforma'}
          className="max-h-[75vh] overflow-y-auto border-t border-[#2B3E5D] bg-[#101A2A] px-5 py-4 xl:hidden"
        >

          {isPublic ? (
            <>
              {publicLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full border-b border-[#2B3E5D] py-3 text-left text-sm text-[#D1E2FC]"
                >
                  {link.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="mt-4 w-full rounded-lg border border-[#45628B] px-4 py-3 text-sm text-white"
              >
                Explorar demo empresa
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('landing')}
                className="block w-full border-b border-[#2B3E5D] py-3 text-left text-sm text-[#D1E2FC]"
              >
                Portal comercial
              </button>

              {internalLinks.map((link) => (
                <button
                  key={link.view}
                  type="button"
                  onClick={() => navigate(link.view)}
                  className="block w-full border-b border-[#2B3E5D] py-3 text-left text-sm text-[#D1E2FC]"
                >
                  {link.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onToggleAiDrawer();
                }}
                className="mt-4 w-full rounded-lg border border-[#45628B] px-4 py-3 text-sm text-white"
              >
                TOKVANT AI
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
};
