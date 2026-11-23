// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TokvanERC1155FactoryV2} from "../contracts/TokvanERC1155FactoryV2.sol";
import {TokvanERC1155V2} from "../contracts/TokvanERC1155V2.sol";
import {MultiConfig} from "../contracts/TokvanERC1155.sol";

interface Vm1155V2 {
    function prank(address) external;
    function expectRevert(bytes4) external;
    function expectRevert() external;
}

contract TokvanERC1155FactoryV2Test {
    Vm1155V2 constant vm = Vm1155V2(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant OPERATOR = address(0x47);
    address constant ADMIN = address(0xA7);
    address constant HOLDER = address(0xB8);
    bytes32 constant PROJECT = keccak256("ERC1155-V2-001");
    bytes32 constant DOSSIER = keccak256("APPROVED-DOSSIER");

    TokvanERC1155FactoryV2 factory;
    MultiConfig config;

    function setUp() public {
        factory = new TokvanERC1155FactoryV2(OPERATOR);
        config = MultiConfig("Products", "PRD", ADMIN, 3, true, true);
    }

    function testOperatorCreatesAndIssuesTypes() public {
        bytes32 digest = factory.hashConfig(PROJECT, DOSSIER, config);
        vm.prank(OPERATOR);
        TokvanERC1155V2 collection = TokvanERC1155V2(factory.createCollection(PROJECT, DOSSIER, config));
        require(factory.collectionByProject(PROJECT) == address(collection));
        require(digest != factory.hashConfig(PROJECT, keccak256("OTHER"), config));
        require(collection.hasRole(collection.DEFAULT_ADMIN_ROLE(), ADMIN));
        require(!collection.hasRole(collection.DEFAULT_ADMIN_ROLE(), OPERATOR));
        require(collection.hasRole(collection.MINTER_ROLE(), OPERATOR));
        vm.prank(OPERATOR);
        collection.createType(HOLDER, 10, 50, "ipfs://type1.json");
        require(collection.balanceOf(HOLDER, 1) == 10);
        vm.prank(OPERATOR);
        collection.mint(HOLDER, 1, 2);
        require(collection.mintedCount(1) == 12);
        bytes32 minterRole = collection.MINTER_ROLE();
        vm.prank(ADMIN);
        collection.revokeRole(minterRole, OPERATOR);
        vm.expectRevert();
        vm.prank(OPERATOR);
        collection.createType(HOLDER, 1, 1, "ipfs://type2.json");
    }

    function testUnauthorizedAndDuplicateCreation() public {
        vm.expectRevert(TokvanERC1155FactoryV2.Unauthorized.selector);
        factory.createCollection(PROJECT, DOSSIER, config);
        vm.prank(OPERATOR);
        factory.createCollection(PROJECT, DOSSIER, config);
        vm.expectRevert(TokvanERC1155FactoryV2.InvalidProject.selector);
        vm.prank(OPERATOR);
        factory.createCollection(PROJECT, DOSSIER, config);
    }
}
