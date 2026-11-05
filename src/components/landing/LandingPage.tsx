import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  FileCheck, 
  Globe2, 
  Sparkles, 
  Building, 
  Trees, 
  Coins, 
  Scale, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';
import { TokvanLogo } from '../brand/TokvanLogo';
import { TOKEN_STANDARDS } from '../../constants/standards';
import { StandardType } from '../../types';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenLeadModal: () => void;
  onSelectStandardDetail?: (std: StandardType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenLeadModal,
  onSelectStandardDetail,
}) => {
  const [activeTab, setActiveTab] = useState<StandardType>('ERC-3643');

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F8FAFC]">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-[#273246]">
        {/* Subtle geometric background grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#316BFA 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Value Proposition & Institutional Trust */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Regional origin & institutional descriptor (unboxed metadata) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#7096FF] tracking-wider uppercase">
                <span>Paraguay</span>
                <span aria-hidden="true" className="text-[#273246]">/</span>
                <span>Visión Global</span>
                <span aria-hidden="true" className="text-[#273246]">/</span>
                <span>Infraestructura Institucional EVM</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-white text-balance leading-[1.12]">
                Tecnología que transforma activos en <span className="text-[#316BFA]">oportunidades digitales</span>.
              </h1>

              {/* Body explanation */}
              <p className="text-base sm:text-lg text-[#9BA6BD] leading-relaxed max-w-2xl font-normal">
                TOKVAN es la plataforma SaaS empresarial de consultoría y tokenización para estructurar, simular, auditar y emitir activos del mundo real (RWA) sobre redes blockchain compatibles con EVM, con controles de cumplimiento, aprobaciones colegiadas y seguridad Zero-Trust.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={onOpenLeadModal}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-xl transition-all shadow-lg shadow-[#316BFA]/25 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#7096FF]" />
                  <span>Explorar Tokenización</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('simulator')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#141A27] hover:bg-[#1B2335] border border-[#273246] hover:border-[#7096FF] rounded-xl transition-all cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-[#7096FF]" />
                  <span>Abrir Simulador EVM</span>
                </button>

                <button
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-[#9BA6BD] hover:text-white transition-colors cursor-pointer"
                >
                  <span>Ver Demo Empresa</span>
                </button>
              </div>

              {/* Trust Indicators (unboxed) */}
              <div className="pt-6 border-t border-[#273246]/60 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-[#9BA6BD]">
                <div>
                  <div className="font-semibold text-white text-sm">Segregación de Roles</div>
                  <div>Maker-Checker y doble firma</div>
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Estándar ERC-3643</div>
                  <div>Cumplimiento e identidad on-chain</div>
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Simulación Controlada</div>
                  <div>Transparencia técnica sin riesgo</div>
                </div>
              </div>

            </div>

            {/* Right Column: Visual Brand Card with Official Asset and Institutional Badges */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-[#141A27] border border-[#273246] p-6 shadow-2xl space-y-6">
                
                {/* Visual Header with Brand Poster */}
                <div className="relative overflow-hidden rounded-xl bg-[#0B0D12] border border-[#273246] p-4 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/17f06f1e-7042-4115-b9d1-1f0c7e1f0d50_f7aafaaa.jpg"
                    alt="TOKVAN Consultoría y tokenización - Identidad Corporativa"
                    className="max-h-64 w-auto object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Live System Profile Status */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#273246]">
                    <span className="text-[#9BA6BD]">Entorno de Ejecución:</span>
                    <span className="font-mono text-slate-200">EVM Multi-Chain (Polygon, Arbitrum, Ethereum)</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#273246]">
                    <span className="text-[#9BA6BD]">Marco Normativo Base:</span>
                    <span className="text-slate-200">Paraguay (BCP / CNV / DLT) + Int.</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9BA6BD]">Gobernanza:</span>
                    <span className="text-[#7096FF] font-semibold">Firewall Lógico Previo al Despliegue</span>
                  </div>
                </div>

                {/* Quick teaser CTA */}
                <button
                  onClick={onOpenLeadModal}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-white bg-[#0B0D12] hover:bg-[#1B2335] border border-[#273246] hover:border-[#316BFA] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#316BFA]" />
                    <span>¿Tiene un activo para estructurar?</span>
                  </div>
                  <span className="text-[#7096FF]">Cotizar diagnóstico &rarr;</span>
                </button>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. INSTITUTIONAL POSITIONING & PILLARS */}
      <section className="py-20 border-b border-[#273246] bg-[#0E121A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl space-y-3 mb-14">
            <div className="text-xs font-semibold text-[#7096FF] uppercase tracking-wider">
              Posicionamiento Institucional
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-white text-balance">
              Infraestructura empresarial para finanzas programables y activos reales
            </h2>
            <p className="text-sm sm:text-base text-[#9BA6BD] leading-relaxed">
              TOKVAN no es una plataforma de especulación ni una token factory masiva. Proveemos la arquitectura técnica, legal y operativa para que bancos, fideicomisos, agroempresas y desarrolladores inmobiliarios emitan activos supervisados con trazabilidad garantizada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1 */}
            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#316BFA]/10 border border-[#316BFA]/20 flex items-center justify-center text-[#316BFA]">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                01. Cumplimiento & Segregación
              </h3>
              <p className="text-xs text-[#9BA6BD] leading-relaxed">
                Ningún contrato se despliega sin la aprobación colegiada de los revisores técnicos, oficiales de cumplimiento y el directorio de la empresa emisora.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#316BFA]/10 border border-[#316BFA]/20 flex items-center justify-center text-[#316BFA]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                02. Seguridad Zero-Trust
              </h3>
              <p className="text-xs text-[#9BA6BD] leading-relaxed">
                Firewall lógico de contratos inteligentes que valida bytecode contra el registro de plantillas certificadas. Sin custodia de claves privadas en navegadores.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#316BFA]/10 border border-[#316BFA]/20 flex items-center justify-center text-[#316BFA]">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                03. Adaptabilidad EVM Multi-Red
              </h3>
              <p className="text-xs text-[#9BA6BD] leading-relaxed">
                Conectores nativos para Polygon, Arbitrum y Ethereum con estimación matemática de gas, monitoreo de confirmaciones y soporte para testnets institucionales.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 3. INTERACTIVE STANDARDS SHOWCASE */}
      <section className="py-20 border-b border-[#273246]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs font-semibold text-[#7096FF] uppercase tracking-wider">
                Arquitectura de Estándares Contractuales
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">
                El estándar idóneo para cada clase de activo
              </h2>
              <p className="text-sm text-[#9BA6BD] mt-1">
                Explore las especificaciones técnicas y casos de uso de cada plantilla contractual soportada en TOKVAN.
              </p>
            </div>

            {/* Standard selector buttons */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#141A27] border border-[#273246] rounded-xl self-start md:self-auto">
              {(['ERC-3643', 'ERC-20', 'ERC-721', 'ERC-1155'] as StandardType[]).map((std) => (
                <button
                  key={std}
                  onClick={() => setActiveTab(std)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === std
                      ? 'bg-[#316BFA] text-white shadow-sm'
                      : 'text-[#9BA6BD] hover:text-white hover:bg-[#273246]'
                  }`}
                >
                  {std}
                </button>
              ))}
            </div>
          </div>

          {/* Active Standard Content Box */}
          {(() => {
            const std = TOKEN_STANDARDS[activeTab];
            return (
              <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 sm:p-8 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#273246]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold text-white">{std.code}</span>
                      <span className="text-sm text-[#7096FF] font-medium">— {std.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#9BA6BD] mt-1">{std.tagline}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9BA6BD]">Nivel de Cumplimiento:</span>
                    <span className="text-xs font-semibold text-white px-2.5 py-1 bg-[#0B0D12] border border-[#273246] rounded-md">
                      {std.complianceLevel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Description & Use cases */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Descripción y Arquitectura
                    </h4>
                    <p className="text-xs sm:text-sm text-[#9BA6BD] leading-relaxed">
                      {std.description}
                    </p>

                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pt-2">
                      Casos de Uso Principales
                    </h4>
                    <ul className="space-y-2">
                      {std.primaryUseCases.map((useCase, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-[#316BFA] shrink-0 mt-0.5" />
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: Key Advantages & Smart Contract Methods */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Ventajas Operativas Empresariales
                    </h4>
                    <ul className="space-y-2">
                      {std.keyAdvantages.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7096FF] shrink-0 mt-1.5" />
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>

                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pt-2">
                      Consideraciones Regulatorias
                    </h4>
                    <div className="rounded-lg bg-[#0B0D12] border border-[#273246] p-3 text-xs text-[#9BA6BD] leading-relaxed">
                      {std.regulatoryConsiderations}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onNavigate('simulator')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7096FF] hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Simular costo y parámetros de {std.code}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

        </div>
      </section>

      {/* 4. ASSET CLASSES WE STRUCTURE */}
      <section className="py-20 border-b border-[#273246] bg-[#0E121A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-semibold text-[#7096FF] uppercase tracking-wider">
              Sectores de Aplicación
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">
              Activos estructurables bajo la legislación paraguaya e internacional
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-5 space-y-3">
              <Trees className="w-6 h-6 text-[#16A34A]" />
              <h3 className="text-base font-bold text-white font-display">Agropecuario & Silvopastoril</h3>
              <p className="text-xs text-[#9BA6BD] leading-relaxed">
                Fideicomisos de tierras, producción ganadera y plantaciones de eucalipto con trazabilidad pericial y cuotapartes reguladas.
              </p>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-5 space-y-3">
              <Building className="w-6 h-6 text-[#316BFA]" />
              <h3 className="text-base font-bold text-white font-display">Inmobiliario Corporativo</h3>
              <p className="text-xs text-[#9BA6BD] leading-relaxed">
                Torres de oficinas, depósitos logísticos y centros comerciales fraccionados para inversores institucionales calificados.
              </p>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-5 space-y-3">
              <Coins className="w-6 h-6 text-[#7096FF]" />
              <h3 className="text-base font-bold text-white font-display">Deuda Privada & Factoring</h3>
              <p className="text-xs text-[#9BA6BD] leading-relaxed">
                Titularización de carteras de crédito corporativo, facturas comerciales y pagarés bursátiles con liquidación programada.
              </p>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-5 space-y-3">
              <Globe2 className="w-6 h-6 text-[#D97706]" />
              <h3 className="text-base font-bold text-white font-display">Infraestructura & Energía</h3>
              <p className="text-xs text-[#9BA6BD] leading-relaxed">
                Parques solares, barcazas para la hidrovía Paraguay-Paraná y proyectos de transmisión con rendimientos atados al flujo de caja.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. PROCESS WORKFLOW OVERVIEW */}
      <section className="py-20 border-b border-[#273246]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="text-xs font-semibold text-[#7096FF] uppercase tracking-wider">
              Gobernanza Operativa
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
              De la consultoría al despliegue en 6 etapas controladas
            </h2>
            <p className="text-sm text-[#9BA6BD]">
              Cada fase requiere validación documental y técnica sin atajos que comprometan la seguridad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            
            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#7096FF]">ETAPA 01</div>
              <h4 className="text-sm font-bold text-white">Diagnóstico</h4>
              <p className="text-[11px] text-[#9BA6BD] leading-relaxed">
                Análisis del activo, objetivo financiero y adecuación a la jurisdicción.
              </p>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#7096FF]">ETAPA 02</div>
              <h4 className="text-sm font-bold text-white">Estructuración</h4>
              <p className="text-[11px] text-[#9BA6BD] leading-relaxed">
                Selección de estándar EVM, red y configuración de parámetros en el wizard.
              </p>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#7096FF]">ETAPA 03</div>
              <h4 className="text-sm font-bold text-white">Simulación</h4>
              <p className="text-[11px] text-[#9BA6BD] leading-relaxed">
                Cálculo de costos de gas, throughput de transferencias y límites operativos.
              </p>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#7096FF]">ETAPA 04</div>
              <h4 className="text-sm font-bold text-white">Security Pre-Flight</h4>
              <p className="text-[11px] text-[#9BA6BD] leading-relaxed">
                Validación de bytecode certificado y firewall lógico contra vulnerabilidades.
              </p>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#7096FF]">ETAPA 05</div>
              <h4 className="text-sm font-bold text-white">Aprobación</h4>
              <p className="text-[11px] text-[#9BA6BD] leading-relaxed">
                Revisión colegiada técnica, legal de compliance y autorización del Directorio.
              </p>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#7096FF]">ETAPA 06</div>
              <h4 className="text-sm font-bold text-white">Supervisión</h4>
              <p className="text-[11px] text-[#9BA6BD] leading-relaxed">
                Despliegue autorizado, indexación de eventos y monitoreo continuo de actividad.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. CALL TO ACTION STRIP */}
      <section className="py-16 bg-[#141A27]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white max-w-xl mx-auto">
            Comience a estructurar el activo digital de su organización
          </h2>
          <p className="text-sm text-[#9BA6BD] max-w-lg mx-auto">
            Obtenga un diagnóstico preliminar sin compromiso y descubra la viabilidad técnica y contractual en minutos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenLeadModal}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-xl transition-colors cursor-pointer shadow-lg shadow-[#316BFA]/20"
            >
              <span>Comenzar Diagnóstico Institucional</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('wizard')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0B0D12] hover:bg-[#1B2335] border border-[#273246] rounded-xl transition-colors cursor-pointer"
            >
              <span>Acceder al Asistente de Proyectos</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. INSTITUTIONAL FOOTER */}
      <footer className="py-12 border-t border-[#273246] bg-[#0B0D12] text-xs text-[#9BA6BD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <TokvanLogo size="sm" variant="standard" />
            <span className="text-[#273246]">|</span>
            <span>Tecnología que transforma activos en oportunidades digitales</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span>Paraguay · Visión Global</span>
            <span>SaaS EVM Architecture</span>
            <button 
              onClick={() => onNavigate('architecture')}
              className="text-[#7096FF] hover:underline cursor-pointer"
            >
              Documentación & ADRs
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-[#273246]/40 text-[11px] text-[#9BA6BD]/80 text-center md:text-left">
          Aviso Institucional: TOKVAN provee infraestructura tecnológica de consultoría y tokenización. Las simulaciones y demostraciones no representan transacciones en mainnet ni constituyen asesoramiento de inversión regulada. La tokenización de activos requiere el debido proceso ante las autoridades pertinentes de cada jurisdicción.
        </div>
      </footer>

    </div>
  );
};
