// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TokvanERC721FactoryV2} from "../contracts/TokvanERC721FactoryV2.sol";
import {TokvanERC721V2} from "../contracts/TokvanERC721V2.sol";
import {NFTConfig} from "../contracts/TokvanERC721.sol";

interface Vm721V2 {
    function prank(address) external;
    function expectRevert(bytes4) external;
    function expectRevert() external;
}

contract TokvanERC721FactoryV2Test {
    Vm721V2 constant vm = Vm721V2(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant OPERATOR = address(0x47);
    address constant ADMIN = address(0xA7);
    address constant HOLDER = address(0xB8);
    bytes32 constant PROJECT = keccak256("ERC721-V2-001");
    bytes32 constant DOSSIER = keccak256("APPROVED-DOSSIER");

    TokvanERC721FactoryV2 factory;
    NFTConfig config;

    function setUp() public {
        factory = new TokvanERC721FactoryV2(OPERATOR);
        config = NFTConfig("Artwork", "ART", ADMIN, 1, true, true);
    }

    function testOperatorCreatesAndMintsToClient() public {
        bytes32 digest = factory.hashConfig(PROJECT, DOSSIER, config);
        vm.prank(OPERATOR);
        TokvanERC721V2 collection = TokvanERC721V2(factory.createCollection(PROJECT, DOSSIER, config));
        require(factory.collectionByProject(PROJECT) == address(collection));
        require(factory.collectionCount() == 1);
        require(digest != factory.hashConfig(PROJECT, keccak256("OTHER"), config));
        require(collection.hasRole(collection.DEFAULT_ADMIN_ROLE(), ADMIN));
        require(!collection.hasRole(collection.DEFAULT_ADMIN_ROLE(), OPERATOR));
        require(collection.hasRole(collection.MINTER_ROLE(), OPERATOR));
        vm.prank(OPERATOR);
        collection.mint(HOLDER, "ipfs://artwork.json");
        require(collection.ownerOf(1) == HOLDER);
        bytes32 minterRole = collection.MINTER_ROLE();
        vm.prank(ADMIN);
        collection.revokeRole(minterRole, OPERATOR);
        require(!collection.hasRole(minterRole, OPERATOR));
        vm.expectRevert();
        vm.prank(OPERATOR);
        collection.mint(HOLDER, "ipfs://another.json");
    }

    function testUnauthorizedAndDuplicateCreation() public {
        vm.expectRevert(TokvanERC721FactoryV2.Unauthorized.selector);
        factory.createCollection(PROJECT, DOSSIER, config);
        vm.prank(OPERATOR);
        factory.createCollection(PROJECT, DOSSIER, config);
        vm.expectRevert(TokvanERC721FactoryV2.InvalidProject.selector);
        vm.prank(OPERATOR);
        factory.createCollection(PROJECT, DOSSIER, config);
    }
}
