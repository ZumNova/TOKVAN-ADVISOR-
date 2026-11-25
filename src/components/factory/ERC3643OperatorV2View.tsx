import {useState} from 'react';
import {formatUnits,getAddress,id,Interface,isAddress,keccak256,parseUnits,toUtf8Bytes,ZeroAddress} from 'ethers';
import factoryArtifact from '../../generated/erc3643FactoryV2Artifact.json';
import claimArtifact from '../../generated/erc3643ClaimV2Artifact.json';
import complianceArtifact from '../../generated/erc3643ComplianceV2Artifact.json';
import suiteArtifact from '../../generated/erc3643Suite.json';
import {injectedWallet,walletError,type WalletProvider} from '../../lib/factoryWallet';

const factoryAbi=new Interface(factoryArtifact.abi);
const claimAbi=new Interface(claimArtifact.abi);
const complianceAbi=new Interface(complianceArtifact.abi);
const tokenAbi=new Interface(suiteArtifact.implementations[0].abi);
const registryAbi=new Interface(suiteArtifact.implementations[1].abi);
const factoryDefault='0x8cC92c109911514738555c144671d5E1B5307503';
const field='mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900';
const button='rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50';
type Context={account:string;isOwner:boolean;factory:string;token:string;claim:string;compliance:string;registry:string;decimals:number};
type RecipientState={verified:boolean;countryAllowed:boolean;country:number;balance:string;supply:string;cap:string;identity:string;expiresAt:number;revoked:boolean};
type FreezeState={frozen:boolean;amount:string;balance:string};

async function connected(wallet:WalletProvider){
 const chain=await wallet.request({method:'eth_chainId'});
 if(typeof chain!=='string'||BigInt(chain)!==11155111n)throw new Error('Seleccioná Sepolia en la wallet.');
 const accounts=await wallet.request({method:'eth_requestAccounts'});
 if(!Array.isArray(accounts)||typeof accounts[0]!=='string')throw new Error('Conectá la wallet propietaria o agente.');
 return getAddress(accounts[0]);
}
async function read(wallet:WalletProvider,address:string,abi:Interface,name:string,args:unknown[]=[]){
 const raw=await wallet.request({method:'eth_call',params:[{to:address,data:abi.encodeFunctionData(name,args)},'latest']});
 if(typeof raw!=='string')throw new Error('Sepolia no devolvió una respuesta válida.');
 return abi.decodeFunctionResult(name,raw);
}
async function send(wallet:WalletProvider,context:Context,to:string,data:string){
 if(await connected(wallet)!==context.account)throw new Error('La cuenta conectada cambió. Volvé a consultar el token.');
 const tx={from:context.account,to,data,value:'0x0'};
 await wallet.request({method:'eth_call',params:[tx,'latest']});
 const gas=BigInt(await wallet.request({method:'eth_estimateGas',params:[tx]}) as string);
 if(await connected(wallet)!==context.account)throw new Error('La cuenta conectada cambió.');
 const hash=await wallet.request({method:'eth_sendTransaction',params:[{...tx,gas:'0x'+(gas*120n/100n).toString(16)}]});
 if(typeof hash!=='string'||!/^0x[0-9a-f]{64}$/i.test(hash))throw new Error('La wallet no devolvió un hash válido.');
 for(let attempt=0;attempt<40;attempt++){
  const receipt=await wallet.request({method:'eth_getTransactionReceipt',params:[hash]}) as {status:string}|null;
  if(receipt){if(BigInt(receipt.status)!==1n)throw new Error('La transacción fue rechazada en Sepolia.');return hash;}
  await new Promise(resolve=>setTimeout(resolve,1500));
 }
 throw new Error(`La transacción fue enviada (${hash}), pero Sepolia todavía no confirmó. Consultá el hash antes de volver a intentar.`);
}
export default function ERC3643OperatorV2View(){
 const factory=factoryDefault;
 const [token,setToken]=useState('');
 const [context,setContext]=useState<Context|null>(null),[recipient,setRecipient]=useState('');
 const [country,setCountry]=useState(''),[entity,setEntity]=useState(true),[days,setDays]=useState('180');
 const [reference,setReference]=useState(''),[quantity,setQuantity]=useState('');
 const [reviewed,setReviewed]=useState(false),[recipientState,setRecipientState]=useState<RecipientState|null>(null);
 const [paused,setPaused]=useState<boolean|null>(null);
 const [holder,setHolder]=useState(''),[freezeAmount,setFreezeAmount]=useState(''),[freezeState,setFreezeState]=useState<FreezeState|null>(null);
 const [delegate,setDelegate]=useState(''),[delegateIsAgent,setDelegateIsAgent]=useState<boolean|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[lastHash,setLastHash]=useState('');
 const run=async(action:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError('');setMessage('');try{await action();}catch(e){setError(walletError(e));}finally{setBusy(false);}};
 const load=()=>run(async()=>{
  if(!isAddress(factory)||!isAddress(token))throw new Error('Ingresá direcciones válidas del factory v2 y del token.');
  const wallet=injectedWallet(),account=await connected(wallet),factoryAddress=getAddress(factory),tokenAddress=getAddress(token);
  const [factoryCode,tokenCode]=await Promise.all([wallet.request({method:'eth_getCode',params:[factoryAddress,'latest']}),wallet.request({method:'eth_getCode',params:[tokenAddress,'latest']})]);
  if(factoryCode==='0x'||tokenCode==='0x')throw new Error('No se encontraron esos contratos en Sepolia.');
  const [version,parts,owner,agent,decimals,registry,pauseState]=await Promise.all([
   read(wallet,factoryAddress,factoryAbi,'VERSION'),read(wallet,factoryAddress,factoryAbi,'suites',[tokenAddress]),
   read(wallet,tokenAddress,tokenAbi,'owner'),read(wallet,tokenAddress,tokenAbi,'isAgent',[account]),
   read(wallet,tokenAddress,tokenAbi,'decimals'),read(wallet,tokenAddress,tokenAbi,'identityRegistry'),read(wallet,tokenAddress,tokenAbi,'paused'),
  ]);
  if(version[0]!==id('TOKVAN_3643_SEPOLIA_EDUCATIONAL_V2'))throw new Error('El factory no es ERC-3643 v2 de TOKVANT.');
  const ownerAddress=getAddress(owner[0]),isOwner=ownerAddress===account;
  if(agent[0]!==true)throw new Error('Esta wallet no tiene permiso de agente en el token.');
  if(getAddress(parts.claimIssuer)===ZeroAddress||getAddress(parts.compliance)===ZeroAddress||getAddress(parts.registry)!==getAddress(registry[0]))throw new Error('El token no pertenece a esta suite v2.');
  const [authority,complianceOwner]=await Promise.all([read(wallet,parts.claimIssuer,claimAbi,'authority'),read(wallet,parts.compliance,complianceAbi,'owner')]);
  if(getAddress(authority[0])!==ownerAddress||getAddress(complianceOwner[0])!==ownerAddress)throw new Error('La propietaria de la suite no coincide con la del token.');
  setContext({account,isOwner,factory:factoryAddress,token:tokenAddress,claim:getAddress(parts.claimIssuer),compliance:getAddress(parts.compliance),registry:getAddress(parts.registry),decimals:Number(decimals[0])});
  setPaused(Boolean(pauseState[0]));
  setRecipientState(null);setFreezeState(null);setDelegateIsAgent(null);setMessage(isOwner?'Suite verificada. La propietaria puede acreditar y emitir en esta prueba.':'Suite verificada. El agente puede emitir, pausar y congelar; no puede acreditar ni cambiar países.');
 });
 const refreshPause=()=>run(async()=>{
  if(!context)throw new Error('Primero verificá la suite.');
  const wallet=injectedWallet();
  if(await connected(wallet)!==context.account)throw new Error('Conectá de nuevo la wallet propietaria.');
  const state=await read(wallet,context.token,tokenAbi,'paused');
  setPaused(Boolean(state[0]));setMessage('Estado de pausa actualizado desde Sepolia.');
 });
 const changePause=()=>run(async()=>{
  if(!context||paused===null)throw new Error('Primero consultá el estado de pausa.');
  const wallet=injectedWallet();
  const current=Boolean((await read(wallet,context.token,tokenAbi,'paused'))[0]);
  if(current!==paused){setPaused(current);throw new Error('El estado cambió. Revisalo antes de firmar.');}
  const hash=await send(wallet,context,context.token,tokenAbi.encodeFunctionData(paused?'unpause':'pause'));
  setLastHash(hash);setPaused(null);
  setMessage('Transacción enviada. Esperá la confirmación y pulsá «Actualizar estado de pausa».');
 });
 const inspectFreeze=()=>run(async()=>{
  if(!context||!isAddress(holder))throw new Error('Ingresá una wallet válida para consultar el congelamiento.');
  const wallet=injectedWallet();
  if(await connected(wallet)!==context.account)throw new Error('Conectá de nuevo la wallet propietaria.');
  const address=getAddress(holder);
  const [frozen,amount,balance]=await Promise.all([
   read(wallet,context.token,tokenAbi,'isFrozen',[address]),
   read(wallet,context.token,tokenAbi,'getFrozenTokens',[address]),
   read(wallet,context.token,tokenAbi,'balanceOf',[address]),
  ]);
  setFreezeState({frozen:Boolean(frozen[0]),amount:formatUnits(amount[0],context.decimals),balance:formatUnits(balance[0],context.decimals)});
  setMessage('Congelamiento consultado en Sepolia.');
 });
 const changeFreeze=(kind:'wallet'|'freeze'|'release')=>run(async()=>{
  if(!context||!isAddress(holder)||!freezeState)throw new Error('Primero consultá la wallet que querés administrar.');
  const wallet=injectedWallet(),address=getAddress(holder);
  if(kind==='wallet'){
   const current=Boolean((await read(wallet,context.token,tokenAbi,'isFrozen',[address]))[0]);
   if(current!==freezeState.frozen){setFreezeState(null);throw new Error('El estado cambió. Consultá de nuevo antes de firmar.');}
   const hash=await send(wallet,context,context.token,tokenAbi.encodeFunctionData('setAddressFrozen',[address,!current]));
   setLastHash(hash);
  }else{
   if(!/^\d+(\.\d+)?$/.test(freezeAmount))throw new Error('Ingresá una cantidad positiva de tokens.');
   const amount=parseUnits(freezeAmount,context.decimals);
   if(amount<=0n)throw new Error('La cantidad debe ser mayor que cero.');
   const [currentFrozen,currentBalance]=await Promise.all([
    read(wallet,context.token,tokenAbi,'getFrozenTokens',[address]),
    read(wallet,context.token,tokenAbi,'balanceOf',[address]),
   ]);
   if(formatUnits(currentFrozen[0],context.decimals)!==freezeState.amount||formatUnits(currentBalance[0],context.decimals)!==freezeState.balance){setFreezeState(null);throw new Error('El saldo o congelamiento cambió. Consultá de nuevo antes de firmar.');}
   if(kind==='freeze'&&amount>currentBalance[0]-currentFrozen[0])throw new Error('La cantidad supera el saldo disponible para congelar.');
   if(kind==='release'&&amount>currentFrozen[0])throw new Error('La cantidad supera el saldo congelado.');
   const hash=await send(wallet,context,context.token,tokenAbi.encodeFunctionData(kind==='freeze'?'freezePartialTokens':'unfreezePartialTokens',[address,amount]));
   setLastHash(hash);
  }
  setFreezeState(null);setMessage('Transacción enviada. Esperá la confirmación y consultá de nuevo el congelamiento.');
 });
 const inspectDelegate=()=>run(async()=>{
  if(!context||!isAddress(delegate))throw new Error('Ingresá una wallet válida para consultar sus permisos.');
  const wallet=injectedWallet();
  if(await connected(wallet)!==context.account)throw new Error('Conectá de nuevo la wallet propietaria.');
  const state=await read(wallet,context.token,tokenAbi,'isAgent',[getAddress(delegate)]);
  setDelegateIsAgent(Boolean(state[0]));setMessage('Permiso de agente consultado en Sepolia.');
 });
 const changeDelegate=()=>run(async()=>{
  if(!context?.isOwner||!isAddress(delegate)||delegateIsAgent===null)throw new Error('Solo la wallet propietaria puede delegar o revocar agentes.');
  const wallet=injectedWallet(),address=getAddress(delegate);
  if(address===context.account)throw new Error('No modifiques desde aquí el permiso de la wallet propietaria.');
  const current=Boolean((await read(wallet,context.token,tokenAbi,'isAgent',[address]))[0]);
  if(current!==delegateIsAgent){setDelegateIsAgent(current);throw new Error('El permiso cambió. Revisalo antes de firmar.');}
  const hash=await send(wallet,context,context.token,tokenAbi.encodeFunctionData(current?'removeAgent':'addAgent',[address]));
  setLastHash(hash);setDelegateIsAgent(null);
  setMessage('Cambio de agente enviado. Esperá la confirmación y consultá de nuevo el permiso.');
 });
 const recipientSnapshot=async(wallet:WalletProvider,current:Context,address:string):Promise<RecipientState>=>{
  const [verified,countryCode,balance,supply,cap,identityResult]=await Promise.all([
   read(wallet,current.registry,registryAbi,'isVerified',[address]),read(wallet,current.registry,registryAbi,'investorCountry',[address]),
   read(wallet,current.token,tokenAbi,'balanceOf',[address]),read(wallet,current.token,tokenAbi,'totalSupply'),
   read(wallet,current.compliance,complianceAbi,'supplyCap'),read(wallet,current.registry,registryAbi,'identity',[address]),
  ]);
  const code=Number(countryCode[0]),identity=getAddress(identityResult[0]);
  const [allowed,credential]=await Promise.all([
   code>0?read(wallet,current.compliance,complianceAbi,'allowedCountry',[code]):Promise.resolve([false]),
   identity!==ZeroAddress?read(wallet,current.claim,claimAbi,'credentials',[identity]):Promise.resolve([0,0,false,false,false,false,false,false,ZeroAddress]),
  ]);
  return {verified:Boolean(verified[0]),countryAllowed:Boolean(allowed[0]),country:code,balance:formatUnits(balance[0],current.decimals),supply:formatUnits(supply[0],current.decimals),cap:formatUnits(cap[0],current.decimals),identity,expiresAt:Number(credential[0]),revoked:Boolean(credential[7])};
 };
 const inspect=()=>run(async()=>{
  if(!context||!isAddress(recipient))throw new Error('Primero verificá la suite e ingresá la wallet destinataria.');
  const wallet=injectedWallet(),address=getAddress(recipient);
  if(await connected(wallet)!==context.account)throw new Error('Conectá de nuevo la wallet propietaria.');
  setRecipientState(await recipientSnapshot(wallet,context,address));
  setMessage('Estado de la wallet consultado en Sepolia.');
 });
 const attest=()=>run(async()=>{
  if(!context?.isOwner||!isAddress(recipient)||!reviewed)throw new Error('Solo la propietaria puede acreditar compradores desde este panel.');
  const code=Number(country),validDays=Number(days);
  if(!Number.isInteger(code)||code<1||code>999||!Number.isInteger(validDays)||validDays<1||validDays>366)throw new Error('Ingresá país ISO numérico (1–999) y vigencia de 1 a 366 días.');
  if(reference.trim().length<4||reference.trim().length>120)throw new Error('Ingresá una referencia interna de 4 a 120 caracteres, sin datos personales.');
  const expiry=Math.floor(Date.now()/1000)+validDays*86400;
  const evidence=keccak256(toUtf8Bytes(`TOKVANT-3643-V2:${reference.trim()}`));
  const credential=[expiry,code,entity,!entity,entity,true,true,false,evidence];
  const hash=await send(injectedWallet(),context,context.claim,claimAbi.encodeFunctionData('attest',[getAddress(recipient),credential]));
  setLastHash(hash);setRecipientState(await recipientSnapshot(injectedWallet(),context,getAddress(recipient)));setMessage('Acreditación ficticia confirmada y estado actualizado desde Sepolia.');
 });
 const allowCountry=()=>run(async()=>{
  if(!context?.isOwner||!recipientState?.verified||recipientState.country<1)throw new Error('Solo la propietaria puede habilitar países desde este panel.');
  const hash=await send(injectedWallet(),context,context.compliance,complianceAbi.encodeFunctionData('setCountry',[recipientState.country,true]));
  setLastHash(hash);setRecipientState(await recipientSnapshot(injectedWallet(),context,getAddress(recipient)));setMessage('País habilitado y estado actualizado desde Sepolia.');
 });
 const revokeCredential=()=>run(async()=>{
  if(!context?.isOwner||!recipientState||recipientState.identity===ZeroAddress||recipientState.revoked)throw new Error('Consultá primero una acreditación vigente para revocarla.');
  if(!window.confirm(`Revocar la acreditación de ${getAddress(recipient)}\n\nLa wallet conservará sus tokens, pero dejará de estar habilitada hasta una nueva acreditación.`))return;
  const hash=await send(injectedWallet(),context,context.claim,claimAbi.encodeFunctionData('revoke',[recipientState.identity]));
  setLastHash(hash);setRecipientState(await recipientSnapshot(injectedWallet(),context,getAddress(recipient)));setMessage('Acreditación revocada y estado actualizado desde Sepolia.');
 });
 const mint=()=>run(async()=>{
  if(!context||!isAddress(recipient)||!recipientState?.verified||!recipientState.countryAllowed)throw new Error('La wallet debe tener identidad vigente y país habilitado.');
  if(!/^\d+(\.\d+)?$/.test(quantity))throw new Error('Ingresá una cantidad positiva.');
  const amount=parseUnits(quantity,context.decimals);
  if(amount<=0n)throw new Error('La cantidad debe ser mayor que cero.');
  const hash=await send(injectedWallet(),context,context.token,tokenAbi.encodeFunctionData('mint',[getAddress(recipient),amount]));
  setLastHash(hash);setRecipientState(null);setMessage('Emisión enviada. Esperá su confirmación y consultá saldo y suministro.');
 });
 return <div className="space-y-5 rounded-xl bg-white p-5 text-slate-900">
  <h2 className="text-2xl font-bold">Operar token ERC-3643 · Sepolia</h2>
  <p>La empresa conserva la documentación y decide a quién habilitar. Esta suite usa acreditaciones ficticias de prueba; no subas datos personales ni comprobantes aquí.</p>
  <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">1. Conectar la wallet propietaria o agente</h3>
   <p className="break-all text-sm">Factory v2 verificado: {factory}</p>
   <label className="block">Contrato del token<input className={field} value={token} onChange={e=>{setToken(e.target.value);setContext(null);setPaused(null);setFreezeState(null);setDelegateIsAgent(null);}} placeholder="0x…"/></label>
   <button type="button" className={button} disabled={busy} onClick={load}>Conectar y verificar permisos</button>
   {context&&<p className="text-sm text-green-700">{context.isOwner?'Propietaria y agente':'Agente del token'}: {context.account} · Decimales: {context.decimals}</p>}
  </section>
  {context&&<section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">2. Wallet compradora</h3>
   <label className="block">Wallet destinataria<input className={field} value={recipient} onChange={e=>{setRecipient(e.target.value);setRecipientState(null);}} placeholder="0x…"/></label>
   <button type="button" className={button} disabled={busy||!isAddress(recipient)} onClick={inspect}>Consultar habilitación y saldo</button>
   {recipientState&&<div className="flex flex-wrap gap-2 text-sm" aria-live="polite">
    <span className={`rounded-lg border px-3 py-2 font-semibold ${recipientState.verified?'border-green-300 bg-green-50 text-green-800':'border-amber-300 bg-amber-50 text-amber-900'}`}>Identidad: {recipientState.revoked?'revocada':recipientState.expiresAt>0&&recipientState.expiresAt<=Math.floor(Date.now()/1000)?'vencida':recipientState.verified?'vigente':'pendiente'}</span>
    <span className={`rounded-lg border px-3 py-2 font-semibold ${recipientState.countryAllowed?'border-green-300 bg-green-50 text-green-800':'border-amber-300 bg-amber-50 text-amber-900'}`}>País {recipientState.country||'sin registrar'}: {recipientState.countryAllowed?'habilitado':'pendiente'}</span>
    {recipientState.expiresAt>0&&<span className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800">Vence: {new Date(recipientState.expiresAt*1000).toLocaleString('es-AR')}</span>}
    <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900">Saldo: {recipientState.balance}</span>
    <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900">Circulación: {recipientState.supply} / {recipientState.cap}</span>
   </div>}
   {context.isOwner&&<><div className="grid gap-3 sm:grid-cols-2">
    <label className="block">País de residencia · ISO numérico<input className={field} type="number" min="1" max="999" value={country} onChange={e=>setCountry(e.target.value)} placeholder="Ej.: 858 Uruguay, 32 Argentina"/></label>
    <label className="block">Vigencia en días (máx. 366)<input className={field} type="number" min="1" max="366" value={days} onChange={e=>setDays(e.target.value)}/></label>
   </div>
   <label className="flex items-center gap-2"><input type="checkbox" checked={entity} onChange={e=>setEntity(e.target.checked)}/>La compradora es una empresa (KYB ficticio). Desmarcá si es persona (KYC ficticio).</label>
   <label className="block">Referencia interna sin nombres ni documentos<input className={field} value={reference} maxLength={120} onChange={e=>setReference(e.target.value)} placeholder="Ej.: TEST-HOTEL-001"/></label>
   <label className="flex items-start gap-2"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>Confirmo que la empresa revisó fuera de TOKVANT el caso y autoriza esta acreditación ficticia en Sepolia.</label>
   <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy||!reviewed||!isAddress(recipient)} onClick={attest}>{recipientState&&(recipientState.revoked||(recipientState.expiresAt>0&&recipientState.expiresAt<=Math.floor(Date.now()/1000)))?'Registrar nueva acreditación':'Registrar acreditación de prueba'}</button><button type="button" className={button} disabled={busy||!recipientState?.verified||recipientState.countryAllowed} onClick={allowCountry}>Habilitar país de prueba</button><button type="button" className="rounded-lg border border-red-600 px-3 py-2 text-red-700 disabled:opacity-50" disabled={busy||!recipientState||recipientState.identity===ZeroAddress||recipientState.revoked} onClick={revokeCredential}>Simular y revocar acreditación</button></div></>}
  </section>}
  {context&&<section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">3. Emitir unidades</h3>
   <p className="text-sm">La emisión crea unidades nuevas directamente en la wallet habilitada. No requiere levantar la pausa; las transferencias siguen bloqueadas hasta que la propietaria decida reanudarlas.</p>
   <label className="block">Cantidad de tokens<input className={field} value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Ej.: 20"/></label>
   <button type="button" className={button} disabled={busy||!recipientState?.verified||!recipientState.countryAllowed} onClick={mint}>Simular y emitir a la wallet</button>
  </section>}
  {context&&<section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">4. Pausa de transferencias</h3>
   <p className="text-sm">La pausa detiene las transferencias normales. La agente puede seguir emitiendo unidades a wallets habilitadas.</p>
   <p className={`text-sm font-semibold ${paused===null?'text-slate-600':paused?'text-amber-800':'text-green-800'}`}>Estado: {paused===null?'pendiente de actualizar':paused?'transferencias pausadas':'transferencias habilitadas'}</p>
   <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy} onClick={refreshPause}>Actualizar estado de pausa</button><button type="button" className={button} disabled={busy||paused===null} onClick={changePause}>{paused?'Simular y reanudar':'Simular y pausar'}</button></div>
  </section>}
  {context&&<section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">5. Congelamiento</h3>
   <p className="text-sm">Congelar una wallet bloquea sus transferencias normales. También podés congelar una cantidad concreta de su saldo; liberar esa cantidad no descongela la wallet completa.</p>
   <label className="block">Wallet titular<input className={field} value={holder} onChange={e=>{setHolder(e.target.value);setFreezeState(null);}} placeholder="0x…"/></label>
   <button type="button" className={button} disabled={busy||!isAddress(holder)} onClick={inspectFreeze}>Consultar saldo y congelamiento</button>
   {freezeState&&<div className="flex flex-wrap gap-2 text-sm" aria-live="polite"><span className={`rounded-lg border px-3 py-2 font-semibold ${freezeState.frozen?'border-amber-300 bg-amber-50 text-amber-900':'border-green-300 bg-green-50 text-green-800'}`}>Wallet: {freezeState.frozen?'congelada':'libre'}</span><span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900">Saldo: {freezeState.balance}</span><span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900">Saldo congelado: {freezeState.amount}</span></div>}
   <button type="button" className={button} disabled={busy||!freezeState} onClick={()=>changeFreeze('wallet')}>{freezeState?.frozen?'Simular y descongelar wallet':'Simular y congelar wallet'}</button>
   <label className="block">Cantidad de tokens a congelar o liberar<input className={field} value={freezeAmount} onChange={e=>setFreezeAmount(e.target.value)} placeholder="Ej.: 2"/></label>
   <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy||!freezeState} onClick={()=>changeFreeze('freeze')}>Simular y congelar cantidad</button><button type="button" className={button} disabled={busy||!freezeState} onClick={()=>changeFreeze('release')}>Simular y liberar cantidad</button></div>
  </section>}
  {context?.isOwner&&<section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">6. Agente del token</h3>
   <p className="text-sm">AE0E puede delegar a otra wallet emisión, pausa y congelamiento del token. Este permiso no acredita compradores, no habilita países y no da acceso por sí solo al panel TOKVANT.</p>
   <label className="block">Wallet a delegar o revocar<input className={field} value={delegate} onChange={e=>{setDelegate(e.target.value);setDelegateIsAgent(null);}} placeholder="0x…"/></label>
   <button type="button" className={button} disabled={busy||!isAddress(delegate)} onClick={inspectDelegate}>Consultar permiso de agente</button>
   {delegateIsAgent!==null&&<p className={`text-sm font-semibold ${delegateIsAgent?'text-green-800':'text-amber-800'}`}>Agente del token: {delegateIsAgent?'habilitado':'sin permiso'}</p>}
   <button type="button" className={button} disabled={busy||delegateIsAgent===null||!isAddress(delegate)||getAddress(delegate)===context.account} onClick={changeDelegate}>{delegateIsAgent?'Simular y revocar agente':'Simular y delegar agente'}</button>
  </section>}
  {lastHash&&<p className="break-all text-sm">Última transacción: <a className="text-blue-700 underline" target="_blank" rel="noreferrer" href={`https://sepolia.etherscan.io/tx/${lastHash}`}>{lastHash}</a></p>}
  {message&&<p role="status" className="text-green-700">{message}</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}
 </div>;
}
