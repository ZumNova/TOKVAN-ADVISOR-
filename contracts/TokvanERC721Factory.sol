// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {TokvanERC721, NFTConfig} from "./TokvanERC721.sol";

contract TokvanERC721Factory {
    bytes32 public constant VERSION = keccak256("TOKVAN_ERC721_FACTORY_V1");
    address public immutable technicalReviewer;
    address public immutable complianceReviewer;
    address public immutable boardReviewer;
    address public immutable operator;
    mapping(bytes32 => uint8) public approvals;
    mapping(bytes32 => address) public collectionByProject;
    uint256 public collectionCount;

    error InvalidParticipants();
    error Unauthorized();
    error MissingApprovals();
    error InvalidProject();
    event ApprovalChanged(bytes32 indexed digest, address indexed reviewer, bool approved);
    event CollectionCreated(bytes32 indexed projectId, address indexed collection, bytes32 indexed digest, address admin);

    constructor(address technical, address compliance, address board, address operator_) {
        if (technical == address(0) || compliance == address(0) || board == address(0) || operator_ == address(0) ||
            technical == compliance || technical == board || compliance == board ||
            operator_ == technical || operator_ == compliance || operator_ == board) revert InvalidParticipants();
        technicalReviewer = technical;
        complianceReviewer = compliance;
        boardReviewer = board;
        operator = operator_;
    }
    function hashConfig(bytes32 projectId, NFTConfig calldata config) public view returns (bytes32) {
        return keccak256(abi.encode(VERSION, block.chainid, address(this), projectId, config));
    }
    function setApproval(bytes32 digest, bool approved) external {
        uint8 bit;
        if (msg.sender == technicalReviewer) bit = 1;
        else if (msg.sender == complianceReviewer) bit = 2;
        else if (msg.sender == boardReviewer) bit = 4;
        else revert Unauthorized();
        if (approved) approvals[digest] |= bit;
        else approvals[digest] &= ~bit;
        emit ApprovalChanged(digest, msg.sender, approved);
    }
    function createCollection(bytes32 projectId, NFTConfig calldata config) external returns (address collection) {
        if (msg.sender != operator) revert Unauthorized();
        if (projectId == bytes32(0) || collectionByProject[projectId] != address(0)) revert InvalidProject();
        bytes32 digest = hashConfig(projectId, config);
        if (approvals[digest] != 7) revert MissingApprovals();
        delete approvals[digest];
        collection = address(new TokvanERC721(config));
        collectionByProject[projectId] = collection;
        collectionCount++;
        emit CollectionCreated(projectId, collection, digest, config.admin);
    }
}
