// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {TokvanERC20Factory} from "../contracts/TokvanERC20Factory.sol";
interface DeployVm {
    function envAddress(string calldata) external returns (address);
    function startBroadcast() external;
    function stopBroadcast() external;
}
contract DeployERC20Factory {
    DeployVm constant vm = DeployVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function run() external returns (TokvanERC20Factory factory) {
        require(block.chainid == 11155111 || block.chainid == 31337, "Sepolia or local only");
        address technical = vm.envAddress("TECHNICAL_REVIEWER");
        address compliance = vm.envAddress("COMPLIANCE_REVIEWER");
        address board = vm.envAddress("BOARD_REVIEWER");
        address operator = vm.envAddress("FACTORY_OPERATOR");
        vm.startBroadcast();
        factory = new TokvanERC20Factory(technical, compliance, board, operator);
        vm.stopBroadcast();
    }
}
