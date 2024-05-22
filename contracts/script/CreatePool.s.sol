// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {StreamingQuadraticFunding} from "../src/StreamingQuadraticFunding.sol";
import {RecipientSuperAppFactory} from "../src/RecipientSuperAppFactory.sol";
import {PoolFactory} from "../src/PoolFactory.sol";

contract CreatePool is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        PoolFactory poolFactory = PoolFactory(0xcB15aE6b8C1c0A868c9c6494C49D65eFce23313A);
        address superfluidHost = 0xc1314EdcD7e478C831a7a24169F7dEADB2646eD2;
        address allocationSuperToken =
            0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad;
        address poolSuperToken = 0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad;
        address recipientSuperAppFactory =
            address(0x062a0AbeB052392005a49a0a4339d1aD4129C8EC);
        uint256 initialSuperAppBalance = 1e8;
        address checker = address(0);

        StreamingQuadraticFunding streamingQuadraticFunding = poolFactory
            .createPool(
            StreamingQuadraticFunding.Metadata(
                1, "QmekqBKMS4YR72b2Rxcs9ZJyrq4qSLNqgKihCR5qRV8T3q"
            ),
            abi.encode(
                vm.addr(deployerPrivateKey),
                superfluidHost,
                allocationSuperToken,
                poolSuperToken,
                recipientSuperAppFactory,
                initialSuperAppBalance,
                checker
            )
        );
        vm.stopBroadcast();

        console2.log(address(streamingQuadraticFunding));
    }
}
