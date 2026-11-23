// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Tokvan3643TestClaimIssuerV2} from "./Tokvan3643TestClaimIssuerV2.sol";
import {Tokvan3643TestComplianceV2} from "./Tokvan3643TestComplianceV2.sol";
import {Tokvan3643SuiteHashes} from "./Tokvan3643SuiteHashes.sol";
import {ISuiteOwner, ISuiteStorage, ISuiteTopics, ISuiteIssuers, ISuiteRegistry, ISuiteToken, RegulatedConfig} from "./Tokvan3643TestFactory.sol";

/// @notice Sepolia educational factory. The 047 creates a suite after a verified off-chain integral decision.
/// @dev No investor is accredited or minted during creation. The project wallet owns every suite component.
contract Tokvan3643TestFactoryV2 {
    bytes32 public constant VERSION = keccak256("TOKVAN_3643_SEPOLIA_EDUCATIONAL_V2");
    address public immutable operator;
    address[5] public implementations;
    mapping(bytes32 => address) public tokenByProject;
    struct Suite {address registry; address storageContract; address topics; address issuers; address claimIssuer; address compliance;}
    mapping(address => Suite) public suites;
    event TokenCreated(bytes32 indexed projectId, address indexed token, bytes32 indexed digest, bytes32 projectHash, string name, bytes32 dossierHash);

    constructor(address operator_, address[5] memory code) {
        require(block.chainid == 11155111, "Sepolia only");
        require(operator_ != address(0), "Operator");
        for (uint256 i; i < 5; i++) {
            require(code[i].codehash == Tokvan3643SuiteHashes.hashAt(i), "Official implementation mismatch");
            implementations[i] = code[i];
        }
        operator = operator_;
    }

    function hashConfig(bytes32 projectId, bytes32 projectHash, RegulatedConfig calldata config) public view returns (bytes32) {
        return keccak256(abi.encode(VERSION, block.chainid, address(this), projectId, projectHash, config));
    }

    function createToken(bytes32 projectId, bytes32 projectHash, RegulatedConfig calldata c) external returns (address token) {
        require(block.chainid == 11155111 && msg.sender == operator, "Sepolia operator only");
        require(projectId != bytes32(0) && projectHash != bytes32(0) && tokenByProject[projectId] == address(0), "Project used / empty");
        require(bytes(c.name).length > 0 && bytes(c.name).length <= 64 && bytes(c.symbol).length > 0 && bytes(c.symbol).length <= 16 && c.decimals <= 18 && c.admin != address(0) && c.claimAuthority == c.admin && c.dossierHash == projectHash && c.supplyCap > 0 && c.walletCap > 0 && c.walletCap <= c.supplyCap && c.countries.length == 0, "Config");
        bytes32 digest = hashConfig(projectId, projectHash, c);
        token = Clones.clone(implementations[0]);
        Suite memory s;
        s.registry = Clones.clone(implementations[1]);
        s.storageContract = Clones.clone(implementations[2]);
        s.topics = Clones.clone(implementations[3]);
        s.issuers = Clones.clone(implementations[4]);
        ISuiteOwner(s.storageContract).init(); ISuiteOwner(s.topics).init(); ISuiteOwner(s.issuers).init();
        ISuiteRegistry(s.registry).init(s.issuers, s.topics, s.storageContract);
        ISuiteStorage(s.storageContract).bindIdentityRegistry(s.registry);
        s.claimIssuer = address(new Tokvan3643TestClaimIssuerV2(c.admin, s.registry));
        s.compliance = address(new Tokvan3643TestComplianceV2(token, s.registry, c.admin, c.supplyCap, c.walletCap));
        uint256[] memory topics = new uint256[](3);
        for (uint256 i; i < 3; i++) {topics[i] = i + 1; ISuiteTopics(s.topics).addClaimTopic(i + 1);}
        ISuiteIssuers(s.issuers).addTrustedIssuer(s.claimIssuer, topics);
        ISuiteToken(token).init(s.registry, s.compliance, c.name, c.symbol, c.decimals, address(0));
        ISuiteOwner(token).addAgent(c.admin);
        ISuiteOwner(s.registry).addAgent(s.claimIssuer);
        ISuiteOwner(s.registry).addAgent(token);
        ISuiteOwner(token).transferOwnership(c.admin);
        ISuiteOwner(s.registry).transferOwnership(c.admin);
        ISuiteOwner(s.storageContract).transferOwnership(c.admin);
        ISuiteOwner(s.topics).transferOwnership(c.admin);
        ISuiteOwner(s.issuers).transferOwnership(c.admin);
        suites[token] = s;
        tokenByProject[projectId] = token;
        emit TokenCreated(projectId, token, digest, projectHash, c.name, c.dossierHash);
    }
}
