import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  Compass, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { TokenProject } from '../../types';

interface TokvanAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: TokenProject | null;
  onApplyAdvisorSuggestion?: (suggestion: string) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  layer: 'educativo' | 'advisor';
  recommendation?: {
    topic: string;
    actionableText: string;
    riskNote: string;
  };
}

export const TokvanAiDrawer: React.FC<TokvanAiDrawerProps> = ({
  isOpen,
  onClose,
  activeProject,
  onApplyAdvisorSuggestion,
}) => {
  const [activeLayer, setActiveLayer] = useState<'educativo' | 'advisor'>('advisor');
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      layer: 'advisor',
      text: activeProject
        ? `Hola. Soy TOKVAN Advisor. He analizado el expediente activo "${activeProject.title}" (${activeProject.parameters.tokenSymbol}). He detectado que está configurado bajo el estándar ${activeProject.standard} en ${activeProject.network}. ¿Desea revisar la solidez de sus reglas de cumplimiento o los costos estimados de gas?`
        : 'Bienvenido a TOKVAN Advisor. Puedo orientarlo en la elección de estándares EVM, análisis de riesgos de transferibilidad y adecuación a la normativa de la CNV/BCP.',
      recommendation: activeProject && activeProject.standard === 'ERC-3643' ? {
        topic: 'Verificación de Claim Topics',
        actionableText: 'Asegúrese de vincular el registro de inversores acreditados antes de iniciar el circuito de firmas de compliance.',
        riskNote: 'Si se omite el Claim Issuer acreditado, las transferencias secundarias quedarán bloqueadas por el contrato de compliance.',
      } : undefined,
    },
  ]);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      layer: activeLayer,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputQuery('');

    // Responsive simulation logic based on question
    setTimeout(() => {
      let replyText = '';
      let recommendation: Message['recommendation'] | undefined = undefined;

      const lower = userText.toLowerCase();

      if (activeLayer === 'educativo') {
        if (lower.includes('gas') || lower.includes('costo')) {
          replyText =
            'El gas es la unidad de cómputo en redes EVM requerida para procesar y validar transacciones. En Polygon y Arbitrum, las tarifas suelen costar fracciones de centavo de dólar (< $0.05), mientras que en Ethereum L1 pueden fluctuar según la congestión de la red ($2 a $20+ USD).';
        } else if (lower.includes('erc-3643') || lower.includes('3643')) {
          replyText =
            'El estándar ERC-3643 (conocido como T-REX) es la norma institucional por excelencia para Security Tokens. A diferencia de un ERC-20 común, integra un Identity Registry que verifica ONCHAINID y reglas de elegibilidad del inversor antes de autorizar cualquier movimiento de tokens.';
        } else if (lower.includes('paraguay') || lower.includes('ley') || lower.includes('cnv') || lower.includes('bcp')) {
          replyText =
            'En Paraguay, la tokenización de activos del mundo real se estructura mediante figuras fiduciarias (Ley de Fideicomisos), fondos de inversión cerrados o valores desmaterializados supervisados por la Superintendencia de Valores (ex CNV) y el BCP. TOKVAN valida la concordancia jurídica de cada proyecto.';
        } else {
          replyText =
            'Como bot educativo en modo lectura, puedo explicarle conceptos de arquitectura blockchain, tipos de billeteras institucionales, diferencias entre estándares de tokens y mitigación de riesgos operativos. ¿Qué concepto desea profundizar?';
        }
      } else {
        // ADVISOR LAYER
        if (lower.includes('riesgo') || lower.includes('seguridad')) {
          replyText =
            'He evaluado los parámetros de su activo. Se recomienda mantener la pausabilidad de emergencia activa para proteger a los inversores ante controversias registrales. Asimismo, el rol de administración debe ser exclusivo de una billetera Multi-Sig institucional (Safe 3-de-5).';
          recommendation = {
            topic: 'Segregación de Llaves Privadas',
            actionableText: 'Designar al menos 3 firmantes independientes en la política de gobernanza.',
            riskNote: 'Nunca utilice billeteras calientes con llave privada única para el despliegue.',
          };
        } else if (lower.includes('estándar') || lower.includes('red')) {
          replyText =
            'Para proyectos con inversores calificados y reparto de dividendos o cuotas, Polygon PoS y Arbitrum One ofrecen el balance óptimo entre bajo costo de gas y alta liquidez. El estándar ERC-3643 es mandatorio si el activo califica como valor negociable.';
        } else {
          replyText =
            'Observación del Advisor: Recuerde que las recomendaciones de este módulo son asistenciales y no ejecutan cambios de manera autónoma. Cualquier ajuste debe ser confirmado por usted y refrendado por la mesa colegiada.';
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'ai',
          text: replyText,
          layer: activeLayer,
          recommendation,
        },
      ]);
    }, 400);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#141A27] border-l border-[#273246] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#273246] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#316BFA] flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-sm font-display flex items-center gap-1.5">
              <span>TOKVAN AI</span>
              <span className="text-[10px] font-semibold text-[#7096FF] px-1.5 py-0.2 rounded bg-[#316BFA]/20">
                Dual-Layer
              </span>
            </div>
            <div className="text-[11px] text-[#9BA6BD]">
              {activeLayer === 'educativo' ? 'Capa A: Bot Educativo (Solo Lectura)' : 'Capa B: Advisor de Configuración'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-[#9BA6BD] hover:text-white p-1 rounded-lg hover:bg-[#273246] transition-colors cursor-pointer"
          aria-label="Cerrar asistente AI"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Layer Tabs */}
      <div className="grid grid-cols-2 p-2 bg-[#0B0D12] border-b border-[#273246] text-xs font-semibold">
        <button
          onClick={() => setActiveLayer('advisor')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors cursor-pointer ${
            activeLayer === 'advisor'
              ? 'bg-[#141A27] text-white shadow-sm'
              : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-[#316BFA]" />
          <span>TOKVAN Advisor</span>
        </button>

        <button
          onClick={() => setActiveLayer('educativo')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors cursor-pointer ${
            activeLayer === 'educativo'
              ? 'bg-[#141A27] text-white shadow-sm'
              : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#7096FF]" />
          <span>Bot Educativo</span>
        </button>
      </div>

      {/* Operational Authority Notice */}
      <div className="px-4 py-2 bg-[#0B0D12]/70 border-b border-[#273246] text-[11px] text-[#9BA6BD] flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-[#7096FF] shrink-0" />
        <span>
          {activeLayer === 'educativo'
            ? 'Modo informativo general sin acceso de escritura a expedientes.'
            : 'El Advisor no puede aprobar, firmar ni desplegar contratos autónomamente.'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#316BFA] text-white rounded-br-none'
                  : 'bg-[#0B0D12] border border-[#273246] text-slate-200 rounded-bl-none space-y-2'
              }`}
            >
              <p>{msg.text}</p>

              {msg.recommendation && (
                <div className="mt-2 p-2.5 rounded-lg bg-[#141A27] border border-[#316BFA]/40 space-y-1.5 text-[11px]">
                  <div className="font-bold text-[#7096FF] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                    <span>Recomendación: {msg.recommendation.topic}</span>
                  </div>
                  <p className="text-slate-300">{msg.recommendation.actionableText}</p>
                  <p className="text-[#D97706] italic text-[10px]">Riesgo: {msg.recommendation.riskNote}</p>
                </div>
              )}
            </div>
            <span className="text-[10px] text-[#9BA6BD] mt-1 px-1">
              {msg.sender === 'user' ? 'Usted' : msg.layer === 'educativo' ? 'TOKVAN Educativo' : 'TOKVAN Advisor'}
            </span>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-[#273246] bg-[#0B0D12]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              activeLayer === 'educativo'
                ? 'Pregunte sobre gas, ERC-3643, wallets o normativa...'
                : 'Consulte sobre parámetros, riesgos o alternativas del proyecto...'
            }
            className="w-full rounded-xl bg-[#141A27] border border-[#273246] pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-[#9BA6BD]/60 focus:outline-none focus:border-[#316BFA]"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="absolute right-2 p-1.5 rounded-lg bg-[#316BFA] hover:bg-[#2557DC] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            aria-label="Enviar consulta"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

    </div>
  );
};
