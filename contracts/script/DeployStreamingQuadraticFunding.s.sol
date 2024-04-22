// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {StreamingQuadraticFunding} from "../src/StreamingQuadraticFunding.sol";

contract DeployStreamingQuadraticFunding is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        new StreamingQuadraticFunding();

        vm.stopBroadcast();
    }
}
