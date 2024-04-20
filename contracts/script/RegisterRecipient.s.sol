// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {
    ISuperToken
} from "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {StreamingQuadraticFunding} from "../src/StreamingQuadraticFunding.sol";
import {RecipientSuperAppFactory} from "../src/RecipientSuperAppFactory.sol";

contract RegisterRecipient is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        StreamingQuadraticFunding streamingQuadraticFunding = StreamingQuadraticFunding(0x533ed7bC8d5924d41D8b3a0ff0B45deAf2C7092d);
        ISuperToken superToken = ISuperToken(0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad);
        address recipientAddress = 0x0000000000000000000000000000000000000000;

        superToken.transfer(address(streamingQuadraticFunding), 1e8);
        streamingQuadraticFunding.registerRecipient(recipientAddress, StreamingQuadraticFunding.Metadata(1, "ipfs://"));

        vm.stopBroadcast();
    }
}
