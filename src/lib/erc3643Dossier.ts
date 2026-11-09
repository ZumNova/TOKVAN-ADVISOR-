import {id} from 'ethers';
export const DOSSIER_FIELDS = [
 ['issuerCountry','País de constitución de la emisora','Indique jurisdicción, entidad y alcance de la prueba.'],
 ['investorCountries','Países donde se ofrecerá el token','Cada país de oferta y residencia necesita evaluación propia; no basta el país de la emisora.'],
 ['assetRights','Activo y derechos del titular','Describa qué representa el token, respaldo, custodia, rescate y derechos económicos.'],
 ['legalClassification','Clasificación jurídica y modalidad de oferta','Identifique la clasificación, oferta pública/privada, registro o exención y sus condiciones.'],
 ['authority','Autoridades y habilitaciones','Indique autoridades competentes, licencias, registros o fundamento de no aplicabilidad.'],
 ['issuerEvidence','KYB de la emisora y beneficiarios finales','Referencia privada del proveedor, verificación de representantes y beneficiarios finales; nunca documentos personales aquí.'],
 ['investorPolicy','KYC/KYB y elegibilidad de destinatarios','Proveedor, personas/entidades admitidas, categoría de inversor, acreditaciones requeridas y revisión periódica.'],
 ['amlPolicy','AML, sanciones y origen de fondos','Responsable, controles, vigencia y procedimiento de revocación/escalamiento.'],
 ['transferPolicy','Restricciones de circulación','Países, límites por titular, plazos de bloqueo y excepciones autorizadas. En esta prueba se ejecutan países y límites de saldo/supply.'],
 ['legalDocuments','Documentación contractual y evidencias','Referencias privadas versionadas del contrato de suscripción, términos, avisos y dictamen.'],
 ['privacy','Privacidad y conservación','Base de tratamiento, acceso, plazos de conservación y ubicación de datos personales fuera de blockchain/IPFS.'],
 ['agentPowers','Facultades de los agentes','Quién puede congelar, quemar, recuperar y forzar transferencias; procedimiento y evidencias exigidas.'],
 ['localReview','Responsable legal por jurisdicción','Nombre/rol profesional o referencia interna, fecha de revisión y alcance por cada país.'],
 ['technicalReview','Validación técnica y operación','Auditoría, contratos de identidad reales, verificador, claves, incidentes y monitoreo.'],
] as const;
export type DossierKey=typeof DOSSIER_FIELDS[number][0];
export interface Dossier {mode:'SIMULATED_SEPOLIA';fields:Record<DossierKey,string>;acknowledged:boolean;}
export function emptyDossier():Dossier {return {mode:'SIMULATED_SEPOLIA',fields:Object.fromEntries(DOSSIER_FIELDS.map(([key])=>[key,''])) as Record<DossierKey,string>,acknowledged:false};}
export function demoDossier():Dossier {const d=emptyDossier();for(const [key] of DOSSIER_FIELDS)d.fields[key]='SIMULADO · '+(({issuerCountry:'Paraguay; entidad ficticia TOKVAN Test',investorCountries:'Paraguay (600) y Argentina (032); oferta ficticia',assetRights:'1000 unidades de prueba; sin derechos económicos ni canje real'} as Partial<Record<DossierKey,string>>)[key] || 'Pendiente de validación real. Evidencia ficticia TEST-3643-001.');return d;}
export function validateDossier(value:Dossier){
 if(value?.mode!=='SIMULATED_SEPOLIA'||value.acknowledged!==true)throw new Error('Confirme que el expediente y las acreditaciones son ficticios, solo para Sepolia.');
 for(const [key,label] of DOSSIER_FIELDS)if(typeof value.fields?.[key]!=='string'||value.fields[key].trim().length<8||value.fields[key].length>2000)throw new Error(`Complete «${label}» (8 a 2000 caracteres).`);
 return value;
}
export function dossierHash(value:Dossier){validateDossier(value);return id(JSON.stringify({mode:value.mode,fields:DOSSIER_FIELDS.map(([key])=>[key,value.fields[key].trim()]),acknowledged:true}));}
export function productionReadiness(){return {allowed:false,reason:'Mainnet bloqueada. Este expediente es declarativo y ficticio; requiere diseño y revisión legal por jurisdicción, acreditaciones reales, validación técnica y una implementación de producción separada.'} as const;}
