// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;

import {Tokvan3643TestFactoryV2} from "../contracts/Tokvan3643TestFactoryV2.sol";
import {Tokvan3643TestComplianceV2} from "../contracts/Tokvan3643TestComplianceV2.sol";
import {Tokvan3643TestClaimIssuerV2} from "../contracts/Tokvan3643TestClaimIssuerV2.sol";
import {RegulatedConfig} from "../contracts/Tokvan3643TestFactory.sol";

interface V2Vm {
    function chainId(uint256) external;
    function etch(address,bytes calldata) external;
    function readFile(string calldata) external returns(string memory);
    function parseJsonBytes(string calldata,string calldata) external pure returns(bytes memory);
    function prank(address) external;
    function expectRevert() external;
}
interface V2Token {function owner() external view returns(address);function paused() external view returns(bool);function totalSupply() external view returns(uint256);function isAgent(address) external view returns(bool);}

contract Tokvan3643FactoryV2Test {
    V2Vm constant vm=V2Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant OPERATOR=address(0x047);
    address constant COMPANY=address(0xBEEF);
    bytes32 constant PROJECT=keccak256("TEST-3643-V2");
    bytes32 constant VERSION_HASH=keccak256("approved-version");

    function components() internal returns(address[5] memory code){
        string[5] memory names=["Token","IdentityRegistry","IdentityRegistryStorage","ClaimTopicsRegistry","TrustedIssuersRegistry"];
        for(uint256 i;i<5;i++){
            code[i]=address(uint160(0x100+i));
            string memory path=string.concat("node_modules/@erc3643org/erc-3643/artifacts/contracts/",i==0?"token/":"registry/implementation/",names[i],".sol/",names[i],".json");
            vm.etch(code[i],vm.parseJsonBytes(vm.readFile(path),".deployedBytecode"));
        }
    }
    function config() internal pure returns(RegulatedConfig memory c){
        c.name="Test Regulated";c.symbol="TREG";c.decimals=0;c.admin=COMPANY;c.claimAuthority=COMPANY;
        c.supplyCap=1000;c.walletCap=1000;c.countries=new uint16[](0);c.dossierHash=VERSION_HASH;
    }
    function testCreatesPausedEmptyCompanyOwnedSuite() public {
        vm.chainId(11155111);
        Tokvan3643TestFactoryV2 f=new Tokvan3643TestFactoryV2(OPERATOR,components());
        vm.expectRevert();f.createToken(PROJECT,VERSION_HASH,config());
        vm.prank(OPERATOR);address token=f.createToken(PROJECT,VERSION_HASH,config());
        require(f.tokenByProject(PROJECT)==token,"Project link");
        require(V2Token(token).owner()==COMPANY,"Owner");
        require(V2Token(token).paused(),"Must start paused");
        require(V2Token(token).totalSupply()==0,"No initial issue");
        require(!V2Token(token).isAgent(OPERATOR),"Factory operator must not control client token");
        (,,,,address claim,address compliance)=f.suites(token);
        require(Tokvan3643TestClaimIssuerV2(claim).authority()==COMPANY,"Claim authority");
        require(Tokvan3643TestComplianceV2(compliance).owner()==COMPANY,"Compliance owner");
        require(!Tokvan3643TestComplianceV2(compliance).allowedCountry(600),"Country must start closed");
        vm.expectRevert();f.createToken(PROJECT,VERSION_HASH,config());
    }
    function testOnlyCompanyCanDelegateAndConfigureLater() public {
        vm.chainId(11155111);
        Tokvan3643TestFactoryV2 f=new Tokvan3643TestFactoryV2(OPERATOR,components());
        vm.prank(OPERATOR);address token=f.createToken(PROJECT,VERSION_HASH,config());
        (,,,,address claim,address compliance)=f.suites(token);
        vm.expectRevert();Tokvan3643TestClaimIssuerV2(claim).setOperator(OPERATOR,true);
        vm.expectRevert();Tokvan3643TestComplianceV2(compliance).setCountry(600,true);
        vm.prank(COMPANY);Tokvan3643TestClaimIssuerV2(claim).setOperator(OPERATOR,true);
        vm.prank(COMPANY);Tokvan3643TestComplianceV2(compliance).setCountry(600,true);
        require(Tokvan3643TestClaimIssuerV2(claim).operators(OPERATOR),"Delegated");
        require(Tokvan3643TestComplianceV2(compliance).allowedCountry(600),"Country opened");
    }
    function testCreationCannotPreauthorizeCountryOrFactoryOperator() public {
        vm.chainId(11155111);
        Tokvan3643TestFactoryV2 f=new Tokvan3643TestFactoryV2(OPERATOR,components());
        RegulatedConfig memory c=config();
        c.countries=new uint16[](1);c.countries[0]=600;
        vm.prank(OPERATOR);vm.expectRevert();f.createToken(PROJECT,VERSION_HASH,c);
        c=config();c.claimAuthority=OPERATOR;
        vm.prank(OPERATOR);vm.expectRevert();f.createToken(PROJECT,VERSION_HASH,c);
    }
    function testMainnetCannotDeploy() public {
        vm.chainId(1);
        address[5] memory code;
        vm.expectRevert();new Tokvan3643TestFactoryV2(OPERATOR,code);
    }
}
