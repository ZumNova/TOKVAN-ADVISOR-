// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

struct NFTConfig {
    string name;
    string symbol;
    address admin;
    uint256 maxSupply;
    bool burnable;
    bool pausable;
}

/// @notice Unique NFTs with immutable per-token URIs and a lifetime issuance cap.
contract TokvanERC721 is ERC721URIStorage, ERC721Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 public immutable maxSupply;
    bool public immutable burnable;
    bool public immutable pausable;
    uint256 public mintedCount;
    uint256 public totalSupply;

    error InvalidConfig();
    error InvalidURI();
    error CapReached();
    error FeatureDisabled();

    constructor(NFTConfig memory config) ERC721(config.name, config.symbol) {
        if (bytes(config.name).length == 0 || bytes(config.name).length > 64 ||
            bytes(config.symbol).length == 0 || bytes(config.symbol).length > 16 ||
            config.admin == address(0) || config.maxSupply == 0) revert InvalidConfig();
        maxSupply = config.maxSupply;
        burnable = config.burnable;
        pausable = config.pausable;
        _grantRole(DEFAULT_ADMIN_ROLE, config.admin);
        _grantRole(MINTER_ROLE, config.admin);
        if (pausable) _grantRole(PAUSER_ROLE, config.admin);
    }

    function mint(address to, string calldata uri) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256 tokenId) {
        if (mintedCount >= maxSupply) revert CapReached();
        if (bytes(uri).length == 0 || bytes(uri).length > 2048) revert InvalidURI();
        tokenId = ++mintedCount;
        totalSupply++;
        // OZ URIStorage allows setting the URI before mint, so receiver callbacks see it.
        _setTokenURI(tokenId, uri);
        _safeMint(to, tokenId);
    }

    function burn(uint256 tokenId) external nonReentrant {
        if (!burnable) revert FeatureDisabled();
        // ERC721 authorization permits the owner or its approved operator to burn.
        _update(address(0), tokenId, msg.sender);
        totalSupply--;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        if (!pausable) revert FeatureDisabled();
        _pause();
    }
    function unpause() external onlyRole(PAUSER_ROLE) {
        if (!pausable) revert FeatureDisabled();
        _unpause();
    }
    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721, ERC721Pausable) returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, ERC721, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
