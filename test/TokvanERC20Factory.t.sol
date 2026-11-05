// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {TokvanERC20Factory} from "../contracts/TokvanERC20Factory.sol";
import {TokvanERC20, TokenConfig} from "../contracts/TokvanERC20.sol";

interface Vm {
    function prank(address) external;
    function expectRevert() external;
    function expectRevert(bytes4) external;
    function chainId(uint256) external;
}
contract TokvanERC20FactoryTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant TECH = address(1);
    address constant COMPLIANCE = address(2);
    address constant BOARD = address(3);
    address constant OPERATOR = address(4);
    address constant ADMIN = address(5);
    address constant TREASURY = address(6);
    address constant USER = address(7);
    bytes32 constant PROJECT = keccak256("TOKVAN-001");
    TokvanERC20Factory factory;
    TokenConfig config;

    function setUp() public {
        factory = new TokvanERC20Factory(TECH, COMPLIANCE, BOARD, OPERATOR);
        config = TokenConfig("TOKVAN Token", "TKVN", 6, 1000e6, 2000e6, ADMIN, TREASURY, true, true, true);
    }
    function approveAll() internal {
        bytes32 digest = factory.hashConfig(PROJECT, config);
        vm.prank(TECH); factory.setApproval(digest, true);
        vm.prank(COMPLIANCE); factory.setApproval(digest, true);
        vm.prank(BOARD); factory.setApproval(digest, true);
    }
    function deployToken() internal returns (TokvanERC20) {
        approveAll();
        vm.prank(OPERATOR);
        return TokvanERC20(factory.createToken(PROJECT, config));
    }
    function testCreateTokenAndRoles() public {
        TokvanERC20 token = deployToken();
        require(token.decimals() == 6 && token.totalSupply() == 1000e6);
        require(token.balanceOf(TREASURY) == 1000e6 && token.cap() == 2000e6);
        require(token.hasRole(token.DEFAULT_ADMIN_ROLE(), ADMIN));
        require(!token.hasRole(token.DEFAULT_ADMIN_ROLE(), address(factory)));
        require(!token.hasRole(token.MINTER_ROLE(), OPERATOR));
        require(factory.tokenByProject(PROJECT) == address(token) && factory.tokenCount() == 1);
        require(factory.approvals(factory.hashConfig(PROJECT, config)) == 0);
    }
    function testRequiresThreeDistinctApprovals() public {
        bytes32 digest = factory.hashConfig(PROJECT, config);
        vm.prank(TECH); factory.setApproval(digest, true);
        vm.prank(TECH); factory.setApproval(digest, true);
        vm.prank(COMPLIANCE); factory.setApproval(digest, true);
        vm.expectRevert(TokvanERC20Factory.MissingApprovals.selector);
        vm.prank(OPERATOR); factory.createToken(PROJECT, config);
    }
    function testCannotApproveAsOutsider() public {
        vm.expectRevert(TokvanERC20Factory.Unauthorized.selector);
        factory.setApproval(bytes32(uint256(1)), true);
    }
    function testCannotCreateAsReviewer() public {
        approveAll();
        vm.expectRevert(TokvanERC20Factory.Unauthorized.selector);
        vm.prank(TECH); factory.createToken(PROJECT, config);
    }
    function testRevocationBlocksDeployment() public {
        approveAll();
        bytes32 digest = factory.hashConfig(PROJECT, config);
        vm.prank(BOARD); factory.setApproval(digest, false);
        vm.expectRevert(TokvanERC20Factory.MissingApprovals.selector);
        vm.prank(OPERATOR); factory.createToken(PROJECT, config);
    }
    function testChangedParametersRequireNewApprovals() public {
        approveAll(); config.treasury = USER;
        vm.expectRevert(TokvanERC20Factory.MissingApprovals.selector);
        vm.prank(OPERATOR); factory.createToken(PROJECT, config);
    }
    function testDuplicateProjectBlockedEvenWithNewApprovals() public {
        deployToken(); approveAll();
        vm.expectRevert(TokvanERC20Factory.InvalidProject.selector);
        vm.prank(OPERATOR); factory.createToken(PROJECT, config);
    }
    function testDomainSeparation() public {
        bytes32 original = factory.hashConfig(PROJECT, config);
        TokvanERC20Factory other = new TokvanERC20Factory(TECH, COMPLIANCE, BOARD, OPERATOR);
        require(original != other.hashConfig(PROJECT, config));
        require(original != factory.hashConfig(keccak256("other"), config));
        vm.chainId(block.chainid + 1);
        require(original != factory.hashConfig(PROJECT, config));
    }
    function testIndependentParticipantsRequired() public {
        vm.expectRevert(TokvanERC20Factory.InvalidParticipants.selector);
        new TokvanERC20Factory(TECH, TECH, BOARD, OPERATOR);
        vm.expectRevert(TokvanERC20Factory.InvalidParticipants.selector);
        new TokvanERC20Factory(TECH, COMPLIANCE, BOARD, TECH);
        vm.expectRevert(TokvanERC20Factory.InvalidParticipants.selector);
        new TokvanERC20Factory(TECH, COMPLIANCE, BOARD, address(0));
    }
    function testMintPermissionAndCap() public {
        TokvanERC20 token = deployToken();
        vm.expectRevert(); vm.prank(USER); token.mint(USER, 1);
        vm.prank(ADMIN); token.mint(USER, 1000e6);
        vm.expectRevert(); vm.prank(ADMIN); token.mint(USER, 1);
        require(token.totalSupply() == token.cap());
    }
    function testPauseBlocksTransferMintBurn() public {
        TokvanERC20 token = deployToken();
        vm.expectRevert(); vm.prank(USER); token.pause();
        vm.prank(ADMIN); token.pause();
        vm.expectRevert(); vm.prank(TREASURY); token.transfer(USER, 1);
        vm.expectRevert(); vm.prank(ADMIN); token.mint(USER, 1);
        vm.expectRevert(); vm.prank(TREASURY); token.burn(1);
        vm.prank(ADMIN); token.unpause();
        vm.prank(TREASURY); token.transfer(USER, 1);
        require(token.balanceOf(USER) == 1);
    }
    function testTransferFromAndBurnAllowance() public {
        TokvanERC20 token = deployToken();
        vm.expectRevert(); vm.prank(USER); token.burnFrom(TREASURY, 10);
        vm.prank(TREASURY); token.approve(USER, 100);
        vm.prank(USER); token.transferFrom(TREASURY, USER, 40);
        vm.prank(USER); token.burnFrom(TREASURY, 60);
        require(token.allowance(TREASURY, USER) == 0);
        require(token.balanceOf(USER) == 40 && token.totalSupply() == 1000e6 - 60);
    }
    function testDisabledFeaturesCannotBeEnabledByGrantingRoles() public {
        config.mintable = false; config.burnable = false; config.pausable = false;
        config.maxSupply = config.initialSupply;
        TokvanERC20 token = deployToken();
        bytes32 minter = token.MINTER_ROLE(); bytes32 pauser = token.PAUSER_ROLE();
        vm.prank(ADMIN); token.grantRole(minter, ADMIN);
        vm.prank(ADMIN); token.grantRole(pauser, ADMIN);
        vm.expectRevert(TokvanERC20.FeatureDisabled.selector); vm.prank(ADMIN); token.mint(USER, 1);
        vm.expectRevert(TokvanERC20.FeatureDisabled.selector); vm.prank(ADMIN); token.pause();
        vm.expectRevert(TokvanERC20.FeatureDisabled.selector); vm.prank(TREASURY); token.burn(1);
    }
    function testInvalidConfigAndAtomicRollback() public {
        config.admin = address(0); approveAll();
        vm.expectRevert(TokvanERC20.InvalidConfig.selector);
        vm.prank(OPERATOR); factory.createToken(PROJECT, config);
        require(factory.approvals(factory.hashConfig(PROJECT, config)) == 7);
        require(factory.tokenByProject(PROJECT) == address(0));
    }
    function testInvalidDecimalsAndSupply() public {
        config.decimals = 19;
        vm.expectRevert(TokvanERC20.InvalidConfig.selector); new TokvanERC20(config);
        config.decimals = 18; config.initialSupply = config.maxSupply + 1;
        vm.expectRevert(TokvanERC20.InvalidConfig.selector); new TokvanERC20(config);
        config.initialSupply = 1; config.mintable = false;
        vm.expectRevert(TokvanERC20.InvalidConfig.selector); new TokvanERC20(config);
    }
    function testFuzzSupplyAlwaysCapped(uint96 initial, uint96 additional) public {
        config.initialSupply = initial;
        config.maxSupply = uint256(initial) + uint256(additional) + 1;
        TokvanERC20 token = deployToken();
        vm.prank(ADMIN); token.mint(USER, uint256(additional) + 1);
        require(token.totalSupply() == config.maxSupply);
        vm.expectRevert(); vm.prank(ADMIN); token.mint(USER, 1);
    }
}
