// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

struct MultiConfig {
    string name;
    string symbol;
    address admin;
    uint256 maxTypes;
    bool burnable;
    bool pausable;
}

/// @notice Fixed metadata and lifetime issuance caps for each token type.
contract TokvanERC1155 is ERC1155Supply, ERC1155Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    string public name;
    string public symbol;
    uint256 public immutable maxTypes;
    bool public immutable burnable;
    bool public immutable pausable;
    uint256 public typeCount;
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public mintedCount;
    mapping(uint256 => string) private _uris;
    error InvalidConfig();
    error InvalidType();
    error InvalidURI();
    error InvalidAmount();
    error CapReached();
    error FeatureDisabled();
    error Unauthorized();
    event TypeCreated(uint256 indexed tokenId, uint256 maxSupply, string tokenURI);

    constructor(MultiConfig memory config) ERC1155("") {
        if(bytes(config.name).length==0||bytes(config.name).length>64||bytes(config.symbol).length==0||bytes(config.symbol).length>16||config.admin==address(0)||config.maxTypes==0)revert InvalidConfig();
        name=config.name;symbol=config.symbol;maxTypes=config.maxTypes;burnable=config.burnable;pausable=config.pausable;
        _grantRole(DEFAULT_ADMIN_ROLE,config.admin);_grantRole(MINTER_ROLE,config.admin);
        if(pausable)_grantRole(PAUSER_ROLE,config.admin);
    }
    function createType(address to,uint256 amount,uint256 cap,string calldata tokenURI) external onlyRole(MINTER_ROLE) nonReentrant returns(uint256 tokenId) {
        if(typeCount>=maxTypes)revert CapReached();
        if(cap==0||amount==0||amount>cap)revert InvalidAmount();
        if(bytes(tokenURI).length==0||bytes(tokenURI).length>2048)revert InvalidURI();
        tokenId=++typeCount;maxSupply[tokenId]=cap;mintedCount[tokenId]=amount;_uris[tokenId]=tokenURI;
        emit URI(tokenURI,tokenId);emit TypeCreated(tokenId,cap,tokenURI);
        _mint(to,tokenId,amount,"");
    }
    function mint(address to,uint256 tokenId,uint256 amount) external onlyRole(MINTER_ROLE) nonReentrant {
        if(maxSupply[tokenId]==0)revert InvalidType();
        if(amount==0)revert InvalidAmount();
        if(amount>maxSupply[tokenId]-mintedCount[tokenId])revert CapReached();
        mintedCount[tokenId]+=amount;_mint(to,tokenId,amount,"");
    }
    function burn(address from,uint256 tokenId,uint256 amount) external nonReentrant {
        if(!burnable)revert FeatureDisabled();
        if(from!=msg.sender&&!isApprovedForAll(from,msg.sender))revert Unauthorized();
        if(amount==0)revert InvalidAmount();
        _burn(from,tokenId,amount);
    }
    function uri(uint256 tokenId) public view override returns(string memory) {
        if(maxSupply[tokenId]==0)revert InvalidType();
        return _uris[tokenId];
    }
    function pause() external onlyRole(PAUSER_ROLE) {if(!pausable)revert FeatureDisabled();_pause();}
    function unpause() external onlyRole(PAUSER_ROLE) {if(!pausable)revert FeatureDisabled();_unpause();}
    function _update(address from,address to,uint256[] memory ids,uint256[] memory amounts) internal override(ERC1155Supply,ERC1155Pausable) {super._update(from,to,ids,amounts);}
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155,AccessControl) returns(bool) {return super.supportsInterface(interfaceId);}
}
