import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_PROJECTS} from '../src/constants/mockData';
import {projectReviewHash,reviewRoleForWallet,reviewWallets,validReview} from '../src/lib/reviewSignatures';
import {projectHash as serverProjectHash} from '../server/governance';

test('las wallets Sepolia tienen un único dictamen y el operador no firma revisión',()=>{
 assert.equal(reviewRoleForWallet(reviewWallets['Technical Reviewer']),'Technical Reviewer');
 assert.equal(reviewRoleForWallet(reviewWallets['Compliance Reviewer']),'Compliance Reviewer');
 assert.equal(reviewRoleForWallet(reviewWallets['Enterprise Board']),'Enterprise Board');
 assert.equal(reviewRoleForWallet('0xF3aAD2304F711ad5f400Ad322442D67DeD3E8A25'),null);
});
test('el hash compartido no cambia al reordenar claves JSONB',()=>{
 const p=MOCK_PROJECTS[0];
 const reordered={...p,parameters:Object.fromEntries(Object.entries(p.parameters).reverse()) as typeof p.parameters};
 assert.equal(projectReviewHash(p),projectReviewHash(reordered));
 assert.equal(projectReviewHash(p),serverProjectHash(reordered));
});
test('cambiar un parámetro o documento cambia la versión que debe firmarse',()=>{
 const p=MOCK_PROJECTS[0];
 assert.notEqual(projectReviewHash(p),projectReviewHash({...p,parameters:{...p.parameters,initialSupply:p.parameters.initialSupply+1}}));
 assert.notEqual(projectReviewHash(p),projectReviewHash({...p,documents:[...p.documents,{...p.documents[0],id:'otro',sha256:'a'.repeat(64)}]}));
 assert.equal(validReview(p,{projectId:p.id,stepId:p.approvals[0].id,role:'Technical Reviewer',decision:'Aprobado',comments:'ok',projectHash:projectReviewHash(p),timestamp:new Date().toISOString(),nonce:'x',signer:reviewWallets['Technical Reviewer'],signature:'0x1234'}),false);
});
