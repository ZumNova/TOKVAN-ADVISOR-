import React, { useState } from 'react';
import { getAddress, toUtf8Bytes, hexlify, verifyMessage } from 'ethers';
import { OWNER, roles, grantMessage, readGrants, saveGrant, type StaffRole, type Grant } from '../../lib/staffAccess';
import deployment from '../../../deployment/sepolia-participants.json';

type Props = { account: string | null; role: StaffRole | 'owner' | null; onLogin: (account: string, role: StaffRole | 'owner') => void; onLogout: () => void };
const wallet = () => {
  const injected = (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!injected) throw new Error('Instalá o abrí una wallet de navegador.');
  return injected;
};
export default function StaffAccess({ account, role, onLogin, onLogout }: Props) {
  const [target, setTarget] = useState('');
  const [targetRole, setTargetRole] = useState<StaffRole>('reviewer');
  const [draft, setDraft] = useState('');
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => { setBusy(true); setError(''); setNotice(''); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); } finally { setBusy(false); } };
  const connect = () => run(async () => {
    const injected = wallet();
    const accounts = await injected.request({ method: 'eth_requestAccounts' }) as string[];
    if (!accounts?.[0]) throw new Error('La wallet no devolvió una cuenta.');
    const address = getAddress(accounts[0]);
    const nonce = crypto.randomUUID();
    const message = `TOKVANT acceso administrativo\nOrigen: ${location.origin}\nWallet: ${address}\nSesión: ${nonce}`;
    const signature = await injected.request({ method: 'personal_sign', params: [hexlify(toUtf8Bytes(message)), address] }) as string;
    if (verifyMessage(message, signature) !== address) throw new Error('Firma inválida.');
    const assigned = address === getAddress(OWNER) ? 'owner' : readGrants().find(g => getAddress(g.address) === address)?.role;
    if (!assigned) throw new Error('Esta wallet no tiene un rol TOKVANT asignado en este navegador.');
    onLogin(address, assigned);
  });
  const issue = () => run(async () => {
    if (role !== 'owner') throw new Error('Solo la cuenta propietaria puede asignar roles.');
    const address = getAddress(target);
    if (address === getAddress(OWNER)) throw new Error('La propietaria ya tiene acceso completo y firma la revisión técnica.');
    const fixed:Partial<Record<StaffRole,string>>={reviewer:deployment.participants.technicalReviewer,compliance:deployment.participants.complianceReviewer,board:deployment.participants.boardReviewer,factory:deployment.participants.operator};
    if(fixed[targetRole]&&address!==getAddress(fixed[targetRole]))throw new Error(`En los factories ya desplegados, el rol ${targetRole} pertenece a ${fixed[targetRole]}. No se puede reasignar por permiso web.`);
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const message = grantMessage(address, targetRole, expires);
    const signature = await wallet().request({ method: 'personal_sign', params: [hexlify(toUtf8Bytes(message)), OWNER] }) as string;
    const grant: Grant = { address, role: targetRole, expires, signature };
    saveGrant(grant);
    setDraft(JSON.stringify(grant));
    setNotice('Rol firmado y guardado en este navegador. Compartí la autorización con esa persona para que pueda importarla en su navegador.');
  });
  const importGrant = () => run(async () => {
    const value = JSON.parse(importText);
    saveGrant(value);
    setImportText('');
    setNotice('Autorización importada. Ahora conectá y firmá con la wallet autorizada.');
  });
  return <section className="mx-auto max-w-2xl px-5 py-12 text-[#E4ECFA]">
    <h1 className="text-3xl font-bold">Acceso al equipo TOKVANT</h1>
    <p className="mt-3 text-sm text-[#B8C9E1]">Conectá tu wallet y firmá un mensaje gratuito para abrir los módulos de tu rol. La cuenta propietaria termina en 047.</p>
    {error && <p role="alert" className="mt-5 rounded-lg border border-red-500 p-3 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-lg border border-emerald-500 p-3 text-sm text-emerald-200">{notice}</p>}
    <div className="mt-6 flex flex-wrap gap-3">
      {!role ? <button disabled={busy} onClick={connect} className="rounded-lg bg-[#567EFF] px-5 py-3 font-semibold disabled:opacity-50">Conectar y firmar acceso</button> : <><span className="rounded-lg border border-[#39547C] px-4 py-3 text-sm">{role === 'owner' ? 'Propietaria' : role} · {account}</span><button onClick={onLogout} className="rounded-lg border border-[#39547C] px-4 py-3">Cerrar sesión</button></>}
    </div>
    {role === 'owner' && <div className="mt-10 rounded-xl border border-[#39547C] p-5">
      <h2 className="text-xl font-semibold">Asignar un rol por 30 días</h2>
      <p className="mt-2 text-sm text-[#B8C9E1]">La wallet destinataria deberá importar la autorización y firmar su propio acceso. La firma no consume gas. En los factories actuales, Técnico corresponde a la 047, Compliance a FB24, Directorio a 1E8D y Operador a 8A25.</p>
      <label className="mt-5 block text-sm">Wallet destinataria<input value={target} onChange={e => setTarget(e.target.value)} placeholder="0x…" className="mt-2 w-full rounded-lg border border-[#39547C] bg-[#0B0D12] p-3" /></label>
      <label className="mt-4 block text-sm">Rol<select value={targetRole} onChange={e => setTargetRole(e.target.value as StaffRole)} className="mt-2 w-full rounded-lg border border-[#39547C] bg-[#0B0D12] p-3">{roles.map(r => <option key={r} value={r}>{r==='reviewer'?'Technical Reviewer':r==='board'?'Enterprise Board · Directorio':r==='compliance'?'Compliance':r==='factory'?'Operador Factory':'Administrador'}</option>)}</select></label>
      <button disabled={busy} onClick={issue} className="mt-5 rounded-lg bg-[#567EFF] px-5 py-3 disabled:opacity-50">Firmar autorización</button>
      {draft && <label className="mt-5 block text-sm">Autorización para entregar<textarea readOnly value={draft} rows={5} className="mt-2 w-full rounded-lg border border-[#39547C] bg-[#0B0D12] p-3 font-mono text-xs" /></label>}
    </div>}
    {!role && <div className="mt-10 rounded-xl border border-[#39547C] p-5"><h2 className="text-xl font-semibold">Importar autorización del propietario</h2><textarea aria-label="Autorización firmada" value={importText} onChange={e => setImportText(e.target.value)} rows={5} className="mt-4 w-full rounded-lg border border-[#39547C] bg-[#0B0D12] p-3 font-mono text-xs" /><button disabled={busy || !importText.trim()} onClick={importGrant} className="mt-3 rounded-lg border border-[#39547C] px-5 py-3 disabled:opacity-50">Importar autorización</button></div>}
    <p className="mt-8 text-xs text-[#91A3BD]">Este control limita la navegación de la demo. Para expedientes compartidos y documentos privados hará falta validar los roles también en el servidor.</p>
  </section>;
}
