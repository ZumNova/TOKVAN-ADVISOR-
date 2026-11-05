import { useEffect, useRef, useState } from 'react';
import { DEPLOYER, PARTICIPANTS, SEPOLIA_HEX, DEPLOYMENT_STORAGE_KEY, injectedWallet, estimateDeployment, sendDeployment, verifyDeployment, walletError } from '../../lib/factoryWallet';

function savedHash() {
  try {
    const value = localStorage.getItem(DEPLOYMENT_STORAGE_KEY);
    return value && /^0x[0-9a-fA-F]{64}$/.test(value) ? value : '';
  } catch { return ''; }
}
export default function FactoryDeploymentPanel({onDeployed}: {onDeployed: (address:string) => void}) {
  const [account, setAccount] = useState('');
  const [estimate, setEstimate] = useState<Awaited<ReturnType<typeof estimateDeployment>> | null>(null);
  const [hash, setHash] = useState(savedHash);
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let wallet;
    try { wallet = injectedWallet(); } catch { return; }
    const invalidate = () => {setAccount(''); setEstimate(null); setMessage('La cuenta o red cambió. Vuelva a conectar y estimar.');};
    wallet.on?.('accountsChanged', invalidate); wallet.on?.('chainChanged', invalidate);
    return () => {wallet.removeListener?.('accountsChanged', invalidate); wallet.removeListener?.('chainChanged', invalidate);};
  }, []);

  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) {setError(walletError(e));}
    finally {busyRef.current = false; setBusy(false);}
  };
  const connect = () => run(async () => {
    const wallet = injectedWallet();
    const accounts = await wallet.request({method:'eth_requestAccounts'}) as string[];
    setAccount(accounts[0] ?? ''); setEstimate(null); setMessage('Wallet conectada. Seleccione Sepolia y estime el despliegue.');
  });
  const switchChain = () => run(async () => {
    await injectedWallet().request({method:'wallet_switchEthereumChain', params:[{chainId:SEPOLIA_HEX}]});
    setEstimate(null); setMessage('Sepolia seleccionada. Conecte la cuenta A047 y estime.');
  });
  const review = () => run(async () => {
    setEstimate(null);
    const result = await estimateDeployment(injectedWallet());
    setEstimate(result); setAccount(DEPLOYER); setMessage('Estimación lista. Revise los cuatro roles antes de firmar.');
  });
  const deploy = () => run(async () => {
    if (hash || !estimate) return;
    // Require working storage before requesting a transaction so refresh can recover its hash.
    localStorage.setItem(DEPLOYMENT_STORAGE_KEY+':check', '1');
    localStorage.removeItem(DEPLOYMENT_STORAGE_KEY+':check');
    setMessage('Confirme el despliegue en su wallet.');
    const txHash = await sendDeployment(injectedWallet());
    setHash(txHash); setEstimate(null);
    try {localStorage.setItem(DEPLOYMENT_STORAGE_KEY,txHash);} catch {setError('No se pudo guardar el hash. Cópielo antes de cerrar esta página.');}
    setMessage('Transacción enviada. Pulse Verificar confirmación cuando esté incluida en un bloque.');
  });
  const check = () => run(async () => {
    const result = await verifyDeployment(injectedWallet(), hash);
    if (result.status === 'pending') {setMessage('La transacción sigue pendiente en Sepolia.'); return;}
    if (result.status === 'failed') {setFailed(true); setMessage('La transacción falló. No se creó el factory.'); return;}
    setAddress(result.address); onDeployed(result.address); setMessage('Factory confirmado en Sepolia. Su dirección ya está cargada en el formulario.');
  });
  const button = 'rounded-lg border border-[#316BFA] px-4 py-2 text-sm disabled:opacity-40';
  return <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-5 space-y-4">
    <h2 className="text-xl font-semibold">Desplegar factory en Sepolia</h2>
    <p className="text-sm text-slate-300 break-all">Firma y gas: {DEPLOYER}</p>
    <dl className="grid sm:grid-cols-2 gap-3 text-xs">{([
      ['Técnico', PARTICIPANTS.technicalReviewer], ['Compliance', PARTICIPANTS.complianceReviewer],
      ['Directorio', PARTICIPANTS.boardReviewer], ['Operador', PARTICIPANTS.operator],
    ] as const).map(([role, value]) => <div key={role}><dt className="text-slate-400">{role}</dt><dd className="font-mono break-all mt-1">{value}</dd></div>)}</dl>
    <p className="text-xs text-slate-400">Los cuatro roles quedan fijos en este factory. El despliegue crea la fábrica; la emisión de tokens requiere las tres aprobaciones posteriores.</p>
    {account && <p className="text-xs break-all">Wallet conectada: {account}</p>}
    <div className="flex flex-wrap gap-3">
      <button className={button} disabled={busy} onClick={connect}>Conectar wallet</button>
      <button className={button} disabled={busy} onClick={switchChain}>Cambiar a Sepolia</button>
      {!hash && <button className={button} disabled={busy} onClick={review}>Estimar despliegue</button>}
      {!hash && estimate && <button className={button+' bg-[#316BFA]'} disabled={busy} onClick={deploy}>Firmar y desplegar factory</button>}
      {hash && <button className={button} disabled={busy} onClick={check}>Verificar confirmación</button>}
      {failed && <button className={button} disabled={busy} onClick={() => {localStorage.removeItem(DEPLOYMENT_STORAGE_KEY); setHash(''); setFailed(false); setEstimate(null); setMessage('Puede volver a estimar el despliegue.');}}>Preparar nuevo intento</button>}
    </div>
    {estimate && <p className="text-sm">Gas con margen: {estimate.gasLimit.toString()} · Costo estimado: {estimate.estimatedEth} ETH Sepolia · Saldo: {estimate.balanceEth} ETH. La wallet mostrará la tarifa final.</p>}
    {hash && <p className="text-sm break-all">Transacción: <a className="text-[#7096FF] underline" href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">{hash}</a></p>}
    {address && <a className="block break-all text-[#7096FF] underline" href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noreferrer">Factory: {address}</a>}
    {message && <p role="status" className="text-sm text-slate-300">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-300 break-words">{error}</p>}
  </div>;
}
