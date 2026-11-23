// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {NFTConfig} from "./TokvanERC721.sol";
import {TokvanERC721V2} from "./TokvanERC721V2.sol";

/// @notice One Sepolia operator creates a collection bound to the approved dossier version.
contract TokvanERC721FactoryV2 {
    address public immutable operator;
    mapping(bytes32 => address) public collectionByProject;
    uint256 public collectionCount;

    error InvalidOperator();
    error Unauthorized();
    error InvalidProject();

    event CollectionCreated(bytes32 indexed projectId, address indexed collection, bytes32 indexed configDigest, bytes32 projectHash, address admin);

    constructor(address operator_) {
        if (operator_ == address(0)) revert InvalidOperator();
        operator = operator_;
    }

    function hashConfig(bytes32 projectId, bytes32 projectHash, NFTConfig calldata config) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), projectId, projectHash, config));
    }

    function createCollection(bytes32 projectId, bytes32 projectHash, NFTConfig calldata config) external returns (address collection) {
        if (msg.sender != operator) revert Unauthorized();
        if (projectId == bytes32(0) || projectHash == bytes32(0) || collectionByProject[projectId] != address(0)) revert InvalidProject();
        bytes32 digest = hashConfig(projectId, projectHash, config);
        collection = address(new TokvanERC721V2(config, operator));
        collectionByProject[projectId] = collection;
        collectionCount++;
        emit CollectionCreated(projectId, collection, digest, projectHash, config.admin);
    }
}
