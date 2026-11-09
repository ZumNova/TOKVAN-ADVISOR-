// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Tokvan3643TestClaimIssuer} from "./Tokvan3643TestIdentity.sol";
import {Tokvan3643TestCompliance} from "./Tokvan3643TestCompliance.sol";
import {Tokvan3643SuiteHashes} from "./Tokvan3643SuiteHashes.sol";
interface ISuiteOwner {function init() external; function transferOwnership(address) external; function addAgent(address) external;}
interface ISuiteStorage {function bindIdentityRegistry(address) external;}
interface ISuiteTopics {function addClaimTopic(uint256) external;}
interface ISuiteIssuers {function addTrustedIssuer(address,uint256[] calldata) external;}
interface ISuiteRegistry {function init(address,address,address) external;}
interface ISuiteToken {function init(address,address,string memory,string memory,uint8,address) external;}
struct RegulatedConfig {string name;string symbol;uint8 decimals;address admin;address claimAuthority;uint256 supplyCap;uint256 walletCap;uint16[] countries;bytes32 dossierHash;}
/// @notice Sepolia-only educational factory using official ERC-3643 4.1.3 implementations, with simulated attestations.
contract Tokvan3643TestFactory {
    bytes32 public constant VERSION=keccak256("TOKVAN_3643_SEPOLIA_EDUCATIONAL_V1");
    address public immutable technicalReviewer; address public immutable complianceReviewer; address public immutable boardReviewer; address public immutable operator;
    address[5] public implementations;
    mapping(bytes32=>uint8) public approvals;
    mapping(bytes32=>address) public tokenByProject;
    struct Suite {address registry;address storageContract;address topics;address issuers;address claimIssuer;address compliance;}
    mapping(address=>Suite) public suites;
    event ApprovalChanged(bytes32 indexed digest,address indexed reviewer,bool approved);
    event TokenCreated(bytes32 indexed projectId,address indexed token,bytes32 indexed digest,string name,bytes32 dossierHash);
    constructor(address technical,address compliance_,address board,address operator_,address[5] memory code) {
        require(block.chainid==11155111,"Sepolia only");
        require(technical!=address(0)&&compliance_!=address(0)&&board!=address(0)&&operator_!=address(0)&&technical!=compliance_&&technical!=board&&technical!=operator_&&compliance_!=board&&compliance_!=operator_&&board!=operator_,"Participants");
        for(uint256 i;i<5;i++){require(code[i].codehash==Tokvan3643SuiteHashes.hashAt(i),"Official implementation mismatch");implementations[i]=code[i];}
        technicalReviewer=technical;complianceReviewer=compliance_;boardReviewer=board;operator=operator_;
    }
    function hashConfig(bytes32 projectId,RegulatedConfig calldata config) public view returns(bytes32){return keccak256(abi.encode(VERSION,block.chainid,address(this),projectId,config));}
    function setApproval(bytes32 digest,bool approved) external {
        uint8 bit=msg.sender==technicalReviewer?1:msg.sender==complianceReviewer?2:msg.sender==boardReviewer?4:0;
        require(bit!=0,"Reviewer only");if(approved)approvals[digest]|=bit;else approvals[digest]&=~bit;emit ApprovalChanged(digest,msg.sender,approved);
    }
    function createToken(bytes32 projectId,RegulatedConfig calldata c) external returns(address token){
        require(block.chainid==11155111 && msg.sender==operator,"Sepolia operator only");
        require(projectId!=bytes32(0)&&tokenByProject[projectId]==address(0),"Project used / empty");
        bytes32 digest=hashConfig(projectId,c);require(approvals[digest]==7,"Three approvals required");
        require(bytes(c.name).length>0&&bytes(c.name).length<=64&&bytes(c.symbol).length>0&&bytes(c.symbol).length<=16&&c.decimals<=18&&c.admin!=address(0)&&c.claimAuthority!=address(0)&&c.dossierHash!=bytes32(0),"Config");
        delete approvals[digest];
        token=Clones.clone(implementations[0]);
        Suite memory s;
        s.registry=Clones.clone(implementations[1]);s.storageContract=Clones.clone(implementations[2]);s.topics=Clones.clone(implementations[3]);s.issuers=Clones.clone(implementations[4]);
        ISuiteOwner(s.storageContract).init();ISuiteOwner(s.topics).init();ISuiteOwner(s.issuers).init();
        ISuiteRegistry(s.registry).init(s.issuers,s.topics,s.storageContract);
        ISuiteStorage(s.storageContract).bindIdentityRegistry(s.registry);
        s.claimIssuer=address(new Tokvan3643TestClaimIssuer(c.claimAuthority,s.registry));
        s.compliance=address(new Tokvan3643TestCompliance(token,s.registry,c.admin,c.supplyCap,c.walletCap,c.countries));
        uint256[] memory topics=new uint256[](3);
        for(uint256 i;i<3;i++){topics[i]=i+1;ISuiteTopics(s.topics).addClaimTopic(i+1);}
        ISuiteIssuers(s.issuers).addTrustedIssuer(s.claimIssuer,topics);
        ISuiteToken(token).init(s.registry,s.compliance,c.name,c.symbol,c.decimals,address(0));
        ISuiteOwner(token).addAgent(c.admin);
        ISuiteOwner(s.registry).addAgent(s.claimIssuer);ISuiteOwner(s.registry).addAgent(token);
        ISuiteOwner(token).transferOwnership(c.admin);ISuiteOwner(s.registry).transferOwnership(c.admin);ISuiteOwner(s.storageContract).transferOwnership(c.admin);ISuiteOwner(s.topics).transferOwnership(c.admin);ISuiteOwner(s.issuers).transferOwnership(c.admin);
        suites[token]=s;tokenByProject[projectId]=token;
        emit TokenCreated(projectId,token,digest,c.name,c.dossierHash);
    }
}
