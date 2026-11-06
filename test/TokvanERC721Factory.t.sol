// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {TokvanERC721Factory} from "../contracts/TokvanERC721Factory.sol";
import {TokvanERC721,NFTConfig} from "../contracts/TokvanERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
interface NFTTestVm {
    function prank(address) external;
    function expectRevert() external;
    function expectRevert(bytes4) external;
    function chainId(uint256) external;
}
contract NFTReceiverProbe is IERC721Receiver {
    bool public sawMetadata;
    bool public reentered;
    function onERC721Received(address,address,uint256 tokenId,bytes calldata) external returns(bytes4) {
        sawMetadata=bytes(TokvanERC721(msg.sender).tokenURI(tokenId)).length>0;
        (reentered,)=msg.sender.call(abi.encodeCall(TokvanERC721.mint,(address(this),"ipfs://again")));
        return IERC721Receiver.onERC721Received.selector;
    }
}
contract TokvanERC721FactoryTest {
    NFTTestVm constant vm=NFTTestVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant TECH=address(1);address constant COMPLIANCE=address(2);address constant BOARD=address(3);
    address constant OPERATOR=address(4);address constant ADMIN=address(5);address constant HOLDER=address(6);address constant OTHER=address(7);
    bytes32 constant PROJECT=keccak256("NFT-001");
    TokvanERC721Factory factory;NFTConfig config;
    function setUp() public {
        factory=new TokvanERC721Factory(TECH,COMPLIANCE,BOARD,OPERATOR);
        config=NFTConfig("TOKVAN NFT","TKNFT",ADMIN,2,true,true);
    }
    function approve() internal {
        bytes32 hash=factory.hashConfig(PROJECT,config);
        vm.prank(TECH);factory.setApproval(hash,true);
        vm.prank(COMPLIANCE);factory.setApproval(hash,true);
        vm.prank(BOARD);factory.setApproval(hash,true);
    }
    function create() internal returns(TokvanERC721 token) {
        approve();vm.prank(OPERATOR);token=TokvanERC721(factory.createCollection(PROJECT,config));
    }
    function mintOne(TokvanERC721 token) internal returns(uint256) {
        vm.prank(ADMIN);return token.mint(HOLDER,"ipfs://metadata/1.json");
    }
    function testFactoryRequiresDistinctParticipants() public {
        vm.expectRevert(TokvanERC721Factory.InvalidParticipants.selector);new TokvanERC721Factory(TECH,TECH,BOARD,OPERATOR);
        vm.expectRevert(TokvanERC721Factory.InvalidParticipants.selector);new TokvanERC721Factory(TECH,COMPLIANCE,BOARD,TECH);
        vm.expectRevert(TokvanERC721Factory.InvalidParticipants.selector);new TokvanERC721Factory(address(0),COMPLIANCE,BOARD,OPERATOR);
    }
    function testThreeApprovalsAndOperatorRequired() public {
        bytes32 hash=factory.hashConfig(PROJECT,config);
        vm.prank(TECH);factory.setApproval(hash,true);vm.prank(TECH);factory.setApproval(hash,true);
        vm.prank(COMPLIANCE);factory.setApproval(hash,true);
        vm.expectRevert(TokvanERC721Factory.MissingApprovals.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
        vm.expectRevert(TokvanERC721Factory.Unauthorized.selector);factory.setApproval(hash,true);
        approve();vm.expectRevert(TokvanERC721Factory.Unauthorized.selector);vm.prank(TECH);factory.createCollection(PROJECT,config);
    }
    function testRevocationAndChangedConfigInvalidateApproval() public {
        approve();bytes32 hash=factory.hashConfig(PROJECT,config);
        vm.prank(BOARD);factory.setApproval(hash,false);
        vm.expectRevert(TokvanERC721Factory.MissingApprovals.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
        approve();config.maxSupply=3;
        vm.expectRevert(TokvanERC721Factory.MissingApprovals.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
    }
    function testCreationRolesAndReplay() public {
        TokvanERC721 token=create();require(factory.collectionByProject(PROJECT)==address(token));require(factory.collectionCount()==1);
        require(token.hasRole(token.DEFAULT_ADMIN_ROLE(),ADMIN));require(token.hasRole(token.MINTER_ROLE(),ADMIN));
        require(!token.hasRole(token.MINTER_ROLE(),address(factory)));require(!token.hasRole(token.DEFAULT_ADMIN_ROLE(),OPERATOR));
        require(factory.approvals(factory.hashConfig(PROJECT,config))==0);
        approve();vm.expectRevert(TokvanERC721Factory.InvalidProject.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
    }
    function testApprovalDomainIsolation() public {
        bytes32 original=factory.hashConfig(PROJECT,config);
        TokvanERC721Factory other=new TokvanERC721Factory(TECH,COMPLIANCE,BOARD,OPERATOR);
        require(original!=other.hashConfig(PROJECT,config));require(original!=factory.hashConfig(bytes32(uint256(1)),config));
        vm.chainId(block.chainid+1);require(original!=factory.hashConfig(PROJECT,config));
    }
    function testInvalidConfigRollsBackApprovalConsumption() public {
        config.admin=address(0);approve();vm.expectRevert(TokvanERC721.InvalidConfig.selector);vm.prank(OPERATOR);factory.createCollection(PROJECT,config);
        require(factory.approvals(factory.hashConfig(PROJECT,config))==7);
        config.admin=ADMIN;config.maxSupply=0;vm.expectRevert(TokvanERC721.InvalidConfig.selector);new TokvanERC721(config);
    }
    function testMintOwnerMetadataAndInterfaces() public {
        TokvanERC721 token=create();uint256 tokenId=mintOne(token);
        require(tokenId==1&&token.ownerOf(1)==HOLDER&&token.balanceOf(HOLDER)==1);
        require(keccak256(bytes(token.tokenURI(1)))==keccak256(bytes("ipfs://metadata/1.json")));
        require(token.supportsInterface(0x80ac58cd)&&token.supportsInterface(0x5b5e139f)&&token.supportsInterface(0x7965db0b));
        require(token.mintedCount()==1&&token.totalSupply()==1);
    }
    function testUnauthorizedMintAndInvalidURI() public {
        TokvanERC721 token=create();vm.expectRevert();vm.prank(OTHER);token.mint(HOLDER,"ipfs://metadata");
        vm.expectRevert(TokvanERC721.InvalidURI.selector);vm.prank(ADMIN);token.mint(HOLDER,"");
        vm.expectRevert();vm.prank(ADMIN);token.mint(address(0),"ipfs://metadata");
        require(token.mintedCount()==0);
    }
    function testSafeReceiverAndReentrancyGuard() public {
        TokvanERC721 token=create();NFTReceiverProbe receiver=new NFTReceiverProbe();bytes32 role=token.MINTER_ROLE();
        vm.prank(ADMIN);token.grantRole(role,address(receiver));
        vm.prank(ADMIN);token.mint(address(receiver),"ipfs://metadata");
        require(receiver.sawMetadata()&&!receiver.reentered());require(token.mintedCount()==1);
        vm.expectRevert();vm.prank(ADMIN);token.mint(address(this),"ipfs://metadata");
        require(token.mintedCount()==1&&token.totalSupply()==1);
    }
    function testTransfersAndBurnPermissions() public {
        TokvanERC721 token=create();mintOne(token);
        vm.expectRevert();vm.prank(OTHER);token.burn(1);
        vm.prank(HOLDER);token.approve(OTHER,1);vm.prank(OTHER);token.transferFrom(HOLDER,OTHER,1);
        require(token.ownerOf(1)==OTHER);
        vm.prank(OTHER);token.burn(1);require(token.totalSupply()==0&&token.mintedCount()==1);
        vm.expectRevert();token.ownerOf(1);vm.expectRevert();token.tokenURI(1);
    }
    function testPauseBlocksMintTransferBurn() public {
        TokvanERC721 token=create();mintOne(token);
        vm.expectRevert();vm.prank(OTHER);token.pause();vm.prank(ADMIN);token.pause();
        vm.expectRevert();vm.prank(ADMIN);token.mint(HOLDER,"ipfs://2");
        vm.expectRevert();vm.prank(HOLDER);token.transferFrom(HOLDER,OTHER,1);
        vm.expectRevert();vm.prank(HOLDER);token.burn(1);
        vm.prank(ADMIN);token.unpause();vm.prank(HOLDER);token.transferFrom(HOLDER,OTHER,1);require(token.ownerOf(1)==OTHER);
    }
    function testBurnDoesNotRestoreLifetimeCap() public {
        config.maxSupply=1;TokvanERC721 token=create();mintOne(token);vm.prank(HOLDER);token.burn(1);
        vm.expectRevert(TokvanERC721.CapReached.selector);vm.prank(ADMIN);token.mint(HOLDER,"ipfs://2");
    }
    function testDisabledFlagsStayDisabled() public {
        config.burnable=false;config.pausable=false;TokvanERC721 token=create();mintOne(token);
        bytes32 pauser=token.PAUSER_ROLE();vm.prank(ADMIN);token.grantRole(pauser,ADMIN);
        vm.expectRevert(TokvanERC721.FeatureDisabled.selector);vm.prank(ADMIN);token.pause();
        vm.expectRevert(TokvanERC721.FeatureDisabled.selector);vm.prank(HOLDER);token.burn(1);
    }
    function testFuzzCapIsNeverExceeded(uint8 count) public {
        config.maxSupply=uint256(count)%12+1;TokvanERC721 token=create();
        for(uint256 i=0;i<config.maxSupply;i++)mintOne(token);
        require(token.mintedCount()==config.maxSupply);
        vm.expectRevert(TokvanERC721.CapReached.selector);mintOne(token);
    }
}
