import {getAddress,id,ZeroAddress,parseUnits,formatEther} from 'ethers';
import {assertSepolia,FACTORY_REGISTRY,workflowInterface,type ChainLog} from './tokenWorkflow';
import {SEPOLIA_HEX,type WalletProvider} from './factoryWallet';
import {tokenInterface} from './tokenContract';
export type ManagementAction='burn'|'pause'|'unpause';
export interface TokenTarget {factory:string;projectReference:string;}
async function tokenCall(wallet:WalletProvider,token:string,method:string,args:unknown[]=[]) {
  const result=await wallet.request({method:'eth_call',params:[{to:token,data:tokenInterface.encodeFunctionData(method,args)},'latest']});
  return tokenInterface.decodeFunctionResult(method,result as string)[0];
}
export async function readManagedToken(wallet:WalletProvider,target:TokenTarget) {
  await assertSepolia(wallet);
  if(getAddress(target.factory)!==FACTORY_REGISTRY.address)throw new Error('Seleccione el factory registrado en Sepolia.');
  if(!target.projectReference.trim())throw new Error('Falta el identificador del expediente.');
  const encoded=await wallet.request({method:'eth_call',params:[{to:FACTORY_REGISTRY.address,data:workflowInterface.encodeFunctionData('tokenByProject',[id(target.projectReference.trim())])},'latest']});
  const token=getAddress(workflowInterface.decodeFunctionResult('tokenByProject',encoded as string)[0]);
  if(token===ZeroAddress)throw new Error('Este expediente todavía no tiene un token creado. Seleccione el expediente de TKN.');
  const accounts=await wallet.request({method:'eth_accounts'});
  if(!Array.isArray(accounts)||typeof accounts[0]!=='string')throw new Error('Conecte una wallet para consultar su saldo y permisos.');
  const account=getAddress(accounts[0]);
  const [symbol,decimals,supply,balance,paused,burnable,pausable,canPause]=await Promise.all([
    tokenCall(wallet,token,'symbol'),tokenCall(wallet,token,'decimals'),tokenCall(wallet,token,'totalSupply'),
    tokenCall(wallet,token,'balanceOf',[account]),tokenCall(wallet,token,'paused'),tokenCall(wallet,token,'burnable'),
    tokenCall(wallet,token,'pausable'),tokenCall(wallet,token,'hasRole',[id('PAUSER_ROLE'),account]),
  ]);
  await assertSepolia(wallet);
  return {token,account,symbol:String(symbol),decimals:Number(decimals),supply:BigInt(supply),balance:BigInt(balance),paused:Boolean(paused),burnable:Boolean(burnable),pausable:Boolean(pausable),canPause:Boolean(canPause)};
}
export function burnUnits(value:string,decimals:number,balance:bigint) {
  if(!/^\d+(\.\d+)?$/.test(value)||(value.split('.')[1]?.length??0)>decimals)throw new Error('Ingrese una cantidad válida, usando punto para los decimales.');
  const amount=parseUnits(value,decimals);
  if(amount<=0n)throw new Error('La cantidad a quemar debe ser mayor que cero.');
  if(amount>balance)throw new Error('No tiene suficientes tokens en esta wallet.');
  return amount;
}
export async function simulateManagement(wallet:WalletProvider,target:TokenTarget,action:ManagementAction,amountText='') {
  const state=await readManagedToken(wallet,target);
  let amount=0n;
  if(action==='burn') {
    if(!state.burnable)throw new Error('La quema no está habilitada en este token.');
    if(state.paused)throw new Error('El token está pausado. Reanúdelo antes de quemar.');
    amount=burnUnits(amountText,state.decimals,state.balance);
  } else {
    if(!state.pausable)throw new Error('La pausa no está habilitada en este token.');
    if(!state.canPause)throw new Error('Esta wallet no tiene permiso de pausa. Para TKN, conecte A047.');
    if(state.paused===(action==='pause'))throw new Error(state.paused?'El token ya está pausado. Actualice el estado.':'El token ya está activo. Actualice el estado.');
  }
  const tx={to:state.token,from:state.account,data:tokenInterface.encodeFunctionData(action,action==='burn'?[amount]:[]),value:'0x0',chainId:SEPOLIA_HEX};
  await wallet.request({method:'eth_call',params:[tx,'latest']});
  const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[tx]}) as string)*120n/100n;
  const [price,balance]=await Promise.all([wallet.request({method:'eth_gasPrice'}),wallet.request({method:'eth_getBalance',params:[state.account,'latest']})]);
  if(BigInt(balance as string)<gas*BigInt(price as string))throw new Error('Saldo de ETH Sepolia insuficiente para el gas.');
  return {target,action,amountText,amount:amount.toString(),state,tx,gas,estimatedEth:formatEther(gas*BigInt(price as string))};
}
export type ManagementReview=Awaited<ReturnType<typeof simulateManagement>>;
export interface ManagementPending {hash:string;token:string;from:string;data:string;action:ManagementAction;amount:string;projectReference:string;}
export async function sendManagement(wallet:WalletProvider,review:ManagementReview):Promise<ManagementPending> {
  const fresh=await simulateManagement(wallet,review.target,review.action,review.amountText);
  if(fresh.state.account!==review.state.account||fresh.state.token!==review.state.token||fresh.tx.data!==review.tx.data)throw new Error('Cambió la cuenta o el token. Vuelva a revisar y simular.');
  await assertSepolia(wallet);
  const accounts=await wallet.request({method:'eth_accounts'}) as string[];
  if(!accounts[0]||getAddress(accounts[0])!==review.state.account)throw new Error('Cambió la cuenta. Vuelva a simular.');
  const hash=await wallet.request({method:'eth_sendTransaction',params:[{...fresh.tx,gas:'0x'+fresh.gas.toString(16)}]});
  if(typeof hash!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(hash))throw new Error('No se recibió un hash válido. Revise la wallet antes de reintentar.');
  return {hash,token:fresh.state.token,from:fresh.state.account,data:fresh.tx.data,action:fresh.action,amount:fresh.amount,projectReference:review.target.projectReference};
}
export async function confirmManagement(wallet:WalletProvider,pending:ManagementPending) {
  await assertSepolia(wallet);
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[pending.hash]}) as null|{status:string;logs:ChainLog[]};
  if(!receipt)return 'pending';
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[pending.hash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!tx?.to||getAddress(tx.to)!==getAddress(pending.token)||getAddress(tx.from)!==getAddress(pending.from)||tx.input.toLowerCase()!==pending.data.toLowerCase()||BigInt(tx.value)!==0n)throw new Error('La transacción no coincide con la acción solicitada.');
  if(BigInt(receipt.status)===0n)return 'failed';
  if(BigInt(receipt.status)!==1n)throw new Error('Receipt desconocido.');
  const event=receipt.logs.filter(log=>getAddress(log.address)===getAddress(pending.token)).map(log=>tokenInterface.parseLog(log)).find(log=>pending.action==='burn'
    ? log?.name==='Transfer'&&getAddress(log.args.from)===getAddress(pending.from)&&log.args.to===ZeroAddress&&log.args.value===BigInt(pending.amount)
    : log?.name===(pending.action==='pause'?'Paused':'Unpaused')&&getAddress(log.args.account)===getAddress(pending.from));
  if(!event)throw new Error('No se encontró la confirmación de esta acción en el contrato.');
  return 'confirmed';
}
