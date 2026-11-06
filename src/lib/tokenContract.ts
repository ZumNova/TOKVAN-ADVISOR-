import {Interface} from 'ethers';
export const tokenInterface = new Interface([
  'function symbol() view returns (string)', 'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)', 'function balanceOf(address) view returns (uint256)',
  'function paused() view returns (bool)', 'function pausable() view returns (bool)', 'function burnable() view returns (bool)',
  'function hasRole(bytes32,address) view returns (bool)',
  'function burn(uint256)', 'function pause()', 'function unpause()',
  'function transfer(address,uint256) returns (bool)',
  'event Transfer(address indexed from,address indexed to,uint256 value)',
  'event Paused(address account)', 'event Unpaused(address account)',
]);
