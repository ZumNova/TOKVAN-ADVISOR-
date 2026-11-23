// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TokvanERC20, TokenConfig} from "./TokvanERC20.sol";

/// @notice Sepolia pilot with one operator. Off-chain approval is checked by TOKVANT before this transaction.
/// @dev The operator's on-chain transaction is the sole factory authorization; it binds a project version hash.
contract TokvanERC20FactoryV2 {
    address public immutable operator;
    mapping(bytes32 => address) public tokenByProject;
    uint256 public tokenCount;

    error InvalidOperator();
    error Unauthorized();
    error InvalidProject();

    event TokenCreated(bytes32 indexed projectId, address indexed token, bytes32 indexed configDigest, bytes32 projectHash, address admin, address treasury);

    constructor(address operator_) {
        if (operator_ == address(0)) revert InvalidOperator();
        operator = operator_;
    }

    function hashConfig(bytes32 projectId, bytes32 projectHash, TokenConfig calldata config) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), projectId, projectHash, config));
    }

    function createToken(bytes32 projectId, bytes32 projectHash, TokenConfig calldata config) external returns (address token) {
        if (msg.sender != operator) revert Unauthorized();
        if (projectId == bytes32(0) || projectHash == bytes32(0) || tokenByProject[projectId] != address(0)) revert InvalidProject();
        bytes32 digest = hashConfig(projectId, projectHash, config);
        token = address(new TokvanERC20(config));
        tokenByProject[projectId] = token;
        tokenCount++;
        emit TokenCreated(projectId, token, digest, projectHash, config.admin, config.treasury);
    }
}
