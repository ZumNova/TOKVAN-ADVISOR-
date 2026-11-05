import { ContractFactory, getAddress, formatEther } from 'ethers';
import artifact from '../generated/factoryArtifact.json';
import deployment from '../../deployment/sepolia-participants.json';

export const DEPLOYER = deployment.deployer;
export const PARTICIPANTS = deployment.participants;
export const SEPOLIA_HEX = '0xaa36a7';
export const DEPLOYMENT_STORAGE_KEY = 'tokvan:sepolia:factory-deployment:v1';
export interface WalletProvider {
  request(args: {method: string; params?: unknown[]}): Promise<unknown>;
  on?(event: string, callback: () => void): void;
  removeListener?(event: string, callback: () => void): void;
}
export function injectedWallet(): WalletProvider {
  const wallet = (window as Window & {ethereum?: WalletProvider}).ethereum;
  if (!wallet) throw new Error('Abra la dapp con una wallet EVM del navegador, por ejemplo MetaMask.');
  return wallet;
}
export async function assertDeploymentWallet(wallet: WalletProvider) {
  const chain = await wallet.request({method:'eth_chainId'});
  if (typeof chain !== 'string' || BigInt(chain) !== 11155111n) throw new Error('Cambie la wallet a Sepolia para continuar.');
  const accounts = await wallet.request({method:'eth_accounts'});
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || getAddress(accounts[0]) !== DEPLOYER) {
    throw new Error('Seleccione la cuenta 0x5211…A047 para desplegar.');
  }
  return DEPLOYER;
}
export async function deploymentTransaction() {
  const factory = new ContractFactory(artifact.abi, artifact.bytecode);
  const tx = await factory.getDeployTransaction(PARTICIPANTS.technicalReviewer, PARTICIPANTS.complianceReviewer, PARTICIPANTS.boardReviewer, PARTICIPANTS.operator);
  return {from:DEPLOYER, data:tx.data!, value:'0x0', chainId:SEPOLIA_HEX};
}
export async function estimateDeployment(wallet: WalletProvider) {
  await assertDeploymentWallet(wallet);
  const transaction = await deploymentTransaction();
  const gas = BigInt(await wallet.request({method:'eth_estimateGas', params:[transaction]}) as string);
  const price = BigInt(await wallet.request({method:'eth_gasPrice'}) as string);
  const balance = BigInt(await wallet.request({method:'eth_getBalance', params:[DEPLOYER,'latest']}) as string);
  // Margin for estimation variance. Final gas fees are reviewed in the wallet.
  const gasLimit = gas * 120n / 100n;
  if (balance < gasLimit * price) throw new Error('La cuenta A047 no tiene suficiente ETH Sepolia para la estimación actual.');
  return {gasLimit, estimatedEth:formatEther(gasLimit * price), balanceEth:formatEther(balance)};
}
export async function sendDeployment(wallet: WalletProvider) {
  const estimate = await estimateDeployment(wallet);
  const transaction = await deploymentTransaction();
  // Revalidate after async estimation so account/network changes invalidate the action.
  await assertDeploymentWallet(wallet);
  const hash = await wallet.request({method:'eth_sendTransaction', params:[{...transaction, gas:'0x'+estimate.gasLimit.toString(16)}]});
  if (typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error('La wallet no devolvió un hash de transacción válido. Revise su historial antes de reintentar.');
  return hash;
}
export async function verifyDeployment(wallet: WalletProvider, hash: string) {
  const chain = await wallet.request({method:'eth_chainId'});
  if (typeof chain !== 'string' || BigInt(chain) !== 11155111n) throw new Error('Cambie a Sepolia para comprobar la transacción.');
  const receipt = await wallet.request({method:'eth_getTransactionReceipt', params:[hash]}) as null | {status:string; contractAddress:string|null};
  if (!receipt) return {status:'pending' as const};
  if (BigInt(receipt.status) === 0n) return {status:'failed' as const};
  if (BigInt(receipt.status) !== 1n || !receipt.contractAddress) throw new Error('Receipt de despliegue inválido.');
  const transaction = await wallet.request({method:'eth_getTransactionByHash', params:[hash]}) as {from:string; to:string|null; input:string; value:string} | null;
  const expected = await deploymentTransaction();
  if (!transaction || getAddress(transaction.from) !== DEPLOYER || transaction.to !== null ||
      transaction.input.toLowerCase() !== expected.data.toLowerCase() || BigInt(transaction.value) !== 0n) {
    throw new Error('La transacción no corresponde a este factory y estos participantes.');
  }
  const address = getAddress(receipt.contractAddress);
  const code = await wallet.request({method:'eth_getCode', params:[address,'latest']});
  if (typeof code !== 'string' || code === '0x') throw new Error('Todavía no se encuentra el código del factory.');
  return {status:'confirmed' as const, address};
}
export function walletError(error: unknown) {
  const value = error as {code?:number|string; message?:string; shortMessage?:string};
  if (value?.code === 4001 || value?.code === 'ACTION_REJECTED') return 'Solicitud cancelada en la wallet. No se confirmó el envío.';
  return value?.shortMessage ?? value?.message ?? 'No se pudo completar la operación con la wallet.';
}
