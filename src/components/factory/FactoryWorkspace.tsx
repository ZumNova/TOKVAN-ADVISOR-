import {lazy, Suspense, useState} from 'react';
import type {ComponentProps} from 'react';
import type ERC20View from './ERC20FactoryView';
const ERC20 = lazy(() => import('./ERC20FactoryView'));
const ERC1155 = lazy(() => import('./ERC1155FactoryView'));
const ERC3643 = lazy(() => import('./ERC3643FactoryView'));
const ERC721 = lazy(() => import('./ERC721FactoryView'));
const standards = ['ERC-20', 'ERC-721', 'ERC-1155', 'ERC-3643'] as const;
export default function FactoryWorkspace({projects,staffAccount,staffRole,initialProjectId}: ComponentProps<typeof ERC20View>&{staffAccount:string|null;staffRole:string|null;initialProjectId?:string}) {
  const [selected, setSelected] = useState<string>(() => {try {return localStorage.getItem('tokvan:factory-workspace:v1') || 'ERC-20';} catch {return 'ERC-20';}});
  if(staffRole==='token_operator')return <div className="space-y-6"><p className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">Acceso de operador de token: ERC-3643 en Sepolia. Las facultades sobre el token las comprueba el contrato con la wallet conectada.</p><Suspense fallback={<p>Cargando token ERC-3643…</p>}><ERC3643 projects={[]} staffAccount={staffAccount} initialProjectId={initialProjectId}/></Suspense></div>;
  return <div className="space-y-6"><nav aria-label="Tipo de factory" className="grid grid-cols-2 md:grid-cols-4 gap-3">{standards.map((standard, index) => <button key={standard} type="button" aria-pressed={selected === standard} onClick={() => {setSelected(standard); try {localStorage.setItem('tokvan:factory-workspace:v1', standard);} catch { /* Selection remains available. */ }}} className={`rounded-xl border p-4 text-left ${selected === standard ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700'}`}><strong>{standard}</strong><span className="block text-sm mt-1">{index < 3 ? 'Sepolia · Disponible' : 'Sepolia · Educativo'}</span></button>)}</nav><Suspense fallback={<p>Cargando factory…</p>}>{selected === 'ERC-20' ? <ERC20 projects={projects}/> : selected === 'ERC-721' ? <ERC721/> : selected === 'ERC-1155' ? <ERC1155/> : selected === 'ERC-3643' ? <ERC3643 projects={projects} staffAccount={staffAccount} initialProjectId={initialProjectId}/> : <section className="rounded-xl border p-6 bg-white"><h2>{selected}</h2><p>Esta factory todavía no está habilitada. Tendrá su propia configuración y bitácora.</p></section>}</Suspense></div>;
}
