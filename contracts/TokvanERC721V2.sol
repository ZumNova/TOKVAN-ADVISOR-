// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TokvanERC721, NFTConfig} from "./TokvanERC721.sol";

/// @notice The project admin remains the collection owner; TOKVANT's operator can issue NFTs.
/// @dev The project admin may revoke the operator's MINTER_ROLE after delivery.
contract TokvanERC721V2 is TokvanERC721 {
    address public immutable issuanceOperator;

    constructor(NFTConfig memory config, address operator_) TokvanERC721(config) {
        if (operator_ == address(0)) revert InvalidConfig();
        issuanceOperator = operator_;
        _grantRole(MINTER_ROLE, operator_);
    }
}
