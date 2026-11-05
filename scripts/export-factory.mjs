import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
const artifact = JSON.parse(readFileSync('out/TokvanERC20Factory.sol/TokvanERC20Factory.json', 'utf8'));
mkdirSync('src/generated', {recursive:true});
writeFileSync('src/generated/factoryArtifact.json', JSON.stringify({abi:artifact.abi, bytecode:artifact.bytecode.object}, null, 2)+'\n');
