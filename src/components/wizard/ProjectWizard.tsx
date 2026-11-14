import React, { useEffect, useRef, useState } from 'react';
import {CheckCircle2,ChevronRight,ChevronLeft,Save} from 'lucide-react';
import {TokenProject,StandardType,NetworkId,ProjectDocument} from '../../types';
import { TOKEN_STANDARDS } from '../../constants/standards';
import { SUPPORTED_NETWORKS } from '../../constants/networks';
import {clientCompleteness, clientProjectChecks, newClientProjectId, saveClientProject} from '../../lib/clientProjects';
import {getClientDocument} from '../../lib/clientDocuments';
import ClientDocuments from './ClientDocuments';
import {isAddress} from 'ethers';

interface ProjectWizardProps {
  initialProject?: Partial<TokenProject>;
  initialStep?: number;
  onSaveProject: (project: TokenProject) => void;
  onCancel: () => void;
}

export const ProjectWizard: React.FC<ProjectWizardProps> = ({
  initialProject,
  initialStep = 1,
  onSaveProject,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const totalSteps = 5;

  // Form State
  const [projectId] = useState<string>(
    initialProject?.id || newClientProjectId()
  );
  const [title, setTitle] = useState(initialProject?.title || '');
  const [organizationName, setOrganizationName] = useState(
    initialProject?.organizationName || ''
  );
  const [taxId, setTaxId] = useState(initialProject?.taxId || '');
  const [assetType, setAssetType] = useState<TokenProject['assetType']>(
    initialProject?.assetType || 'Agropecuario'
  );
  const [assetDescription, setAssetDescription] = useState(
    initialProject?.assetDescription || ''
  );
  const [assetTypeOther, setAssetTypeOther] = useState(initialProject?.assetTypeOther || '');
  const [assetTypeError, setAssetTypeError] = useState('');
  const [jurisdiction, setJurisdiction] = useState<TokenProject['jurisdiction']>(
    initialProject?.jurisdiction || 'Paraguay (BCP / CNV / Ley DLT)'
  );
  const [targetValuationUsd, setTargetValuationUsd] = useState<number>(
    initialProject?.targetValuationUsd ?? 10000000
  );

  // Contract standard and network
  const [standard, setStandard] = useState<StandardType>(
    initialProject?.standard || 'ERC-3643'
  );
  const [network, setNetwork] = useState<NetworkId>(
    initialProject?.network || 'polygon'
  );

  // Parameters
  const [tokenName, setTokenName] = useState(
    initialProject?.parameters?.tokenName || ''
  );
  const [tokenSymbol, setTokenSymbol] = useState(
    initialProject?.parameters?.tokenSymbol || ''
  );
  const [decimals, setDecimals] = useState<number>(
    ['ERC-721','ERC-1155'].includes(initialProject?.standard || '') ? 0 : initialProject?.parameters?.decimals ?? 2
  );
  const [initialSupply, setInitialSupply] = useState<number>(
    initialProject?.parameters?.initialSupply ?? 1000000
  );
  const [isPausable, setIsPausable] = useState<boolean>(
    initialProject?.parameters?.isPausable ?? true
  );
  const [isMintable, setIsMintable] = useState<boolean>(
    initialProject?.parameters?.isMintable ?? false
  );
  const [isBurnable, setIsBurnable] = useState<boolean>(
    initialProject?.parameters?.isBurnable ?? false
  );
  const [isUpgradeabilityEnabled, setIsUpgradeabilityEnabled] = useState<boolean>(
    initialProject?.parameters?.isUpgradeabilityEnabled ?? true
  );
  const [transferRestrictions, setTransferRestrictions] = useState(
    initialProject?.parameters?.transferRestrictions || 'Permisos ERC-3643 (Identity Registry)'
  );
  const [custodyModel, setCustodyModel] = useState(
    initialProject?.parameters?.custodyModel || 'Custodia institucional MPC'
  );

  const [documents, setDocuments] = useState<ProjectDocument[]>(initialProject?.documents?.filter(d=>d.storage==='browser') || []);
  const [contact, setContact] = useState(initialProject?.contact || {fullName:'',email:'',phone:'',consent:false});
  const [clientWalletAddress, setClientWalletAddress] = useState(initialProject?.clientWalletAddress || '');
  const [clientWalletNetwork, setClientWalletNetwork] = useState<NetworkId>(initialProject?.clientWalletNetwork || initialProject?.network || 'polygon');
  const [proposedRecipientsText,setProposedRecipientsText]=useState((initialProject?.proposedRecipients||[]).map(row=>row.walletAddress).join('\n'));
  const [documentsBusy, setDocumentsBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [formError, setFormError] = useState('');
  const [lastSaved, setLastSaved] = useState('Preparando borrador…');

  // Completion percentage
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  const buildProject = ():TokenProject => {
    const finalizedProject: TokenProject = {
      id: projectId,
      title: title.trim(),
      organizationId: 'org-py-001',
      organizationName,
      contact:{...contact,fullName:contact.fullName.trim(),email:contact.email.trim(),phone:contact.phone.trim()},
      taxId,
      assetDescription,
      commercialContext: initialProject?.commercialContext,
      assetType,
      assetTypeOther: assetType === 'Otro' ? assetTypeOther.trim() : undefined,
      jurisdiction,
      standard,
      network,
      clientWalletAddress: clientWalletAddress.trim(),
      clientWalletNetwork: clientWalletAddress.trim() ? clientWalletNetwork : undefined,
      walletSupportRequested: !clientWalletAddress.trim(),
      proposedRecipients: standard==='ERC-3643'?proposedRecipientsText.split(/\r?\n/).map(walletAddress=>walletAddress.trim()).filter(Boolean).map(walletAddress=>({walletAddress})):undefined,
      status: 'Borrador',
      progressPercent,
      targetValuationUsd,
      createdAt: initialProject?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isSimulationOnly: true,
      parameters: {
        tokenName,
        tokenSymbol,
        decimals,
        initialSupply,
        maxSupply: initialSupply,
        isPausable,
        isBurnable,
        isMintable,
        isUpgradeabilityEnabled,
        transferRestrictions,
        custodyModel,
        complianceRules: {
          requireKYC: true,
          requireKYB: true,
          restrictSanctionedCountries: true,
          lockupPeriodDays: 180,
        },
      },
      documents,
      securityScore: 0,
      securityChecks: [],
      approvals: [
        {
          id: `app-${projectId}-1`,
          role: 'Technical Reviewer',
          label: 'Revisión Técnica y Auditoría de Parámetros',
          status: 'Pendiente',
        },
        {
          id: `app-${projectId}-2`,
          role: 'Compliance Reviewer',
          label: 'Dictamen de Cumplimiento Regulatorio y AML',
          status: 'Pendiente',
        },
        {
          id: `app-${projectId}-3`,
          role: 'Enterprise Board',
          label: 'Autorización Ejecutiva de la Organización Emisora',
          status: 'Pendiente',
        },
      ],
    };

    return finalizedProject;
  };

  const draft = buildProject();
  const snapshot = JSON.stringify(draft);
  const checks = clientProjectChecks(draft);
  const completeness = clientCompleteness(draft);
  useEffect(()=>{
    if(submitting || documentsBusy)return;
    try {saveClientProject(JSON.parse(snapshot),currentStep);setLastSaved('Borrador guardado en este navegador');}
    catch {setLastSaved('No se pudo guardar el borrador');setFormError('No hay almacenamiento disponible. No cierre la página: libere espacio o habilite el almacenamiento del navegador.');}
  },[snapshot,currentStep,submitting,documentsBusy]);

  const saveAndExit=()=>{
    if(documentsBusy||submitting)return;
    try {saveClientProject(buildProject(),currentStep);onCancel();}
    catch {setFormError('No se pudo guardar. Permanezca en esta página y compruebe el espacio del navegador.');}
  };
  const handleNextStep=()=>{
    if(documentsBusy||submitting)return;
    const missing=checks.find(c=>c.step===currentStep&&!c.ok);
    if(missing){setFormError('Complete: '+missing.label+'.');window.scrollTo({top:0,behavior:'smooth'});return;}
    setFormError('');setCurrentStep(step=>Math.min(5,step+1));window.scrollTo({top:0,behavior:'smooth'});
  };
  const handlePrevStep=()=>{setFormError('');setCurrentStep(step=>Math.max(1,step-1));};
  const handleFinalizeProject=async()=>{
    if(submitLock.current||documentsBusy)return;
    if(standard==='ERC-3643'){const wallets=proposedRecipientsText.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);if(wallets.length>100||wallets.some(v=>!isAddress(v))||new Set(wallets.map(v=>v.toLowerCase())).size!==wallets.length){setFormError('Revisá las wallets destinatarias propuestas: una dirección EVM válida por línea, sin repetir (máximo 100).');setCurrentStep(5);return;}}
    const missing=checks.find(c=>!c.ok);
    if(missing){setFormError('Complete: '+missing.label+'.');setCurrentStep(missing.step);return;}
    submitLock.current=true;setSubmitting(true);setFormError('');
    try{
      await Promise.all(documents.map(doc=>getClientDocument(projectId,doc)));
      const project={...buildProject(),status:'Preliminar' as const,completenessScore:completeness};
      saveClientProject(project,5,'prepared');
      onSaveProject(project);
    }catch(e){setFormError(e instanceof Error?e.message:'No se pudo guardar la solicitud.');}
    finally{submitLock.current=false;setSubmitting(false);}
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      
      {/* Top Breadcrumb & Autosave Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#273246]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7096FF] uppercase tracking-wider">
            <span>Expediente de Proyecto</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-white">{projectId}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
            Asistente Guiado de Estructuración y Tokenización
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-[#9BA6BD] flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>{lastSaved}</span>
          </div>
          <button
            onClick={saveAndExit} disabled={documentsBusy||submitting}
            className="px-3 py-1.5 text-xs text-[#9BA6BD] hover:text-white rounded-lg border border-[#273246] hover:bg-[#141A27] transition-colors cursor-pointer"
          >
            Guardar y salir
          </button>
        </div>
      </div>

      <p className="text-xs text-[#9BA6BD]">Borrador guardado en este equipo y navegador. Podrá retomarlo desde el inicio. La recepción central de TOKVANT se habilitará en la siguiente etapa.</p>
      {formError&&<p role="alert" className="rounded-lg border border-red-400/50 p-3 text-sm text-red-200">{formError}</p>}
      {/* Progress Stepper Bar */}
      <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-white">Paso {currentStep} de {totalSteps}</span>
          <span className="text-[#7096FF] font-mono">{progressPercent}% Completado</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#0B0D12] overflow-hidden border border-[#273246]/50">
          <div 
            className="h-full bg-[#316BFA] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepper Labels */}
        <div className="grid grid-cols-5 gap-2 mt-3 text-[11px] text-center">
          <div className={currentStep >= 1 ? 'text-white font-medium' : 'text-[#9BA6BD]'}>
            1. Activo & Emisor
          </div>
          <div className={currentStep >= 2 ? 'text-white font-medium' : 'text-[#9BA6BD]'}>
            2. Estándar & Red
          </div>
          <div className={currentStep >= 3 ? 'text-white font-medium' : 'text-[#9BA6BD]'}>
            3. Parámetros
          </div>
          <div className={currentStep >= 4 ? 'text-white font-medium' : 'text-[#9BA6BD]'}>
            4. Documentación
          </div>
          <div className={currentStep >= 5 ? 'text-white font-medium' : 'text-[#9BA6BD]'}>
            5. Revisar y finalizar
          </div>
        </div>
      </div>

      {/* FORM BODY BY STEP */}
      <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 sm:p-8 space-y-6">
        
        {/* STEP 1: ORGANIZATION & ASSET */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Información de la Organización Emisora y Activo Subyacente
              </h2>
              <p className="text-xs text-[#9BA6BD] mt-1">
                Especifique la entidad jurídica responsable de la emisión y la naturaleza económica del activo.
              </p>
            </div>

            <div className="rounded-xl border border-[#39547C] p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Responsable de la solicitud</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {([['fullName','Nombre y apellido *','text'],['email','Email de contacto *','email'],['phone','Teléfono / WhatsApp con código de país (opcional)','tel']] as const).map(([key,label,type])=><label key={key} className="text-xs text-slate-300">{label}<input type={type} maxLength={200} value={contact[key]} onChange={e=>setContact({...contact,[key]:e.target.value})} className="mt-1 w-full rounded-lg border border-[#39547C] bg-[#0B0D12] p-3 text-white"/></label>)}
              </div>
              <label className="flex gap-2 text-xs text-slate-300"><input type="checkbox" checked={contact.consent} onChange={e=>setContact({...contact,consent:e.target.checked})}/>Autorizo el uso de mis datos de contacto para gestionar esta solicitud y recibir observaciones de TOKVANT.</label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Razón Social / Organización *
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#316BFA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  RUC / Identificación Fiscal
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#316BFA]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Título del Proyecto de Tokenización *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Fideicomiso Silvopastoril Chaco Central — Emisión Serie A"
                className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white placeholder-[#9BA6BD]/60 focus:outline-none focus:border-[#316BFA]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tipo de Activo Subyacente
                </label>
                <select
                  value={assetType}
                  onChange={(e) => {setAssetType(e.target.value as TokenProject['assetType']);setAssetTypeError('');}}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#316BFA]"
                >
                  <option value="Agropecuario">Agropecuario / Silvopastoril</option>
                  <option value="Inmobiliario">Inmobiliario Corporativo & Residencial</option>
                  <option value="Deuda / Factoring">Deuda Privada & Factoring</option>
                  <option value="Infraestructura">Infraestructura & Logística</option>
                  <option value="Derechos de Emisión">Créditos de Carbono / Ambientales</option>
                  <option value="Fondo Privado">Fondo Cerrado de Inversión</option>
                  <option value="Otro">Otro tipo de activo</option>
                </select>
                {assetType === 'Otro' && <div className="mt-3">
                  <label htmlFor="asset-type-other" className="block text-xs font-semibold text-slate-300 mb-1.5">Especifique el tipo de activo *</label>
                  <input id="asset-type-other" type="text" maxLength={200} required value={assetTypeOther} onChange={e=>{setAssetTypeOther(e.target.value);setAssetTypeError('');}} aria-invalid={Boolean(assetTypeError)} aria-describedby={assetTypeError ? 'asset-type-error' : undefined} placeholder="Ej. Derechos de regalías musicales" className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#316BFA]"/>
                  {assetTypeError && <p id="asset-type-error" role="alert" className="mt-2 text-xs text-red-300">{assetTypeError}</p>}
                </div>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Jurisdicción Aplicable y Marco de Cumplimiento
                </label>
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value as TokenProject['jurisdiction'])}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#316BFA]"
                >
                  <option value="Paraguay (BCP / CNV / Ley DLT)">Paraguay (BCP / CNV / Ley DLT)</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Estados Unidos (Reg D / Reg S)">Estados Unidos (Reg D / Reg S)</option>
                  <option value="Suiza (DLT Act)">Suiza (DLT Act)</option>
                  <option value="Unión Europea (MiCA)">Unión Europea (MiCA)</option>
                  <option value="Multi-jurisdiccional">Multi-jurisdiccional</option>
                  <option value="Por definir (revisión del expediente)">Por definir (revisión del expediente)</option>
                </select>
                <p className="mt-2 text-xs text-[#9BA6BD]">Selección preliminar, sujeta a revisión del expediente. Si intervienen varios países, seleccione «Multi-jurisdiccional» e identifique en el expediente el país de la emisora, la ubicación del activo y los países de oferta e inversores. Esta selección no habilita países ni modifica las reglas del contrato.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Valuación Objetivo del Activo (USD)
                </label>
                <input
                  type="number"
                  value={targetValuationUsd}
                  onChange={(e) => setTargetValuationUsd(Number(e.target.value))}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#316BFA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Modelo de Custodia Institucional
                </label>
                <select
                  value={custodyModel}
                  onChange={(e) => setCustodyModel(e.target.value as any)}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#316BFA]"
                >
                  <option value="Custodia institucional MPC">Custodia institucional MPC (Multi-Party Computation)</option>
                  <option value="Multi-firma institucional">Bóveda Multi-Firma (Safe 3-of-5)</option>
                  <option value="Bóveda corporativa segregada">Bóveda corporativa segregada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Memoria Descriptiva del Activo *
              </label>
              <textarea
                rows={3}
                value={assetDescription}
                onChange={(e) => setAssetDescription(e.target.value)}
                className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#316BFA]"
              />
            </div>
          </div>
        )}

        {/* STEP 2: STANDARD & BLOCKCHAIN NETWORK */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Selección de Estándar Contractual y Red Blockchain
              </h2>
              <p className="text-xs text-[#9BA6BD] mt-1">
                Elija la norma técnica EVM y la red de liquidación. Son parámetros propuestos para revisión por TOKVANT.
              </p>
            </div>

            {/* Standard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['ERC-3643', 'ERC-20', 'ERC-721', 'ERC-1155'] as StandardType[]).map((std) => {
                const profile = TOKEN_STANDARDS[std];
                return (
                  <button
                    key={std}
                    type="button"
                    onClick={() => {setStandard(std);if(std==='ERC-721'||std==='ERC-1155')setDecimals(0);}}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      standard === std
                        ? 'border-[#316BFA] bg-[#316BFA]/10 ring-1 ring-[#316BFA]'
                        : 'border-[#273246] bg-[#0B0D12] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#273246]/60">
                      <div className="font-mono font-bold text-white text-sm">{std}</div>
                      {std === 'ERC-3643' && (
                        <span className="text-[10px] font-semibold text-[#7096FF] px-2 py-0.5 rounded bg-[#316BFA]/20">
                          Recomendado RWA
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-200 mt-2">{profile.title}</div>
                    <p className="text-[11px] text-[#9BA6BD] mt-1 leading-relaxed line-clamp-3">
                      {profile.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Network Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Red Blockchain de Liquidación
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['sepolia', 'polygon', 'arbitrum', 'ethereum'] as NetworkId[]).map((netId) => {
                  const net = SUPPORTED_NETWORKS[netId];
                  return (
                    <button
                      key={netId}
                      type="button"
                      onClick={() => setNetwork(netId)}
                      className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        network === netId
                          ? 'border-[#316BFA] bg-[#316BFA]/10 text-white font-semibold'
                          : 'border-[#273246] bg-[#0B0D12] text-[#9BA6BD] hover:border-slate-500'
                      }`}
                    >
                      <div className="font-bold text-white">{net.name}</div>
                      <div className="text-[10px] text-[#9BA6BD] mt-1 font-mono">
                        {net.currency} · Bloque {net.avgBlockTimeSeconds}s
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Technical Rule Note */}
            <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-4 text-xs text-[#9BA6BD] space-y-1">
              <span className="font-semibold text-white block">Evaluación de Conformidad Técnica:</span>
              <p>
                {standard === 'ERC-3643'
                  ? 'La propuesta ERC-3643 contempla identidades y reglas de transferencia. El equipo revisará qué controles necesita el proyecto.'
                  : `Se seleccionó ${standard}. La configuración final y los controles aplicables se revisarán con el equipo de TOKVANT.`}
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: TOKEN PARAMETERS & RESTRICTIONS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Configuración de Parámetros Contractuales
              </h2>
              <p className="text-xs text-[#9BA6BD] mt-1">
                Proponga nombre, símbolo, cantidad y funciones del token. Estos datos no despliegan un contrato y quedan sujetos a revisión.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Token *
                </label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#316BFA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Símbolo Bursátil / Ticker *
                </label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#316BFA]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cantidad propuesta de unidades
                </label>
                <input
                  type="number"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(Number(e.target.value))}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#316BFA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Precisión Decimal
                </label>
                <select
                  disabled={standard==='ERC-721'||standard==='ERC-1155'}
                  value={decimals}
                  onChange={(e) => setDecimals(Number(e.target.value))}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#316BFA]"
                >
                  <option value={0}>0 (Indivisible / Títulos enteros)</option>
                  <option value={2}>2 (Centavos / Divisa fiduciaria)</option>
                  <option value={6}>6 (Estilo USDC)</option>
                  <option value={18}>18 (Estándar nativo EVM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Régimen de Transferencia y Controles
              </label>
              <select
                value={transferRestrictions}
                onChange={(e) => setTransferRestrictions(e.target.value as any)}
                className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#316BFA]"
              >
                <option value="Permisos ERC-3643 (Identity Registry)">
                  Permisos ERC-3643 (Identity Registry On-Chain & Claims)
                </option>
                <option value="Lista blanca (Whitelist)">
                  Lista blanca administrada (Whitelist autorizada por emisor)
                </option>
                <option value="Sin restricción">
                  Sin restricción (Solo para activos no catalogados como valores)
                </option>
              </select>
            </div>

            {/* Privileged Features Toggles */}
            <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                Funcionalidades Privilegiadas (Sujetas a Doble Firma Multi-Sig)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPausable}
                    onChange={(e) => setIsPausable(e.target.checked)}
                    className="h-4 w-4 rounded border-[#273246] bg-[#141A27] text-[#316BFA]"
                  />
                  <span>Pausabilidad de Emergencia (Pausable)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isUpgradeabilityEnabled}
                    onChange={(e) => setIsUpgradeabilityEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-[#273246] bg-[#141A27] text-[#316BFA]"
                  />
                  <span>Actualizable mediante Proxy UUPS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isBurnable}
                    onChange={(e) => setIsBurnable(e.target.checked)}
                    className="h-4 w-4 rounded border-[#273246] bg-[#141A27] text-[#316BFA]"
                  />
                  <span>Quema de Tokens (Burnable)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isMintable}
                    onChange={(e) => setIsMintable(e.target.checked)}
                    className="h-4 w-4 rounded border-[#273246] bg-[#141A27] text-[#316BFA]"
                  />
                  <span>Emisión adicional (Mintable)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && <ClientDocuments projectId={projectId} documents={documents} onChange={setDocuments} onBusyChange={setDocumentsBusy}/>}

        {currentStep === 5 && <section className="space-y-5">
          <h2 className="text-lg font-bold text-white">Revisá tu expediente</h2>
          <p className="text-sm text-[#9BA6BD]">Comprobá tus datos de contacto, la propuesta y los adjuntos antes de finalizar esta preparación.</p>
          <div className="rounded-xl border border-[#39547C] bg-[#0B0D12] p-5 space-y-3"><h3 className="text-white font-semibold">Completitud del expediente: {completeness}%</h3><p className="text-xs text-[#9BA6BD]">Este indicador cuenta los datos y adjuntos aportados. La revisión técnica, legal y documental queda pendiente.</p>{checks.map(c=><button key={c.label} type="button" disabled={submitting} onClick={()=>setCurrentStep(c.step)} className="block w-full text-left text-sm text-slate-200">{c.ok?'✓':'○'} {c.label} <span className="text-[#9BBCFF]">· Revisar</span></button>)}</div>
          <dl className="grid sm:grid-cols-2 gap-4 rounded-xl bg-[#0B0D12] p-5 text-sm text-white">
            <div><dt className="text-[#9BA6BD]">Proyecto</dt><dd>{title}</dd></div><div><dt className="text-[#9BA6BD]">Empresa</dt><dd>{organizationName}</dd></div>
            <div><dt className="text-[#9BA6BD]">Responsable</dt><dd>{contact.fullName}</dd></div><div><dt className="text-[#9BA6BD]">Contacto</dt><dd className="break-all">{contact.email} {contact.phone}</dd></div>
            <div><dt className="text-[#9BA6BD]">Activo y jurisdicción</dt><dd>{assetType==='Otro'?assetTypeOther:assetType} · {jurisdiction}</dd></div><div><dt className="text-[#9BA6BD]">Token propuesto</dt><dd>{tokenName} · {tokenSymbol} · {standard}</dd></div>
            <div><dt className="text-[#9BA6BD]">Unidades / decimales</dt><dd>{initialSupply} / {decimals}</dd></div><div><dt className="text-[#9BA6BD]">Adjuntos</dt><dd>{documents.length} · Pendientes de revisión</dd></div>
            <div className="sm:col-span-2"><dt className="text-[#9BA6BD]">Wallet del cliente</dt><dd className="break-all">{clientWalletAddress.trim() ? `${clientWalletAddress.trim()} · ${SUPPORTED_NETWORKS[clientWalletNetwork]?.name}` : 'Pendiente · Solicita acompañamiento de TOKVANT'}</dd></div>
          </dl>
          <div className="rounded-xl border border-[#39547C] bg-[#0B0D12] p-5 space-y-4">
            <div><h3 className="font-semibold text-white">Wallet para este proyecto · opcional</h3><p className="mt-2 text-sm text-[#9BA6BD]">Si ya tenés una wallet EVM, indicá su dirección y la red en la que usarías el token. Si todavía no tenés una, dejá el campo vacío: TOKVANT podrá orientarte durante la revisión. No conectes la wallet ni firmes nada para completar esta solicitud.</p></div>
            <label className="block text-sm text-slate-200">Dirección pública de tu wallet
              <input value={clientWalletAddress} onChange={e=>setClientWalletAddress(e.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} className="mt-2 w-full rounded-lg border border-[#39547C] bg-[#101A2A] px-3 py-3 font-mono text-sm text-white" />
            </label>
            {clientWalletAddress.trim() ? <label className="block text-sm text-slate-200">Red en la que usarías esta wallet
              <select value={clientWalletNetwork} onChange={e=>setClientWalletNetwork(e.target.value as NetworkId)} className="mt-2 w-full rounded-lg border border-[#39547C] bg-[#101A2A] px-3 py-3 text-white">
                {Object.values(SUPPORTED_NETWORKS).map(net=><option key={net.id} value={net.id}>{net.name}</option>)}
              </select>
            </label> : <p className="text-sm text-[#B8C9E1]">Sin wallet por ahora · podés continuar y solicitar acompañamiento.</p>}
            <p className="text-xs text-[#9BA6BD]">Red propuesta para el token: <strong className="text-white">{SUPPORTED_NETWORKS[network]?.name}</strong>. La dirección EVM puede usarse en distintas redes; aquí registramos la red prevista para este proyecto.</p>
            {clientWalletAddress.trim() && !checks.find(c=>c.step===5)?.ok && <p role="alert" className="text-sm text-amber-200">Revisá la dirección y seleccioná la misma red propuesta para el token.</p>}
          </div>
          {standard==='ERC-3643'&&<div className="rounded-xl border border-[#39547C] bg-[#0B0D12] p-5 space-y-3"><h3 className="font-semibold text-white">Wallets receptoras iniciales · opcional</h3><p className="text-sm text-[#9BA6BD]">Una dirección pública EVM por línea (máximo 100). Son candidatas propuestas, no quedan habilitadas ni reciben tokens al enviar la solicitud. TOKVANT y la autoridad de acreditación revisarán cada una. No escribas nombres ni documentos personales aquí.</p><textarea rows={4} value={proposedRecipientsText} onChange={e=>setProposedRecipientsText(e.target.value)} placeholder="0x…\n0x…" spellCheck={false} className="w-full rounded-lg border border-[#39547C] bg-[#101A2A] p-3 font-mono text-sm text-white"/><p className="text-xs text-[#B8C9E1]">{proposedRecipientsText.split(/\r?\n/).filter(v=>v.trim()).length} wallet(s) propuesta(s) · Red del proyecto: {SUPPORTED_NETWORKS[network]?.name}</p></div>}
          <p className="rounded-lg border border-amber-400/40 p-4 text-sm text-amber-100">Al finalizar guardaremos una copia en este navegador e intentaremos enviar el expediente y los adjuntos al espacio privado de TOKVANT. Solo se considerará recibido cuando aparezca el comprobante. Si falla la conexión, podrás reintentar sin perder tu borrador. Los avisos por email aún no están activos.</p>
        </section>}

        {/* STEPPER NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between pt-6 border-t border-[#273246]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep} disabled={documentsBusy||submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#9BA6BD] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Paso Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={saveAndExit} disabled={documentsBusy||submitting}
              className="px-4 py-2 text-xs font-medium text-[#9BA6BD] hover:text-white transition-colors cursor-pointer"
            >
              Guardar y salir
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep} disabled={documentsBusy||submitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <span>Continuar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={()=>void handleFinalizeProject()} disabled={documentsBusy||submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#16A34A]/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting?'Guardando solicitud…':'Enviar solicitud a TOKVANT'}</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
