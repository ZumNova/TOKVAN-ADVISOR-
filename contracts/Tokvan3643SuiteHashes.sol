// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;
// Generated from pinned official ERC-3643 4.1.3 runtime bytecode.
library Tokvan3643SuiteHashes { function hashAt(uint256 index) internal pure returns(bytes32) {
if(index==0) return 0x6bd438874f61699014a6d46b02b1d6f3be428881ddd6278091fec5ab075b9843; // Token
if(index==1) return 0xeca38ed1d8e1d2936579feea6252619067a3c1ef162d7a5e5da280cb0178ae37; // IdentityRegistry
if(index==2) return 0x2aa00fe1e68569703103b7a9151fbbb6643f2de074e8a0dd9400f4ea0c620546; // IdentityRegistryStorage
if(index==3) return 0xcdc89dbe18f36d29caaf4fe7820244c47774ea90f71e5762e49bf87d3656b68e; // ClaimTopicsRegistry
if(index==4) return 0x8b4403107fbc03d39713e30792c6253bbd1f8b87e02cf0b1b3da964a4471b0a1; // TrustedIssuersRegistry
revert("Index");
} }
