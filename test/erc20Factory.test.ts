import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { Contract, ContractFactory, JsonRpcProvider, ZeroAddress } from 'ethers';
import { PARTICIPANTS, type WalletProvider } from '../src/lib/factoryWallet';
import { FACTORY_REGISTRY, readTokenState, sendTokenAction, confirmTokenTransaction, journalFromLogs, type ChainLog } from '../src/lib/tokenWorkflow';
import { prepareFactoryRequest, requestJson, type FactoryInput } from '../src/lib/erc20Factory';

const input: FactoryInput = {
  projectId: 'TEST-001', factory: '0x0000000000000000000000000000000000000010',
  admin: '0x0000000000000000000000000000000000000011', treasury: '0x0000000000000000000000000000000000000012',
  name: 'Test Token', symbol: 'TEST', decimals: '18', initialSupply: '9007199254740993.000000000000000001',
  maxSupply: '9007199254740993.000000000000000001', mintable: false, burnable: true, pausable: true,
};
test('preserves quantities beyond Number.MAX_SAFE_INTEGER', () => {
  const result = prepareFactoryRequest(input);
  assert.equal(result.config.initialSupply, 9007199254740993000000000000000001n);
  assert.equal(JSON.parse(requestJson(result)).config.initialSupply, '9007199254740993000000000000000001');
});
test('rejects invalid parameters before encoding', () => {
  for (const patch of [
    {admin: ZeroAddress}, {treasury: 'invalid'}, {decimals: '19'}, {decimals: ''},
    {initialSupply: '-1'}, {initialSupply: '1e18'}, {initialSupply: '1.0000000000000000001'},
    {initialSupply: '1', maxSupply: '2'}, {maxSupply: '0'}, {name: ''}, {projectId: ''},
    {symbol: 'X'.repeat(17)}, {initialSupply: (2n ** 256n).toString()},
  ]) assert.throws(() => prepareFactoryRequest({...input, ...patch}));
});
test('invalidates review hash for every parameter and factory/project change', () => {
  const baseline = prepareFactoryRequest({...input, mintable: true});
  for (const patch of [
    {name: 'Other'}, {symbol: 'OTHER'}, {initialSupply: '1'}, {maxSupply: '99999999999999999999'},
    {admin: input.treasury}, {treasury: input.admin}, {burnable: false}, {pausable: false}, {mintable: false},
    {projectId: 'TEST-002'}, {factory: input.admin},
  ]) assert.notEqual(prepareFactoryRequest({...input, mintable: true, ...patch}).digest, baseline.digest);
});
test('exported transactions execute full approval/create flow on a local Sepolia forkless chain', {timeout: 30000}, async () => {
  const process = spawn('anvil', ['--port', '18545', '--chain-id', '11155111', '--silent'], {stdio: 'ignore'});
  let launchError: Error | undefined;
  process.on('error', error => { launchError = error; });
  const provider = new JsonRpcProvider('http://127.0.0.1:18545', 11155111, {staticNetwork: true});
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (launchError) throw launchError;
      if (process.exitCode !== null) throw new Error('Anvil exited before test startup; port 18545 must be free.');
      try { await provider.getBlockNumber(); ready = true; break; } catch { await setTimeout(100); }
    }
    assert.ok(ready, 'Local Anvil must start');
    const [deployer, technical, compliance, board, operator] = await Promise.all([0,1,2,3,4].map(i => provider.getSigner(i)));
    const artifact = JSON.parse(readFileSync('out/TokvanERC20Factory.sol/TokvanERC20Factory.json', 'utf8'));
    const factory = await new ContractFactory(artifact.abi, artifact.bytecode.object, deployer).deploy(
      technical.address, compliance.address, board.address, operator.address,
    );
    await factory.waitForDeployment();
    const request = prepareFactoryRequest({...input, factory: await factory.getAddress()});
    const contract = new Contract(await factory.getAddress(), artifact.abi, provider);
    assert.equal(await contract.hashConfig(request.projectId, request.config), request.digest);
    await assert.rejects(provider.call({...request.deployment, from: operator.address}));
    for (const signer of [technical, compliance, board]) await (await signer.sendTransaction(request.approval)).wait();
    assert.equal(await contract.approvals(request.digest), 7n);
    // Same prepared calldata is simulated before being submitted by the operator.
    await provider.call({...request.deployment, from: operator.address});
    await (await operator.sendTransaction(request.deployment)).wait();
    const tokenAddress = await contract.tokenByProject(request.projectId);
    assert.notEqual(tokenAddress, ZeroAddress);
    const token = new Contract(tokenAddress, ['function totalSupply() view returns (uint256)', 'function balanceOf(address) view returns (uint256)'], provider);
    assert.equal(await token.totalSupply(), request.config.initialSupply);
    assert.equal(await token.balanceOf(input.treasury), request.config.initialSupply);
    await assert.rejects(provider.call({...request.deployment, from: operator.address}));

    // Exercise the actual browser workflow with the configured roles on local Anvil only.
    const configured = await new ContractFactory(artifact.abi, artifact.bytecode.object, deployer).deploy(...Object.values(PARTICIPANTS));
    await configured.waitForDeployment();
    await provider.send('anvil_setCode', [FACTORY_REGISTRY.address, await provider.getCode(await configured.getAddress())]);
    for (const address of Object.values(PARTICIPANTS)) {
      await provider.send('anvil_impersonateAccount', [address]);
      await provider.send('anvil_setBalance', [address, '0x56bc75e2d63100000']);
    }
    let account = PARTICIPANTS.technicalReviewer;
    const wallet: WalletProvider = {request: async ({method,params}) => method==='eth_accounts' ? [account] : provider.send(method,params??[])};
    const liveRequest=prepareFactoryRequest({...input,projectId:'TOKVAN-SEPOLIA-TKN-001',factory:FACTORY_REGISTRY.address,name:'TOKVAN Test Token',symbol:'TKN'});
    assert.equal((await readTokenState(wallet,liveRequest)).approvals,0);
    await assert.rejects(sendTokenAction(wallet,liveRequest,'deployment',account),/Operador/);
    account=PARTICIPANTS.operator;
    await assert.rejects(sendTokenAction(wallet,liveRequest,'deployment',account),/Faltan/);
    const allLogs: ChainLog[]=[];
    const execute=async(action:'approval'|'revocation'|'deployment')=>{
      const pending=await sendTokenAction(wallet,liveRequest,action,account);
      assert.equal(await confirmTokenTransaction(wallet,pending),'confirmed');
      const receipt=await provider.send('eth_getTransactionReceipt',[pending.hash]);
      allLogs.push(...receipt.logs);
      return pending;
    };
    for(const reviewer of [PARTICIPANTS.technicalReviewer,PARTICIPANTS.complianceReviewer,PARTICIPANTS.boardReviewer]) {
      account=reviewer;await execute('approval');
    }
    assert.equal((await readTokenState(wallet,liveRequest)).approvals,7);
    await assert.rejects(sendTokenAction(wallet,liveRequest,'approval',account),/ya aprobó/);
    await execute('revocation');
    assert.equal((await readTokenState(wallet,liveRequest)).approvals,3);
    await execute('approval');
    account=PARTICIPANTS.operator;
    const altered=prepareFactoryRequest({...input,projectId:'TOKVAN-SEPOLIA-TKN-001',factory:FACTORY_REGISTRY.address,name:'Changed',symbol:'TKN'});
    await assert.rejects(sendTokenAction(wallet,altered,'deployment',account),/Faltan/);
    await execute('deployment');
    const finalState=await readTokenState(wallet,liveRequest);
    assert.notEqual(finalState.token,ZeroAddress);
    await assert.rejects(sendTokenAction(wallet,liveRequest,'deployment',account),/ya tiene/);
    const entries=journalFromLogs([...allLogs,...allLogs]);
    assert.equal(entries.filter(e=>e.kind==='Aprobación').length,4);
    assert.equal(entries.filter(e=>e.kind==='Revocación').length,1);
    assert.equal(entries.filter(e=>e.kind==='Token').length,1);
    assert.equal(entries.find(e=>e.kind==='Token')!.address,finalState.token);
  } finally {
    provider.destroy(); process.kill('SIGTERM');
  }
});
