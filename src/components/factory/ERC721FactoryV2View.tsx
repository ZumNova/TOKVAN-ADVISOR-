import {useEffect,useState} from 'react';
import {AbiCoder,ContractFactory,Interface,ZeroAddress,getAddress,id,isAddress,keccak256,toUtf8Bytes} from 'ethers';
import factoryArtifact from '../../generated/erc721FactoryV2Artifact.json';
import tokenArtifact from '../../generated/erc721V2Artifact.json';
import {DEPLOYER,injectedWallet,SEPOLIA_HEX,walletError,type WalletProvider} from '../../lib/factoryWallet';
import {loadGovernance} from '../../lib/governance';
import {linkCollection} from '../../lib/collections';
import {metadataURI,nftInteger} from '../../lib/erc721Workflow';
import NFTMediaPanel from './NFTMediaPanel';
import type {TokenProject} from '../../types';

const factoryAbi=new Interface(factoryArtifact.abi),tokenAbi=new Interface(tokenArtifact.abi);
const prefix='tokvan:erc721:v2:';
const hashPattern=/^0x[0-9a-f]{64}$/i;
const saved=(key:string)=>{try{return localStorage.getItem(prefix+key)||'';}catch{return '';}};
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
async function send(wallet:WalletProvider,transaction:{from:string;to?:string;data:string;value:string}){
 await wallet047(wallet);
 if(transaction.to)await wallet.request({method:'eth_call',params:[transaction,'latest']});
 const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[transaction]}) as string);
 await wallet047(wallet);
 const hash=await wallet.request({method:'eth_sendTransaction',params:[{...transaction,gas:'0x'+(gas*120n/100n).toString(16)}]});
 if(typeof hash!=='string'||!hashPattern.test(hash))throw new Error('La wallet no devolvió un hash válido; revisá su historial.');
 return hash;
}
const field='mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900';
export default function ERC721FactoryV2View({projects,staffAccount,initialProjectId}:{projects:TokenProject[];staffAccount:string|null;initialProjectId?:string}){
 const [factoryHash,setFactoryHash]=useState(()=>saved('factory-hash'));
 const [factory,setFactory]=useState('');
 const [projectId,setProjectId]=useState(initialProjectId||'');
 const [approvedHash,setApprovedHash]=useState('');
 const [admin,setAdmin]=useState('');
 const [recipient,setRecipient]=useState('');
 const [collectionHash,setCollectionHash]=useState(()=>saved(`collection:${initialProjectId||''}`));
 const [collection,setCollection]=useState('');
 const [mintHash,setMintHash]=useState(()=>saved(`mint:${initialProjectId||''}`));
 const [uri,setUri]=useState('');
 const [busy,setBusy]=useState(false),[mediaBusy,setMediaBusy]=useState(false);
 const [linked,setLinked]=useState(false);
 const [message,setMessage]=useState(''),[error,setError]=useState('');
 const project=projects.find(p=>p.id===projectId&&p.standard==='ERC-721');
 const issues=project?[
  project.network!=='sepolia'?'El expediente debe estar en Sepolia.':'',
  project.parameters.decimals!==0?'ERC-721 requiere cero decimales.':'',
  project.parameters.isUpgradeabilityEnabled?'Este contrato no admite UUPS.':'',
  project.parameters.transferRestrictions!=='Sin restricción'?'Este contrato no aplica restricciones de transferencia.':'',
  project.parameters.complianceRules.requireKYC||project.parameters.complianceRules.requireKYB||project.parameters.complianceRules.restrictSanctionedCountries||(project.parameters.complianceRules.lockupPeriodDays??0)>0?'Este contrato no implementa los controles solicitados.':'',
  !Number.isSafeInteger(project.parameters.initialSupply)||project.parameters.initialSupply<1?'El máximo debe ser entero positivo.':'',
 ].filter(Boolean):[];
 useEffect(()=>{if(initialProjectId){setProjectId(initialProjectId);setApprovedHash('');setCollectionHash(saved(`collection:${initialProjectId}`));setMintHash(saved(`mint:${initialProjectId}`));}},[initialProjectId]);
 const run=async(action:()=>Promise<void>)=>{setBusy(true);setError('');setMessage('');try{await action();}catch(e){setError(walletError(e));}finally{setBusy(false);}};
 const config=()=>{
  if(!project||issues.length)throw new Error(issues.join(' ')||'Seleccioná un expediente ERC-721 recibido.');
  const name=project.parameters.tokenName.trim(),symbol=project.parameters.tokenSymbol.trim(),address=getAddress(admin.trim());
  if(!name||toUtf8Bytes(name).length>64||!symbol||toUtf8Bytes(symbol).length>16||address===ZeroAddress)throw new Error('Revisá nombre, símbolo y wallet administradora.');
  return {name,symbol,admin:address,maxSupply:nftInteger(String(project.parameters.initialSupply)),burnable:project.parameters.isBurnable,pausable:project.parameters.isPausable};
 };
 const deploy=()=>run(async()=>{
  if(factoryHash)throw new Error('Primero verificá o corregí el hash de despliegue existente.');
  const wallet=injectedWallet();await wallet047(wallet);
  const transaction={from:DEPLOYER,data:await factoryData(),value:'0x0'};
  const hash=await send(wallet,transaction);setFactoryHash(hash);localStorage.setItem(prefix+'factory-hash',hash);
  setMessage('Despliegue enviado. Verificá su confirmación antes de crear una colección.');
 });
 const verifyFactory=()=>run(async()=>{
  if(!hashPattern.test(factoryHash))throw new Error('Ingresá el hash de despliegue del factory v2.');
  const wallet=injectedWallet();await wallet047(wallet);const receipt=await confirmed(wallet,factoryHash);
  if(!receipt.contractAddress)throw new Error('Ese hash no desplegó un contrato.');
  const tx=await wallet.request({method:'eth_getTransactionByHash',params:[factoryHash]}) as {from:string;to:string|null;input:string;value:string}|null;
  if(!tx||getAddress(tx.from)!==DEPLOYER||tx.to!==null||BigInt(tx.value)!==0n||tx.input.toLowerCase()!==(await factoryData()).toLowerCase())throw new Error('Este despliegue no corresponde al factory ERC-721 v2 de la 047.');
  const address=getAddress(receipt.contractAddress),code=await wallet.request({method:'eth_getCode',params:[address,'latest']});
  if(typeof code!=='string'||code==='0x')throw new Error('El factory no tiene código.');
  const call=await wallet.request({method:'eth_call',params:[{to:address,data:factoryAbi.encodeFunctionData('operator')},'latest']}) as string;
  if(getAddress(factoryAbi.decodeFunctionResult('operator',call)[0])!==DEPLOYER)throw new Error('La 047 no es operadora del factory.');
  setFactory(address);localStorage.setItem(prefix+'factory-hash',factoryHash);setMessage('Factory ERC-721 v2 verificado en Sepolia.');
 });
 const load=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||issues.length)throw new Error(issues.join(' ')||'Elegí un expediente recibido y conectá la 047.');
  const governance=await loadGovernance(staffAccount,project.submissionId);
  if(!governance.soloAuthorized)throw new Error('Falta la decisión integral vigente de la 047.');
  const client=project.clientWalletNetwork==='sepolia'&&project.clientWalletAddress&&isAddress(project.clientWalletAddress)?getAddress(project.clientWalletAddress):'';
  setApprovedHash(governance.projectHash);setAdmin(client);setRecipient(client);
  setMessage('Decisión integral cargada. Revisá la administradora y la destinataria antes de crear.');
 });
 const create=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||!factory||!approvedHash||collectionHash)throw new Error('Verificá factory, expediente y creación pendiente.');
  const governance=await loadGovernance(staffAccount,project.submissionId);
  if(!governance.soloAuthorized||governance.projectHash!==approvedHash)throw new Error('La decisión integral no está vigente para esta versión.');
  const c=config();
  if(project.clientWalletNetwork==='sepolia'&&project.clientWalletAddress&&isAddress(project.clientWalletAddress)&&getAddress(project.clientWalletAddress)!==c.admin)throw new Error('La administradora debe coincidir con la wallet Sepolia del expediente.');
  const wallet=injectedWallet();await wallet047(wallet);
  const projectHash=id(project.id),data=factoryAbi.encodeFunctionData('collectionByProject',[projectHash]);
  const existing=await wallet.request({method:'eth_call',params:[{to:factory,data},'latest']}) as string;
  if(getAddress(factoryAbi.decodeFunctionResult('collectionByProject',existing)[0])!==ZeroAddress)throw new Error('Este expediente ya tiene una colección en el factory v2.');
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','address','bytes32','bytes32','tuple(string name,string symbol,address admin,uint256 maxSupply,bool burnable,bool pausable)'],[11155111n,factory,projectHash,approvedHash,c]));
  if(!window.confirm(`Crear colección ${c.name} (${c.symbol}) en Sepolia\nAdministradora: ${c.admin}\nMáximo histórico: ${c.maxSupply}\nVersión: ${approvedHash}\nConfiguración: ${digest}\n\nLa 047 podrá emitir NFTs; la administradora podrá revocar ese permiso.`))return;
  const hash=await send(wallet,{from:DEPLOYER,to:factory,data:factoryAbi.encodeFunctionData('createCollection',[projectHash,approvedHash,c]),value:'0x0'});
  setCollectionHash(hash);localStorage.setItem(prefix+`collection:${project.id}`,hash);setMessage('Creación enviada. Verificá la colección en Sepolia.');
 });
 const verifyCollection=()=>run(async()=>{
  if(!project||!approvedHash||!factory||!hashPattern.test(collectionHash))throw new Error('Cargá expediente, factory y hash de creación.');
  const c=config(),wallet=injectedWallet();await wallet047(wallet);const receipt=await confirmed(wallet,collectionHash);
  const digest=keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','address','bytes32','bytes32','tuple(string name,string symbol,address admin,uint256 maxSupply,bool burnable,bool pausable)'],[11155111n,factory,id(project.id),approvedHash,c]));
  const event=receipt.logs.filter(log=>getAddress(log.address)===factory).map(log=>{try{return factoryAbi.parseLog(log);}catch{return null;}}).find(log=>log?.name==='CollectionCreated'&&log.args.projectId===id(project.id)&&log.args.projectHash===approvedHash&&log.args.configDigest===digest);
  if(!event)throw new Error('La creación no coincide con esta versión y configuración.');
  const address=getAddress(event.args.collection),code=await wallet.request({method:'eth_getCode',params:[address,'latest']});
  if(typeof code!=='string'||code==='0x')throw new Error('La colección no tiene código.');
  setCollection(address);setMessage('Colección verificada. Vinculala al expediente antes de emitir el NFT.');
 });
 const link=()=>run(async()=>{
  if(!project?.submissionId||!staffAccount||!collection)throw new Error('Primero verificá la colección.');
  const result=await linkCollection(staffAccount,project.submissionId,collectionHash,factoryHash) as {collection:{collection_address:string}};
  if(getAddress(result.collection.collection_address)!==collection)throw new Error('Supabase devolvió otra colección.');
  setLinked(true);setMessage('Colección vinculada en Supabase. Ya podés preparar la imagen y emitir el NFT.');
 });
 const mint=()=>run(async()=>{
  if(!collection||!linked||!isAddress(recipient))throw new Error('Vinculá la colección y revisá la destinataria.');
  const metadata=metadataURI(uri),to=getAddress(recipient);if(to===ZeroAddress)throw new Error('La destinataria no puede ser cero.');
  if(!window.confirm(`Emitir un NFT a ${to}\nColección: ${collection}\nMetadatos: ${metadata}\n\nLa URI del NFT quedará fija.`))return;
  const wallet=injectedWallet();const hash=await send(wallet,{from:DEPLOYER,to:collection,data:tokenAbi.encodeFunctionData('mint',[to,metadata]),value:'0x0'});
  setMintHash(hash);localStorage.setItem(prefix+`mint:${projectId}`,hash);setMessage('Emisión enviada. Verificá el NFT en Sepolia.');
 });
 const verifyMint=()=>run(async()=>{
  if(!collection||!hashPattern.test(mintHash))throw new Error('Ingresá el hash de emisión del NFT.');
  const wallet=injectedWallet();await wallet047(wallet);const receipt=await confirmed(wallet,mintHash);
  const transfer=receipt.logs.filter(log=>getAddress(log.address)===collection).map(log=>{try{return tokenAbi.parseLog(log);}catch{return null;}}).find(log=>log?.name==='Transfer'&&getAddress(log.args.from)===ZeroAddress);
  if(!transfer)throw new Error('No se encontró la emisión ERC-721 en esta colección.');
  setMessage(`NFT #${transfer.args.tokenId} confirmado para ${getAddress(transfer.args.to)}.`);
 });
 return <div className="space-y-5 rounded-xl bg-white p-5 text-slate-900">
  <h2 className="text-2xl font-bold">ERC-721 · operador único · Sepolia</h2>
  <p>La 047 crea la colección y emite el NFT. La wallet administradora indicada en el expediente conserva el control de la colección y puede revocar el permiso de emisión de la 047.</p>
  <button type="button" className="rounded-lg border px-3 py-2" onClick={()=>void run(async()=>{await injectedWallet().request({method:'wallet_switchEthereumChain',params:[{chainId:SEPOLIA_HEX}]});setMessage('Sepolia seleccionada.');})}>Cambiar a Sepolia</button>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">1. Factory v2</h3><button type="button" disabled={busy||!!factoryHash} onClick={deploy} className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50">Desplegar con 047</button><label className="block text-sm">Hash de despliegue<input className={field} value={factoryHash} onChange={e=>{setFactoryHash(e.target.value);setFactory('');}}/></label><button type="button" disabled={busy||!hashPattern.test(factoryHash)} onClick={verifyFactory} className="rounded-lg border px-3 py-2 disabled:opacity-50">Verificar factory</button>{factory&&<p className="break-all text-green-700">Factory: {factory}</p>}</section>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">2. Expediente y colección</h3><select className={field} value={projectId} onChange={e=>{const id=e.target.value;setProjectId(id);setApprovedHash('');setCollection('');setLinked(false);setCollectionHash(saved(`collection:${id}`));setMintHash(saved(`mint:${id}`));}}><option value="">Elegí un expediente ERC-721 recibido</option>{projects.filter(p=>p.standard==='ERC-721'&&p.submissionId).map(p=><option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select>{issues.length>0&&<p className="text-amber-800">{issues.join(' ')}</p>}<button type="button" disabled={busy||!project?.submissionId||issues.length>0} onClick={load} className="rounded-lg border px-3 py-2 disabled:opacity-50">Cargar decisión integral</button>{approvedHash&&<><p className="break-all text-sm text-green-700">Versión aprobada: {approvedHash}</p><p>{project?.parameters.tokenName} ({project?.parameters.tokenSymbol}) · máximo {project?.parameters.initialSupply}</p><label className="block">Wallet administradora<input className={field} value={admin} onChange={e=>setAdmin(e.target.value)}/></label><button type="button" disabled={busy||!factory||!!collectionHash||!isAddress(admin)} onClick={create} className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50">Simular y crear colección con 047</button></>}</section>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">3. Verificar y vincular</h3><label className="block text-sm">Hash de creación<input className={field} value={collectionHash} onChange={e=>{setCollectionHash(e.target.value);setCollection('');setLinked(false);}}/></label><button type="button" disabled={busy||!factory||!hashPattern.test(collectionHash)} onClick={verifyCollection} className="rounded-lg border px-3 py-2 disabled:opacity-50">Verificar colección</button>{collection&&<><a className="block break-all text-blue-700 underline" target="_blank" rel="noreferrer" href={`https://sepolia.etherscan.io/address/${collection}`}>Colección: {collection}</a><button type="button" disabled={busy||linked} onClick={link} className="rounded-lg bg-green-700 px-3 py-2 text-white disabled:opacity-50">Vincular al expediente en Supabase</button></>}</section>
  {collection&&<section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">4. Emitir NFT</h3><label className="block">Wallet destinataria<input className={field} value={recipient} onChange={e=>setRecipient(e.target.value)}/></label><NFTMediaPanel collection={collection} projectReference={project?.id} account={staffAccount} disabled={busy||mediaBusy||!linked||!!mintHash} onURI={setUri} onBusy={setMediaBusy}/><details><summary>Usar URI existente (avanzado)</summary><label className="block">URI de metadatos<input className={field} value={uri} onChange={e=>setUri(e.target.value)}/></label></details><button type="button" disabled={busy||mediaBusy||!linked||!!mintHash||!isAddress(recipient)||!uri} onClick={mint} className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50">Simular y emitir NFT con 047</button><label className="block text-sm">Hash de emisión<input className={field} value={mintHash} onChange={e=>setMintHash(e.target.value)}/></label><button type="button" disabled={busy||!hashPattern.test(mintHash)} onClick={verifyMint} className="rounded-lg border px-3 py-2 disabled:opacity-50">Verificar NFT</button></section>}
  {message&&<p role="status" className="text-green-700">{message}</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}
 </div>;
}
