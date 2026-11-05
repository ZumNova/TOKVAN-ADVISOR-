import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Coins, 
  DollarSign, 
  CheckCircle2, 
  PieChart as PieIcon,
  RefreshCw
} from 'lucide-react';
import { StandardType, NetworkId } from '../../types';
import { SUPPORTED_NETWORKS } from '../../constants/networks';
import { TOKEN_STANDARDS } from '../../constants/standards';

interface TokenSimulatorProps {
  onApplyParametersToWizard?: (params: any) => void;
  onNavigate: (view: string) => void;
}

export const TokenSimulator: React.FC<TokenSimulatorProps> = ({
  onApplyParametersToWizard,
  onNavigate,
}) => {
  // Simulator inputs
  const [standard, setStandard] = useState<StandardType>('ERC-3643');
  const [network, setNetwork] = useState<NetworkId>('polygon');
  const [assetValuation, setAssetValuation] = useState<number>(10000000); // 10M USD
  const [initialSupply, setInitialSupply] = useState<number>(1000000);
  const [decimals, setDecimals] = useState<number>(2);
  const [requireIdentityRegistry, setRequireIdentityRegistry] = useState<boolean>(true);
  const [isPausable, setIsPausable] = useState<boolean>(true);
  const [isMintable, setIsMintable] = useState<boolean>(false);
  const [monthlyTransferVolume, setMonthlyTransferVolume] = useState<number>(150);

  // Distribution splits
  const [sponsorEquityPercent, setSponsorEquityPercent] = useState<number>(30);
  const [investorAllocationPercent, setInvestorAllocationPercent] = useState<number>(55);
  const [treasuryReservePercent, setTreasuryReservePercent] = useState<number>(15);

  const selectedNet = SUPPORTED_NETWORKS[network];
  const selectedStd = TOKEN_STANDARDS[standard];

  // Gas and Cost Calculations
  const calculations = useMemo(() => {
    // Deployment gas units
    let deploymentGasUnits = 2500000;
    if (standard === 'ERC-3643') {
      deploymentGasUnits = 4200000; // includes Identity Registry + Compliance contracts
    } else if (standard === 'ERC-1155') {
      deploymentGasUnits = 2900000;
    } else if (standard === 'ERC-721') {
      deploymentGasUnits = 2800000;
    }

    // Per-transfer gas units
    let transferGasUnits = 45000;
    if (standard === 'ERC-3643') {
      transferGasUnits = 85000; // identity verification check
    } else if (standard === 'ERC-1155') {
      transferGasUnits = 55000;
    } else if (standard === 'ERC-721') {
      transferGasUnits = 65000;
    }

    // Network unit conversion
    // Polygon: POL ~$0.35, Gas: ~35 Gwei
    // Arbitrum: ETH ~$2,500, Gas: ~0.1 Gwei + L1 calldata fee ~$0.08
    // Ethereum: ETH ~$2,500, Gas: ~18 Gwei
    let nativeTokenPriceUsd = 0.35;
    let l1DataFeePerTxUsd = 0;

    if (network === 'arbitrum') {
      nativeTokenPriceUsd = 2600;
      l1DataFeePerTxUsd = 0.08;
    } else if (network === 'ethereum' || network === 'sepolia') {
      nativeTokenPriceUsd = 2600;
      l1DataFeePerTxUsd = 0;
    } else {
      nativeTokenPriceUsd = 0.40; // POL
    }

    const deployGasCostNative = (deploymentGasUnits * selectedNet.avgGasPriceGwei * 1e-9);
    const deployCostUsd = deployGasCostNative * nativeTokenPriceUsd;

    const transferGasCostNative = (transferGasUnits * selectedNet.avgGasPriceGwei * 1e-9);
    const transferCostUsd = (transferGasCostNative * nativeTokenPriceUsd) + l1DataFeePerTxUsd;
    const monthlyGasCostUsd = transferCostUsd * monthlyTransferVolume;

    // Token nominal value
    const tokenNominalPrice = assetValuation / (initialSupply || 1);

    // Multi-network comparative estimates
    const comparative = {
      polygon: {
        deployUsd: (deploymentGasUnits * 35 * 1e-9) * 0.40,
        transferUsd: (transferGasUnits * 35 * 1e-9) * 0.40,
        settlementTime: '2.1 seg',
      },
      arbitrum: {
        deployUsd: (deploymentGasUnits * 0.1 * 1e-9) * 2600 + 1.20,
        transferUsd: (transferGasUnits * 0.1 * 1e-9) * 2600 + 0.08,
        settlementTime: '0.25 seg',
      },
      ethereum: {
        deployUsd: (deploymentGasUnits * 18 * 1e-9) * 2600,
        transferUsd: (transferGasUnits * 18 * 1e-9) * 2600,
        settlementTime: '12 seg',
      },
    };

    return {
      deploymentGasUnits,
      transferGasUnits,
      deployCostUsd,
      transferCostUsd,
      monthlyGasCostUsd,
      tokenNominalPrice,
      comparative,
    };
  }, [standard, network, assetValuation, initialSupply, monthlyTransferVolume, selectedNet]);

  const handleLaunchProjectFromSimulation = () => {
    onNavigate('wizard');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header and Disclaimer */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7096FF]">
          <Cpu className="w-4 h-4" />
          <span>Simulador de Arquitectura EVM</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#9BA6BD]">Entorno de Modelado Sin Riesgo Financiero</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          Simulador Interactivo de Costos, Gas y Distribución de Tokens
        </h1>
        <p className="text-sm text-[#9BA6BD] max-w-3xl">
          Modele escenarios de tokenización en tiempo real. Ajuste el estándar EVM, la red de liquidación, la valuación del activo subyacente y las reglas de cumplimiento para obtener proyecciones matemáticas precisas.
        </p>
      </div>

      {/* Demonstrative Alert Banner */}
      <div className="rounded-xl bg-[#141A27] border border-[#316BFA]/30 p-4 flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-[#316BFA] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Transparencia Operativa: Modo Simulación</p>
          <p className="text-[#9BA6BD]">
            Las estimaciones reflejan condiciones de red teóricas basadas en precios de gas promedio. Ninguna transacción real es enviada a la blockchain desde este simulador. No constituye oferta pública de valores ni promesa de rendimiento garantizado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: CONFIGURATION CONTROLS */}
        <div className="lg:col-span-5 rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 pb-3 border-b border-[#273246]">
            1. Parámetros del Activo y Red
          </h2>

          {/* Standard Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Estándar Contractual EVM
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['ERC-3643', 'ERC-20', 'ERC-721', 'ERC-1155'] as StandardType[]).map((std) => (
                <button
                  key={std}
                  type="button"
                  onClick={() => setStandard(std)}
                  className={`p-2.5 rounded-lg text-left border text-xs transition-all cursor-pointer ${
                    standard === std
                      ? 'border-[#316BFA] bg-[#316BFA]/10 text-white font-semibold'
                      : 'border-[#273246] bg-[#0B0D12] text-[#9BA6BD] hover:border-slate-500'
                  }`}
                >
                  <div className="font-mono text-xs">{std}</div>
                  <div className="text-[10px] text-[#9BA6BD] truncate">
                    {std === 'ERC-3643' ? 'RWA Regulado' : std === 'ERC-20' ? 'Fungible' : std === 'ERC-721' ? 'No Fungible' : 'Multi-Tramo'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Network Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Red Blockchain de Liquidación
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as NetworkId)}
              className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-[#316BFA]"
            >
              <option value="polygon">Polygon PoS (Mainnet) — Bajas comisiones, alta velocidad</option>
              <option value="arbitrum">Arbitrum One (L2 Rollup) — Seguridad Ethereum + Escalabilidad</option>
              <option value="ethereum">Ethereum (L1 Settlement) — Máxima seguridad institucional</option>
              <option value="sepolia">Sepolia (EVM Testnet) — Pruebas sin fondos reales</option>
            </select>
          </div>

          {/* Asset Valuation Slider */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">Valuación del Activo Subyacente</span>
              <span className="font-mono font-bold text-white tabular-nums">
                ${assetValuation.toLocaleString()} USD
              </span>
            </div>
            <input
              type="range"
              min="500000"
              max="50000000"
              step="500000"
              value={assetValuation}
              onChange={(e) => setAssetValuation(Number(e.target.value))}
              className="w-full h-1.5 bg-[#273246] rounded-lg appearance-none cursor-pointer accent-[#316BFA]"
            />
            <div className="flex justify-between text-[10px] text-[#9BA6BD] mt-1 font-mono">
              <span>$500K</span>
              <span>$25M</span>
              <span>$50M+</span>
            </div>
          </div>

          {/* Initial Supply */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">Suministro de Tokens a Emitir</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {initialSupply.toLocaleString()} unidades
              </span>
            </div>
            <input
              type="number"
              value={initialSupply}
              onChange={(e) => setInitialSupply(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg bg-[#0B0D12] border border-[#273246] px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#316BFA]"
            />
          </div>

          {/* Compliance & Security Toggles */}
          <div className="pt-2 border-t border-[#273246] space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Reglas de Control & Seguridad
            </span>

            <label className="flex items-center justify-between cursor-pointer text-xs">
              <span className="text-slate-300">Identity Registry On-Chain (KYC/AML)</span>
              <input
                type="checkbox"
                checked={requireIdentityRegistry}
                onChange={(e) => setRequireIdentityRegistry(e.target.checked)}
                className="h-4 w-4 rounded border-[#273246] bg-[#0B0D12] text-[#316BFA]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-xs">
              <span className="text-slate-300">Pausabilidad de Emergencia (Circuit Breaker)</span>
              <input
                type="checkbox"
                checked={isPausable}
                onChange={(e) => setIsPausable(e.target.checked)}
                className="h-4 w-4 rounded border-[#273246] bg-[#0B0D12] text-[#316BFA]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-xs">
              <span className="text-slate-300">Emisión Posterior (Mintable)</span>
              <input
                type="checkbox"
                checked={isMintable}
                onChange={(e) => setIsMintable(e.target.checked)}
                className="h-4 w-4 rounded border-[#273246] bg-[#0B0D12] text-[#316BFA]"
              />
            </label>
          </div>

          {/* Monthly Transaction Volume */}
          <div className="pt-2 border-t border-[#273246]">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">Operaciones Mensuales Estimadas</span>
              <span className="font-mono font-bold text-white tabular-nums">{monthlyTransferVolume} tx/mes</span>
            </div>
            <input
              type="range"
              min="10"
              max="2000"
              step="10"
              value={monthlyTransferVolume}
              onChange={(e) => setMonthlyTransferVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-[#273246] rounded-lg appearance-none cursor-pointer accent-[#316BFA]"
            />
          </div>

        </div>

        {/* RIGHT PANEL: SIMULATION RESULTS & PROJECTIONS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4">
              <span className="text-[11px] font-semibold text-[#9BA6BD] uppercase tracking-wider block">
                Valor Nominal por Token
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold text-white tabular-nums">
                  ${calculations.tokenNominalPrice.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#9BA6BD]">USD</span>
              </div>
              <span className="text-[10px] text-[#9BA6BD] block mt-1">
                Basado en ${assetValuation.toLocaleString()} / {initialSupply.toLocaleString()} tokens
              </span>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4">
              <span className="text-[11px] font-semibold text-[#9BA6BD] uppercase tracking-wider block">
                Costo Despliegue ({selectedNet.currency})
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold text-[#7096FF] tabular-nums">
                  ${calculations.deployCostUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#9BA6BD]">USD est.</span>
              </div>
              <span className="text-[10px] text-[#9BA6BD] block mt-1 font-mono">
                ~{calculations.deploymentGasUnits.toLocaleString()} gas units
              </span>
            </div>

            <div className="rounded-xl bg-[#141A27] border border-[#273246] p-4">
              <span className="text-[11px] font-semibold text-[#9BA6BD] uppercase tracking-wider block">
                Costo por Transferencia
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold text-[#16A34A] tabular-nums">
                  ${calculations.transferCostUsd < 0.01 ? '< $0.01' : `$${calculations.transferCostUsd.toFixed(3)}`}
                </span>
                <span className="text-[11px] text-[#9BA6BD]">USD / tx</span>
              </div>
              <span className="text-[10px] text-[#9BA6BD] block mt-1">
                {monthlyTransferVolume} ops = ${calculations.monthlyGasCostUsd.toFixed(2)}/mes
              </span>
            </div>

          </div>

          {/* Network Side-by-Side Comparison */}
          <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Comparativa de Redes de Despliegue
              </h3>
              <span className="text-[11px] text-[#9BA6BD]">Calculado para {standard}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#273246] text-[#9BA6BD]">
                    <th className="py-2.5 font-medium">Red EVM</th>
                    <th className="py-2.5 font-medium">Finalidad</th>
                    <th className="py-2.5 font-medium text-right">Despliegue Est.</th>
                    <th className="py-2.5 font-medium text-right">Transferencia Est.</th>
                    <th className="py-2.5 font-medium text-right">Idoneidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273246] text-slate-200">
                  <tr className={network === 'polygon' ? 'bg-[#316BFA]/5 font-semibold text-white' : ''}>
                    <td className="py-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8247E5]" />
                      <span>Polygon PoS</span>
                    </td>
                    <td className="py-3 font-mono text-[#9BA6BD]">{calculations.comparative.polygon.settlementTime}</td>
                    <td className="py-3 font-mono text-right tabular-nums">${calculations.comparative.polygon.deployUsd.toFixed(2)} USD</td>
                    <td className="py-3 font-mono text-right tabular-nums">${calculations.comparative.polygon.transferUsd.toFixed(3)} USD</td>
                    <td className="py-3 text-right text-[#16A34A]">Alta liquidez / Bajo costo</td>
                  </tr>

                  <tr className={network === 'arbitrum' ? 'bg-[#316BFA]/5 font-semibold text-white' : ''}>
                    <td className="py-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#28A0F0]" />
                      <span>Arbitrum One</span>
                    </td>
                    <td className="py-3 font-mono text-[#9BA6BD]">{calculations.comparative.arbitrum.settlementTime}</td>
                    <td className="py-3 font-mono text-right tabular-nums">${calculations.comparative.arbitrum.deployUsd.toFixed(2)} USD</td>
                    <td className="py-3 font-mono text-right tabular-nums">${calculations.comparative.arbitrum.transferUsd.toFixed(3)} USD</td>
                    <td className="py-3 text-right text-[#7096FF]">Institucional L2 / Seguridad L1</td>
                  </tr>

                  <tr className={network === 'ethereum' ? 'bg-[#316BFA]/5 font-semibold text-white' : ''}>
                    <td className="py-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#627EEA]" />
                      <span>Ethereum L1</span>
                    </td>
                    <td className="py-3 font-mono text-[#9BA6BD]">{calculations.comparative.ethereum.settlementTime}</td>
                    <td className="py-3 font-mono text-right tabular-nums">${calculations.comparative.ethereum.deployUsd.toFixed(2)} USD</td>
                    <td className="py-3 font-mono text-right tabular-nums">${calculations.comparative.ethereum.transferUsd.toFixed(2)} USD</td>
                    <td className="py-3 text-right text-slate-400">Emisiones &gt;$25M USD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Token Distribution Simulation Chart Bar */}
          <div className="rounded-2xl bg-[#141A27] border border-[#273246] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Simulación de Asignación y Cap Table
              </h3>
              <span className="text-xs font-mono text-[#7096FF]">Total: 100%</span>
            </div>

            {/* Visual multi-segmented bar */}
            <div className="w-full h-5 rounded-lg bg-[#0B0D12] overflow-hidden flex border border-[#273246]">
              <div 
                style={{ width: `${sponsorEquityPercent}%` }} 
                className="bg-[#316BFA] h-full transition-all"
                title={`Sponsor / Originador: ${sponsorEquityPercent}%`}
              />
              <div 
                style={{ width: `${investorAllocationPercent}%` }} 
                className="bg-[#16A34A] h-full transition-all"
                title={`Inversores Calificados: ${investorAllocationPercent}%`}
              />
              <div 
                style={{ width: `${treasuryReservePercent}%` }} 
                className="bg-[#D97706] h-full transition-all"
                title={`Reserva de Liquidez / Tesorería: ${treasuryReservePercent}%`}
              />
            </div>

            {/* Distribution sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300">Originador / Sponsor</span>
                  <span className="font-mono text-[#316BFA] font-bold">{sponsorEquityPercent}%</span>
                </div>
                <div className="text-[11px] text-[#9BA6BD] font-mono tabular-nums">
                  {((initialSupply * sponsorEquityPercent) / 100).toLocaleString()} tokens
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300">Inversores Calificados</span>
                  <span className="font-mono text-[#16A34A] font-bold">{investorAllocationPercent}%</span>
                </div>
                <div className="text-[11px] text-[#9BA6BD] font-mono tabular-nums">
                  {((initialSupply * investorAllocationPercent) / 100).toLocaleString()} tokens
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300">Reserva de Tesorería</span>
                  <span className="font-mono text-[#D97706] font-bold">{treasuryReservePercent}%</span>
                </div>
                <div className="text-[11px] text-[#9BA6BD] font-mono tabular-nums">
                  {((initialSupply * treasuryReservePercent) / 100).toLocaleString()} tokens
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action: Send parameters to Project Wizard */}
          <div className="rounded-xl bg-[#0B0D12] border border-[#273246] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-white">¿Satisfecho con la simulación?</div>
              <div className="text-[11px] text-[#9BA6BD]">
                Traslade estos parámetros ({standard} en {selectedNet.name}) directamente al Asistente de Creación de Proyecto.
              </div>
            </div>

            <button
              onClick={handleLaunchProjectFromSimulation}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#316BFA] hover:bg-[#2557DC] rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <span>Aplicar al Wizard de Proyecto</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
