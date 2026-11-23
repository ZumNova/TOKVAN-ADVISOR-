// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TokvanERC20FactoryV2} from "../contracts/TokvanERC20FactoryV2.sol";
import {TokvanERC20, TokenConfig} from "../contracts/TokvanERC20.sol";

interface VmV2 {
    function prank(address) external;
    function expectRevert(bytes4) external;
}

contract TokvanERC20FactoryV2Test {
    VmV2 constant vm = VmV2(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant OPERATOR = address(0x47);
    address constant ADMIN = address(0xA7);
    address constant TREASURY = address(0xB7);
    bytes32 constant PROJECT = keccak256("TOKVANT-TEST-V2");
    bytes32 constant VERSION = keccak256("approved-project-version");
    TokvanERC20FactoryV2 factory;
    TokenConfig config;

    function setUp() public {
        factory = new TokvanERC20FactoryV2(OPERATOR);
        config = TokenConfig("Pilot", "PILOT", 6, 1000e6, 1000e6, ADMIN, TREASURY, false, true, true);
    }

    function testOneOperatorCreatesAndBindsVersion() public {
        bytes32 digest = factory.hashConfig(PROJECT, VERSION, config);
        vm.prank(OPERATOR);
        TokvanERC20 token = TokvanERC20(factory.createToken(PROJECT, VERSION, config));
        require(factory.tokenByProject(PROJECT) == address(token));
        require(factory.tokenCount() == 1 && token.balanceOf(TREASURY) == 1000e6);
        require(digest != factory.hashConfig(PROJECT, keccak256("different-version"), config));
        require(!token.hasRole(token.DEFAULT_ADMIN_ROLE(), OPERATOR));
    }

    function testOtherWalletCannotCreate() public {
        vm.expectRevert(TokvanERC20FactoryV2.Unauthorized.selector);
        factory.createToken(PROJECT, VERSION, config);
    }

    function testDuplicateAndMissingHashesBlocked() public {
        vm.expectRevert(TokvanERC20FactoryV2.InvalidProject.selector);
        vm.prank(OPERATOR); factory.createToken(bytes32(0), VERSION, config);
        vm.expectRevert(TokvanERC20FactoryV2.InvalidProject.selector);
        vm.prank(OPERATOR); factory.createToken(PROJECT, bytes32(0), config);
        vm.prank(OPERATOR); factory.createToken(PROJECT, VERSION, config);
        vm.expectRevert(TokvanERC20FactoryV2.InvalidProject.selector);
        vm.prank(OPERATOR); factory.createToken(PROJECT, VERSION, config);
    }
}
