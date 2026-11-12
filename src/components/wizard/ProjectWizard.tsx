import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  Cpu, 
  Upload, 
  Lock, 
  Scale, 
  HelpCircle,
  Save,
  ArrowRight
} from 'lucide-react';
import { TokenProject, StandardType, NetworkId, RiskLevel, ProjectDocument } from '../../types';
import { TOKEN_STANDARDS } from '../../constants/standards';
import { SUPPORTED_NETWORKS } from '../../constants/networks';

interface ProjectWizardProps {
  initialProject?: Partial<TokenProject>;
  onSaveProject: (project: TokenProject) => void;
  onCancel: () => void;
}

export const ProjectWizard: React.FC<ProjectWizardProps> = ({
  initialProject,
  onSaveProject,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  // Form State
  const [projectId] = useState<string>(
    initialProject?.id || `TOKVAN-PY-2027-000${Math.floor(100 + Math.random() * 900)}`
  );
  const [title, setTitle] = useState(initialProject?.title || '');
  const [organizationName, setOrganizationName] = useState(
    initialProject?.organizationName || 'AgroForestal del Este S.A.'
  );
  const [taxId, setTaxId] = useState('80054921-3 (Paraguay)');
  const [assetType, setAssetType] = useState<TokenProject['assetType']>(
    initialProject?.assetType || 'Agropecuario'
  );
  const [assetDescription, setAssetDescription] = useState(
    'Fideicomiso silvopastoril con 3.500 ha de reforestación y producción ganadera regenerativa en el Chaco Central.'
  );
  const [jurisdiction, setJurisdiction] = useState<TokenProject['jurisdiction']>(
    initialProject?.jurisdiction || 'Paraguay (BCP / CNV / Ley DLT)'
  );
  const [targetValuationUsd, setTargetValuationUsd] = useState<number>(
    initialProject?.targetValuationUsd || 10000000
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
    initialProject?.parameters?.tokenName || 'Chaco Forestal Token'
  );
  const [tokenSymbol, setTokenSymbol] = useState(
    initialProject?.parameters?.tokenSymbol || 'CHACO-RWA'
  );
  const [decimals, setDecimals] = useState<number>(
    initialProject?.parameters?.decimals ?? 2
  );
  const [initialSupply, setInitialSupply] = useState<number>(
    initialProject?.parameters?.initialSupply || 1000000
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

  // Documents
  const [documents, setDocuments] = useState<ProjectDocument[]>(
    initialProject?.documents && initialProject.documents.length > 0
      ? initialProject.documents
      : [
          {
            id: 'doc-w1',
            name: 'Escritura Pública y Asiento Registral',
            category: 'Legal',
            fileName: 'Escritura_Inmueble_Chaco.pdf',
            fileSize: '4.2 MB',
            uploadDate: '2026-11-04',
            status: 'Verificado',
          },
          {
            id: 'doc-w2',
            name: 'Informe Pericial de Valuación Independiente',
            category: 'Financiero',
            fileName: 'Valuacion_PWC_2026.pdf',
            fileSize: '8.1 MB',
            uploadDate: '2026-11-04',
            status: 'Verificado',
          },
        ]
  );

  // Draft autosave feedback
  const [lastSaved, setLastSaved] = useState<string>('Guardado local activo');

  // Completion percentage
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setLastSaved(`Borrador actualizado: ${new Date().toLocaleTimeString()}`);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalizeProject = () => {
    const finalizedProject: TokenProject = {
      id: projectId,
      title: title || `${organizationName} — Tokenización ${assetType}`,
      organizationId: 'org-py-001',
      organizationName,
      assetType,
      jurisdiction,
      standard,
      network,
      status: 'En revisión',
      progressPercent: 75,
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
      securityScore: 94,
      securityChecks: [
        {
          id: 'sc-1',
          title: 'Verificación de Hash de Plantilla Certificada',
          category: 'Bytecode',
          level: 'Informativo',
          passed: true,
          details: 'Bytecode certificado por auditorías de ConsenSys y OpenZeppelin.',
        },
        {
          id: 'sc-2',
          title: 'Control de Emisión y Cap Máximo',
          category: 'Permisos',
          level: 'Informativo',
          passed: true,
          details: `Cap restringido a ${initialSupply.toLocaleString()} unidades.`,
        },
        {
          id: 'sc-3',
          title: 'Identity Registry y Reglas de Jurisdicción',
          category: 'Cumplimiento',
          level: 'Informativo',
          passed: true,
          details: 'Contrato de compliance on-chain activo y vinculado.',
        },
      ],
      approvals: [
        {
          id: `app-${Date.now()}-1`,
          role: 'Technical Reviewer',
          label: 'Revisión Técnica y Auditoría de Parámetros',
          status: 'Pendiente',
        },
        {
          id: `app-${Date.now()}-2`,
          role: 'Compliance Reviewer',
          label: 'Dictamen de Cumplimiento Regulatorio y AML',
          status: 'Pendiente',
        },
        {
          id: `app-${Date.now()}-3`,
          role: 'Enterprise Board',
          label: 'Autorización Ejecutiva de la Organización Emisora',
          status: 'Pendiente',
        },
      ],
    };

    onSaveProject(finalizedProject);
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
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-[#9BA6BD] hover:text-white rounded-lg border border-[#273246] hover:bg-[#141A27] transition-colors cursor-pointer"
          >
            Guardar y Salir
          </button>
        </div>
      </div>

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
            5. Pre-Flight
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
                  onChange={(e) => setAssetType(e.target.value as any)}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#316BFA]"
                >
                  <option value="Agropecuario">Agropecuario / Silvopastoril</option>
                  <option value="Inmobiliario">Inmobiliario Corporativo & Residencial</option>
                  <option value="Deuda / Factoring">Deuda Privada & Factoring</option>
                  <option value="Infraestructura">Infraestructura & Logística</option>
                  <option value="Derechos de Emisión">Créditos de Carbono / Ambientales</option>
                  <option value="Fondo Privado">Fondo Cerrado de Inversión</option>
                </select>
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
                Memoria Descriptiva del Activo
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
                Elija la norma técnica EVM y la red de liquidación. TOKVAN valida automáticamente la compatibilidad de bytecode.
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
                    onClick={() => setStandard(std)}
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
                {(['polygon', 'arbitrum', 'ethereum'] as NetworkId[]).map((netId) => {
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
                  ? 'El estándar ERC-3643 implementará el contrato ONCHAINID Identity Registry y el Compliance Engine para validar que solo inversores con KYC/KYB acreditado puedan transaccionar.'
                  : `Se seleccionó ${standard}. Se recomienda adjuntar un módulo de lista blanca adicional para garantizar cumplimiento legal según la CNV/BCP.`}
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
                Defina nombre, símbolo, suministro y políticas inmutables que gobernarán el contrato inteligente.
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
                  Suministro Total (Cap Inmutable)
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

        {/* STEP 4: DOCUMENTATION & EVIDENCE */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Documentación Pericial, Legal y Fiduciaria
              </h2>
              <p className="text-xs text-[#9BA6BD] mt-1">
                La emisión de un activo digital institucional exige respaldo probatorio verificable antes de habilitar la revisión de cumplimiento.
              </p>
            </div>

            {/* Document list */}
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0D12] border border-[#273246] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#316BFA] shrink-0" />
                    <div>
                      <div className="font-semibold text-white">{doc.name}</div>
                      <div className="text-[11px] text-[#9BA6BD] font-mono">
                        {doc.fileName} · {doc.fileSize} · Subido el {doc.uploadDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#16A34A] px-2.5 py-0.5 rounded bg-[#16A34A]/10 border border-[#16A34A]/20">
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#273246] rounded-xl p-6 text-center space-y-2 hover:border-[#316BFA] transition-colors bg-[#0B0D12]/50">
              <Upload className="w-6 h-6 text-[#7096FF] mx-auto" />
              <div className="text-xs font-semibold text-white">Adjuntar Documento Legal o Financiero</div>
              <p className="text-[11px] text-[#9BA6BD]">
                Formatos permitidos: PDF, XLSX, DOCX (Máx. 25 MB por archivo). Los documentos son anclados con hash SHA-256 inmutable.
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: PRE-FLIGHT SECURITY CHECK & SUBMISSION */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Evaluación de Seguridad Pre-Flight & Confirmación
              </h2>
              <p className="text-xs text-[#9BA6BD] mt-1">
                Firewall lógico de contratos: Verificación de invariantes técnicas antes de iniciar el circuito colegiado de firmas.
              </p>
            </div>

            {/* Assessment Score Box */}
            <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#273246]">
                <div>
                  <span className="text-[11px] font-semibold text-[#7096FF] uppercase tracking-wider block">
                    Security Pre-Flight Assessment
                  </span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    Puntaje de Solidez: 94 / 100
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#16A34A] px-3 py-1 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-md self-start sm:self-auto">
                  Aprobación Técnica Viable
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>
                    <strong>Bytecode Certificado:</strong> Plantilla {standard} auditada conforme a especificaciones OpenZeppelin.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>
                    <strong>Gobernanza:</strong> Administración delegada a Multi-Sig institucional sin llaves privadas expuestas.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>
                    <strong>Respaldo Documental:</strong> 2 documentos periciales cargados y validados.
                  </span>
                </div>
              </div>
            </div>

            {/* Project Summary Card */}
            <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-4 text-xs space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                Resumen de Emisión
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
                <div>
                  <span className="text-[#9BA6BD] block">Símbolo:</span>
                  <span className="text-white font-mono font-bold">{tokenSymbol}</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Suministro:</span>
                  <span className="text-white font-mono tabular-nums">{initialSupply.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Red Destino:</span>
                  <span className="text-white font-medium capitalize">{network}</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Estándar:</span>
                  <span className="text-[#7096FF] font-mono font-bold">{standard}</span>
                </div>
              </div>
            </div>

            {/* Institutional Warning */}
            <div className="rounded-lg bg-[#D97706]/10 border border-[#D97706]/20 p-3 text-xs text-[#D97706] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Al enviar este expediente a revisión, se iniciará el flujo de aprobación colegiada (Técnico, Compliance y Directorio). Los parámetros quedarán inmutables para esta versión.
              </span>
            </div>

          </div>
        )}

        {/* STEPPER NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between pt-6 border-t border-[#273246]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#9BA6BD] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Paso Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-[#9BA6BD] hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <span>Continuar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalizeProject}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#16A34A]/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enviar a Flujo de Aprobaciones</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
