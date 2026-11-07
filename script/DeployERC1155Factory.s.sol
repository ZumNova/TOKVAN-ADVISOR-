// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {TokvanERC1155Factory} from "../contracts/TokvanERC1155Factory.sol";
interface MultiDeployVm {
    function envAddress(string calldata) external returns (address);
    function startBroadcast() external;
    function stopBroadcast() external;
}
contract DeployERC1155Factory {
    MultiDeployVm constant vm = MultiDeployVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function run() external returns (TokvanERC1155Factory factory) {
        require(block.chainid == 11155111 || block.chainid == 31337, "Sepolia or local only");
        address technical = vm.envAddress("TECHNICAL_REVIEWER");
        address compliance = vm.envAddress("COMPLIANCE_REVIEWER");
        address board = vm.envAddress("BOARD_REVIEWER");
        address operator = vm.envAddress("FACTORY_OPERATOR");
        vm.startBroadcast();
        factory = new TokvanERC1155Factory(technical, compliance, board, operator);
        vm.stopBroadcast();
    }
}
