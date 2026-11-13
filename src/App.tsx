import React, { lazy, Suspense, useState } from 'react';
import { TopBar } from './components/navigation/TopBar';
import { LandingPage } from './components/landing/LandingPage';
import { CommercialLandingPage } from './components/landing/CommercialLandingPage';
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
import ClientProjectHome from './components/wizard/ClientProjectHome';
import StaffAccess from './components/admin/StaffAccess';
import { roleCanOpen, type StaffRole } from './lib/staffAccess';
import {validReview,reviewRoleForWallet,type ReviewProof} from './lib/reviewSignatures';
import {listClientProjects,markClientProjectSubmitted,type ClientProjectRecord} from './lib/clientProjects';
import {submitClientProject,listSharedSubmissions,downloadSharedDocument} from './lib/sharedSubmissions';
import {saveSharedReview,type SharedReview} from './lib/governance';

import { TokenProject } from './types';

const FactoryWorkspace = lazy(() => import('./components/factory/FactoryWorkspace'));

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [staff, setStaff] = useState<{account:string;role:StaffRole|'owner'} | null>(null);
  const [requestedView, setRequestedView] = useState<string>('dashboard');
  React.useEffect(() => {
    const ethereum = (window as Window & {ethereum?:{on?:(event:string, fn:()=>void)=>void;removeListener?:(event:string, fn:()=>void)=>void}}).ethereum;
    const clear = () => { setStaff(null); setCurrentView('landing'); };
    ethereum?.on?.('accountsChanged', clear);
    ethereum?.on?.('chainChanged', clear);
    return () => { ethereum?.removeListener?.('accountsChanged', clear); ethereum?.removeListener?.('chainChanged', clear); };
  }, []);
  const [projects, setProjects] = useState<TokenProject[]>([]);

  // Modals & Drawers state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<TokenProject | null>(null);
  const [wizardSeedProject, setWizardSeedProject] = useState<Partial<TokenProject> | undefined>(undefined);
  const [wizardStep,setWizardStep] = useState(1);
  const [clientRecords,setClientRecords] = useState<ClientProjectRecord[]>(()=>{try{return listClientProjects();}catch{return [];}});
  const [clientReceipt,setClientReceipt] = useState<ClientProjectRecord>();
  const [submissionProgress,setSubmissionProgress]=useState('');
  const [submissionError,setSubmissionError]=useState('');
  const [sharedLoading,setSharedLoading]=useState(false);
  const [sharedError,setSharedError]=useState('');
  const refreshClientRecords=()=>{try{setClientRecords(listClientProjects());}catch{/* The wizard reports storage errors when saving. */}};
  const resumeClientProject=(record:ClientProjectRecord)=>{setWizardSeedProject(record.project);setWizardStep(record.step);setCurrentView('wizard');window.scrollTo({top:0,behavior:'smooth'});};

  // Notifications or toast message
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleNavigate = (view: string) => {
    if (['dashboard','projects','factory','simulator','standards','approvals','admin','architecture'].includes(view) && !roleCanOpen(staff?.role ?? null, view)) {
      setRequestedView(view); setCurrentView('staff-access'); window.scrollTo({top:0}); return;
    }
    refreshClientRecords();
    if(view==='wizard'){setWizardSeedProject(undefined);setWizardStep(1);}
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLeadModal = () => {
    setIsLeadModalOpen(true);
  };

  const handleProjectCreatedFromLead = (newDraft: TokenProject) => {
    setWizardSeedProject(newDraft);
    setWizardStep(1);
    setCurrentView('wizard');
    showToast(`Expediente ${newDraft.id} generado desde el diagnóstico institucional.`);
  };

  const deliverProject=async(record:ClientProjectRecord)=>{
    if(submissionProgress)return;
    setSubmissionError('');setSubmissionProgress('Iniciando envío…');
    try{
      const receipt=await submitClientProject(record.project,setSubmissionProgress);
      const updated=markClientProjectSubmitted(record.project.id,receipt.id,receipt.receivedAt);
      setClientReceipt(updated);refreshClientRecords();
    }catch(e){setSubmissionError(e instanceof Error?e.message:'No se pudo enviar el expediente.');}
    finally{setSubmissionProgress('');}
  };
  const refreshShared=async()=>{
    if(!staff||sharedLoading)return;
    setSharedLoading(true);setSharedError('');
    try{
      const received=await listSharedSubmissions(staff.account);
      setProjects(received);
    }catch(e){setSharedError(e instanceof Error?e.message:'No se pudo cargar la bandeja.');}
    finally{setSharedLoading(false);}
  };
  const handleSaveProjectFromWizard = (finalizedProject: TokenProject) => {
    setWizardSeedProject(undefined);
    refreshClientRecords();
    setClientReceipt({project:finalizedProject,step:5,stage:'prepared',savedAt:new Date().toISOString()});
    setCurrentView('client-confirmation');
    void deliverProject({project:finalizedProject,step:5,stage:'prepared',savedAt:new Date().toISOString()});
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleUpdateApproval = async (proof:ReviewProof) => {
    const project=projects.find(p=>p.id===proof.projectId);
    if(!project||!staff||reviewRoleForWallet(staff.account)!==proof.role||!validReview(project,proof)){
      throw new Error('No se pudo verificar la firma para este dictamen.');
    }
    if(project.submissionId)await saveSharedReview(staff.account,project.submissionId,proof);
    setProjects(prev=>prev.map(p=>p.id!==proof.projectId?p:{
      ...p,
      status:proof.decision==='Aprobado'?'En revisión':'Requiere atención',
      approvals:p.approvals.map(step=>step.id!==proof.stepId?step:{
        ...step,status:proof.decision,comments:proof.comments,timestamp:proof.timestamp,
        signatureHash:proof.signature,signerWallet:proof.signer,signedProjectHash:proof.projectHash,
        signedMessage:JSON.stringify(proof),approverName:proof.signer,
      }),
    }));
    showToast(project.submissionId?'Dictamen firmado y guardado en la bitácora compartida.':'Dictamen firmado en esta sesión de demostración.');
  };
  const applySharedReviews=(projectId:string,reviews:SharedReview[])=>{
    setProjects(prev=>prev.map(project=>project.id!==projectId?project:{...project,approvals:project.approvals.map(step=>{
      const row=reviews.find(item=>item.role===step.role);
      if(!row||!validReview(project,row.proof))return step;
      const proof=row.proof;
      return {...step,status:proof.decision,comments:proof.comments,timestamp:proof.timestamp,signatureHash:proof.signature,signerWallet:proof.signer,signedProjectHash:proof.projectHash,signedMessage:JSON.stringify(proof),approverName:proof.signer};
    })}));
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#316BFA] selection:text-white">
      
      {/* Top Bar adhering to the Top Bar Contract (§2) */}
      <TopBar
        currentView={currentView}
        onNavigate={handleNavigate}
        staffRole={staff?.role ?? null}
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
                TOKVANT
              </button>
              <span aria-hidden="true">/</span>
              <span className="text-white capitalize">
                {currentView === 'dashboard'
                  ? 'Resumen Ejecutivo'
                  : currentView === 'projects'
                  ? 'Expedientes de Emisión'
                  : currentView === 'wizard'
                  ? 'Asistente de Tokenización'
                  : currentView === 'staff-access'
                  ? 'Acceso al equipo'
                  : currentView === 'client-confirmation'
                  ? 'Tu solicitud'
                  : currentView === 'factory'
                  ? 'Factories de tokenización'
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

            <span className="text-[#7096FF] font-mono text-[11px]">Entorno de pruebas</span>
          </div>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <>
          <ClientProjectHome records={clientRecords} onResume={resumeClientProject} onSubmit={record=>void deliverProject(record)} progress={submissionProgress} submitError={submissionError}/>
          <CommercialLandingPage
            onNavigate={handleNavigate}
            onOpenLeadModal={handleOpenLeadModal}
          />
          </>
        )}
        {currentView === 'staff-access' && <StaffAccess account={staff?.account ?? null} role={staff?.role ?? null} onLogin={(account,role)=>{setStaff({account,role});setCurrentView(roleCanOpen(role,requestedView)?requestedView:(role === 'factory' ? 'factory' : 'dashboard'));}} onLogout={()=>{setStaff(null);setCurrentView('landing');}}/>}
        {currentView === 'client-confirmation' && <ClientProjectHome records={clientRecords} receipt={clientReceipt} onResume={resumeClientProject} onHome={()=>handleNavigate('landing')} onSubmit={record=>void deliverProject(record)} progress={submissionProgress} submitError={submissionError}/>}

        {currentView === 'dashboard' && roleCanOpen(staff?.role ?? null, 'dashboard') && (
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <DashboardOverview
              projects={projects}
              onNavigate={handleNavigate}
              onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
            />
          </div>
        )}

        {currentView === 'projects' && roleCanOpen(staff?.role ?? null, 'projects') && (
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <ProjectsList
              projects={projects}
              onSelectProject={(proj) => setSelectedProjectForDetail(proj)}
              onRefreshShared={()=>void refreshShared()} sharedLoading={sharedLoading} sharedError={sharedError}
              onCreateNew={() => {
                setWizardSeedProject(undefined);
                setWizardStep(1);
                setCurrentView('wizard');
              }}
              onNavigateToApprovals={(proj) => {
                setSelectedProjectForDetail(proj);
                handleNavigate('approvals');
              }}
            />
          </div>
        )}

        {currentView === 'wizard' && (
          <ProjectWizard
            key={wizardSeedProject?.id || 'new-client-project'}
            initialProject={wizardSeedProject}
            initialStep={wizardStep}
            onSaveProject={handleSaveProjectFromWizard}
            onCancel={() => {
              setWizardSeedProject(undefined);
              refreshClientRecords();
              setCurrentView('landing');
            }}
          />
        )}

        {currentView === 'factory' && roleCanOpen(staff?.role ?? null, 'factory') && (
          <Suspense fallback={<p className="p-8">Cargando factory…</p>}><FactoryWorkspace projects={projects} /></Suspense>
        )}

        {currentView === 'simulator' && roleCanOpen(staff?.role ?? null, 'simulator') && (
          <TokenSimulator
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'standards' && roleCanOpen(staff?.role ?? null, 'standards') && (
          <StandardsCatalogView
            onNavigateToSimulator={() => handleNavigate('simulator')}
          />
        )}

        {currentView === 'approvals' && roleCanOpen(staff?.role ?? null, 'approvals') && (
          <ApprovalWorkflowView
            projects={projects}
            initialProjectId={selectedProjectForDetail?.id}
            onUpdateApproval={handleUpdateApproval}
            onApplySharedReviews={applySharedReviews}
            staffAccount={staff?.account ?? null}
            staffRole={staff?.role ?? null}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin' && roleCanOpen(staff?.role ?? null, 'admin') && (
          <AdminPortal
            organizations={[]}
            leads={[]}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'architecture' && roleCanOpen(staff?.role ?? null, 'architecture') && (
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
        onDownloadDocument={(project,doc)=>{if(!staff)return;void downloadSharedDocument(staff.account,project,doc).catch(e=>showToast(e instanceof Error?e.message:'No se pudo descargar.'));}}
        onNavigateToApprovals={(p) => {
          setSelectedProjectForDetail(p);
          handleNavigate('approvals');
        }}
      />

      {/* TOKVANT IA drawer */}
      <TokvanAiDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        activeProject={selectedProjectForDetail || projects[0]}
      />

    </div>
  );
}
