export type StandardType = 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'ERC-3643';

export type NetworkId = 'ethereum' | 'polygon' | 'arbitrum' | 'sepolia';

export type ProjectStatus =
  | 'Borrador'
  | 'Preliminar'
  | 'En configuración'
  | 'Pendiente de documentos'
  | 'Listo para simulación'
  | 'Simulado'
  | 'En revisión'
  | 'Requiere correcciones'
  | 'Pendiente de aprobación'
  | 'Aprobado'
  | 'Listo para despliegue'
  | 'Despliegue en curso'
  | 'Desplegado'
  | 'Requiere atención'
  | 'Suspendido'
  | 'Archivado';

export type RiskLevel = 'Informativo' | 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

export type UserRole =
  | 'Super Admin'
  | 'Technical Reviewer'
  | 'Compliance Reviewer'
  | 'Customer Success'
  | 'Administrador'
  | 'Operador'
  | 'Aprobador'
  | 'Auditor';

export interface EVMNetwork {
  id: NetworkId;
  name: string;
  chainId: number;
  currency: string;
  rpcUrl: string;
  blockExplorer: string;
  avgBlockTimeSeconds: number;
  avgGasPriceGwei: number;
  isTestnet: boolean;
  status: 'active' | 'degraded' | 'maintenance';
}

export interface ContractTemplate {
  id: string;
  standard: StandardType;
  version: string;
  name: string;
  description: string;
  bytecodeHash: string;
  compiler: string;
  dependencies: string[];
  status: 'Draft' | 'Under Review' | 'Approved' | 'Certified' | 'Deprecated';
  auditFirm: string;
  auditDate: string;
  auditReportUrl: string;
  supportedNetworks: NetworkId[];
  knownRisks: string[];
}

export interface ProjectDocument {
  id: string;
  name: string;
  category: 'Legal' | 'Técnico' | 'Financiero' | 'Compliance';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: 'Verificado' | 'Pendiente' | 'Rechazado';
  storage?: 'browser' | 'remote';
  sha256?: string;
  sizeBytes?: number;
}

export interface TokenParameters {
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  initialSupply: number;
  maxSupply?: number;
  isPausable: boolean;
  isBurnable: boolean;
  isMintable: boolean;
  isUpgradeabilityEnabled: boolean;
  transferRestrictions: 'Sin restricción' | 'Lista blanca (Whitelist)' | 'Permisos ERC-3643 (Identity Registry)' | 'Regulada por país';
  custodyModel: 'Custodia institucional MPC' | 'Multi-firma institucional' | 'Bóveda corporativa segregada';
  complianceRules: {
    requireKYC: boolean;
    requireKYB: boolean;
    restrictSanctionedCountries: boolean;
    maxHoldersLimit?: number;
    lockupPeriodDays?: number;
  };
}

export interface SecurityCheckItem {
  id: string;
  title: string;
  category: 'Bytecode' | 'Permisos' | 'Gobernanza' | 'Cumplimiento';
  level: RiskLevel;
  passed: boolean;
  details: string;
}

export interface ApprovalStep {
  id: string;
  role: 'Technical Reviewer' | 'Compliance Reviewer' | 'Enterprise Board';
  label: string;
  approverName?: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Corrección solicitada';
  timestamp?: string;
  comments?: string;
  signatureHash?: string;
  signerWallet?: string;
  signedProjectHash?: string;
  signedMessage?: string;
}

export interface TokenProject {
  id: string; // e.g. "TOKVAN-PY-2027-000145"
  title: string;
  organizationId: string;
  organizationName: string;
  assetType: 'Inmobiliario' | 'Agropecuario' | 'Deuda / Factoring' | 'Infraestructura' | 'Fondo Privado' | 'Derechos de Emisión' | 'Otro';
  assetTypeOther?: string;
  assetDescription?: string;
  taxId?: string;
  contact?: {fullName:string;email:string;phone:string;consent:boolean};
  commercialContext?: {targetAudience:string;commercialChannels:string;objective:string;country:string;sector:string;experienceLevel:string;marketingConsent:boolean};
  completenessScore?: number;
  submissionId?: string;
  receivedAt?: string;
  clientWalletAddress?: string;
  clientWalletNetwork?: NetworkId;
  walletSupportRequested?: boolean;
  jurisdiction: 'Paraguay (BCP / CNV / Ley DLT)' | 'Argentina' | 'Estados Unidos (Reg D / Reg S)' | 'Suiza (DLT Act)' | 'Unión Europea (MiCA)' | 'Multi-jurisdiccional' | 'Por definir (revisión del expediente)';
  standard: StandardType;
  network: NetworkId;
  status: ProjectStatus;
  progressPercent: number;
  targetValuationUsd: number;
  createdAt: string;
  updatedAt: string;
  parameters: TokenParameters;
  documents: ProjectDocument[];
  securityScore: number;
  securityChecks: SecurityCheckItem[];
  approvals: ApprovalStep[];
  deployedContractAddress?: string;
  isSimulationOnly: boolean;
}

export interface LeadSubmission {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  assetSector: string;
  estimatedVolume: string;
  readinessLevel: string;
  notes?: string;
  assignedAdvisor?: string;
  status: 'Nuevo' | 'En evaluación' | 'Diagnóstico emitido' | 'Convertido a Proyecto';
  createdAt: string;
}

export interface OrganizationTenant {
  id: string;
  legalName: string;
  taxId: string; // RUC en Paraguay u homólogo
  country: string;
  tier: 'Enterprise' | 'Fintech' | 'Institución Financiera';
  activeProjectsCount: number;
  deployedContractsCount: number;
  kybStatus: 'Verificado' | 'En revisión' | 'Pendiente';
}
