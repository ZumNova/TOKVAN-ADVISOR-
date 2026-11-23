import {useEffect,useState} from 'react';
import {AbiCoder, ContractFactory, Interface, ZeroAddress, formatEther, getAddress, id, isAddress, keccak256, toUtf8Bytes} from 'ethers';
import artifact from '../../generated/factoryV2Artifact.json';
import {CONFIG_TUPLE, prepareFactoryRequest, projectBlockers, type FactoryInput} from '../../lib/erc20Factory';
import {DEPLOYER, injectedWallet, SEPOLIA_HEX, walletError, type WalletProvider} from '../../lib/factoryWallet';
import {loadGovernance} from '../../lib/governance';
import {linkIssuance} from '../../lib/issuances';
import type {TokenProject} from '../../types';

const deploymentKey='tokvan:erc20:factory-v2:deployment';
const creationKey='tokvan:erc20:factory-v2:creation';
const abi=new Interface(artifact.abi);
const saved=(key:string)=>{try{return localStorage.getItem(key)||'';}catch{return '';}};
const txHash=(value:string)=>/^0x[0-9a-f]{64}$/i.test(value);
async function wallet047(wallet:WalletProvider){
 const chain=await wallet.request({method:'eth_chainId'});
 if(typeof chain!=='string'||BigInt(chain)!==11155111n)throw new Error('Seleccioná Sepolia en la wallet.');
 const accounts=await wallet.request({method:'eth_accounts'});
 if(!Array.isArray(accounts)||typeof accounts[0]!=='string'||getAddress(accounts[0])!==DEPLOYER)throw new Error('Seleccioná la wallet 047.');
 return DEPLOYER;
}
async function receipt(wallet:WalletProvider,hash:string){
 const result=await wallet.request({method:'eth_getTransactionReceipt',params:[hash]}) as {status:string;contractAddress:string|null;logs:{address:string;topics:string[];data:string}[]}|null;
 if(!result)throw new Error('La transacción aún no tiene confirmación en Sepolia.');
 if(BigInt(result.status)!==1n)throw new Error('La transacción falló en Sepolia.');
 return result;
}
async function deploymentData(){return (await new ContractFactory(artifact.abi,artifact.bytecode).getDeployTransaction(DEPLOYER)).data!;}

export default function ERC20FactoryV2View({projects,staffAccount,initialProjectId}:{projects:TokenProject[];staffAccount:string|null;initialProjectId?:string}){
 const [deploymentHash,setDeploymentHash]=useState(()=>saved(deploymentKey));
 const [factory,setFactory]=useState('');
 const [projectId,setProjectId]=useState(initialProjectId||'');
 const [admin,setAdmin]=useState('');
 const [treasury,setTreasury]=useState('');
 const [approvedHash,setApprovedHash]=useState('');
 const [creationHash,setCreationHash]=useState(()=>saved(`${creationKey}:${initialProjectId||''}`));
 const [token,setToken]=useState('');
 const [linked,setLinked]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const project=projects.find(item=>item.id===projectId&&item.standard==='ERC-20');
 const blockers=project?projectBlockers(project):[];
 useEffect(()=>{if(initialProjectId){setProjectId(initialProjectId);setApprovedHash('');setCreationHash(saved(`${creationKey}:${initialProjectId}`));}},[initialProjectId]);
 const run=async(action:()=>Promise<void>)=>{setBusy(true);setError('');setMessage('');try{await action();}catch(e){setError(walletError(e));}finally{setBusy(false);}};
 const switchChain=()=>run(async()=>{await injectedWallet().request({method:'wallet_switchEthereumChain',params:[{chainId:SEPOLIA_HEX}]});setMessage('Sepolia seleccionada.');});
 const deploy=()=>run(async()=>{
  if(deploymentHash)throw new Error('Ya hay una transacción de despliegue registrada. Verificala antes de intentar otra.');
  const wallet=injectedWallet();await wallet047(wallet);
  const data=await deploymentData();
  const transaction={from:DEPLOYER,data,value:'0x0'};
  const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[transaction]}) as string);
  await wallet047(wallet);
  const hash=await wallet.request({method:'eth_sendTransaction',params:[{...transaction,gas:'0x'+(gas*120n/100n).toString(16)}]});
  if(typeof hash!=='string'||!txHash(hash))throw new Error('La wallet no devolvió un hash válido. Revisá su historial antes de reintentar.');
  setDeploymentHash(hash);localStorage.setItem(deploymentKey,hash);setMessage('Despliegue enviado. Verificá la confirmación antes de preparar la emisión.');
 });
 const verifyFactory=()=>run(async()=>{
  if(!txHash(deploymentHash))throw new Error('Ingresá el hash de despliegue del factory v2.');
  const wallet=injectedWallet();await wallet047(wallet);const confirmed=await receipt(wallet,deploymentHash);
  if(!confirmed.contractAddress)throw new Error('Ese hash no creó un contrato.');
  const transaction=await wallet.request({method:'eth_getTransactionByHash',params:[deploymentHash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!transaction||getAddress(transaction.from)!==DEPLOYER||transaction.to!==null||BigInt(transaction.value)!==0n||transaction.input.toLowerCase()!==(await deploymentData()).toLowerCase())throw new Error('El despliegue no corresponde al factory v2 de la 047.');
  const address=getAddress(confirmed.contractAddress);const code=await wallet.request({method:'eth_getCode',params:[address,'latest']});
  if(typeof code!=='string'||code==='0x')throw new Error('No se encontró el código del factory.');
  const result=await wallet.request({method:'eth_call',params:[{to:address,data:abi.encodeFunctionData('operator')},'latest']}) as string;
  if(getAddress(abi.decodeFunctionResult('operator',result)[0])!==DEPLOYER)throw new Error('El operador del factory no es la 047.');
  setFactory(address);localStorage.setItem(deploymentKey,deploymentHash);setMessage('Factory v2 verificado en Sepolia. Operador: 047.');
 });
 const loadProject=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount)throw new Error('Seleccioná un expediente ERC-20 recibido y conectá la 047.');
  if(blockers.length)throw new Error(blockers.join(' '));
  const state=await loadGovernance(staffAccount,project.submissionId);
  if(!state.soloAuthorized)throw new Error('Falta la aprobación integral vigente de la 047 para esta versión.');
  const walletAddress=project.clientWalletNetwork==='sepolia'&&project.clientWalletAddress&&isAddress(project.clientWalletAddress)?getAddress(project.clientWalletAddress):'';
  setApprovedHash(state.projectHash);setAdmin(walletAddress);setTreasury(walletAddress);
  setMessage('Decisión integral verificada. Revisá administración, tesorería y cantidades antes de crear.');
 });
 const create=()=>run(async()=>{
  if(!factory||!project?.submissionId||!staffAccount||!approvedHash)throw new Error('Verificá el factory y cargá el expediente aprobado.');
  if(blockers.length)throw new Error(blockers.join(' '));
  const state=await loadGovernance(staffAccount,project.submissionId);
  if(!state.soloAuthorized||state.projectHash!==approvedHash)throw new Error('La decisión integral ya no corresponde a esta versión del expediente.');
  const input:FactoryInput={projectId:project.id,factory,admin,treasury,name:project.parameters.tokenName,symbol:project.parameters.tokenSymbol,decimals:String(project.parameters.decimals),initialSupply:String(project.parameters.initialSupply),maxSupply:String(project.parameters.maxSupply??project.parameters.initialSupply),mintable:project.parameters.isMintable,burnable:project.parameters.isBurnable,pausable:project.parameters.isPausable};
  const prepared=prepareFactoryRequest(input),wallet=injectedWallet();await wallet047(wallet);
  if(!isAddress(admin)||!isAddress(treasury)||getAddress(admin)===ZeroAddress||getAddress(treasury)===ZeroAddress)throw new Error('Revisá las wallets de administración y tesorería.');
  const existing=await wallet.request({method:'eth_call',params:[{to:factory,data:abi.encodeFunctionData('tokenByProject',[prepared.projectId])},'latest']}) as string;
  if(getAddress(abi.decodeFunctionResult('tokenByProject',existing)[0])!==ZeroAddress)throw new Error('Este expediente ya tiene un token creado por el factory v2.');
  const data=abi.encodeFunctionData('createToken',[prepared.projectId,approvedHash,prepared.config]);
  const transaction={from:DEPLOYER,to:factory,data,value:'0x0'};
  await wallet.request({method:'eth_call',params:[transaction,'latest']});
  const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[transaction]}) as string);
  const price=BigInt(await wallet.request({method:'eth_gasPrice'}) as string);
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','address','bytes32','bytes32',CONFIG_TUPLE],[11155111n,factory,prepared.projectId,approvedHash,prepared.config]));
  if(!window.confirm(`Crear ${prepared.config.name} (${prepared.config.symbol}) en Sepolia\nSupply inicial: ${input.initialSupply}\nAdministradora: ${getAddress(admin)}\nTesorería: ${getAddress(treasury)}\nHash de versión: ${approvedHash}\nHash de configuración: ${digest}\nGas estimado con margen: ${formatEther(gas*120n/100n*price)} ETH\n\nLa wallet mostrará el costo final.`))return;
  await wallet047(wallet);
  const hash=await wallet.request({method:'eth_sendTransaction',params:[{...transaction,gas:'0x'+(gas*120n/100n).toString(16)}]});
  if(typeof hash!=='string'||!txHash(hash))throw new Error('La wallet no devolvió un hash válido. Revisá su historial.');
  setCreationHash(hash);localStorage.setItem(`${creationKey}:${project.id}`,hash);setMessage('Creación enviada. Verificá la confirmación en Sepolia.');
 });
 const verifyToken=()=>run(async()=>{
  if(!factory||!project||!approvedHash||!txHash(creationHash))throw new Error('Verificá el factory y cargá el expediente aprobado antes de comprobar la creación.');
  const wallet=injectedWallet();await wallet047(wallet);const confirmed=await receipt(wallet,creationHash);
  const event=confirmed.logs.filter(log=>getAddress(log.address)===factory).map(log=>{try{return abi.parseLog(log);}catch{return null;}}).find(log=>log?.name==='TokenCreated');
  if(!event)throw new Error('La transacción no emitió TokenCreated en este factory.');
  if(event.args.projectId!==id(project.id)||event.args.projectHash!==approvedHash)throw new Error('La creación no corresponde a esta versión del expediente.');
  const input:FactoryInput={projectId:project.id,factory,admin,treasury,name:project.parameters.tokenName,symbol:project.parameters.tokenSymbol,decimals:String(project.parameters.decimals),initialSupply:String(project.parameters.initialSupply),maxSupply:String(project.parameters.maxSupply??project.parameters.initialSupply),mintable:project.parameters.isMintable,burnable:project.parameters.isBurnable,pausable:project.parameters.isPausable};
  const prepared=prepareFactoryRequest(input);
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','address','bytes32','bytes32',CONFIG_TUPLE],[11155111n,factory,prepared.projectId,approvedHash,prepared.config]));
  if(event.args.configDigest!==digest)throw new Error('La configuración creada no coincide con los datos revisados.');
  const address=getAddress(event.args.token);const code=await wallet.request({method:'eth_getCode',params:[address,'latest']});
  if(typeof code!=='string'||code==='0x')throw new Error('El token todavía no tiene código verificable.');
  setToken(address);setMessage('Token ERC-20 v2 confirmado en Sepolia. Guardá el hash de creación para vincularlo al expediente.');
 });
 const linkToken=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||!token||!txHash(deploymentHash))throw new Error('Primero verificá el token y el factory.');
  const result=await linkIssuance(staffAccount,project.submissionId,creationHash,deploymentHash);
  if(getAddress(result.issuance.token_address)!==token)throw new Error('Supabase devolvió una dirección de token diferente.');
  setLinked(true);setMessage('Emisión vinculada al expediente en Supabase. La constancia del cliente puede mostrar «Token creado».');
 });
 const field='w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900';
 return <div className="space-y-5 rounded-2xl bg-white p-5 text-slate-900">
  <h2 className="text-2xl font-bold">ERC-20 · operador único · Sepolia</h2>
  <p>La 047 firma una decisión integral por expediente y, luego, la transacción de creación. El factory v1 y sus tokens conservan su recorrido anterior.</p>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">1. Factory v2</h3><p className="text-sm">Operador fijo: {DEPLOYER}</p><button type="button" disabled={busy||!!deploymentHash} onClick={deploy} className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50">Desplegar con 047</button><label className="block text-sm">Hash de despliegue<input className={field} value={deploymentHash} onChange={e=>{setDeploymentHash(e.target.value);setFactory('');}} placeholder="0x…"/></label><button type="button" disabled={busy||!txHash(deploymentHash)} onClick={verifyFactory} className="rounded-lg border border-blue-600 px-3 py-2">Verificar factory en Sepolia</button>{factory&&<p className="break-all text-green-700">Factory verificado: {factory}</p>}</section>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">2. Expediente y decisión integral</h3><select className={field} value={projectId} onChange={e=>{setProjectId(e.target.value);setApprovedHash('');setAdmin('');setTreasury('');setCreationHash(saved(`${creationKey}:${e.target.value}`));}}><option value="">Elegí un expediente ERC-20 recibido</option>{projects.filter(item=>item.standard==='ERC-20'&&item.submissionId).map(item=><option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select>{blockers.length>0&&<p className="text-amber-800">{blockers.join(' ')}</p>}<button type="button" disabled={busy||!project?.submissionId||blockers.length>0} onClick={loadProject} className="rounded-lg border border-blue-600 px-3 py-2 disabled:opacity-50">Cargar decisión integral desde Supabase</button>{approvedHash&&<><p className="break-all text-sm text-green-700">Versión aprobada: {approvedHash}</p><p>{project?.parameters.tokenName} ({project?.parameters.tokenSymbol}) · supply {project?.parameters.initialSupply} · máximo {project?.parameters.maxSupply??project?.parameters.initialSupply}</p><label className="block">Administradora<input className={field} value={admin} onChange={e=>setAdmin(e.target.value)}/></label><label className="block">Tesorería inicial<input className={field} value={treasury} onChange={e=>setTreasury(e.target.value)}/></label><button type="button" disabled={busy||!factory||!isAddress(admin)||!isAddress(treasury)||!!creationHash} onClick={create} className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50">Simular y crear token con 047</button></>}</section>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">3. Confirmación</h3><label className="block text-sm">Hash de creación<input className={field} value={creationHash} onChange={e=>{setCreationHash(e.target.value);setToken('');setLinked(false);}} placeholder="0x…"/></label><button type="button" disabled={busy||!factory||!txHash(creationHash)} onClick={verifyToken} className="rounded-lg border border-blue-600 px-3 py-2 disabled:opacity-50">Verificar token en Sepolia</button>{token&&<><a className="block break-all text-blue-700 underline" href={`https://sepolia.etherscan.io/address/${token}`} target="_blank" rel="noreferrer">Token: {token}</a><button type="button" disabled={busy||linked} onClick={linkToken} className="rounded-lg bg-green-700 px-3 py-2 text-white disabled:opacity-50">Vincular token al expediente en Supabase</button></>}</section>
  <button type="button" disabled={busy} onClick={switchChain} className="rounded-lg border px-3 py-2">Cambiar a Sepolia</button>
  {message&&<p role="status" className="text-green-700">{message}</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}
 </div>;
}
