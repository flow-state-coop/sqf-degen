// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {ERC721Checker} from "../src/ERC721Checker.sol";

contract DeployChecker is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address ERC721 = 0x8C6e496e75CCD14C470997d23fA6c0315a74831A;

        ERC721Checker checker = new ERC721Checker(ERC721);
        console.log("Deployed checker at", address(checker));

        vm.stopBroadcast();
    }
}
