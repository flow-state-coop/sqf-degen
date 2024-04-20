// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {StreamingQuadraticFunding} from "../src/StreamingQuadraticFunding.sol";
import {RecipientSuperAppFactory} from "../src/RecipientSuperAppFactory.sol";

contract Initialize is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        StreamingQuadraticFunding streamingQuadraticFunding = StreamingQuadraticFunding(0x533ed7bC8d5924d41D8b3a0ff0B45deAf2C7092d);

        address superfluidHost = 0xc1314EdcD7e478C831a7a24169F7dEADB2646eD2;
        address allocationSuperToken = 0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad;
        address poolSuperToken = 0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad;
        address recipientSuperAppFactory = address(0x062a0AbeB052392005a49a0a4339d1aD4129C8EC);
        uint256 initialSuperAppBalance = 1e8;

        streamingQuadraticFunding.initialize(
            abi.encode(
                superfluidHost, allocationSuperToken, poolSuperToken, recipientSuperAppFactory, initialSuperAppBalance
            )
        );

        vm.stopBroadcast();
    }
}
