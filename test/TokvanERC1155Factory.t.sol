// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {TokvanERC1155Factory} from "../contracts/TokvanERC1155Factory.sol";
import {TokvanERC1155,MultiConfig} from "../contracts/TokvanERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
interface MultiTestVm {function prank(address) external;function expectRevert() external;function expectRevert(bytes4) external;function chainId(uint256) external;}
contract MultiReceiverProbe is ERC1155Holder {
 bool public sawMetadata;bool public reentered;
 function onERC1155Received(address,address,uint256 tokenId,uint256,bytes memory) public override returns(bytes4) {
  sawMetadata=bytes(TokvanERC1155(msg.sender).uri(tokenId)).length>0;
  (reentered,)=msg.sender.call(abi.encodeCall(TokvanERC1155.mint,(address(this),tokenId,1)));
  return this.onERC1155Received.selector;
 }
}
contract TokvanERC1155FactoryTest {
    MultiTestVm constant vm=MultiTestVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant TECH=address(1);address constant COMPLIANCE=address(2);address constant BOARD=address(3);
    address constant OPERATOR=address(4);address constant ADMIN=address(5);address constant HOLDER=address(6);address constant OTHER=address(7);
    bytes32 constant PROJECT=keccak256("NFT-001");
    TokvanERC1155Factory factory;MultiConfig config;
    function setUp() public {
        factory=new TokvanERC1155Factory(TECH,COMPLIANCE,BOARD,OPERATOR);
        config=MultiConfig("TOKVAN NFT","TKNFT",ADMIN,2,true,true);
    }
    function approve() internal {
        bytes32 hash=factory.hashConfig(PROJECT,config);
        vm.prank(TECH);factory.setApproval(hash,true);
        vm.prank(COMPLIANCE);factory.setApproval(hash,true);
        vm.prank(BOARD);factory.setApproval(hash,true);
    }
    function create() internal returns(TokvanERC1155 token) {
        approve();vm.prank(OPERATOR);token=TokvanERC1155(factory.createCollection(PROJECT,config));
    }
    function testFactoryRequiresDistinctParticipants() public {
        vm.expectRevert(TokvanERC1155Factory.InvalidParticipants.selector);new TokvanERC1155Factory(TECH,TECH,BOARD,OPERATOR);
        vm.expectRevert(TokvanERC1155Factory.InvalidParticipants.selector);new TokvanERC1155Factory(TECH,COMPLIANCE,BOARD,TECH);
        vm.expectRevert(TokvanERC1155Factory.InvalidParticipants.selector);new TokvanERC1155Factory(address(0),COMPLIANCE,BOARD,OPERATOR);
    }
    function testThreeApprovalsAndOperatorRequired() public {
        bytes32 hash=factory.hashConfig(PROJECT,config);
        vm.prank(TECH);factory.setApproval(hash,true);vm.prank(TECH);factory.setApproval(hash,true);
        vm.prank(COMPLIANCE);factory.setApproval(hash,true);
        vm.expectRevert(TokvanERC1155Factory.MissingApprovals.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
        vm.expectRevert(TokvanERC1155Factory.Unauthorized.selector);factory.setApproval(hash,true);
        approve();vm.expectRevert(TokvanERC1155Factory.Unauthorized.selector);vm.prank(TECH);factory.createCollection(PROJECT,config);
    }
    function testRevocationAndChangedConfigInvalidateApproval() public {
        approve();bytes32 hash=factory.hashConfig(PROJECT,config);
        vm.prank(BOARD);factory.setApproval(hash,false);
        vm.expectRevert(TokvanERC1155Factory.MissingApprovals.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
        approve();config.maxTypes=3;
        vm.expectRevert(TokvanERC1155Factory.MissingApprovals.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
    }
    function testCreationRolesAndReplay() public {
        TokvanERC1155 token=create();require(factory.collectionByProject(PROJECT)==address(token));require(factory.collectionCount()==1);
        require(token.hasRole(token.DEFAULT_ADMIN_ROLE(),ADMIN));require(token.hasRole(token.MINTER_ROLE(),ADMIN));
        require(!token.hasRole(token.MINTER_ROLE(),address(factory)));require(!token.hasRole(token.DEFAULT_ADMIN_ROLE(),OPERATOR));
        require(factory.approvals(factory.hashConfig(PROJECT,config))==0);
        approve();vm.expectRevert(TokvanERC1155Factory.InvalidProject.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
    }
    function testApprovalDomainIsolation() public {
        bytes32 original=factory.hashConfig(PROJECT,config);
        TokvanERC1155Factory other=new TokvanERC1155Factory(TECH,COMPLIANCE,BOARD,OPERATOR);
        require(original!=other.hashConfig(PROJECT,config));require(original!=factory.hashConfig(bytes32(uint256(1)),config));
        vm.chainId(block.chainid+1);require(original!=factory.hashConfig(PROJECT,config));
    }
    function testInvalidConfigRollsBackApprovalConsumption() public {
        config.admin=address(0);approve();vm.expectRevert(TokvanERC1155.InvalidConfig.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
        require(factory.approvals(factory.hashConfig(PROJECT,config))==7);
        config.admin=ADMIN;config.maxTypes=0;vm.expectRevert(TokvanERC1155.InvalidConfig.selector);new TokvanERC1155(config);
    }

    function testTypesMetadataAndBalances() public {
        TokvanERC1155 t=create();vm.prank(ADMIN);uint256 first=t.createType(HOLDER,10,20,"ipfs://first");
        vm.prank(ADMIN);uint256 second=t.createType(HOLDER,1,1,"ipfs://unique");
        require(first==1&&second==2&&t.typeCount()==2&&t.balanceOf(HOLDER,1)==10&&t.totalSupply()==11);
        require(t.totalSupply(1)==10&&t.maxSupply(1)==20&&t.mintedCount(1)==10);
        require(keccak256(bytes(t.uri(1)))==keccak256(bytes("ipfs://first")));
        require(t.supportsInterface(0xd9b67a26)&&t.supportsInterface(0x0e89341c)&&t.supportsInterface(0x7965db0b));
        vm.expectRevert(TokvanERC1155.CapReached.selector);vm.prank(ADMIN);t.createType(HOLDER,1,1,"ipfs://third");
    }
    function testMintBurnAndLifetimeCap() public {
        TokvanERC1155 t=create();vm.prank(ADMIN);t.createType(HOLDER,5,10,"ipfs://one");
        vm.prank(HOLDER);t.burn(HOLDER,1,2);require(t.balanceOf(HOLDER,1)==3&&t.totalSupply(1)==3&&t.mintedCount(1)==5);
        vm.prank(ADMIN);t.mint(HOLDER,1,5);require(t.mintedCount(1)==10&&t.totalSupply(1)==8);
        vm.expectRevert(TokvanERC1155.CapReached.selector);vm.prank(ADMIN);t.mint(HOLDER,1,1);
        vm.prank(HOLDER);t.burn(HOLDER,1,8);require(t.typeCount()==1&&t.maxSupply(1)==10);
        vm.expectRevert(TokvanERC1155.CapReached.selector);vm.prank(ADMIN);t.mint(HOLDER,1,1);
        vm.prank(ADMIN);require(t.createType(HOLDER,1,1,"ipfs://two")==2);
    }
    function testUnauthorizedAndInvalidInputs() public {
        TokvanERC1155 t=create();vm.expectRevert();vm.prank(OTHER);t.createType(HOLDER,1,10,"ipfs://one");
        vm.expectRevert(TokvanERC1155.InvalidAmount.selector);vm.prank(ADMIN);t.createType(HOLDER,0,10,"ipfs://one");
        vm.expectRevert(TokvanERC1155.InvalidAmount.selector);vm.prank(ADMIN);t.createType(HOLDER,11,10,"ipfs://one");
        vm.expectRevert(TokvanERC1155.InvalidURI.selector);vm.prank(ADMIN);t.createType(HOLDER,1,10,"");
        vm.expectRevert();vm.prank(ADMIN);t.createType(address(0),1,10,"ipfs://one");
        vm.expectRevert(TokvanERC1155.InvalidType.selector);vm.prank(ADMIN);t.mint(HOLDER,1,1);
        vm.prank(ADMIN);t.createType(HOLDER,5,10,"ipfs://one");
        vm.expectRevert();vm.prank(OTHER);t.mint(HOLDER,1,1);
        vm.expectRevert(TokvanERC1155.Unauthorized.selector);vm.prank(ADMIN);t.burn(HOLDER,1,1);
        vm.expectRevert();vm.prank(HOLDER);t.burn(HOLDER,1,6);
        vm.expectRevert(TokvanERC1155.InvalidAmount.selector);vm.prank(ADMIN);t.mint(HOLDER,1,0);
        vm.expectRevert(TokvanERC1155.InvalidAmount.selector);vm.prank(HOLDER);t.burn(HOLDER,1,0);
    }
    function testTransfersBatchAndApprovedBurn() public {
        TokvanERC1155 t=create();vm.prank(ADMIN);t.createType(HOLDER,10,10,"ipfs://one");vm.prank(ADMIN);t.createType(HOLDER,5,5,"ipfs://two");
        vm.prank(HOLDER);t.safeTransferFrom(HOLDER,OTHER,1,2,"");
        uint256[] memory ids=new uint256[](2);ids[0]=1;ids[1]=2;uint256[] memory amounts=new uint256[](2);amounts[0]=3;amounts[1]=1;
        vm.prank(HOLDER);t.safeBatchTransferFrom(HOLDER,OTHER,ids,amounts,"");require(t.balanceOf(OTHER,1)==5&&t.balanceOf(OTHER,2)==1&&t.totalSupply()==15);
        vm.prank(HOLDER);t.setApprovalForAll(ADMIN,true);vm.prank(ADMIN);t.burn(HOLDER,2,2);require(t.totalSupply(2)==3);
    }
    function testPauseBlocksAllTokenUpdates() public {
        TokvanERC1155 t=create();vm.prank(ADMIN);t.createType(HOLDER,5,10,"ipfs://one");vm.prank(ADMIN);t.pause();
        vm.expectRevert();vm.prank(ADMIN);t.createType(HOLDER,1,1,"ipfs://two");
        vm.expectRevert();vm.prank(ADMIN);t.mint(HOLDER,1,1);
        vm.expectRevert();vm.prank(HOLDER);t.burn(HOLDER,1,1);
        vm.expectRevert();vm.prank(HOLDER);t.safeTransferFrom(HOLDER,OTHER,1,1,"");
        uint256[] memory ids=new uint256[](1);ids[0]=1;uint256[] memory amounts=new uint256[](1);amounts[0]=1;
        vm.expectRevert();vm.prank(HOLDER);t.safeBatchTransferFrom(HOLDER,OTHER,ids,amounts,"");
        vm.expectRevert();vm.prank(OTHER);t.unpause();vm.prank(ADMIN);t.unpause();vm.prank(ADMIN);t.mint(HOLDER,1,1);
    }
    function testOptionalFeaturesStayDisabled() public {
        config.burnable=false;config.pausable=false;TokvanERC1155 t=create();vm.prank(ADMIN);t.createType(HOLDER,1,1,"ipfs://one");
        vm.expectRevert(TokvanERC1155.FeatureDisabled.selector);vm.prank(HOLDER);t.burn(HOLDER,1,1);
        bytes32 pauseRole=t.PAUSER_ROLE();vm.prank(ADMIN);t.grantRole(pauseRole,ADMIN);vm.expectRevert(TokvanERC1155.FeatureDisabled.selector);vm.prank(ADMIN);t.pause();
    }
    function testReceiverMetadataReentryAndAtomicRejection() public {
        TokvanERC1155 t=create();MultiReceiverProbe receiver=new MultiReceiverProbe();
        bytes32 mintRole=t.MINTER_ROLE();vm.prank(ADMIN);t.grantRole(mintRole,address(receiver));vm.prank(ADMIN);t.createType(address(receiver),2,10,"ipfs://one");
        require(receiver.sawMetadata()&&!receiver.reentered()&&t.mintedCount(1)==2);
        vm.expectRevert();vm.prank(ADMIN);t.createType(address(this),1,1,"ipfs://two");require(t.typeCount()==1);
    }
    function testFuzzLifetimeCap(uint96 amountSeed,uint96 burnSeed) public {
        TokvanERC1155 t=create();uint256 amount=uint256(amountSeed)+1;uint256 burned=uint256(burnSeed)%amount+1;
        vm.prank(ADMIN);t.createType(HOLDER,amount,amount,"ipfs://one");vm.prank(HOLDER);t.burn(HOLDER,1,burned);
        require(t.mintedCount(1)==amount&&t.totalSupply(1)==amount-burned);
        vm.expectRevert(TokvanERC1155.CapReached.selector);vm.prank(ADMIN);t.mint(HOLDER,1,1);
    }
}
