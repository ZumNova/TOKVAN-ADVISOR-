import { getAddress, verifyMessage } from 'ethers';

export const OWNER = '0x521125be95c5679539aB07582F55F0040975A047';
export type StaffRole = 'administrator' | 'factory' | 'reviewer' | 'compliance' | 'board' | 'accounting';
export type Grant = { address: string; role: StaffRole; expires: number; signature: string };
export const roles: StaffRole[] = ['administrator', 'factory', 'reviewer', 'compliance', 'board', 'accounting'];
const KEY = 'tokvant:staff-grants:v1';
export const grantMessage = (address: string, role: StaffRole, expires: number) => `TOKVANT staff access\nOrigin: ${location.origin}\nWallet: ${getAddress(address)}\nRole: ${role}\nExpires: ${expires}`;
export const validGrant = (value: unknown): value is Grant => {
  if (!value || typeof value !== 'object') return false;
  const g = value as Grant;
  try {
    return roles.includes(g.role) && Number.isSafeInteger(g.expires) && g.expires > Date.now() && getAddress(g.address) !== getAddress(OWNER) && verifyMessage(grantMessage(g.address, g.role, g.expires), g.signature) === getAddress(OWNER);
  } catch { return false; }
};
export const readGrants = (): Grant[] => {
  try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value.filter(validGrant) : []; } catch { return []; }
};
export const saveGrant = (grant: Grant) => {
  if (!validGrant(grant)) throw new Error('La autorización no está firmada por la cuenta propietaria o está vencida.');
  const current = readGrants().filter(g => !(g.address.toLowerCase() === grant.address.toLowerCase() && g.role === grant.role));
  localStorage.setItem(KEY, JSON.stringify([...current, grant]));
};
export const roleCanOpen = (role: StaffRole | 'owner' | null, view: string) => {
  if (!role) return false;
  if (view === 'admin') return role === 'owner' || role === 'administrator';
  if (role === 'accounting') return ['projects','dashboard','approvals'].includes(view);
  if (['factory','projects','dashboard','approvals','simulator','standards','architecture'].includes(view)) return true;
  return false;
};
