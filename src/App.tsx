import React, { lazy, Suspense, useState } from 'react';
import { TopBar } from './components/navigation/TopBar';
import { LandingPage } from './components/landing/LandingPage';
import { LeadCaptureModal } from './components/landing/LeadCaptureModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ProjectsList } from './components/dashboard/ProjectsList';
import { ProjectDetailModal } from './components/dashboard/ProjectDetailModal';
import { ProjectWizard } from './components/wizard/ProjectWizard';
import { TokenSimulator } from './components/simulator/TokenSimulator';
import { StandardsCatalogView } from './components/standards/StandardsCatalogView';
import { ApprovalWorkflowView } from './components/approvals/ApprovalWorkflowView';
import { AdminPortal } from './components/admin/AdminPortal';
import { ArchitectureDocsView } from './components/docs/ArchitectureDocsView';
import { TokvanAiDrawer } from './components/ai/TokvanAiDrawer';

import { MOCK_PROJECTS, MOCK_ORGANIZATIONS, INITIAL_ORGANIZATION, MOCK_LEADS } from './constants/mockData';
import { TokenProject, OrganizationTenant, LeadSubmission } from './types';

const ERC20FactoryView = lazy(() => import('./components/factory/ERC20FactoryView'));

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [projects, setProjects] = useState<TokenProject[]>(MOCK_PROJECTS);
  const [activeOrg, setActiveOrg] = useState<OrganizationTenant>(INITIAL_ORGANIZATION);
  const [leads, setLeads] = useState<LeadSubmission[]>(MOCK_LEADS);

  // Modals & Drawers state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<TokenProject | null>(null);
  const [wizardSeedProject, setWizardSeedProject] = useState<Partial<TokenProject> | undefined>(undefined);

  // Notifications or toast message
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLeadModal = () => {
    setIsLeadModalOpen(true);
  };

  const handleProjectCreatedFromLead = (newDraft: TokenProject) => {
    setProjects((prev) => [newDraft, ...prev]);
    setWizardSeedProject(newDraft);
    setCurrentView('wizard');
    showToast(`Expediente ${newDraft.id} generado desde el diagnóstico institucional.`);
  };

  const handleSaveProjectFromWizard = (finalizedProject: TokenProject) => {
    setProjects((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === finalizedProject.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = finalizedProject;
        return copy;
      }
      return [finalizedProject, ...prev];
    });
    setWizardSeedProject(undefined);
    setCurrentView('projects');
    showToast(`Expediente ${finalizedProject.id} enviado al circuito colegiado de aprobaciones.`);
  };

  const handleUpdateApproval = (
    projectId: string,
    stepId: string,
    status: 'Aprobado' | 'Rechazado' | 'Corrección solicitada',
    comments: string
  ) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;

        const updatedSteps = proj.approvals.map((st) => {
          if (st.id !== stepId) return st;
          return {
            ...st,
            status,
            comments,
            timestamp: new Date().toUTCString(),
            signatureHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
          };
        });

        // If all approved, check status
        const allApproved = updatedSteps.every((s) => s.status === 'Aprobado');
        const anyRejected = updatedSteps.some((s) => s.status === 'Rechazado');

        let newStatus = proj.status;
        if (allApproved) {
          newStatus = 'Listo para despliegue';
        } else if (anyRejected) {
          newStatus = 'Requiere atención';
        }

        return {
          ...proj,
          approvals: updatedSteps,
          status: newStatus,
        };
      })
    );
    showToast(`Dictamen registrado con éxito en el expediente.`);
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#316BFA] selection:text-white">
      
      {/* Top Bar adhering to the Top Bar Contract (§2) */}
      <TopBar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeOrg={activeOrg}
        onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        isAiDrawerOpen={isAiDrawerOpen}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#141A27] border border-[#316BFA] text-white text-xs px-4 py-3 shadow-2xl animate-in fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Sub-Header Breadcrumb for Workspace Views */}
      {currentView !== 'landing' && (
        <div className="w-full border-b border-[#273246] bg-[#0E121A] py-2.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs text-[#9BA6BD]">
            <div className="flex items-center gap-2 font-medium">
              <button 
                onClick={() => handleNavigate('landing')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                TOKVAN
              </button>
              <span aria-hidden="true">/</span>
              <span className="text-white capitalize">
                {currentView === 'dashboard'
                  ? 'Resumen Ejecutivo'
                  : currentView === 'projects'
                  ? 'Expedientes de Emisión'
                  : currentView === 'wizard'
                  ? 'Asistente de Tokenización'
                  : currentView === 'factory'
                  ? 'Factory ERC-20'
                  : currentView === 'simulator'
                  ? 'Simulador EVM'
                  : currentView === 'standards'
                  ? 'Catálogo de Estándares'
                  : currentView === 'approvals'
                  ? 'Gobernanza & Aprobaciones'
                  : currentView === 'admin'
                  ? 'Backoffice Administrativo'
                  : 'Arquitectura & ADRs'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="hidden sm:inline">Empresa: <strong className="text-white">{activeOrg.legalName}</strong></span>
              <span className="text-[#7096FF] font-mono">Sandbox Demo Activo</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenLeadModal={handleOpenLeadModal}
            onSelectStandardDetail={(std) => {
              setCurrentView('standards');
            }}
          />
        )}

        {currentView === 'dashboard' && (
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <DashboardOverview
              organization={activeOrg}
              projects={projects}
              onNavigate={handleNavigate}
              onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
            />
          </div>
        )}

        {currentView === 'projects' && (
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <ProjectsList
              projects={projects}
              onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
              onCreateNew={() => {
                setWizardSeedProject(undefined);
                setCurrentView('wizard');
              }}
              onNavigateToApprovals={(proj) => {
                setCurrentView('approvals');
              }}
            />
          </div>
        )}

        {currentView === 'wizard' && (
          <ProjectWizard
            initialProject={wizardSeedProject}
            onSaveProject={handleSaveProjectFromWizard}
            onCancel={() => {
              setWizardSeedProject(undefined);
              setCurrentView('dashboard');
            }}
          />
        )}

        {currentView === 'factory' && (
          <Suspense fallback={<p className="p-8">Cargando factory…</p>}><ERC20FactoryView projects={projects} /></Suspense>
        )}

        {currentView === 'simulator' && (
          <TokenSimulator
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'standards' && (
          <StandardsCatalogView
            onNavigateToSimulator={() => setCurrentView('simulator')}
          />
        )}

        {currentView === 'approvals' && (
          <ApprovalWorkflowView
            projects={projects}
            onUpdateApproval={handleUpdateApproval}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            organizations={MOCK_ORGANIZATIONS}
            leads={leads}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'architecture' && (
          <ArchitectureDocsView />
        )}
      </main>

      {/* Interactive Commercial Capture Modal "¿Qué desea tokenizar?" */}
      <LeadCaptureModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onProjectCreatedFromLead={handleProjectCreatedFromLead}
      />

      {/* Project Inspector Detail Modal */}
      <ProjectDetailModal
        project={selectedProjectForDetail}
        onClose={() => setSelectedProjectForDetail(null)}
        onNavigateToApprovals={(p) => {
          setSelectedProjectForDetail(null);
          setCurrentView('approvals');
        }}
      />

      {/* TOKVAN AI Dual Layer Drawer */}
      <TokvanAiDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        activeProject={selectedProjectForDetail || projects[0]}
      />

    </div>
  );
}
