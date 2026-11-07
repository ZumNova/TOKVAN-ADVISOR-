import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
mkdirSync('src/generated', {recursive:true});
for (const [contract, file] of [['TokvanERC20Factory','factoryArtifact'],['TokvanERC721Factory','erc721FactoryArtifact'],['TokvanERC721','erc721Artifact'],['TokvanERC1155Factory','erc1155FactoryArtifact'],['TokvanERC1155','erc1155Artifact']]) {
  const artifact = JSON.parse(readFileSync(`out/${contract}.sol/${contract}.json`, 'utf8'));
  writeFileSync(`src/generated/${file}.json`, JSON.stringify({abi:artifact.abi, bytecode:artifact.bytecode.object}, null, 2)+'\n');
}
