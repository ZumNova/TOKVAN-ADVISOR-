// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;
import {Tokvan3643TestFactory} from "../contracts/Tokvan3643TestFactory.sol";
import {Tokvan3643TestClaimIssuer,Tokvan3643TestIdentity} from "../contracts/Tokvan3643TestIdentity.sol";
import {Tokvan3643TestCompliance} from "../contracts/Tokvan3643TestCompliance.sol";
interface RegTestVm {function chainId(uint256) external;function expectRevert() external;function prank(address) external;}
contract Tokvan3643SafetyTest {
 RegTestVm constant vm=RegTestVm(address(uint160(uint256(keccak256("hevm cheat code")))));
 function testMainnetCannotDeployTestFactoryOrFakeCredentials() public {
  vm.chainId(1);address[5] memory implementations;
  vm.expectRevert();new Tokvan3643TestFactory(address(1),address(2),address(3),address(4),implementations);
  vm.expectRevert();new Tokvan3643TestClaimIssuer(address(1),address(2));
  vm.expectRevert();new Tokvan3643TestIdentity(address(1),address(2));
  uint16[] memory countries=new uint16[](1);countries[0]=600;
  vm.expectRevert();new Tokvan3643TestCompliance(address(1),address(2),address(3),100,50,countries);
 }
 function testWrongImplementationRejectedEvenOnSepolia() public {
  vm.chainId(11155111);address[5] memory implementations;
  vm.expectRevert();new Tokvan3643TestFactory(address(1),address(2),address(3),address(4),implementations);
 }
 function testComplianceBindingAndCallbacksAreTokenOnly() public {
  vm.chainId(11155111);uint16[] memory countries=new uint16[](1);countries[0]=600;
  Tokvan3643TestCompliance c=new Tokvan3643TestCompliance(address(1),address(2),address(3),100,50,countries);
  vm.expectRevert();c.bindToken(address(1));
  vm.prank(address(1));c.bindToken(address(1));require(c.isTokenBound(address(1)));
  vm.expectRevert();c.created(address(4),10);vm.expectRevert();c.addTokenAgent(address(4));
  vm.prank(address(3));c.addTokenAgent(address(4));require(c.isTokenAgent(address(4)));
  vm.prank(address(1));c.unbindToken(address(1));require(!c.isTokenBound(address(1)));
 }
 function testUnknownIdentityAndUnauthorizedRecoveryCannotCreateClaims() public {
  vm.chainId(11155111);Tokvan3643TestClaimIssuer issuer=new Tokvan3643TestClaimIssuer(address(2),address(3));
  require(!issuer.isClaimValid(address(10),1,hex"00",hex"00"));
  vm.expectRevert();issuer.authorizeRecovery(address(10),address(11),keccak256("test"));
  vm.prank(address(2));vm.expectRevert();issuer.authorizeRecovery(address(10),address(11),keccak256("test"));
  Tokvan3643TestIdentity identity=new Tokvan3643TestIdentity(address(1),address(issuer));
  require(identity.keyHasPurpose(keccak256(abi.encode(address(1))),1));
  require(!identity.keyHasPurpose(keccak256(abi.encode(address(1))),2));
  vm.expectRevert();identity.authorizeRecovery(address(4));
 }
}
