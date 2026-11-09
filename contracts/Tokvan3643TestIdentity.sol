// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;

interface ITestClaimSource {
    function claimData(address identity, uint256 topic) external view returns (bytes memory);
}
/// @notice Sepolia-only identity adapter. No real KYC documents or off-chain claim signatures.
contract Tokvan3643TestIdentity {
    address public immutable issuer;
    mapping(bytes32 => bool) private managementKeys;
    constructor(address subject, address issuer_) {
        require(block.chainid == 11155111, "Sepolia only");
        issuer = issuer_; managementKeys[keccak256(abi.encode(subject))] = true;
    }
    function authorizeRecovery(address wallet) external {
        require(msg.sender == issuer && wallet != address(0), "Issuer only");
        managementKeys[keccak256(abi.encode(wallet))] = true;
    }
    function keyHasPurpose(bytes32 key, uint256 purpose) external view returns (bool) {
        return purpose == 1 && managementKeys[key];
    }
    function getClaim(bytes32 claimId) external view returns (uint256, uint256, address, bytes memory, bytes memory, string memory) {
        for (uint256 topic = 1; topic <= 3; topic++) {
            if (claimId == keccak256(abi.encode(issuer, topic))) {
                return (topic, 1, issuer, hex"00", ITestClaimSource(issuer).claimData(address(this), topic), "SIMULATED_SEPOLIA_ONLY");
            }
        }
        return (0, 0, address(0), "", "", "");
    }
}
interface ITestIdentityRegistry {
    function registerIdentity(address wallet, address identity, uint16 country) external;
    function updateCountry(address wallet, uint16 country) external;
    function identity(address wallet) external view returns (address);
}
/// @notice Fictional attestations signed as Ethereum transactions by the designated test authority.
contract Tokvan3643TestClaimIssuer {
    address public immutable authority;
    ITestIdentityRegistry public immutable registry;
    struct Credential { uint64 expiresAt; uint16 country; bool entity; bool kyc; bool kyb; bool aml; bool eligible; bool revoked; bytes32 evidence; }
    mapping(address => Credential) public credentials;
    mapping(address => bool) public issuedIdentity;
    event TestCredential(address indexed wallet, address indexed identity, uint64 expiresAt, uint16 country, bytes32 evidence);
    event TestCredentialRevoked(address indexed identity);
    event TestRecoveryAuthorized(address indexed identity, address indexed wallet, bytes32 evidence);
    modifier onlyAuthority() { require(msg.sender == authority, "Test authority only"); _; }
    constructor(address authority_, address registry_) {
        require(block.chainid == 11155111 && authority_ != address(0), "Sepolia / authority");
        authority = authority_; registry = ITestIdentityRegistry(registry_);
    }
    function attest(address wallet, Credential calldata credential) external onlyAuthority returns (address identity) {
        require(wallet != address(0) && credential.country > 0 && credential.country <= 999, "Wallet / country");
        require(credential.expiresAt > block.timestamp && credential.expiresAt <= block.timestamp + 366 days, "Expiry: up to 366 days");
        require(credential.evidence != bytes32(0) && !credential.revoked, "Test evidence required");
        identity = registry.identity(wallet);
        if (identity == address(0)) {
            identity = address(new Tokvan3643TestIdentity(wallet, address(this)));
            issuedIdentity[identity] = true;
            registry.registerIdentity(wallet, identity, credential.country);
        } else {
            require(issuedIdentity[identity], "Unknown identity");
            registry.updateCountry(wallet, credential.country);
        }
        credentials[identity] = credential;
        emit TestCredential(wallet, identity, credential.expiresAt, credential.country, credential.evidence);
    }
    function revoke(address identity) external onlyAuthority {
        require(issuedIdentity[identity], "Unknown identity");
        credentials[identity].revoked = true; emit TestCredentialRevoked(identity);
    }
    function authorizeRecovery(address identity, address wallet, bytes32 evidence) external onlyAuthority {
        require(issuedIdentity[identity] && wallet != address(0) && evidence != bytes32(0), "Identity / evidence");
        Tokvan3643TestIdentity(identity).authorizeRecovery(wallet);
        emit TestRecoveryAuthorized(identity, wallet, evidence);
    }
    function claimData(address identity, uint256 topic) public view returns (bytes memory) {
        return abi.encode(block.chainid, address(this), identity, topic, credentials[identity]);
    }
    function isClaimValid(address identity, uint256 topic, bytes calldata signature, bytes calldata data) external view returns (bool) {
        Credential memory c = credentials[identity];
        if (block.chainid != 11155111 || !issuedIdentity[identity] || c.revoked || c.expiresAt <= block.timestamp || keccak256(signature) != keccak256(hex"00") || keccak256(data) != keccak256(claimData(identity, topic))) return false;
        if (topic == 1) return c.entity ? c.kyb : c.kyc;
        if (topic == 2) return c.aml;
        if (topic == 3) return c.eligible;
        return false;
    }
}
