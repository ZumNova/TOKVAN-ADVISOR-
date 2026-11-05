// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

struct TokenConfig {
    string name;
    string symbol;
    uint8 decimals;
    uint256 initialSupply;
    uint256 maxSupply;
    address admin;
    address treasury;
    bool mintable;
    bool burnable;
    bool pausable;
}

/// @notice Immutable ERC-20 configuration. Amounts are in base units.
contract TokvanERC20 is ERC20Capped, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint8 private immutable tokenDecimals;
    bool public immutable mintable;
    bool public immutable burnable;
    bool public immutable pausable;

    error InvalidConfig();
    error FeatureDisabled();

    constructor(TokenConfig memory config) ERC20(config.name, config.symbol) ERC20Capped(config.maxSupply) {
        if (
            bytes(config.name).length == 0 || bytes(config.name).length > 64 ||
            bytes(config.symbol).length == 0 || bytes(config.symbol).length > 16 ||
            config.decimals > 18 || config.admin == address(0) || config.treasury == address(0) ||
            config.initialSupply > config.maxSupply ||
            (!config.mintable && config.initialSupply != config.maxSupply)
        ) revert InvalidConfig();
        tokenDecimals = config.decimals;
        mintable = config.mintable;
        burnable = config.burnable;
        pausable = config.pausable;
        _grantRole(DEFAULT_ADMIN_ROLE, config.admin);
        if (mintable) _grantRole(MINTER_ROLE, config.admin);
        if (pausable) _grantRole(PAUSER_ROLE, config.admin);
        _mint(config.treasury, config.initialSupply);
    }

    function decimals() public view override returns (uint8) { return tokenDecimals; }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (!mintable) revert FeatureDisabled();
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        if (!burnable) revert FeatureDisabled();
        _burn(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        if (!burnable) revert FeatureDisabled();
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        if (!pausable) revert FeatureDisabled();
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        if (!pausable) revert FeatureDisabled();
        _unpause();
    }

    function _update(address from, address to, uint256 value)
        internal override(ERC20Capped, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
