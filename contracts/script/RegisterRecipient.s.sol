// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {ISuperToken} from
    "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {StreamingQuadraticFunding} from "../src/StreamingQuadraticFunding.sol";

contract RegisterRecipient is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        StreamingQuadraticFunding streamingQuadraticFunding =
        StreamingQuadraticFunding(0xb2e43BaC91497020C2BCfF0d3658C1A0884771e5);
        ISuperToken superToken =
            ISuperToken(0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad);
        address recipientAddress = address(0);

        superToken.transfer(address(streamingQuadraticFunding), 1e8);
        streamingQuadraticFunding.registerRecipient(
            recipientAddress, StreamingQuadraticFunding.Metadata(1, "")
        );

        vm.stopBroadcast();
    }
}
