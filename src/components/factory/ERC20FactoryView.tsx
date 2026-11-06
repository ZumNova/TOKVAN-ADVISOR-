import { useState } from 'react';
import FactoryDeploymentPanel from './FactoryDeploymentPanel';
import TokenExecutionPanel from './TokenExecutionPanel';
import FactoryJournal from './FactoryJournal';
import { FACTORY_REGISTRY } from '../../lib/tokenWorkflow';
import { DEPLOYER } from '../../lib/factoryWallet';
import type { TokenProject } from '../../types';
import { prepareFactoryRequest, projectBlockers, requestJson, type FactoryInput } from '../../lib/erc20Factory';

const defaults: FactoryInput = {
  projectId: 'TOKVAN-SEPOLIA-TKN-001', factory: FACTORY_REGISTRY.address, admin: DEPLOYER, treasury: DEPLOYER, name: 'TOKVAN Test Token', symbol: 'TKN',
  decimals: '18', initialSupply: '1000000', maxSupply: '1000000', mintable: false, burnable: true, pausable: true,
};
const draftKey = 'tokvan:erc20:prepared-input:v1';
function restoreDraft(): FactoryInput | null {
  try { const input = JSON.parse(localStorage.getItem(draftKey) ?? 'null'); if (input) { prepareFactoryRequest(input); return input; } } catch {}
  return null;
}
const fieldStyle = 'mt-1 block w-full rounded-lg border border-[#273246] bg-[#0B0D12] p-3 text-white';
export default function ERC20FactoryView({ projects }: { projects: TokenProject[] }) {
  const [savedDraft] = useState(restoreDraft);
  const [input, setInput] = useState<FactoryInput>(() => savedDraft ?? {...defaults});
  const [journalRevision, setJournalRevision] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState<ReturnType<typeof prepareFactoryRequest> | null>(() => savedDraft ? prepareFactoryRequest(savedDraft) : null);
  const [error, setError] = useState('');
  const project = projects.find(p => p.id === selectedId);
  const blockers = project ? projectBlockers(project) : [];
  const update = <K extends keyof FactoryInput>(key: K, value: FactoryInput[K]) => {
    setInput(previous => ({...previous, [key]: value})); setResult(null); setError('');
  };
  const selectProject = (value: string) => {
    setSelectedId(value); setResult(null); setError('');
    const p = projects.find(item => item.id === value);
    if (!p) {
      setInput({...defaults});
      return;
    }
    setInput(previous => ({...previous, projectId: p.id, name: p.parameters.tokenName, symbol: p.parameters.tokenSymbol,
      decimals: String(p.parameters.decimals), initialSupply: String(p.parameters.initialSupply),
      maxSupply: String(p.parameters.maxSupply ?? p.parameters.initialSupply),
      mintable: p.parameters.isMintable, burnable: p.parameters.isBurnable, pausable: p.parameters.isPausable}));
  };
  const prepare = () => {
    try {
      if (blockers.length) throw new Error(blockers.join(' '));
      const prepared = prepareFactoryRequest(input);
      localStorage.setItem(draftKey, JSON.stringify(input));
      setResult(prepared); setError('');
    } catch (e) { setResult(null); setError(e instanceof Error ? e.message : 'No se pudo preparar la emisión.'); }
  };
  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([requestJson(result)], {type: 'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'tokvan-erc20-request.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const textFields = [
    ['projectId', 'Identificador del expediente'], ['factory', 'Dirección del factory en Sepolia'],
    ['name', 'Nombre del token'], ['symbol', 'Símbolo'], ['decimals', 'Decimales (0–18)'],
    ['initialSupply', 'Supply inicial (tokens)'], ['maxSupply', 'Supply máximo (tokens)'],
    ['admin', 'Wallet administradora del token'], ['treasury', 'Tesorería que recibe la emisión inicial'],
  ] as const;
  return (
    <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div><p className="text-sm text-[#7096FF]">ERC-20 · v1 · Sepolia</p>
        <h1 className="text-3xl font-bold mt-2">Factory de tokens</h1>
        <p className="mt-3 text-slate-300">Configure la emisión, prepare la revisión y obtenga las transacciones para crear su token.</p>
      </div>
      <div className="rounded-xl border border-[#316BFA] p-4 space-y-2 text-sm">
        <strong>Factory ERC-20 registrado · Sepolia</strong>
        <a className="block text-[#7096FF] break-all underline" href={`https://sepolia.etherscan.io/address/${FACTORY_REGISTRY.address}`} target="_blank" rel="noreferrer">{FACTORY_REGISTRY.address}</a>
        <p className="text-slate-300">Usamos esta fábrica para emitir TKN. No necesita volver a desplegarla.</p>
        <button className="rounded-lg border border-[#316BFA] px-3 py-2" onClick={() => update('factory', FACTORY_REGISTRY.address)}>Usar factory registrado</button>
      </div>
      <details><summary className="cursor-pointer text-sm text-slate-400">Herramientas de despliegue de factories</summary><FactoryDeploymentPanel onDeployed={address => update('factory', address)} /></details>
      <ol className="grid sm:grid-cols-3 gap-3 text-sm">
        {['1. Configurar emisión', '2. Aprobar con tres cuentas', '3. Crear desde la cuenta operadora'].map(step => <li className="p-4 rounded-xl bg-[#141A27] border border-[#273246]" key={step}>{step}</li>)}
      </ol>
      <p className="text-sm rounded-xl border border-amber-700/50 bg-amber-950/20 p-4 text-amber-200">
        Emisión de prueba en Sepolia. Las aprobaciones del sandbox no autorizan emisiones reales.
        Cada revisor firma en su wallet; el operador crea el token cuando las tres aprobaciones están confirmadas. Contratos v1 sin auditoría externa.
      </p>
      <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-5 space-y-5">
        <label className="block text-sm">Origen de los parámetros
          <select className={fieldStyle} value={selectedId} onChange={e => selectProject(e.target.value)}>
            <option value="">Nueva emisión ERC-20 de prueba · TKN</option>
            {projects.filter(p => p.standard === 'ERC-20').map(p => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}
          </select>
        </label>
        {blockers.length > 0 && <ul className="text-amber-200 text-sm list-disc pl-5">{blockers.map(message => <li key={message}>{message}</li>)}</ul>}
        <form onSubmit={e => {e.preventDefault(); prepare();}} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">{textFields.map(([key, label]) => <label className="block text-sm" key={key}>{label}
            <input required autoComplete="off" className={fieldStyle} value={input[key]} onChange={e => update(key, e.target.value)} />
          </label>)}</div>
          <div className="flex flex-wrap gap-5">{([['mintable', 'Emisión adicional'], ['burnable', 'Quema por titulares'], ['pausable', 'Pausa de emergencia']] as const).map(([key, label]) =>
            <label key={key} className="flex gap-2 text-sm items-center"><input type="checkbox" checked={input[key]} onChange={e => update(key, e.target.checked)} />{label}</label>)}</div>
          <p className="text-xs text-slate-400">El máximo limita el supply en circulación. La administradora recibe los roles habilitados y puede delegarlos.
            La pausa bloquea transferencias, emisión y quema. Sin upgrade, whitelist ni controles KYC on-chain en v1.</p>
          <button disabled={blockers.length > 0} className="rounded-lg bg-[#316BFA] px-5 py-3 font-semibold disabled:opacity-40">Preparar para revisión</button>
        </form>
      </div>
      {error && <p role="alert" className="text-red-300 break-words">{error}</p>}
      {result && <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-5 space-y-4" role="status">
        <h2 className="text-xl font-semibold">Emisión preparada · pendiente de revisión on-chain</h2>
        <p className="text-sm text-slate-300">Técnica, Compliance y Directorio deben revisar este mismo archivo y enviar la aprobación desde sus respectivas cuentas.
          Después, el operador puede simular y ejecutar la creación. Cambiar cualquier parámetro exige nuevas aprobaciones.</p>
        <p className="text-xs break-all font-mono">Hash de revisión: {result.digest}</p>
        <button onClick={download} className="rounded-lg border border-[#7096FF] px-5 py-3">Descargar parámetros y transacciones</button>
        <TokenExecutionPanel key={result.digest} request={result} onConfirmed={() => setJournalRevision(value => value + 1)} />
        <details><summary className="cursor-pointer">Ver transacciones y cantidades exactas</summary><pre className="mt-3 max-h-80 overflow-auto text-xs bg-[#0B0D12] p-3 rounded-lg">{requestJson(result)}</pre></details>
      </div>}
      <FactoryJournal revision={journalRevision} />
    </section>
  );
}
