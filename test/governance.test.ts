import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Wallet,verifyMessage} from 'ethers';
import {MOCK_PROJECTS} from '../src/constants/mockData';
import {projectHash,POST} from '../server/governance';
import {projectReviewHash} from '../src/lib/reviewSignatures';
import {paymentMessage,authorizationMessage} from '../src/lib/governance';

test('la versión revisada coincide en cliente y servidor',()=>{
 assert.equal(projectHash(MOCK_PROJECTS[0]),projectReviewHash(MOCK_PROJECTS[0]));
 assert.notEqual(projectHash(MOCK_PROJECTS[0]),projectHash({...MOCK_PROJECTS[0],parameters:{...MOCK_PROJECTS[0].parameters,initialSupply:1}}));
});
test('recibo y autorización vinculan expediente, dictámenes y comprobante a la firma',async()=>{
 const wallet=Wallet.createRandom(),origin='https://tokvan-advisor.vercel.app',id='11111111-1111-4111-8111-111111111111';
 const payment=paymentMessage(origin,id,id,'100.00','USD','TRX-1234','a'.repeat(64),wallet.address);
 const signed=await wallet.signMessage(payment);
 assert.equal(verifyMessage(payment,signed),wallet.address);
 assert.notEqual(verifyMessage(paymentMessage(origin,id,id,'200.00','USD','TRX-1234','a'.repeat(64),wallet.address),signed),wallet.address);
 const authorization=authorizationMessage(origin,id,'0xabc',['1','2','3'],id,wallet.address);
 assert.notEqual(verifyMessage(authorization.replace('1,2,3','1,2,4'),await wallet.signMessage(authorization)),wallet.address);
});
test('la API rechaza consultas sin firma de wallet',async()=>{
 const result=await POST(new Request('https://tokvan-advisor.vercel.app/api/governance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'list',submissionId:'11111111-1111-4111-8111-111111111111'})}));
 assert.equal(result.status,403);
});
