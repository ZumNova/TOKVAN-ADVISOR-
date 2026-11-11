import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { LeadSubmission, StandardType, TokenProject } from '../../types';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreatedFromLead?: (newProject: TokenProject) => void;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  onClose,
  onProjectCreatedFromLead,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [sector, setSector] = useState('Agropecuario / Forestal');
  const [assetType, setAssetType] = useState('Fideicomiso de Tierras & Reforestación');
  const [country, setCountry] = useState('Paraguay');
  const [objective, setObjective] = useState('Levantamiento de capital privado mediante cuotapartes reguladas');
  const [estimatedVolume, setEstimatedVolume] = useState('$5M - $10M USD');
  const [experienceLevel, setExperienceLevel] = useState('Intermedio (conocemos el concepto de tokenización)');

  // Contact info
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [targetAudience, setTargetAudience] = useState('');
  const [commercialChannels, setCommercialChannels] = useState('');

  // Diagnostic result
  const [generatedDraftId, setGeneratedDraftId] = useState('');
  const [recommendedStandard, setRecommendedStandard] = useState<StandardType>('ERC-3643');

  if (!isOpen) return null;

  const handleCalculateDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !email || !companyName || !fullName) {
      return;
    }

    // Recommendation logic based on objective & asset
    let standard: StandardType = 'ERC-3643';
    if (sector.includes('Factoring') || assetType.includes('Facturas') || assetType.includes('Deuda')) {
      standard = 'ERC-1155';
    } else if (assetType.includes('Único') || assetType.includes('Maquinaria') || assetType.includes('Inmueble Individual')) {
      standard = 'ERC-721';
    } else if (objective.includes('Carbono') || objective.includes('Commodity')) {
      standard = 'ERC-20';
    } else {
      standard = 'ERC-3643';
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const draftId = `TOKVANT-PY-2027-000${randomSuffix}`;
    setGeneratedDraftId(draftId);
    setRecommendedStandard(standard);
    setStep(3);
  };

  const handleStartProjectDraft = () => {
    const draftProject: TokenProject = {
      id: generatedDraftId || `TOKVANT-PY-2027-000${Math.floor(100 + Math.random() * 900)}`,
      title: `${companyName || 'Proyecto'} — Tokenización ${assetType}`,
      organizationId: 'org-py-001',
      organizationName: companyName || 'Empresa Emisora',
      assetType: sector.includes('Agro') ? 'Agropecuario' : sector.includes('Inmobiliario') ? 'Inmobiliario' : 'Deuda / Factoring',
      jurisdiction: country === 'Paraguay' ? 'Paraguay (BCP / CNV / Ley DLT)' : 'Estados Unidos (Reg D / Reg S)',
      standard: recommendedStandard,
      network: 'polygon',
      status: 'Preliminar',
      progressPercent: 15,
      targetValuationUsd: estimatedVolume.includes('50M') ? 50000000 : 7500000,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isSimulationOnly: true,
      parameters: {
        tokenName: `${companyName || 'Activo'} Digital Token`,
        tokenSymbol: 'TK-DIGITAL',
        decimals: 2,
        initialSupply: 750000,
        maxSupply: 750000,
        isPausable: true,
        isBurnable: false,
        isMintable: false,
        isUpgradeabilityEnabled: true,
        transferRestrictions: recommendedStandard === 'ERC-3643' ? 'Permisos ERC-3643 (Identity Registry)' : 'Lista blanca (Whitelist)',
        custodyModel: 'Custodia institucional MPC',
        complianceRules: {
          requireKYC: true,
          requireKYB: true,
          restrictSanctionedCountries: true,
        },
      },
      documents: [],
      securityScore: 88,
      securityChecks: [],
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

    onClose();
    if (onProjectCreatedFromLead) {
      onProjectCreatedFromLead(draftProject);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#141A27] border border-[#273246] shadow-2xl p-6 md:p-8 overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9BA6BD] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#273246] cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
            <Sparkles className="w-4 h-4" />
            <span>Diagnóstico Preliminar de Tokenización</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-1 font-display">
            ¿Qué desea tokenizar en su organización?
          </h2>
          <p className="text-sm text-[#9BA6BD] mt-1">
            Complete los parámetros de su activo. Recibirá una orientación técnica preliminar y podrá explorar un borrador de proyecto en el entorno de demostración.
          </p>
        </div>

        {/* Multi-step progress tabs */}
        <div className="flex items-center justify-between mb-8 border-b border-[#273246] pb-3 text-xs font-medium">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#316BFA]' : 'text-[#9BA6BD]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-[#316BFA] text-white' : 'bg-[#273246] text-[#9BA6BD]'}`}>1</span>
            <span>Activo & Objetivo</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#273246]" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#316BFA]' : 'text-[#9BA6BD]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-[#316BFA] text-white' : 'bg-[#273246] text-[#9BA6BD]'}`}>2</span>
            <span>Entidad & Contacto</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#273246]" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-[#316BFA]' : 'text-[#9BA6BD]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-[#316BFA] text-white' : 'bg-[#273246] text-[#9BA6BD]'}`}>3</span>
            <span>Diagnóstico TOKVANT</span>
          </div>
        </div>

        {/* STEP 1: ASSET & OBJECTIVE */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Sector Económico
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#316BFA]"
              >
                <option value="Agropecuario / Forestal">Agropecuario / Silvopastoril / Forestal</option>
                <option value="Inmobiliario Corporativo & Residencial">Inmobiliario Corporativo & Residencial</option>
                <option value="Deuda Privada & Factoring Ganadero/Comercial">Deuda Privada & Factoring Comercial</option>
                <option value="Infraestructura & Logística Hidroviaria">Infraestructura, Energía & Logística</option>
                <option value="Créditos de Carbono & Activos Ambientales">Créditos de Carbono & Activos Ambientales</option>
                <option value="Fondo de Inversión Cerrado / Participaciones">Fondo de Inversión / Equity Privado</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  País de Radicación del Activo
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#316BFA]"
                >
                  <option value="Paraguay">Paraguay (BCP / CNV)</option>
                  <option value="Uruguay">Uruguay</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Brasil">Brasil</option>
                  <option value="Estados Unidos">Estados Unidos</option>
                  <option value="Suiza / UE">Suiza / Unión Europea</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Volumen Estimado de Emisión
                </label>
                <select
                  value={estimatedVolume}
                  onChange={(e) => setEstimatedVolume(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#316BFA]"
                >
                  <option value="$1M - $5M USD">$1M a $5M USD</option>
                  <option value="$5M - $10M USD">$5M a $10M USD</option>
                  <option value="$10M - $25M USD">$10M a $25M USD</option>
                  <option value="$25M - $50M+ USD">$25M a $50M+ USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Descripción Específica del Activo
              </label>
              <input
                type="text"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                placeholder="Ej. Fideicomiso ganadero de 4.000 cabezas en Boquerón"
                className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white placeholder-[#9BA6BD]/60 focus:outline-none focus:border-[#316BFA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Objetivo Principal de la Tokenización
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#316BFA]"
              >
                <option value="Levantamiento de capital privado mediante cuotapartes reguladas">
                  Levantamiento de capital privado mediante cuotapartes reguladas
                </option>
                <option value="Fraccionamiento de inmueble para liquidez a inversores calificados">
                  Fraccionamiento de activo inmobiliario para liquidez
                </option>
                <option value="Emisión de pagarés digitales / cesión de derechos de cobro">
                  Titularización de cartera de crédito / factoring
                </option>
                <option value="Certificados de impacto ambiental y trazabilidad en cadena">
                  Certificación ambiental y trazabilidad en cadena
                </option>
              </select>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer"
              >
                <span>Continuar a Datos de Contacto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ENTITY & CONTACT */}
        {step === 2 && (
          <form onSubmit={handleCalculateDiagnostic} className="space-y-4">

{/* INFORMACIÓN COMERCIAL */}
<div className="rounded-xl border border-[#39547C] bg-[#101A2A] p-4 space-y-4">

  <div>
    <h3 className="text-sm font-bold text-white">
      Estrategia comercial del proyecto
    </h3>
    <p className="mt-1 text-xs leading-relaxed text-[#AABBD4]">
      Estos datos nos ayudan a comprender a quién estará dirigido
      el activo digital y qué canales de distribución existen.
    </p>
  </div>

  <div>
    <label
      htmlFor="targetAudience"
      className="mb-2 block text-xs font-semibold text-[#D1E2FC]"
    >
      ¿A quién estaría dirigido el token?
    </label>

    <input
      id="targetAudience"
      type="text"
      value={targetAudience}
      onChange={(e) => setTargetAudience(e.target.value)}
      placeholder="Clientes, usuarios, empresas o inversores previstos"
      className="w-full rounded-lg border border-[#455C80] bg-[#0B0D12] px-3.5 py-3 text-sm text-white placeholder:text-[#798BA7] focus:border-[#567EFF] focus:outline-none"
    />
  </div>

  <div>
    <label
      htmlFor="commercialChannels"
      className="mb-2 block text-xs font-semibold text-[#D1E2FC]"
    >
      ¿Qué canales comerciales tiene actualmente?
    </label>

    <input
      id="commercialChannels"
      type="text"
      value={commercialChannels}
      onChange={(e) => setCommercialChannels(e.target.value)}
      placeholder="Equipo comercial, aliados, comunidad, redes sociales..."
      className="w-full rounded-lg border border-[#455C80] bg-[#0B0D12] px-3.5 py-3 text-sm text-white placeholder:text-[#798BA7] focus:border-[#567EFF] focus:outline-none"
    />
  </div>

  <p className="text-xs leading-relaxed text-[#AABBD4]">
    Ambos campos son opcionales.
  </p>

</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Rodrigo Zaldívar"
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white placeholder-[#9BA6BD]/60 focus:outline-none focus:border-[#316BFA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Razón Social / Organización *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. AgroForestal Guaraní S.A."
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white placeholder-[#9BA6BD]/60 focus:outline-none focus:border-[#316BFA]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Correo Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com.py"
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white placeholder-[#9BA6BD]/60 focus:outline-none focus:border-[#316BFA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Teléfono / WhatsApp Directo
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+595 981 123 456"
                  className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white placeholder-[#9BA6BD]/60 focus:outline-none focus:border-[#316BFA]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nivel de Madurez Operativa en Activos Digitales
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#316BFA]"
              >
                <option value="Sin experiencia previa">Primera aproximación / Deseamos consultoría integral</option>
                <option value="Intermedio (conocemos el concepto de tokenización)">
                  Intermedio (contamos con activos identificados y estructura legal)
                </option>
                <option value="Avanzado (equipo financiero y legal involucrado)">
                  Avanzado (preparados para estructurar emisión y contratar auditoría)
                </option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#273246] bg-[#0B0D12] text-[#316BFA] focus:ring-0"
                />
                <span className="text-xs text-[#9BA6BD] leading-relaxed">
                  Autorizo a TOKVANT a procesar esta información conforme al marco de confidencialidad profesional para emitir el diagnóstico preliminar de estructuración y crear un expediente de proyecto.
                </span>
              </label>
            </div>

{/* CONSENTIMIENTO COMERCIAL OPCIONAL */}
<div className="pt-2">
  <label className="flex cursor-pointer items-start gap-3">
    <input
      type="checkbox"
      checked={marketingConsent}
      onChange={(e) => setMarketingConsent(e.target.checked)}
      className="mt-1 h-4 w-4 rounded border-[#455C80] bg-[#0B0D12] text-[#567EFF]"
    />

    <span className="text-xs leading-relaxed text-[#AABBD4]">
      Deseo recibir novedades, contenidos educativos y
      comunicaciones comerciales de TOKVANT.
      Esta autorización es opcional.
    </span>
  </label>
</div>

            <div className="pt-4 flex items-center justify-between border-t border-[#273246]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-[#9BA6BD] hover:text-white transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={!consent || !email || !companyName || !fullName}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              >
                <span>Generar Diagnóstico Institucional</span>
                <Sparkles className="w-4 h-4 text-[#7096FF]" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PRELIMINARY DIAGNOSTIC RESULT */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#273246]">
                <div>
                  <div className="text-[11px] font-semibold text-[#7096FF] uppercase tracking-wider">
                  </div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    {generatedDraftId}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] text-xs font-semibold self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Orientación preliminar generada</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                <div>
                  <span className="text-[#9BA6BD] block">Organización Solicitante:</span>
                  <span className="text-white font-medium">{companyName}</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Jurisdicción Base:</span>
                  <span className="text-white font-medium">{country} (BCP / CNV / DLT)</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Activo Subyacente:</span>
                  <span className="text-white font-medium truncate block">{assetType}</span>
                </div>
                <div>
                  <span className="text-[#9BA6BD] block">Estándar EVM Recomendado:</span>
                  <span className="text-[#7096FF] font-bold font-mono text-sm">{recommendedStandard}</span>
                </div>
              </div>
            </div>

            {/* Recommendation analysis */}
            <div className="rounded-xl bg-[#141A27] border border-[#316BFA]/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7096FF]">
                <ShieldCheck className="w-4 h-4" />
                <span>Orientación técnica preliminar de TOKVANT</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para el activo <strong className="text-white">{assetType}</strong> radicado en <strong className="text-white">{country}</strong> con un volumen objetivo de <strong className="text-white">{estimatedVolume}</strong>, se recomienda estructurar bajo la norma <strong className="text-white">{recommendedStandard}</strong>. Este estándar puede incorporar mecanismos de identidad y
elegibilidad, según la implementación y configuración.
Su utilización no garantiza automáticamente cumplimiento regulatorio.
              </p>
              <div className="text-[11px] text-[#9BA6BD] pt-1">
                * Nota institucional: Este diagnóstico es de carácter orientativo preliminar y no constituye asesoría legal ni financiera vinculante. Requiere validación por la mesa técnica y de compliance de TOKVANT.
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-[#9BA6BD] hover:text-white transition-colors cursor-pointer"
              >
                Cerrar diagnóstico
              </button>

              <button
                type="button"
                onClick={handleStartProjectDraft}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors shadow-lg shadow-[#316BFA]/25 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Abrir en Asistente de Proyectos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
