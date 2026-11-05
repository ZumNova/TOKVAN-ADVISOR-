import { StandardType } from '../types';

export interface StandardProfile {
  code: StandardType;
  title: string;
  tagline: string;
  isRwaSpecialized: boolean;
  description: string;
  primaryUseCases: string[];
  complianceLevel: 'Básico / Sin reglas integradas' | 'Condicional por contrato' | 'Cumplimiento Institucional Nativo (ERC-3643)';
  architecturalComponents: string[];
  keyAdvantages: string[];
  regulatoryConsiderations: string;
  smartContractMethods: string[];
}

export const TOKEN_STANDARDS: Record<StandardType, StandardProfile> = {
  'ERC-3643': {
    code: 'ERC-3643',
    title: 'Permissioned Token Standard (T-REX)',
    tagline: 'Estándar institucional para Security Tokens con verificación de identidad on-chain',
    isRwaSpecialized: true,
    description:
      'Diseñado específicamente para activos del mundo real (RWA) regulados. Integra un registro de identidades (Identity Registry), verificadores de claims (ONCHAINID) y un motor de reglas de transferencia (Compliance Rules). Garantiza que ninguna transferencia pueda ejecutarse si el emisor o receptor no cumplen con los requisitos de KYC/KYB y jurisdicción.',
    primaryUseCases: [
      'Valores negociables y acciones de sociedades no cotizadas',
      'Fondos inmobiliarios con cuotapartes reguladas',
      'Títulos de deuda corporativa y bonos verdes',
      'Fideicomisos agropecuarios y forestales en Paraguay y LatAm',
    ],
    complianceLevel: 'Cumplimiento Institucional Nativo (ERC-3643)',
    architecturalComponents: [
      'Identity Registry (Almacena identidades ONCHAINID validadas)',
      'Compliance Contract (Reglas de país, cupos máximos de inversores, lockup)',
      'Claim Topics Registry (Validadores acreditados de KYC y residencia)',
      'Agent Management (Capacidad de pausado, congelamiento y recuperación legal)',
    ],
    keyAdvantages: [
      'Imposibilidad técnica de transferencias no autorizadas',
      'Cumplimiento automático de normativas de valores sin custodio centralizado',
      'Soporte para recuperación de tokens por orden judicial o pérdida de claves',
      'Totalmente compatible con interfaces ERC-20 para billeteras y custodios',
    ],
    regulatoryConsiderations:
      'Requiere proceso de emisión estructurado según CNV/BCP o regulador de la jurisdicción elegida. TOKVAN valida los supuestos de compliance antes de cualquier despliegue.',
    smartContractMethods: [
      'canTransfer(address _from, address _to, uint256 _amount) view returns (bool)',
      'setIdentityRegistry(address _identityRegistry)',
      'setCompliance(address _compliance)',
      'forcedTransfer(address _from, address _to, uint256 _amount)',
      'freezePartialTokens(address _userAddress, uint256 _amount)',
    ],
  },
  'ERC-20': {
    code: 'ERC-20',
    title: 'Fungible Token Standard',
    tagline: 'Estándar universal para activos divisibles e intercambiables',
    isRwaSpecialized: false,
    description:
      'El estándar más adoptado en redes EVM para activos donde cada unidad es idéntica a otra. Utilizado para representación de commodities, puntos de recompensa o cuotas no reguladas.',
    primaryUseCases: [
      'Créditos de carbono fungibles y certificados de sostenibilidad',
      'Unidades de liquidación interna entre filiales corporativas',
      'Representación de gramos de commodities (oro, soja certificada)',
      'Instrumentos de liquidez con reglas de transferencia simplificadas',
    ],
    complianceLevel: 'Básico / Sin reglas integradas',
    architecturalComponents: [
      'Total Supply & Balances Ledger',
      'Allowance & Delegated Transfer Engine',
      'Pausable Extension (Recomendado para uso empresarial)',
      'AccessControl (Roles de administración y minteo)',
    ],
    keyAdvantages: [
      'Máxima compatibilidad con infraestructuras DeFi, wallets y exchanges institucionales',
      'Costos de gas mínimos y ejecución predecible',
      'Extensibilidad probada con librerías OpenZeppelin',
    ],
    regulatoryConsiderations:
      'No incluye filtros de KYC nativos. Si el activo subyacente califica como valor negociable, se debe adicionar un contrato envoltorio de whitelist o migrar a ERC-3643.',
    smartContractMethods: [
      'transfer(address to, uint256 amount) returns (bool)',
      'approve(address spender, uint256 amount) returns (bool)',
      'transferFrom(address from, address to, uint256 amount) returns (bool)',
      'pause() / unpause() [Extensión Empresarial]',
    ],
  },
  'ERC-721': {
    code: 'ERC-721',
    title: 'Non-Fungible Token (NFT) Standard',
    tagline: 'Estándar para activos únicos e indivisibles con trazabilidad pericial',
    isRwaSpecialized: false,
    description:
      'Cada token posee un identificador numérico único y metadatos verificables que no pueden ser intercambiados 1:1 por otro. Ideal para titularidad individualizada de bienes físicos o derechos exclusivos.',
    primaryUseCases: [
      'Títulos de propiedad inmobiliaria y fincas georreferenciadas en Catastro',
      'Maquinaria industrial o agrícola pesada con número de serie y peritaje',
      'Obras de arte, derechos de propiedad intelectual y patentes industriales',
      'Contratos de concesión o licencias de explotación con plazo determinado',
    ],
    complianceLevel: 'Condicional por contrato',
    architecturalComponents: [
      'TokenId Unique Indexing',
      'TokenURI (Metadatos inmutables en IPFS / Arweave con hash SHA-256)',
      'Enforceable Transfer Restrictions & Royalty Registry (ERC-2981)',
      'Role-based Revocation Mechanism',
    ],
    keyAdvantages: [
      'Identificación inequívoca de cada activo subyacente',
      'Metadatos enriquecidos (planos, peritajes, dictámenes legales) anclados criptográficamente',
      'Historial de traspasos auditable en cadena desde su origen',
    ],
    regulatoryConsiderations:
      'El registro del token debe correlacionarse legalmente con la inscripción en los Registros Públicos de la jurisdicción física donde radique el bien.',
    smartContractMethods: [
      'ownerOf(uint256 tokenId) view returns (address)',
      'safeTransferFrom(address from, address to, uint256 tokenId)',
      'tokenURI(uint256 tokenId) view returns (string)',
    ],
  },
  'ERC-1155': {
    code: 'ERC-1155',
    title: 'Multi-Token Standard',
    tagline: 'Estándar híbrido para emisiones con múltiples tramos y series',
    isRwaSpecialized: false,
    description:
      'Permite administrar un número ilimitado de tipos de tokens (fungibles y no fungibles) dentro de un único contrato inteligente desplegado. Reduce drásticamente costos operativos y de despliegue en proyectos con múltiples clases de activos.',
    primaryUseCases: [
      'Programas de pagarés o factoring con diferentes fechas de vencimiento',
      'Emisiones de bonos estructurados en tramos (Senior, Mezzanine, Equity)',
      'Desarrollos inmobiliarios con unidades residenciales y tokens de renta común',
      'Lotes agropecuarios fraccionados por cosecha y zafra',
    ],
    complianceLevel: 'Condicional por contrato',
    architecturalComponents: [
      'Batch Transfer Engine (Transferencias múltiples en una sola transacción)',
      'Multi-Id Balance Tracker',
      'Dynamic URI with replacement {id}',
      'Modular Permission Controller',
    ],
    keyAdvantages: [
      'Ahorro de hasta un 85% en costos de gas comparado con desplegar contratos individuales',
      'Operaciones en lote (Batch Transfers) para distribuciones masivas de cuotas o dividendos',
      'Arquitectura limpia y unificada para portafolios complejos',
    ],
    regulatoryConsiderations:
      'La coexistencia de activos con diferentes perfiles de riesgo dentro del mismo contrato requiere claridad explícita en los términos contractuales de cada tramo.',
    smartContractMethods: [
      'safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
      'balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
      'uri(uint256 id) view returns (string)',
    ],
  },
};
