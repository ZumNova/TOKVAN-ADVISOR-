import {useEffect,useState} from 'react';
import {AbiCoder,ContractFactory,Interface,ZeroAddress,getAddress,id,isAddress,keccak256,toUtf8Bytes} from 'ethers';
import factoryArtifact from '../../generated/erc1155FactoryV2Artifact.json';
import tokenArtifact from '../../generated/erc1155V2Artifact.json';
import {DEPLOYER,injectedWallet,SEPOLIA_HEX,walletError,type WalletProvider} from '../../lib/factoryWallet';
import {loadGovernance} from '../../lib/governance';
import {linkCollection} from '../../lib/collections';
import {metadataURI,nftInteger} from '../../lib/erc721Workflow';
import NFTMediaPanel from './NFTMediaPanel';
import type {TokenProject} from '../../types';

const factoryAbi=new Interface(factoryArtifact.abi),tokenAbi=new Interface(tokenArtifact.abi);
const prefix='tokvan:erc1155:v2:',hashPattern=/^0x[0-9a-f]{64}$/i;
const saved=(key:string)=>{try{return localStorage.getItem(prefix+key)||'';}catch{return '';}};
const field='mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900';
const button='rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50';
async function wallet047(wallet:WalletProvider){
 const chain=await wallet.request({method:'eth_chainId'});
 if(typeof chain!=='string'||BigInt(chain)!==11155111n)throw new Error('Seleccioná Sepolia.');
 const accounts=await wallet.request({method:'eth_accounts'});
 if(!Array.isArray(accounts)||typeof accounts[0]!=='string'||getAddress(accounts[0])!==DEPLOYER)throw new Error('Conectá la wallet 047.');
}
async function factoryData(){return (await new ContractFactory(factoryArtifact.abi,factoryArtifact.bytecode).getDeployTransaction(DEPLOYER)).data!;}
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
export default function ERC1155FactoryV2View({projects,staffAccount,initialProjectId}:{projects:TokenProject[];staffAccount:string|null;initialProjectId?:string}){
 const [factoryHash,setFactoryHash]=useState(()=>saved('factory-hash')),[factory,setFactory]=useState('');
 const [projectId,setProjectId]=useState(initialProjectId||''),[approvedHash,setApprovedHash]=useState('');
 const [admin,setAdmin]=useState(''),[recipient,setRecipient]=useState('');
 const [collectionHash,setCollectionHash]=useState(()=>saved(`collection:${initialProjectId||''}`)),[collection,setCollection]=useState('');
 const [linked,setLinked]=useState(false),[typeCount,setTypeCount]=useState<number|null>(null);
 const [amount,setAmount]=useState('1'),[cap,setCap]=useState('1'),[uri,setUri]=useState('');
 const [typeHash,setTypeHash]=useState(()=>saved(`type:${initialProjectId||''}`)),[busy,setBusy]=useState(false),[mediaBusy,setMediaBusy]=useState(false);
 const [lastType,setLastType]=useState<{hash:string;id:string;amount:string;recipient:string}|null>(null);
 const [message,setMessage]=useState(''),[error,setError]=useState('');
 const project=projects.find(p=>p.id===projectId&&p.standard==='ERC-1155');
 const issues=project?[
  project.network!=='sepolia'?'El expediente debe estar en Sepolia.':'',
  project.parameters.decimals!==0?'ERC-1155 requiere cero decimales.':'',
  project.parameters.isUpgradeabilityEnabled?'Este contrato no admite UUPS.':'',
  project.parameters.transferRestrictions!=='Sin restricción'?'Este contrato no aplica restricciones de transferencia.':'',
  project.parameters.complianceRules.requireKYC||project.parameters.complianceRules.requireKYB||project.parameters.complianceRules.restrictSanctionedCountries||(project.parameters.complianceRules.lockupPeriodDays??0)>0?'Este contrato no implementa los controles solicitados.':'',
  !Number.isSafeInteger(project.parameters.initialSupply)||project.parameters.initialSupply<1?'El máximo de tipos debe ser entero positivo.':'',
 ].filter(Boolean):[];
 useEffect(()=>{if(initialProjectId){setProjectId(initialProjectId);setApprovedHash('');setCollectionHash(saved(`collection:${initialProjectId}`));setTypeHash(saved(`type:${initialProjectId}`));}},[initialProjectId]);
 const run=async(action:()=>Promise<void>)=>{setBusy(true);setError('');setMessage('');try{await action();}catch(e){setError(walletError(e));}finally{setBusy(false);}};
 const config=()=>{
  if(!project||issues.length)throw new Error(issues.join(' ')||'Seleccioná un expediente ERC-1155 recibido.');
  if(!isAddress(admin.trim()))throw new Error('Completá la wallet administradora antes de verificar la colección.');
  const name=project.parameters.tokenName.trim(),symbol=project.parameters.tokenSymbol.trim(),address=getAddress(admin.trim());
  if(!name||toUtf8Bytes(name).length>64||!symbol||toUtf8Bytes(symbol).length>16||address===ZeroAddress)throw new Error('Revisá nombre, símbolo y wallet administradora.');
  return {name,symbol,admin:address,maxTypes:nftInteger(String(project.parameters.initialSupply)),burnable:project.parameters.isBurnable,pausable:project.parameters.isPausable};
 };
 const readTypeCount=async(wallet:WalletProvider,address:string)=>{
  const result=await wallet.request({method:'eth_call',params:[{to:address,data:tokenAbi.encodeFunctionData('typeCount')},'latest']}) as string;
  const count=Number(tokenAbi.decodeFunctionResult('typeCount',result)[0]);setTypeCount(count);return count;
 };
 const deploy=()=>run(async()=>{
  if(factoryHash)throw new Error('Primero verificá o corregí el hash de despliegue existente.');
  const wallet=injectedWallet();await wallet047(wallet);
  const hash=await send(wallet,{from:DEPLOYER,data:await factoryData(),value:'0x0'});
  setFactoryHash(hash);localStorage.setItem(prefix+'factory-hash',hash);setMessage('Despliegue enviado. Verificá su confirmación antes de crear una colección.');
 });
 const verifyFactory=()=>run(async()=>{
  if(!hashPattern.test(factoryHash))throw new Error('Ingresá el hash de despliegue del factory ERC-1155 v2.');
  const wallet=injectedWallet();await wallet047(wallet);const receipt=await confirmed(wallet,factoryHash);
  if(!receipt.contractAddress)throw new Error('Ese hash no desplegó un contrato.');
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[factoryHash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!tx||getAddress(tx.from)!==DEPLOYER||tx.to!==null||BigInt(tx.value)!==0n||tx.input.toLowerCase()!==(await factoryData()).toLowerCase())throw new Error('Este despliegue no corresponde al factory ERC-1155 v2 de la 047.');
  const address=getAddress(receipt.contractAddress),code=await wallet.request({method:'eth_getCode',params:[address,'latest']});
  if(typeof code!=='string'||code==='0x')throw new Error('El factory no tiene código.');
  const result=await wallet.request({method:'eth_call',params:[{to:address,data:factoryAbi.encodeFunctionData('operator')},'latest']}) as string;
  if(getAddress(factoryAbi.decodeFunctionResult('operator',result)[0])!==DEPLOYER)throw new Error('La 047 no es operadora del factory.');
  setFactory(address);localStorage.setItem(prefix+'factory-hash',factoryHash);setMessage('Factory ERC-1155 v2 verificado en Sepolia.');
 });
 const load=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||issues.length)throw new Error(issues.join(' ')||'Elegí un expediente recibido y conectá la 047.');
  const governance=await loadGovernance(staffAccount,project.submissionId);
  if(!governance.soloAuthorized)throw new Error('Falta la decisión integral vigente de la 047.');
  const client=project.clientWalletNetwork==='sepolia'&&project.clientWalletAddress&&isAddress(project.clientWalletAddress)?getAddress(project.clientWalletAddress):'';
  setApprovedHash(governance.projectHash);setAdmin(client||saved(`admin:${project.id}`));setRecipient(client||saved(`recipient:${project.id}`));
  setMessage('Decisión integral cargada. Revisá administradora y destinataria antes de crear.');
 });
 const create=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||!factory||!approvedHash||collectionHash)throw new Error('Verificá factory, expediente y creación pendiente.');
  const governance=await loadGovernance(staffAccount,project.submissionId);
  if(!governance.soloAuthorized||governance.projectHash!==approvedHash)throw new Error('La decisión integral no está vigente para esta versión.');
  const c=config();
  if(project.clientWalletNetwork==='sepolia'&&project.clientWalletAddress&&isAddress(project.clientWalletAddress)&&getAddress(project.clientWalletAddress)!==c.admin)throw new Error('La administradora debe coincidir con la wallet Sepolia del expediente.');
  const wallet=injectedWallet();await wallet047(wallet);const projectIdHash=id(project.id);
  const existing=await wallet.request({method:'eth_call',params:[{to:factory,data:factoryAbi.encodeFunctionData('collectionByProject',[projectIdHash])},'latest']}) as string;
  if(getAddress(factoryAbi.decodeFunctionResult('collectionByProject',existing)[0])!==ZeroAddress)throw new Error('Este expediente ya tiene una colección en el factory v2.');
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','address','bytes32','bytes32','tuple(string name,string symbol,address admin,uint256 maxTypes,bool burnable,bool pausable)'],[11155111n,factory,projectIdHash,approvedHash,c]));
  if(!window.confirm(`Crear colección ${c.name} (${c.symbol}) en Sepolia\nAdministradora: ${c.admin}\nMáximo de tipos: ${c.maxTypes}\nVersión: ${approvedHash}\nConfiguración: ${digest}\n\nLa 047 podrá crear tipos; la administradora podrá revocar ese permiso.`))return;
  const hash=await send(wallet,{from:DEPLOYER,to:factory,data:factoryAbi.encodeFunctionData('createCollection',[projectIdHash,approvedHash,c]),value:'0x0'});
  setCollectionHash(hash);localStorage.setItem(prefix+`collection:${project.id}`,hash);setMessage('Creación enviada. Verificá la colección en Sepolia.');
 });
 const verifyCollection=()=>run(async()=>{
  if(!project||!approvedHash||!factory||!hashPattern.test(collectionHash))throw new Error('Cargá expediente, factory y hash de creación.');
  const c=config(),wallet=injectedWallet();await wallet047(wallet);const receipt=await confirmed(wallet,collectionHash);
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','address','bytes32','bytes32','tuple(string name,string symbol,address admin,uint256 maxTypes,bool burnable,bool pausable)'],[11155111n,factory,id(project.id),approvedHash,c]));
  const event=receipt.logs.filter(log=>getAddress(log.address)===factory).map(log=>{try{return factoryAbi.parseLog(log);}catch{return null;}}).find(log=>log?.name==='CollectionCreated'&&log.args.projectId===id(project.id)&&log.args.projectHash===approvedHash&&log.args.configDigest===digest);
  if(!event)throw new Error('La creación no coincide con esta versión y configuración.');
  const address=getAddress(event.args.collection),code=await wallet.request({method:'eth_getCode',params:[address,'latest']});
  if(typeof code!=='string'||code==='0x')throw new Error('La colección no tiene código.');
  setCollection(address);await readTypeCount(wallet,address);setMessage('Colección verificada. Vinculala al expediente antes de crear tipos.');
 });
 const link=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||!collection)throw new Error('Primero verificá la colección.');
  const result=await linkCollection(staffAccount,project.submissionId,collectionHash,factoryHash) as {collection:{collection_address:string}};
  if(getAddress(result.collection.collection_address)!==collection)throw new Error('Supabase devolvió otra colección.');
  setLinked(true);setMessage('Colección vinculada en Supabase. Ya podés crear cada tipo.');
 });
 const createType=()=>run(async()=>{
  if(!collection||!linked||!isAddress(recipient))throw new Error('Vinculá la colección y completá una wallet destinataria válida.');
  if(typeHash)throw new Error('Primero verificá el hash de emisión anterior.');
  const to=getAddress(recipient);if(to===ZeroAddress)throw new Error('La destinataria no puede ser cero.');
  const qty=nftInteger(amount),limit=nftInteger(cap),metadata=metadataURI(uri),c=config();
  if(qty===0n||limit===0n||qty>limit)throw new Error('La cantidad inicial debe ser positiva y no superar el máximo histórico.');
  const wallet=injectedWallet();await wallet047(wallet);const count=await readTypeCount(wallet,collection);
  if(BigInt(count)>=c.maxTypes)throw new Error('La colección ya alcanzó el máximo de tipos.');
  if(!window.confirm(`Crear tipo #${count+1} y emitir ${qty} unidad(es) a ${to}\nMáximo histórico: ${limit}\nMetadatos: ${metadata}\n\nLa URI del tipo quedará fija.`))return;
  const hash=await send(wallet,{from:DEPLOYER,to:collection,data:tokenAbi.encodeFunctionData('createType',[to,qty,limit,metadata]),value:'0x0'});
  setTypeHash(hash);localStorage.setItem(prefix+`type:${projectId}`,hash);setMessage('Emisión enviada. Verificá el tipo antes de crear otro.');
 });
 const verifyType=()=>run(async()=>{
  if(!collection||!hashPattern.test(typeHash))throw new Error('Ingresá el hash de emisión del tipo.');
  const wallet=injectedWallet();await wallet047(wallet);const receipt=await confirmed(wallet,typeHash);
  const events=receipt.logs.filter(log=>getAddress(log.address)===collection).map(log=>{try{return tokenAbi.parseLog(log);}catch{return null;}});
  const created=events.find(event=>event?.name==='TypeCreated');
  const transfer=events.find(event=>event?.name==='TransferSingle'&&getAddress(event.args.from)===ZeroAddress&&event.args.id===created?.args.tokenId);
  if(!created||!transfer)throw new Error('No se encontró la creación y emisión de un tipo ERC-1155 en esta colección.');
  const count=await readTypeCount(wallet,collection);
  setLastType({hash:typeHash,id:String(created.args.tokenId),amount:String(transfer.args.value),recipient:getAddress(transfer.args.to)});
  setTypeHash('');localStorage.removeItem(prefix+`type:${projectId}`);setUri('');
  setMessage(`Tipo #${created.args.tokenId} confirmado: ${transfer.args.value} unidad(es) para ${getAddress(transfer.args.to)}. Tipos creados: ${count}.`);
 });
 return <div className="space-y-5 rounded-xl bg-white p-5 text-slate-900">
  <h2 className="text-2xl font-bold">ERC-1155 · operador único · Sepolia</h2>
  <p>La 047 crea la colección y sus tipos. La administradora del proyecto conserva el control y puede revocar el permiso de emisión de la 047.</p>
  <button type="button" className="rounded-lg border px-3 py-2" onClick={()=>void run(async()=>{await injectedWallet().request({method:'wallet_switchEthereumChain',params:[{chainId:SEPOLIA_HEX}]});setMessage('Sepolia seleccionada.');})}>Cambiar a Sepolia</button>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">1. Factory v2</h3><button type="button" disabled={busy||!!factoryHash} onClick={deploy} className={button}>Desplegar con 047</button><label className="block text-sm">Hash de despliegue<input className={field} value={factoryHash} onChange={e=>{setFactoryHash(e.target.value);setFactory('');}}/></label><button type="button" disabled={busy||!hashPattern.test(factoryHash)} onClick={verifyFactory} className="rounded-lg border px-3 py-2 disabled:opacity-50">Verificar factory</button>{factory&&<p className="break-all text-green-700">Factory: {factory}</p>}</section>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">2. Expediente y colección</h3><select className={field} value={projectId} onChange={e=>{const next=e.target.value;setProjectId(next);setApprovedHash('');setAdmin('');setRecipient('');setCollection('');setLinked(false);setTypeCount(null);setCollectionHash(saved(`collection:${next}`));setTypeHash(saved(`type:${next}`));}}><option value="">Elegí un expediente ERC-1155 recibido</option>{projects.filter(p=>p.standard==='ERC-1155'&&p.submissionId).map(p=><option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select>{issues.length>0&&<p className="text-amber-800">{issues.join(' ')}</p>}<button type="button" disabled={busy||!project?.submissionId||issues.length>0} onClick={load} className="rounded-lg border px-3 py-2 disabled:opacity-50">Cargar decisión integral</button>{approvedHash&&<><p className="break-all text-sm text-green-700">Versión aprobada: {approvedHash}</p><p>{project?.parameters.tokenName} ({project?.parameters.tokenSymbol}) · máximo {project?.parameters.initialSupply} tipos</p><label className="block">Wallet administradora<input className={field} value={admin} onChange={e=>{setAdmin(e.target.value);if(projectId)localStorage.setItem(prefix+`admin:${projectId}`,e.target.value);}}/></label><button type="button" disabled={busy||!factory||!!collectionHash||!isAddress(admin)} onClick={create} className={button}>Simular y crear colección con 047</button></>}</section>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">3. Verificar y vincular</h3><label className="block text-sm">Hash de creación<input className={field} value={collectionHash} onChange={e=>{setCollectionHash(e.target.value);setCollection('');setLinked(false);}}/></label><button type="button" disabled={busy||!factory||!hashPattern.test(collectionHash)} onClick={verifyCollection} className="rounded-lg border px-3 py-2 disabled:opacity-50">Verificar colección</button>{collection&&<><a className="block break-all text-blue-700 underline" target="_blank" rel="noreferrer" href={`https://sepolia.etherscan.io/address/${collection}`}>Colección: {collection}</a><button type="button" disabled={busy||linked} onClick={link} className="rounded-lg bg-green-700 px-3 py-2 text-white disabled:opacity-50">Vincular al expediente en Supabase</button></>}</section>
  {collection&&<section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">4. Crear y emitir tipos</h3><p>Tipos creados: {typeCount??'por consultar'} / {project?.parameters.initialSupply}. Cada ID tiene una imagen, URI y máximo histórico propios.</p>{lastType&&<p className="break-all text-sm text-green-700">Tipo #{lastType.id} · {lastType.amount} unidad(es) a {lastType.recipient} · <a href={`https://sepolia.etherscan.io/tx/${lastType.hash}`} target="_blank" rel="noreferrer" className="underline">Ver emisión</a></p>}<label className="block">Wallet destinataria<input className={field} value={recipient} onChange={e=>{setRecipient(e.target.value);if(projectId)localStorage.setItem(prefix+`recipient:${projectId}`,e.target.value);}}/></label><div className="grid gap-3 md:grid-cols-2"><label>Cantidad inicial<input className={field} inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Máximo histórico de este tipo<input className={field} inputMode="numeric" value={cap} onChange={e=>setCap(e.target.value)}/></label></div><NFTMediaPanel key={`${collection}:${typeCount}`} standard="ERC1155" collection={collection} projectReference={project?.id} account={staffAccount} disabled={busy||mediaBusy||!linked||!!typeHash||typeCount===null||typeCount>=Number(project?.parameters.initialSupply)} onURI={setUri} onBusy={setMediaBusy}/><details><summary>Usar URI existente (avanzado)</summary><label className="block">URI de metadatos<input className={field} value={uri} onChange={e=>setUri(e.target.value)}/></label></details><button type="button" disabled={busy||mediaBusy||!linked||!!typeHash||!isAddress(recipient)||!uri||typeCount===null||typeCount>=Number(project?.parameters.initialSupply)} onClick={createType} className={button}>Crear tipo y emitir unidades con 047</button><label className="block text-sm">Hash de emisión<input className={field} value={typeHash} onChange={e=>setTypeHash(e.target.value)}/></label><button type="button" disabled={busy||!hashPattern.test(typeHash)} onClick={verifyType} className="rounded-lg border px-3 py-2 disabled:opacity-50">Verificar tipo emitido</button></section>}
  {message&&<p role="status" className="text-green-700">{message}</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}
 </div>;
}
