// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;
interface ITestTokenView {function totalSupply() external view returns(uint256); function balanceOf(address) external view returns(uint256);}
interface ITestCountryRegistry {function investorCountry(address) external view returns(uint16);}
/// @notice Test rules, not country legislation. Fixed caps/countries; privileged ERC-3643 actions bypass canTransfer.
contract Tokvan3643TestCompliance {
    address public immutable expectedToken;
    address public immutable owner;
    ITestCountryRegistry public immutable registry;
    uint256 public immutable supplyCap;
    uint256 public immutable walletCap;
    mapping(uint16 => bool) public allowedCountry;
    mapping(address => bool) public isTokenAgent;
    bool private bound;
    event TokenBound(address token); event TokenUnbound(address token);
    event TokenAgentAdded(address agent); event TokenAgentRemoved(address agent);
    constructor(address token, address registry_, address admin, uint256 supply, uint256 perWallet, uint16[] memory countries) {
        require(block.chainid == 11155111 && supply > 0 && perWallet > 0 && perWallet <= supply && countries.length > 0 && countries.length <= 20, "Invalid test rules");
        expectedToken=token; registry=ITestCountryRegistry(registry_); owner=admin; supplyCap=supply; walletCap=perWallet;
        for(uint256 i; i<countries.length; i++){require(countries[i]>0 && countries[i]<=999,"Country");allowedCountry[countries[i]]=true;}
    }
    function bindToken(address token) external {require(msg.sender==expectedToken && token==expectedToken && !bound,"Token only");bound=true;emit TokenBound(token);}
    function unbindToken(address token) external {require(msg.sender==expectedToken && token==expectedToken,"Token only");bound=false;emit TokenUnbound(token);}
    function isTokenBound(address token) external view returns(bool){return bound && token==expectedToken;}
    function addTokenAgent(address agent) external {require(msg.sender==owner && agent!=address(0),"Owner only");isTokenAgent[agent]=true;emit TokenAgentAdded(agent);}
    function removeTokenAgent(address agent) external {require(msg.sender==owner,"Owner only");delete isTokenAgent[agent];emit TokenAgentRemoved(agent);}
    function canTransfer(address from,address to,uint256 amount) external view returns(bool){
        if(!bound || to==address(0) || !allowedCountry[registry.investorCountry(to)])return false;
        ITestTokenView token=ITestTokenView(expectedToken);
        if(from==address(0) && (token.totalSupply()>supplyCap || amount>supplyCap-token.totalSupply()))return false;
        uint256 balance=token.balanceOf(to);
        return from==to || (balance<=walletCap && amount<=walletCap-balance);
    }
    function transferred(address,address,uint256) external view {require(msg.sender==expectedToken && bound,"Token only");}
    function created(address,uint256) external view {require(msg.sender==expectedToken && bound,"Token only");}
    function destroyed(address,uint256) external view {require(msg.sender==expectedToken && bound,"Token only");}
}
