// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;

interface IV2TokenView {function totalSupply() external view returns(uint256); function balanceOf(address) external view returns(uint256);}
interface IV2CountryRegistry {function investorCountry(address) external view returns(uint16);}

/// @notice Mutable Sepolia-only educational rules. Country permissions start empty.
contract Tokvan3643TestComplianceV2 {
    address public immutable expectedToken;
    address public immutable owner;
    IV2CountryRegistry public immutable registry;
    uint256 public supplyCap;
    uint256 public walletCap;
    mapping(uint16 => bool) public allowedCountry;
    mapping(address => bool) public isTokenAgent;
    bool private bound;
    event RulesUpdated(uint256 supplyCap,uint256 walletCap);
    event CountryUpdated(uint16 country,bool allowed);
    event TokenBound(address token);
    event TokenUnbound(address token);
    event TokenAgentAdded(address agent);
    event TokenAgentRemoved(address agent);
    modifier onlyOwner(){require(msg.sender==owner,"Owner only");_;}
    constructor(address token,address registry_,address admin,uint256 supply,uint256 perWallet){
        require(block.chainid==11155111&&token!=address(0)&&registry_!=address(0)&&admin!=address(0)&&supply>0&&perWallet>0&&perWallet<=supply,"Invalid test rules");
        expectedToken=token;registry=IV2CountryRegistry(registry_);owner=admin;supplyCap=supply;walletCap=perWallet;
    }
    function setLimits(uint256 supply,uint256 perWallet) external onlyOwner {
        require(supply>=IV2TokenView(expectedToken).totalSupply()&&supply>0&&perWallet>0&&perWallet<=supply,"Limits");
        supplyCap=supply;walletCap=perWallet;emit RulesUpdated(supply,perWallet);
    }
    function setCountry(uint16 country,bool allowed) external onlyOwner {
        require(country>0&&country<=999,"Country");allowedCountry[country]=allowed;emit CountryUpdated(country,allowed);
    }
    function bindToken(address token) external {require(msg.sender==expectedToken&&token==expectedToken&&!bound,"Token only");bound=true;emit TokenBound(token);}
    function unbindToken(address token) external {require(msg.sender==expectedToken&&token==expectedToken,"Token only");bound=false;emit TokenUnbound(token);}
    function isTokenBound(address token) external view returns(bool){return bound&&token==expectedToken;}
    function addTokenAgent(address agent) external onlyOwner {require(agent!=address(0),"Agent");isTokenAgent[agent]=true;emit TokenAgentAdded(agent);}
    function removeTokenAgent(address agent) external onlyOwner {delete isTokenAgent[agent];emit TokenAgentRemoved(agent);}
    function canTransfer(address from,address to,uint256 amount) external view returns(bool){
        if(!bound||to==address(0)||!allowedCountry[registry.investorCountry(to)])return false;
        IV2TokenView token=IV2TokenView(expectedToken);
        if(from==address(0)&&(token.totalSupply()>supplyCap||amount>supplyCap-token.totalSupply()))return false;
        uint256 balance=token.balanceOf(to);
        return from==to||(balance<=walletCap&&amount<=walletCap-balance);
    }
    function transferred(address,address,uint256) external view {require(msg.sender==expectedToken&&bound,"Token only");}
    function created(address,uint256) external view {require(msg.sender==expectedToken&&bound,"Token only");}
    function destroyed(address,uint256) external view {require(msg.sender==expectedToken&&bound,"Token only");}
}
