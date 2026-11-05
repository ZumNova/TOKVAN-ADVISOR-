import React, { useState } from 'react';
import { 
  Database, 
  Layers, 
  ShieldCheck, 
  Code2, 
  Cpu, 
  Workflow, 
  FileText, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const ArchitectureDocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'er' | 'adrs' | 'status' | 'security'>('status');

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#273246]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
          <Layers className="w-4 h-4" />
          <span>Arquitectura Empresarial TOKVAN</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#9BA6BD]">Fase 1: MVP Visual Funcional + Base Técnica</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
          Documentación Arquitectónica, ADRs y Modelo de Datos
        </h1>
        <p className="text-xs text-[#9BA6BD] mt-1">
          Especificación formal del sistema SaaS multi-tenant, motor de aprobaciones, integración EVM y diferenciación explícita entre capacidades activas y simuladas.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-[#141A27] border border-[#273246] rounded-xl text-xs font-medium">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'status' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          Matriz de Estado (Real vs Simulado)
        </button>

        <button
          onClick={() => setActiveTab('er')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'er' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          Modelo Relacional (PostgreSQL)
        </button>

        <button
          onClick={() => setActiveTab('adrs')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'adrs' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          ADRs (Decisiones de Arquitectura)
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'security' ? 'bg-[#316BFA] text-white font-semibold shadow-sm' : 'text-[#9BA6BD] hover:text-white'
          }`}
        >
          Seguridad Zero-Trust & Firewall
        </button>
      </div>

      {/* TAB 1: TRANSPARENCY STATUS MATRIX */}
      {activeTab === 'status' && (
        <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Matriz de Transparencia de Implementación (Criterio de Calidad §0 y §28)
            </h2>
            <p className="text-xs text-[#9BA6BD] mt-1">
              Diferenciación rigurosa entre las capacidades funcionales interactivas de la Fase 1 y las integraciones de infraestructura previstas en el Roadmap.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#273246] bg-[#0B0D12]/70 text-[#9BA6BD]">
                  <th className="py-3 px-4 font-semibold">Componente / Módulo</th>
                  <th className="py-3 px-4 font-semibold">Estado en Fase 1</th>
                  <th className="py-3 px-4 font-semibold">Mecanismo Operativo</th>
                  <th className="py-3 px-4 font-semibold">Evolución en Fase 2/3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#273246] text-slate-200">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Design System & Brand Assets</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">100% Implementado</td>
                  <td className="py-3 px-4 text-[#9BA6BD]">Isotipo vectorial fiel + Asset fotográfico oficial</td>
                  <td className="py-3 px-4 text-[#7096FF]">Exportables SVG/Figma para empresas</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Wizard de Proyectos (5 etapas / 13 pasos)</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">100% Funcional</td>
                  <td className="py-3 px-4 text-[#9BA6BD]">Persistencia reactiva en sesión + validación estricta</td>
                  <td className="py-3 px-4 text-[#7096FF]">Persistencia PostgreSQL con RLS</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Simulador EVM de Gas & Cap Table</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">100% Funcional</td>
                  <td className="py-3 px-4 text-[#9BA6BD]">Fórmulas matemáticas en vivo para Polygon, Arb y Eth</td>
                  <td className="py-3 px-4 text-[#7096FF]">Oráculos de gas en tiempo real (Chainlink)</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Motor de Aprobaciones Colegiadas</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">100% Interactivo</td>
                  <td className="py-3 px-4 text-[#9BA6BD]">Maker-Checker con firma simulada y segregación</td>
                  <td className="py-3 px-4 text-[#7096FF]">Firma EIP-712 / Safe Transaction Service</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Contract Template Registry</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">100% Verificado</td>
                  <td className="py-3 px-4 text-[#9BA6BD]">Hashes SHA-256 pre-calculados de plantillas auditadas</td>
                  <td className="py-3 px-4 text-[#7096FF]">Integración con Sourcify y Etherscan API</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-white">TOKVAN AI (Bot Educativo + Advisor)</td>
                  <td className="py-3 px-4 text-[#16A34A] font-semibold">100% Operativo</td>
                  <td className="py-3 px-4 text-[#9BA6BD]">Análisis contextual del proyecto activo sin permisos de escritura</td>
                  <td className="py-3 px-4 text-[#7096FF]">RAG de jurisprudencia CNV/BCP y Ley DLT</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Despliegue Blockchain en Mainnet</td>
                  <td className="py-3 px-4 text-[#D97706] font-semibold">Simulado / Bloqueado</td>
                  <td className="py-3 px-4 text-[#9BA6BD]">Identificado explícitamente como simulación sin fondos reales</td>
                  <td className="py-3 px-4 text-[#7096FF]">Fase 4: Custodia MPC y testnets Sepolia/Amoy</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RELATIONAL MODEL */}
      {activeTab === 'er' && (
        <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Modelo Relacional PostgreSQL & Aislamiento Multi-Tenant (§17)
            </h2>
            <p className="text-xs text-[#9BA6BD] mt-1">
              Esquema de datos diseñado para backend NestJS con Prisma ORM y Row-Level-Security (RLS).
            </p>
          </div>

          <div className="bg-[#0B0D12] p-5 rounded-xl border border-[#273246] font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`-- ENTIDADES DE IDENTIDAD Y MULTI-TENANCY
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL UNIQUE, -- RUC Paraguay
    country_iso VARCHAR(2) NOT NULL DEFAULT 'PY',
    kyb_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'ADMIN', 'TECHNICAL_REVIEWER', 'COMPLIANCE', 'DIRECTOR'
    mfa_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENTIDADES DE PROYECTO Y EXPEDIENTE
CREATE TABLE projects (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'TOKVAN-PY-2027-000145'
    organization_id UUID NOT NULL REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    standard VARCHAR(20) NOT NULL, -- 'ERC-3643', 'ERC-20', etc.
    network VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    target_valuation NUMERIC(18, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESPECIFICACIÓN DE SMART CONTRACTS
CREATE TABLE contract_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(64) REFERENCES projects(id),
    template_id VARCHAR(64) NOT NULL,
    bytecode_hash VARCHAR(66) NOT NULL,
    deployed_address VARCHAR(42),
    chain_id INT NOT NULL,
    is_simulation BOOLEAN DEFAULT TRUE
);

-- MOTOR DE APROBACIONES (MAKER-CHECKER)
CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(64) REFERENCES projects(id),
    role VARCHAR(50) NOT NULL,
    approver_user_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    signature_hash VARCHAR(132),
    decision_at TIMESTAMPTZ,
    comments TEXT
);`}
          </div>
        </div>
      )}

      {/* TAB 3: ADRS */}
      {activeTab === 'adrs' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#141A27] border border-[#273246] space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#7096FF]">ADR-001</span>
              <span className="text-xs text-[#9BA6BD]">·</span>
              <h3 className="text-sm font-bold text-white">Selección de ERC-3643 como Estándar Core para RWA</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Contexto:</strong> Los Security Tokens requieren estricto control de transferencia conforme a la legislación de valores (CNV/BCP).<br />
              <strong>Decisión:</strong> Adoptar la arquitectura ERC-3643 (T-REX) que separa el contrato de token del Identity Registry y del Compliance Engine.<br />
              <strong>Consecuencia:</strong> Imposibilidad matemática de que un tercero no verificado adquiera tokens en mercados secundarios.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141A27] border border-[#273246] space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#7096FF]">ADR-002</span>
              <span className="text-xs text-[#9BA6BD]">·</span>
              <h3 className="text-sm font-bold text-white">Segregación Estricta de Funciones (Maker-Checker 3-Role)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Contexto:</strong> Evitar que un solo operador configure y despliegue un contrato sin auditoría pericial.<br />
              <strong>Decisión:</strong> Requerir 3 firmas independientes: Técnico (código y gas), Compliance (KYC/KYB y marco legal) y Directorio (apoderado legal). Se prohíbe la auto-aprobación.<br />
              <strong>Consecuencia:</strong> Trazabilidad auditable inmutable antes de cualquier interacción on-chain.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141A27] border border-[#273246] space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#7096FF]">ADR-003</span>
              <span className="text-xs text-[#9BA6BD]">·</span>
              <h3 className="text-sm font-bold text-white">Arquitectura Multi-Red con Adaptadores EVM Independientes</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Contexto:</strong> Las organizaciones varían entre emisiones de bajo costo (Polygon/Arbitrum) y grandes emisiones fiduciarias (Ethereum L1).<br />
              <strong>Decisión:</strong> Implementar abstracción de red agnóstica de cadena con interfaz común de estimación de gas y verificación de confirmaciones.<br />
              <strong>Consecuencia:</strong> Incorporación transparente de nuevas L2s sin alterar la lógica de negocio.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: ZERO TRUST */}
      {activeTab === 'security' && (
        <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display">
            Principios del Firewall Lógico Pre-Deploy (§14)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] space-y-1.5">
              <div className="font-bold text-white">1. Verificación Criptográfica de Bytecode</div>
              <p className="text-[#9BA6BD]">
                El compilador local genera el bytecode y compara su hash SHA-256 contra las plantillas certificadas de TOKVAN. Cualquier modificación no autorizada bloquea el despliegue.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] space-y-1.5">
              <div className="font-bold text-white">2. Sin Almacenamiento de Claves Privadas</div>
              <p className="text-[#9BA6BD]">
                TOKVAN nunca solicita seed phrases ni almacena claves en navegadores o servidores. La firma se delega a proveedores institucionales de custodia MPC o Safe Multi-Sig.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] space-y-1.5">
              <div className="font-bold text-white">3. Control de Cap y Permisos Inmutables</div>
              <p className="text-[#9BA6BD]">
                Se verifica que la función de emisión posterior (mint) no pueda ser invocada por direcciones no autorizadas ni supere el tope pericial de valuación del activo.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#273246] space-y-1.5">
              <div className="font-bold text-white">4. Aislamiento Row-Level-Security (RLS)</div>
              <p className="text-[#9BA6BD]">
                Cada solicitud al backend valida el tenant autenticado mediante claims criptográficos JWT, imposibilitando el acceso cruzado entre empresas cliente.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
