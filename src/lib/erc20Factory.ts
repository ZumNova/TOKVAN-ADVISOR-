import { AbiCoder, Interface, getAddress, id, keccak256, parseUnits, toUtf8Bytes, ZeroAddress } from 'ethers';
import type { TokenProject } from '../types';

export const CONFIG_TUPLE = 'tuple(string name,string symbol,uint8 decimals,uint256 initialSupply,uint256 maxSupply,address admin,address treasury,bool mintable,bool burnable,bool pausable)';
export const FACTORY_ABI = [
  `function hashConfig(bytes32 projectId,${CONFIG_TUPLE} config) view returns (bytes32)`,
  'function approvals(bytes32 digest) view returns (uint8)',
  'function operator() view returns (address)',
  'function tokenByProject(bytes32 projectId) view returns (address)',
  'function setApproval(bytes32 digest,bool approved)',
  `function createToken(bytes32 projectId,${CONFIG_TUPLE} config) returns (address)`,
];
export const factoryInterface = new Interface(FACTORY_ABI);
export interface FactoryInput {
  projectId: string; factory: string; admin: string; treasury: string;
  name: string; symbol: string; decimals: string; initialSupply: string; maxSupply: string;
  mintable: boolean; burnable: boolean; pausable: boolean;
}
export const FACTORY_CHAIN_ID = 11155111;

export function projectBlockers(project: TokenProject): string[] {
  const p = project.parameters;
  const errors: string[] = [];
  if (!Number.isSafeInteger(p.initialSupply) || (p.maxSupply !== undefined && !Number.isSafeInteger(p.maxSupply))) errors.push('El expediente tiene cantidades sin precisión entera segura. Cree una emisión de prueba e ingrese las cantidades exactas como texto.');
  if (project.standard !== 'ERC-20') errors.push('Seleccione un expediente ERC-20.');
  if (project.network !== 'sepolia') errors.push('La primera versión del preparador usa Sepolia.');
  if (p.isUpgradeabilityEnabled) errors.push('El factory v1 no admite contratos actualizables.');
  if (p.transferRestrictions !== 'Sin restricción' || p.complianceRules.requireKYC || p.complianceRules.requireKYB ||
      p.complianceRules.restrictSanctionedCountries || (p.complianceRules.maxHoldersLimit ?? 0) > 0 || (p.complianceRules.lockupPeriodDays ?? 0) > 0) {
    errors.push('Este expediente requiere controles de transferencia que ERC-20 v1 no implementa.');
  }
  return errors;
}

export function prepareFactoryRequest(input: FactoryInput) {
  const address = (value: string) => {
    const result = getAddress(value.trim());
    if (result === ZeroAddress) throw new Error('Las direcciones no pueden ser cero.');
    return result;
  };
  const factory = address(input.factory);
  const name = input.name.trim();
  const symbol = input.symbol.trim();
  if (!input.projectId.trim()) throw new Error('Ingrese el identificador del expediente.');
  if (!name || toUtf8Bytes(name).length > 64 || !symbol || toUtf8Bytes(symbol).length > 16) {
    throw new Error('Nombre: 1–64 bytes. Símbolo: 1–16 bytes.');
  }
  if (!/^\d+$/.test(input.decimals) || Number(input.decimals) > 18) throw new Error('Los decimales deben estar entre 0 y 18.');
  const decimals = Number(input.decimals);
  const units = (value: string) => {
    if (!/^\d+(\.\d+)?$/.test(value) || (value.split('.')[1]?.length ?? 0) > decimals) {
      throw new Error('Supply inválido: use números positivos sin separadores de miles y respete los decimales.');
    }
    const result = parseUnits(value, decimals);
    if (result >= 2n ** 256n) throw new Error('El supply supera uint256.');
    return result;
  };
  const initialSupply = units(input.initialSupply);
  const maxSupply = units(input.maxSupply);
  if (maxSupply === 0n || initialSupply > maxSupply) throw new Error('El máximo debe ser positivo y mayor o igual al supply inicial.');
  if (!input.mintable && initialSupply !== maxSupply) throw new Error('Sin emisión adicional, supply inicial y máximo deben coincidir.');
  const config = {name, symbol, decimals, initialSupply, maxSupply, admin: address(input.admin), treasury: address(input.treasury), mintable: input.mintable, burnable: input.burnable, pausable: input.pausable};
  const projectId = id(input.projectId.trim());
  const digest = keccak256(AbiCoder.defaultAbiCoder().encode(['uint256', 'address', 'bytes32', CONFIG_TUPLE], [FACTORY_CHAIN_ID, factory, projectId, config]));
  const transaction = (data: string) => ({to: factory, value: '0', data});
  return {
    version: 'tokvan-erc20-v1', chainId: FACTORY_CHAIN_ID, projectReference: input.projectId.trim(), projectId, digest, config,
    approval: transaction(factoryInterface.encodeFunctionData('setApproval', [digest, true])),
    revocation: transaction(factoryInterface.encodeFunctionData('setApproval', [digest, false])),
    deployment: transaction(factoryInterface.encodeFunctionData('createToken', [projectId, config])),
  };
}
export function requestJson(request: ReturnType<typeof prepareFactoryRequest>) {
  return JSON.stringify(request, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2);
}
