// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TokvanERC20, TokenConfig} from "./TokvanERC20.sol";

/// @notice Three independent on-chain reviewers authorize exact token parameters.
/// @dev Reviewers and operator are immutable in v1. Approvals have no expiry;
/// reviewers may revoke their own vote until execution.
contract TokvanERC20Factory {
    address public immutable technicalReviewer;
    address public immutable complianceReviewer;
    address public immutable boardReviewer;
    address public immutable operator;
    mapping(bytes32 => uint8) public approvals;
    mapping(bytes32 => address) public tokenByProject;
    uint256 public tokenCount;

    error InvalidParticipants();
    error Unauthorized();
    error MissingApprovals();
    error InvalidProject();
    event ApprovalChanged(bytes32 indexed digest, address indexed reviewer, bool approved);
    event TokenCreated(bytes32 indexed projectId, address indexed token, bytes32 indexed digest, address admin, address treasury);

    constructor(address technical, address compliance, address board, address operator_) {
        if (
            technical == address(0) || compliance == address(0) || board == address(0) || operator_ == address(0) ||
            technical == compliance || technical == board || compliance == board ||
            operator_ == technical || operator_ == compliance || operator_ == board
        ) revert InvalidParticipants();
        technicalReviewer = technical;
        complianceReviewer = compliance;
        boardReviewer = board;
        operator = operator_;
    }

    function hashConfig(bytes32 projectId, TokenConfig calldata config) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), projectId, config));
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

    function createToken(bytes32 projectId, TokenConfig calldata config) external returns (address token) {
        if (msg.sender != operator) revert Unauthorized();
        if (projectId == bytes32(0) || tokenByProject[projectId] != address(0)) revert InvalidProject();
        bytes32 digest = hashConfig(projectId, config);
        if (approvals[digest] != 7) revert MissingApprovals();
        delete approvals[digest];
        token = address(new TokvanERC20(config));
        tokenByProject[projectId] = token;
        tokenCount++;
        emit TokenCreated(projectId, token, digest, config.admin, config.treasury);
    }
}
