// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {PoolFactory} from "../src/PoolFactory.sol";

contract DeployPoolFactoryProxy is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        new ERC1967Proxy(0x0C323adb863485856369c1baAc38E26B0E1E9564, "");

        vm.stopBroadcast();
    }
}
