// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.23;

interface IChecker {
    function isValidAllocator(address _allocator)
        external
        view
        returns (bool);
}
