import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {keccak256} from 'ethers';
const base='node_modules/@erc3643org/erc-3643';
const names=['Token','IdentityRegistry','IdentityRegistryStorage','ClaimTopicsRegistry','TrustedIssuersRegistry'];
const suite=names.map(name=>{const dir=name==='Token'?'token':'registry/implementation';const a=JSON.parse(readFileSync(`${base}/artifacts/contracts/${dir}/${name}.sol/${name}.json`,'utf8'));if(Object.keys(a.linkReferences).length||Object.keys(a.deployedLinkReferences).length)throw Error('Linked library requires review');return {name,abi:a.abi,bytecode:a.bytecode,runtimeHash:keccak256(a.deployedBytecode)};});
mkdirSync('src/generated',{recursive:true});
writeFileSync('src/generated/erc3643Suite.json',JSON.stringify({package:'@erc3643org/erc-3643',version:'4.1.3',implementations:suite},null,2)+'\n');
writeFileSync('contracts/Tokvan3643SuiteHashes.sol','// SPDX-License-Identifier: GPL-3.0\npragma solidity 0.8.24;\n// Generated from pinned official ERC-3643 4.1.3 runtime bytecode.\nlibrary Tokvan3643SuiteHashes { function hashAt(uint256 index) internal pure returns(bytes32) {\n'+suite.map((a,i)=>`if(index==${i}) return ${a.runtimeHash}; // ${a.name}`).join('\n')+'\nrevert("Index");\n} }\n');
mkdirSync('docs/licenses',{recursive:true});writeFileSync('docs/licenses/ERC3643-GPL-3.0.txt',readFileSync(`${base}/LICENSE.md`));
