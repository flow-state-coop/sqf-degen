// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.23;

import { IChecker } from "./interfaces/IChecker.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ERC721Checker is IChecker {
    IERC721 public immutable erc721;

    constructor(address definitiveERC721) {
        erc721 = IERC721(definitiveERC721);
    }

    function isValidAllocator(address _allocator) external view override returns (bool) {
        return IERC721(_allocator).balanceOf(address(this)) > 0;
    }
}
