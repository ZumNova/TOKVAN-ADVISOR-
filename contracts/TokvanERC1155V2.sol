// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TokvanERC1155, MultiConfig} from "./TokvanERC1155.sol";

/// @notice The project admin owns the collection; the TOKVANT operator may issue its types.
/// @dev The project admin can revoke the operator's MINTER_ROLE after delivery.
contract TokvanERC1155V2 is TokvanERC1155 {
    address public immutable issuanceOperator;

    constructor(MultiConfig memory config, address operator_) TokvanERC1155(config) {
        if (operator_ == address(0)) revert InvalidConfig();
        issuanceOperator = operator_;
        _grantRole(MINTER_ROLE, operator_);
    }
}
