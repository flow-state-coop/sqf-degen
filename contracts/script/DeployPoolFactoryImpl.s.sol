// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {RecipientSuperAppFactory} from "../src/RecipientSuperAppFactory.sol";
import {PoolFactory} from "../src/PoolFactory.sol";

contract DeployPoolFactoryImpl is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        new PoolFactory();

        vm.stopBroadcast();
    }
}
