// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.23;

import {IChecker} from "./interfaces/IChecker.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MultiERC721Checker is IChecker {
    IERC721[] public erc721s;

    constructor(address[] memory definitiveERC721s) {
        erc721s = new IERC721[](definitiveERC721s.length);
        for (uint256 i = 0; i < definitiveERC721s.length; i++) {
            erc721s[i] = IERC721(definitiveERC721s[i]);
        }
    }

    function isValidAllocator(address _allocator) external view override returns (bool) {
        for (uint256 i = 0; i < erc721s.length; i++) {
            if (erc721s[i].balanceOf(_allocator) > 0) {
                return true;
            }
        }
        return false;
    }
}
