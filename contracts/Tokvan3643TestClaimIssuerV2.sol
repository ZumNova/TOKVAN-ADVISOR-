// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;

import {Tokvan3643TestIdentity, ITestIdentityRegistry, ITestClaimSource} from "./Tokvan3643TestIdentity.sol";

/// @notice Fictional Sepolia attestations. The project owner may authorize or revoke an operator later.
contract Tokvan3643TestClaimIssuerV2 is ITestClaimSource {
    address public immutable authority;
    ITestIdentityRegistry public immutable registry;
    mapping(address=>bool) public operators;
    struct Credential {uint64 expiresAt;uint16 country;bool entity;bool kyc;bool kyb;bool aml;bool eligible;bool revoked;bytes32 evidence;}
    mapping(address=>Credential) public credentials;
    mapping(address=>bool) public issuedIdentity;
    event OperatorUpdated(address indexed operator,bool allowed);
    event TestCredential(address indexed wallet,address indexed identity,uint64 expiresAt,uint16 country,bytes32 evidence);
    event TestCredentialRevoked(address indexed identity);
    event TestRecoveryAuthorized(address indexed identity,address indexed wallet,bytes32 evidence);
    modifier onlyAuthority(){require(msg.sender==authority||operators[msg.sender],"Test authority only");_;}
    constructor(address authority_,address registry_){require(block.chainid==11155111&&authority_!=address(0)&&registry_!=address(0),"Sepolia / authority");authority=authority_;registry=ITestIdentityRegistry(registry_);}
    function setOperator(address operator_,bool allowed) external {require(msg.sender==authority&&operator_!=address(0),"Owner only");operators[operator_]=allowed;emit OperatorUpdated(operator_,allowed);}
    function attest(address wallet,Credential calldata credential) external onlyAuthority returns(address identity){
        require(wallet!=address(0)&&credential.country>0&&credential.country<=999,"Wallet / country");
        require(credential.expiresAt>block.timestamp&&credential.expiresAt<=block.timestamp+366 days,"Expiry: up to 366 days");
        require(credential.evidence!=bytes32(0)&&!credential.revoked,"Test evidence required");
        identity=registry.identity(wallet);
        if(identity==address(0)){identity=address(new Tokvan3643TestIdentity(wallet,address(this)));issuedIdentity[identity]=true;registry.registerIdentity(wallet,identity,credential.country);}
        else {require(issuedIdentity[identity],"Unknown identity");registry.updateCountry(wallet,credential.country);}
        credentials[identity]=credential;emit TestCredential(wallet,identity,credential.expiresAt,credential.country,credential.evidence);
    }
    function revoke(address identity) external onlyAuthority {require(issuedIdentity[identity],"Unknown identity");credentials[identity].revoked=true;emit TestCredentialRevoked(identity);}
    function authorizeRecovery(address identity,address wallet,bytes32 evidence) external onlyAuthority {
        require(issuedIdentity[identity]&&wallet!=address(0)&&evidence!=bytes32(0),"Identity / evidence");
        Tokvan3643TestIdentity(identity).authorizeRecovery(wallet);emit TestRecoveryAuthorized(identity,wallet,evidence);
    }
    function claimData(address identity,uint256 topic) public view returns(bytes memory){return abi.encode(block.chainid,address(this),identity,topic,credentials[identity]);}
    function isClaimValid(address identity,uint256 topic,bytes calldata signature,bytes calldata data) external view returns(bool){
        Credential memory c=credentials[identity];
        if(block.chainid!=11155111||!issuedIdentity[identity]||c.revoked||c.expiresAt<=block.timestamp||keccak256(signature)!=keccak256(hex"00")||keccak256(data)!=keccak256(claimData(identity,topic)))return false;
        if(topic==1)return c.entity?c.kyb:c.kyc;
        if(topic==2)return c.aml;
        if(topic==3)return c.eligible;
        return false;
    }
}
