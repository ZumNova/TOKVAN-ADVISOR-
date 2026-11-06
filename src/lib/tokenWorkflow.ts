import { Interface, getAddress, ZeroAddress, formatEther } from 'ethers';
import artifact from '../generated/factoryArtifact.json';
import registry from '../../deployment/sepolia-registry.json';
import { PARTICIPANTS, SEPOLIA_HEX, type WalletProvider } from './factoryWallet';
import type { prepareFactoryRequest } from './erc20Factory';

export { registry as FACTORY_REGISTRY };
export type TokenRequest = ReturnType<typeof prepareFactoryRequest>;
export type TokenAction = 'approval' | 'revocation' | 'deployment';
export const workflowInterface = new Interface(artifact.abi);
export const REVIEWERS = [
  {label:'Técnico', address:PARTICIPANTS.technicalReviewer, bit:1},
  {label:'Compliance', address:PARTICIPANTS.complianceReviewer, bit:2},
  {label:'Directorio', address:PARTICIPANTS.boardReviewer, bit:4},
];
export async function assertSepolia(wallet: WalletProvider) {
  const chain = await wallet.request({method:'eth_chainId'});
  if (typeof chain !== 'string' || BigInt(chain) !== 11155111n) throw new Error('Seleccione Sepolia en la wallet.');
}
async function call(wallet: WalletProvider, method:string, args:unknown[]) {
  const data=workflowInterface.encodeFunctionData(method,args);
  const output=await wallet.request({method:'eth_call',params:[{to:registry.address,data},'latest']});
  return workflowInterface.decodeFunctionResult(method,output as string)[0];
}
export async function readTokenState(wallet:WalletProvider, request:TokenRequest) {
  await assertSepolia(wallet);
  if (getAddress(request.deployment.to)!==registry.address || request.chainId!==registry.chainId) throw new Error('Use el factory ERC-20 registrado en Sepolia.');
  const [digest, approvals, token, accounts] = await Promise.all([
    call(wallet,'hashConfig',[request.projectId,request.config]), call(wallet,'approvals',[request.digest]),
    call(wallet,'tokenByProject',[request.projectId]), wallet.request({method:'eth_accounts'}),
  ]);
  if (digest!==request.digest) throw new Error('Los parámetros no coinciden con el hash del factory. Prepare nuevamente la emisión.');
  const account=Array.isArray(accounts)&&typeof accounts[0]==='string' ? getAddress(accounts[0]) : '';
  return {approvals:Number(approvals),token:getAddress(token as string),account};
}
function authorize(state:Awaited<ReturnType<typeof readTokenState>>, action:TokenAction) {
  if (state.token!==ZeroAddress) throw new Error('Este expediente ya tiene un token desplegado. Consulte la bitácora.');
  if (action==='deployment') {
    if (state.account!==PARTICIPANTS.operator) throw new Error('La creación debe firmarse desde el Operador 8A25.');
    if (state.approvals!==7) throw new Error('Faltan aprobaciones on-chain para estos parámetros.');
  } else {
    const reviewer=REVIEWERS.find(r=>r.address===state.account);
    if (!reviewer) throw new Error('Conecte una de las tres wallets revisoras.');
    const approved=Boolean(state.approvals&reviewer.bit);
    if (approved===(action==='approval')) throw new Error(approved?'Esta wallet ya aprobó estos parámetros.':'Esta wallet no tiene una aprobación para revocar.');
  }
}
export async function estimateTokenAction(wallet:WalletProvider, request:TokenRequest, action:TokenAction) {
  const state=await readTokenState(wallet,request); authorize(state,action);
  const tx={...request[action],value:'0x0',from:state.account,chainId:SEPOLIA_HEX};
  // eth_call executes the exact action without sending it.
  await wallet.request({method:'eth_call',params:[tx,'latest']});
  const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[tx]}) as string)*120n/100n;
  const [price,balance]=await Promise.all([
    wallet.request({method:'eth_gasPrice'}),wallet.request({method:'eth_getBalance',params:[state.account,'latest']}),
  ]);
  if (BigInt(balance as string)<gas*BigInt(price as string)) throw new Error('Saldo insuficiente de ETH Sepolia para esta operación.');
  return {tx,gas,estimatedEth:formatEther(gas*BigInt(price as string)),account:state.account};
}
export interface PendingTokenTransaction {
  hash:string; from:string; data:string; digest:string; projectId:string; action:TokenAction; submittedAt:string;
}
export async function sendTokenAction(wallet:WalletProvider, request:TokenRequest, action:TokenAction, expectedAccount:string) {
  const estimate=await estimateTokenAction(wallet,request,action);
  if (estimate.account!==expectedAccount) throw new Error('Cambió la cuenta. Vuelva a simular antes de firmar.');
  const state=await readTokenState(wallet,request); authorize(state,action);
  if (state.account!==expectedAccount) throw new Error('Cambió la cuenta. Vuelva a simular.');
  const hash=await wallet.request({method:'eth_sendTransaction',params:[{...estimate.tx,gas:'0x'+estimate.gas.toString(16)}]});
  if(typeof hash!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error('No se recibió un hash válido. Revise el historial de su wallet antes de reintentar.');
  return {hash,from:state.account,data:estimate.tx.data,digest:request.digest,projectId:request.projectId,action,submittedAt:new Date().toISOString()} satisfies PendingTokenTransaction;
}
export interface ChainLog { address:string;topics:string[];data:string;transactionHash:string;blockNumber:string;logIndex:string;removed?:boolean; }
export async function confirmTokenTransaction(wallet:WalletProvider, pending:PendingTokenTransaction) {
  await assertSepolia(wallet);
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[pending.hash]}) as null | {status:string;logs:ChainLog[]};
  if(!receipt) return 'pending';
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[pending.hash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!tx || !tx.to || getAddress(tx.to)!==registry.address || getAddress(tx.from)!==getAddress(pending.from) || tx.input.toLowerCase()!==pending.data.toLowerCase() || BigInt(tx.value)!==0n) throw new Error('La transacción no coincide con la operación guardada.');
  if(BigInt(receipt.status)===0n) return 'failed';
  if(BigInt(receipt.status)!==1n) throw new Error('Estado de receipt desconocido.');
  const event=receipt.logs.filter(l=>getAddress(l.address)===registry.address).map(l=>workflowInterface.parseLog(l)).find(l=>
    pending.action==='deployment'
      ? l?.name==='TokenCreated'&&l.args.projectId===pending.projectId&&l.args.digest===pending.digest
      : l?.name==='ApprovalChanged'&&l.args.digest===pending.digest&&getAddress(l.args.reviewer)===getAddress(pending.from)&&l.args.approved===(pending.action==='approval'));
  if(!event) throw new Error('No se encontró el evento esperado del factory.');
  return 'confirmed';
}
export interface JournalEntry {
  id:string;kind:'Factory'|'Aprobación'|'Revocación'|'Token';transactionHash:string;blockNumber:number;
  timestamp?:string;address:string;projectId?:string;digest?:string;admin?:string;treasury?:string;
  tokenName?:string;tokenSymbol?:string;decimals?:number;initialSupplyBaseUnits?:string;maxSupplyBaseUnits?:string;
}
export const FACTORY_JOURNAL_ENTRY:JournalEntry={id:registry.transactionHash,kind:'Factory',transactionHash:registry.transactionHash,blockNumber:registry.blockNumber,timestamp:registry.timestamp,address:registry.address};
export function journalFromLogs(logs:ChainLog[]):JournalEntry[] {
  const entries=new Map<string,JournalEntry>();
  for(const log of logs) {
    if(log.removed||getAddress(log.address)!==registry.address) continue;
    const event=workflowInterface.parseLog(log); if(!event) continue;
    const base={id:`${log.transactionHash}:${log.logIndex}`,transactionHash:log.transactionHash,blockNumber:Number(BigInt(log.blockNumber)),digest:String(event.args.digest)};
    if(event.name==='TokenCreated') entries.set(base.id,{...base,kind:'Token',address:getAddress(event.args.token),projectId:event.args.projectId,admin:getAddress(event.args.admin),treasury:getAddress(event.args.treasury)});
    if(event.name==='ApprovalChanged') entries.set(base.id,{...base,kind:event.args.approved?'Aprobación':'Revocación',address:getAddress(event.args.reviewer)});
  }
  return [...entries.values()].sort((a,b)=>a.blockNumber-b.blockNumber);
}
export async function readJournal(wallet:WalletProvider) {
  await assertSepolia(wallet);
  // Public RPC pools may disagree on the latest block; keep a two-block margin.
  const latest=Math.max(0,Number(BigInt(await wallet.request({method:'eth_blockNumber'}) as string))-2);
  const logs:ChainLog[]=[];
  for(let from=registry.blockNumber;from<=latest;from+=5000) {
    await assertSepolia(wallet);
    const batch=await wallet.request({method:'eth_getLogs',params:[{address:registry.address,fromBlock:'0x'+from.toString(16),toBlock:'0x'+Math.min(latest,from+4999).toString(16),topics:[[workflowInterface.getEvent('TokenCreated')!.topicHash,workflowInterface.getEvent('ApprovalChanged')!.topicHash]]}]});
    if(!Array.isArray(batch)) throw new Error('El RPC no devolvió eventos válidos.');
    logs.push(...batch);
  }
  await assertSepolia(wallet);
  const entries=journalFromLogs(logs);
  for(const entry of entries.filter(e=>e.kind==='Token')) {
    const transaction=await wallet.request({method:'eth_getTransactionByHash',params:[entry.transactionHash]}) as {input:string;to:string}|null;
    if(!transaction||getAddress(transaction.to)!==registry.address) throw new Error('No se pudo recuperar la emisión registrada.');
    const decoded=workflowInterface.parseTransaction({data:transaction.input});
    if(decoded?.name==='createToken'&&decoded.args.projectId===entry.projectId) {
      const config=decoded.args.config;
      entry.tokenName=config.name;entry.tokenSymbol=config.symbol;entry.decimals=Number(config.decimals);
      entry.initialSupplyBaseUnits=String(config.initialSupply);entry.maxSupplyBaseUnits=String(config.maxSupply);
    }
  }
  await assertSepolia(wallet);
  return [FACTORY_JOURNAL_ENTRY,...entries];
}
