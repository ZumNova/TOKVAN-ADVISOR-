import {useEffect,useState} from 'react';
import {AbiCoder,ContractFactory,Interface,ZeroAddress,getAddress,id,isAddress,keccak256,parseUnits,toUtf8Bytes} from 'ethers';
import factoryArtifact from '../../generated/erc3643FactoryV2Artifact.json';
import legacyArtifact from '../../generated/erc3643FactoryArtifact.json';
import suite from '../../generated/erc3643Suite.json';
import {DEPLOYER,injectedWallet,SEPOLIA_HEX,walletError,type WalletProvider} from '../../lib/factoryWallet';
import {loadGovernance} from '../../lib/governance';
import {linkRegulatedIssuanceV2} from '../../lib/regulatedIssuances';
import type {TokenProject} from '../../types';

const oldFactory='0x873Cd8e429c677e678b4C5970e28492585403774';
const factoryAbi=new Interface(factoryArtifact.abi),oldAbi=new Interface(legacyArtifact.abi),tokenAbi=new Interface(suite.implementations[0].abi);
const prefix='tokvan:erc3643:v2:',hashPattern=/^0x[0-9a-f]{64}$/i;
const saved=(key:string)=>{try{return localStorage.getItem(prefix+key)||'';}catch{return '';}};
const field='mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900';
const button='rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50';
async function wallet047(wallet:WalletProvider){
 const chain=await wallet.request({method:'eth_chainId'});
 if(typeof chain!=='string'||BigInt(chain)!==11155111n)throw new Error('Seleccioná Sepolia.');
 const accounts=await wallet.request({method:'eth_accounts'});
 if(!Array.isArray(accounts)||typeof accounts[0]!=='string'||getAddress(accounts[0])!==DEPLOYER)throw new Error('Conectá la wallet 047.');
}
async function readImplementations(wallet:WalletProvider){
 const addresses:string[]=[];
 for(let i=0;i<5;i++){
  const raw=await wallet.request({method:'eth_call',params:[{to:oldFactory,data:oldAbi.encodeFunctionData('implementations',[i])},'latest']}) as string;
  const address=getAddress(oldAbi.decodeFunctionResult('implementations',raw)[0]);
  const code=await wallet.request({method:'eth_getCode',params:[address,'latest']}) as string;
  if(keccak256(code)!==suite.implementations[i].runtimeHash)throw new Error(`El componente oficial ${suite.implementations[i].name} no coincide.`);
  addresses.push(address);
 }
 return addresses;
}
async function factoryData(wallet:WalletProvider){return (await new ContractFactory(factoryArtifact.abi,factoryArtifact.bytecode).getDeployTransaction(DEPLOYER,await readImplementations(wallet))).data!;}
async function confirmed(wallet:WalletProvider,hash:string){
 const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[hash]}) as {status:string;contractAddress:string|null;logs:{address:string;topics:string[];data:string}[]}|null;
 if(!receipt)throw new Error('La transacción aún no tiene confirmación.');
 if(BigInt(receipt.status)!==1n)throw new Error('La transacción falló en Sepolia.');
 return receipt;
}
async function send(wallet:WalletProvider,tx:{from:string;to?:string;data:string;value:string}){
 await wallet047(wallet);
 if(tx.to)await wallet.request({method:'eth_call',params:[tx,'latest']});
 const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[tx]}) as string);
 await wallet047(wallet);
 const hash=await wallet.request({method:'eth_sendTransaction',params:[{...tx,gas:'0x'+(gas*120n/100n).toString(16)}]});
 if(typeof hash!=='string'||!hashPattern.test(hash))throw new Error('La wallet no devolvió un hash válido; revisá su historial.');
 return hash;
}
export default function ERC3643FactoryV2View({projects,staffAccount,initialProjectId}:{projects:TokenProject[];staffAccount:string|null;initialProjectId?:string}){
 const [factoryHash,setFactoryHash]=useState(()=>saved('factory-hash')),[factory,setFactory]=useState('');
 const [projectId,setProjectId]=useState(initialProjectId||''),[approvedHash,setApprovedHash]=useState('');
 const [admin,setAdmin]=useState(''),[supplyCap,setSupplyCap]=useState('');
 const [creationHash,setCreationHash]=useState(()=>saved(`token:${initialProjectId||''}`)),[token,setToken]=useState(''),[linked,setLinked]=useState(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const project=projects.find(p=>p.id===projectId&&p.standard==='ERC-3643');
 const issues=project?[
  project.network!=='sepolia'?'El expediente debe estar en Sepolia.':'',
  project.parameters.isUpgradeabilityEnabled?'Esta suite de prueba no admite UUPS.':'',
  project.parameters.decimals<0||project.parameters.decimals>18?'Los decimales deben estar entre 0 y 18.':'',
 ].filter(Boolean):[];
 useEffect(()=>{if(initialProjectId){setProjectId(initialProjectId);setApprovedHash('');setCreationHash(saved(`token:${initialProjectId}`));setToken('');setLinked(false);}},[initialProjectId]);
 const run=async(action:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError('');setMessage('');try{await action();}catch(e){setError(walletError(e));}finally{setBusy(false);}};
 const config=()=>{
  if(!project||issues.length)throw new Error(issues.join(' ')||'Elegí un expediente ERC-3643 recibido.');
  if(!approvedHash||!hashPattern.test(approvedHash))throw new Error('Cargá la decisión integral vigente.');
  if(!isAddress(admin.trim())||getAddress(admin.trim())===ZeroAddress)throw new Error('Completá una wallet propietaria válida.');
  const name=project.parameters.tokenName.trim(),symbol=project.parameters.tokenSymbol.trim();
  if(!name||toUtf8Bytes(name).length>64||!symbol||toUtf8Bytes(symbol).length>16)throw new Error('Revisá nombre y símbolo del expediente.');
  if(!/^\d+(\.\d+)?$/.test(supplyCap)||Number(supplyCap)<=0)throw new Error('Ingresá un máximo de suministro positivo.');
  const cap=parseUnits(supplyCap,project.parameters.decimals);
  if(cap<=0n)throw new Error('El máximo debe ser positivo.');
  const owner=getAddress(admin.trim());
  return {name,symbol,decimals:project.parameters.decimals,admin:owner,claimAuthority:owner,supplyCap:cap,walletCap:cap,countries:[] as number[],dossierHash:approvedHash};
 };
 const deploy=()=>run(async()=>{
  if(factoryHash)throw new Error('Primero verificá o corregí el hash de despliegue existente.');
  const wallet=injectedWallet();await wallet047(wallet);
  const hash=await send(wallet,{from:DEPLOYER,data:await factoryData(wallet),value:'0x0'});
  setFactoryHash(hash);localStorage.setItem(prefix+'factory-hash',hash);setMessage('Despliegue enviado. Verificá el factory antes de crear un token.');
 });
 const verifyFactory=()=>run(async()=>{
  if(!hashPattern.test(factoryHash))throw new Error('Ingresá el hash de despliegue del factory v2.');
  const wallet=injectedWallet();await wallet047(wallet);const receipt=await confirmed(wallet,factoryHash);
  if(!receipt.contractAddress)throw new Error('Ese hash no desplegó un contrato.');
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[factoryHash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!tx||getAddress(tx.from)!==DEPLOYER||tx.to!==null||BigInt(tx.value)!==0n||tx.input.toLowerCase()!==(await factoryData(wallet)).toLowerCase())throw new Error('El despliegue no corresponde al factory ERC-3643 v2 de la 047.');
  const address=getAddress(receipt.contractAddress),code=await wallet.request({method:'eth_getCode',params:[address,'latest']});
  if(typeof code!=='string'||code==='0x')throw new Error('El factory no tiene código.');
  const raw=await wallet.request({method:'eth_call',params:[{to:address,data:factoryAbi.encodeFunctionData('operator')},'latest']}) as string;
  if(getAddress(factoryAbi.decodeFunctionResult('operator',raw)[0])!==DEPLOYER)throw new Error('La 047 no es operadora de este factory.');
  setFactory(address);setMessage('Factory ERC-3643 v2 verificado en Sepolia.');
 });
 const load=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||issues.length)throw new Error(issues.join(' ')||'Elegí un expediente recibido y conectá la 047.');
  const governance=await loadGovernance(staffAccount,project.submissionId);
  if(!governance.soloAuthorized)throw new Error('Falta la decisión integral vigente de la 047.');
  const client=project.clientWalletNetwork==='sepolia'&&project.clientWalletAddress&&isAddress(project.clientWalletAddress)?getAddress(project.clientWalletAddress):'';
  setApprovedHash(governance.projectHash);setAdmin(client||saved(`admin:${project.id}`));setSupplyCap(project.parameters.maxSupply?String(project.parameters.maxSupply):saved(`cap:${project.id}`));
  setMessage('Decisión integral cargada. Revisá la propietaria y el máximo antes de crear.');
 });
 const create=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||!factory||!approvedHash||creationHash)throw new Error('Verificá factory, expediente y creación pendiente.');
  const governance=await loadGovernance(staffAccount,project.submissionId);
  if(!governance.soloAuthorized||governance.projectHash!==approvedHash)throw new Error('La decisión integral no está vigente para esta versión.');
  const c=config();
  if(project.clientWalletNetwork==='sepolia'&&project.clientWalletAddress&&isAddress(project.clientWalletAddress)&&getAddress(project.clientWalletAddress)!==c.admin)throw new Error('La propietaria debe coincidir con la wallet Sepolia del expediente.');
  if(project.parameters.maxSupply!==undefined&&c.supplyCap!==parseUnits(String(project.parameters.maxSupply),c.decimals))throw new Error('El máximo no coincide con el expediente aprobado.');
  const wallet=injectedWallet();await wallet047(wallet);const projectHash=id(project.id);
  const existing=await wallet.request({method:'eth_call',params:[{to:factory,data:factoryAbi.encodeFunctionData('tokenByProject',[projectHash])},'latest']}) as string;
  if(getAddress(factoryAbi.decodeFunctionResult('tokenByProject',existing)[0])!==ZeroAddress)throw new Error('Este expediente ya tiene un token en el factory v2.');
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','uint256','address','bytes32','bytes32','tuple(string name,string symbol,uint8 decimals,address admin,address claimAuthority,uint256 supplyCap,uint256 walletCap,uint16[] countries,bytes32 dossierHash)'],[id('TOKVAN_3643_SEPOLIA_EDUCATIONAL_V2'),11155111n,factory,projectHash,approvedHash,c]));
  if(!window.confirm(`Crear ${c.name} (${c.symbol}) en Sepolia\nPropietaria: ${c.admin}\nSuministro inicial: 0 · pausado\nPaíses habilitados: ninguno\nVersión: ${approvedHash}\nConfiguración: ${digest}\n\nLa empresa configurará permisos y acreditaciones después.`))return;
  const hash=await send(wallet,{from:DEPLOYER,to:factory,data:factoryAbi.encodeFunctionData('createToken',[projectHash,approvedHash,c]),value:'0x0'});
  setCreationHash(hash);localStorage.setItem(prefix+`token:${project.id}`,hash);setMessage('Creación enviada. Verificá el token en Sepolia.');
 });
 const verifyToken=()=>run(async()=>{
  if(!project||!factory||!hashPattern.test(creationHash))throw new Error('Cargá el expediente, factory y hash de creación.');
  const wallet=injectedWallet();await wallet047(wallet);const receipt=await confirmed(wallet,creationHash);
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[creationHash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!tx||getAddress(tx.from)!==DEPLOYER||BigInt(tx.value)!==0n)throw new Error('La creación no fue autorizada por la 047.');
  const c=config();
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','uint256','address','bytes32','bytes32','tuple(string name,string symbol,uint8 decimals,address admin,address claimAuthority,uint256 supplyCap,uint256 walletCap,uint16[] countries,bytes32 dossierHash)'],[id('TOKVAN_3643_SEPOLIA_EDUCATIONAL_V2'),11155111n,factory,id(project.id),approvedHash,c]));
  const event=receipt.logs.filter(log=>getAddress(log.address)===factory).map(log=>{try{return factoryAbi.parseLog(log);}catch{return null;}}).find(log=>log?.name==='TokenCreated'&&log.args.projectId===id(project.id)&&log.args.projectHash===approvedHash&&log.args.digest===digest);
  if(!event)throw new Error('No se encontró TokenCreated de esta configuración.');
  const address=getAddress(event.args.token);
  const registered=await wallet.request({method:'eth_call',params:[{to:factory,data:factoryAbi.encodeFunctionData('tokenByProject',[id(project.id)])},'latest']}) as string;
  if(getAddress(factoryAbi.decodeFunctionResult('tokenByProject',registered)[0])!==address)throw new Error('El token no coincide con el registro del factory.');
  const values=await Promise.all(['owner','paused','totalSupply'].map(name=>wallet.request({method:'eth_call',params:[{to:address,data:tokenAbi.encodeFunctionData(name)},'latest']}) as Promise<string>));
  if(getAddress(tokenAbi.decodeFunctionResult('owner',values[0])[0])!==getAddress(admin)||!tokenAbi.decodeFunctionResult('paused',values[1])[0]||BigInt(tokenAbi.decodeFunctionResult('totalSupply',values[2])[0])!==0n)throw new Error('El token no está pausado, vacío y bajo propiedad de la empresa.');
  setToken(address);setMessage('Token ERC-3643 v2 verificado: creado, pausado y sin titulares acreditados.');
 });
 const link=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||!token)throw new Error('Primero verificá el token.');
  const result=await linkRegulatedIssuanceV2(staffAccount,project.submissionId,creationHash,factoryHash) as {issuance:{token_address:string}};
  if(getAddress(result.issuance.token_address)!==token)throw new Error('Supabase devolvió otro token.');
  setLinked(true);setMessage('Token creado y vinculado al expediente en Supabase. Configuración de identidades y circulación: etapa posterior.');
 });
 return <div className="space-y-5 rounded-xl bg-white p-5 text-slate-900">
  <h2 className="text-2xl font-bold">ERC-3643 · operador único · Sepolia</h2>
  <p>La 047 crea la suite. La wallet de la empresa recibe la propiedad. El token nace pausado, con suministro cero y sin países ni titulares habilitados.</p>
  <button type="button" className="rounded-lg border px-3 py-2" onClick={()=>void run(async()=>{await injectedWallet().request({method:'wallet_switchEthereumChain',params:[{chainId:SEPOLIA_HEX}]});setMessage('Sepolia seleccionada.');})}>Cambiar a Sepolia</button>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">1. Factory v2</h3><p className="text-sm">Reutiliza los cinco componentes oficiales ya instalados en Sepolia.</p><button type="button" disabled={busy||!!factoryHash} onClick={deploy} className={button}>Desplegar con 047</button><label className="block text-sm">Hash de despliegue<input className={field} value={factoryHash} onChange={e=>{setFactoryHash(e.target.value);setFactory('');}}/></label><button type="button" disabled={busy||!hashPattern.test(factoryHash)} onClick={verifyFactory} className="rounded-lg border px-3 py-2 disabled:opacity-50">Verificar factory</button>{factory&&<p className="break-all text-green-700">Factory: {factory}</p>}</section>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">2. Expediente y token</h3><select className={field} value={projectId} onChange={e=>{const next=e.target.value;setProjectId(next);setApprovedHash('');setAdmin('');setSupplyCap('');setToken('');setLinked(false);setCreationHash(saved(`token:${next}`));}}><option value="">Elegí un expediente ERC-3643 recibido</option>{projects.filter(p=>p.standard==='ERC-3643'&&p.submissionId).map(p=><option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select>{issues.length>0&&<p className="text-amber-800">{issues.join(' ')}</p>}<button type="button" disabled={busy||!project?.submissionId||issues.length>0} onClick={load} className="rounded-lg border px-3 py-2 disabled:opacity-50">Cargar decisión integral</button>{approvedHash&&<><p className="break-all text-sm text-green-700">Versión aprobada: {approvedHash}</p><p>{project?.parameters.tokenName} ({project?.parameters.tokenSymbol})</p><label className="block">Wallet propietaria de la empresa<input className={field} value={admin} onChange={e=>{setAdmin(e.target.value);if(projectId)localStorage.setItem(prefix+`admin:${projectId}`,e.target.value);}}/></label><label className="block">Máximo de suministro (tokens)<input className={field} value={supplyCap} onChange={e=>{setSupplyCap(e.target.value);if(projectId)localStorage.setItem(prefix+`cap:${projectId}`,e.target.value);}}/></label><p className="text-sm">La empresa podrá configurar países, límites y operadores después. Esta creación no acredita personas ni emite tokens.</p><button type="button" disabled={busy||!factory||!!creationHash||!isAddress(admin)} onClick={create} className={button}>Simular y crear token con 047</button></>}</section>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">3. Verificar y entregar</h3><label className="block text-sm">Hash de creación<input className={field} value={creationHash} onChange={e=>{setCreationHash(e.target.value);setToken('');setLinked(false);}}/></label><button type="button" disabled={busy||!factory||!approvedHash||!hashPattern.test(creationHash)} onClick={verifyToken} className="rounded-lg border px-3 py-2 disabled:opacity-50">Verificar token</button>{token&&<><a className="block break-all text-blue-700 underline" target="_blank" rel="noreferrer" href={`https://sepolia.etherscan.io/address/${token}`}>Token: {token}</a><p>Creado · pausado · suministro 0 · identidades pendientes</p><button type="button" disabled={busy||linked} onClick={link} className="rounded-lg bg-green-700 px-3 py-2 text-white disabled:opacity-50">Vincular al expediente en Supabase</button></>}</section>
  {message&&<p role="status" className="text-green-700">{message}</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}
 </div>;
}
