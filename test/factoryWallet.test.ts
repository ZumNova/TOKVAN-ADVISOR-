import { test } from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import artifact from '../src/generated/factoryArtifact.json';
import { DEPLOYER, SEPOLIA_HEX, assertDeploymentWallet, deploymentTransaction, estimateDeployment, sendDeployment, verifyDeployment, type WalletProvider } from '../src/lib/factoryWallet';
const hash = '0x'+'ab'.repeat(32);
const address = '0x0000000000000000000000000000000000000010';
function mock(overrides: Record<string,unknown> = {}) {
  const calls: {method:string;params?:unknown[]}[] = [];
  const answers: Record<string,unknown> = {eth_chainId:SEPOLIA_HEX,eth_accounts:[DEPLOYER],eth_estimateGas:'0x1e8480',eth_gasPrice:'0x3b9aca00',eth_getBalance:'0xde0b6b3a7640000',eth_sendTransaction:hash,...overrides};
  const wallet: WalletProvider = {request:async args => {calls.push(args);const value=answers[args.method]; if(value instanceof Error) throw value; return value;}};
  return {wallet,calls};
}
test('browser bytecode and ABI match compiled factory', () => {
  const compiled = JSON.parse(readFileSync('out/TokvanERC20Factory.sol/TokvanERC20Factory.json','utf8'));
  assert.equal(artifact.bytecode,compiled.bytecode.object); assert.deepEqual(artifact.abi,compiled.abi);
});
test('blocks wrong network, wrong signer and disconnected wallet', async () => {
  for(const override of [{eth_chainId:'0x1'},{eth_accounts:[address]},{eth_accounts:[]}]) {
    const {wallet,calls} = mock(override);
    await assert.rejects(sendDeployment(wallet));
    assert.ok(!calls.some(c=>c.method==='eth_sendTransaction'));
  }
});
test('rejects insufficient balance without requesting a signature', async () => {
  const {wallet,calls}=mock({eth_getBalance:'0x0'});
  await assert.rejects(sendDeployment(wallet),/suficiente/);
  assert.ok(!calls.some(c=>c.method==='eth_sendTransaction'));
});
test('estimates and sends contract creation from A047 with explicit Sepolia chain', async () => {
  const {wallet,calls}=mock();
  assert.equal(await assertDeploymentWallet(wallet),DEPLOYER);
  assert.equal((await estimateDeployment(wallet)).gasLimit,2400000n);
  assert.equal(await sendDeployment(wallet),hash);
  const sent = calls.find(c=>c.method==='eth_sendTransaction')!.params![0] as Record<string,unknown>;
  assert.equal(sent.from,DEPLOYER);assert.equal(sent.chainId,SEPOLIA_HEX);assert.equal(sent.to,undefined);assert.equal(sent.value,'0x0');
  assert.equal(sent.data,(await deploymentTransaction()).data);
});
test('rechecks account after estimation and blocks account change', async () => {
  const {wallet,calls}=mock(); const request=wallet.request.bind(wallet);let count=0;
  wallet.request = args => args.method==='eth_accounts' && ++count===2 ? Promise.resolve([address]) : request(args);
  await assert.rejects(sendDeployment(wallet),/Seleccione/);
  assert.ok(!calls.some(c=>c.method==='eth_sendTransaction'));
});
test('wallet rejection propagates without a success hash', async () => {
  await assert.rejects(sendDeployment(mock({eth_sendTransaction:new Error('Rejected')}).wallet),/Rejected/);
});
test('pending and failed receipts never become deployed', async () => {
  assert.deepEqual(await verifyDeployment(mock({eth_getTransactionReceipt:null}).wallet,hash),{status:'pending'});
  assert.deepEqual(await verifyDeployment(mock({eth_getTransactionReceipt:{status:'0x0',contractAddress:null}}).wallet,hash),{status:'failed'});
});
test('confirmation verifies exact creation calldata and on-chain code', async () => {
  const tx=await deploymentTransaction();
  const answers={eth_getTransactionReceipt:{status:'0x1',contractAddress:address},eth_getTransactionByHash:{from:DEPLOYER,to:null,input:tx.data,value:'0x0'},eth_getCode:'0x6000'};
  assert.deepEqual(await verifyDeployment(mock(answers).wallet,hash),{status:'confirmed',address});
  await assert.rejects(verifyDeployment(mock({...answers,eth_getCode:'0x'}).wallet,hash),/código/);
  await assert.rejects(verifyDeployment(mock({...answers,eth_getTransactionByHash:{from:DEPLOYER,to:null,input:'0x6000',value:'0x0'}}).wallet,hash),/no corresponde/);
  await assert.rejects(verifyDeployment(mock({...answers,eth_chainId:'0x1'}).wallet,hash),/Sepolia/);
});
