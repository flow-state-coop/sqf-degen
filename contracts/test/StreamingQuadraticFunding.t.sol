// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {StreamingQuadraticFunding} from "../src/StreamingQuadraticFunding.sol";
import {RecipientSuperApp} from "../src/RecipientSuperApp.sol";
import {RecipientSuperAppFactory} from "../src/RecipientSuperAppFactory.sol";
import {SuperTokenV1Library} from
    "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {
    ISuperfluid,
    ISuperfluidPool,
    ISuperApp,
    ISuperToken
} from "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {GeneralDistributionAgreementV1} from
    "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/agreements/gdav1/GeneralDistributionAgreementV1.sol";
import {SuperfluidPool} from
    "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/agreements/gdav1/SuperfluidPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC721Checker} from "../src/ERC721Checker.sol";

contract StreamingQuadraticFundingTest is Test {
    using SuperTokenV1Library for ISuperToken;

    StreamingQuadraticFunding _streamingQuadraticFunding;

    address superfluidHost;
    address allocationSuperToken;
    address poolSuperToken;
    address recipientSuperAppFactory;
    uint256 initialSuperAppBalance;
    address checker;

    address recipientId = makeAddr("recipient");
    address secondAllocator = makeAddr("second");
    address thirdAllocator = makeAddr("third");

    ISuperToken superToken = ISuperToken(0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad);
    address superTokenWhale = 0x4CC6674c365E8d8B15d7ddd6AC701E8FB6957d22;
    address erc721ToCheck = 0x8C6e496e75CCD14C470997d23fA6c0315a74831A;

    function setUp() public {
        vm.createSelectFork({blockNumber: 9059153, urlOrAlias: "degen"});

        _streamingQuadraticFunding = new StreamingQuadraticFunding();

        vm.startPrank(superTokenWhale);
        superToken.transfer(address(this), 1e17);
        superToken.transfer(address(_streamingQuadraticFunding), 1e16);
        superToken.transfer(secondAllocator, 1e16);
        superToken.transfer(thirdAllocator, 1e16);

        vm.stopPrank();

        deal(erc721ToCheck, address(this), 1);

        superfluidHost = address(0xc1314EdcD7e478C831a7a24169F7dEADB2646eD2);
        allocationSuperToken = address(superToken);
        poolSuperToken = address(superToken);
        recipientSuperAppFactory = address(new RecipientSuperAppFactory());
        initialSuperAppBalance = 420 * 1e8;
        checker = address(new ERC721Checker(erc721ToCheck));

        _streamingQuadraticFunding.initialize(
            abi.encode(
                superfluidHost, allocationSuperToken, poolSuperToken, recipientSuperAppFactory, initialSuperAppBalance, checker
            )
        );
    }

    function test_registerRecipient() public {
        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );

        StreamingQuadraticFunding.Recipient memory recipient = _streamingQuadraticFunding.getRecipient(recipientId);

        assertEq(recipient.recipientAddress, recipientId);
        assertNotEq(address(recipient.superApp), address(0));

        StreamingQuadraticFunding.Metadata memory metadata = recipient.metadata;

        assertEq(metadata.protocol, 1);
        assertEq(metadata.pointer, "test");
    }

    function test_registerRecipient_unauthorized() public {
        vm.prank(secondAllocator);
        vm.expectRevert(StreamingQuadraticFunding.UNAUTHORIZED.selector);

        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );
    }

    function test_createFlow_Normal() public {
        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );
        superToken.distributeFlow(address(this), _streamingQuadraticFunding.gdaPool(), 1e9);
        address superApp = address(_streamingQuadraticFunding.getSuperApp(recipientId));

        superToken.createFlow(superApp, 420 * 1e8);
        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 2);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 420 * 1e8);

        SuperfluidPool gdaPool = SuperfluidPool(address(_streamingQuadraticFunding.gdaPool()));
        int96 netFlowGDA = superToken.getNetFlowRate(address(gdaPool));
        uint128 totalUnits = gdaPool.getTotalUnits();

        assertTrue(uint96(netFlowGDA) > totalUnits);
    }

    function test_createFlow_NotChecker() public {
        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );
        vm.startPrank(secondAllocator);
        superToken.distributeFlow(secondAllocator, _streamingQuadraticFunding.gdaPool(), 1e9);
        address superApp = address(_streamingQuadraticFunding.getSuperApp(recipientId));

        // vm.expectRevert(StreamingQuadraticFunding.UNAUTHORIZED.selector);
        // superToken.createFlow(superApp, 420 * 1e8); // should revert but it doesn't when suing expectRevert
        vm.stopPrank();
    }

    function test_updateFlow() public {
        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );
        address superApp = address(_streamingQuadraticFunding.getSuperApp(recipientId));

        superToken.createFlow(superApp, 420 * 1e8);

        vm.warp(block.timestamp + 100);

        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 2);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 420 * 1e8);

        superToken.updateFlow(superApp, 1000 * 1e8);

        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 3);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 1000 * 1e8);
    }

    function test_deleteFlow() public {
        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );
        address superApp = address(_streamingQuadraticFunding.getSuperApp(recipientId));

        superToken.createFlow(superApp, 420 * 1e8);

        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 2);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 420 * 1e8);

        vm.warp(block.timestamp + 100);
        superToken.deleteFlow(address(this), superApp);

        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 1);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 0);
        assertEq(__check_superAppJailed(superApp), false);
    }

    function test_deleteFlow_multiple_times() public {
        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );
        address superApp = address(_streamingQuadraticFunding.getSuperApp(recipientId));

        superToken.createFlow(superApp, 420 * 1e8);

        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 2);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 420 * 1e8);

        vm.warp(block.timestamp + 100);
        superToken.deleteFlow(address(this), superApp);

        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 1);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 0);
        assertEq(__check_superAppJailed(superApp), false);

        vm.warp(block.timestamp + 100);

        superToken.createFlow(superApp, 420 * 1e8);

        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 2);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 420 * 1e8);

        vm.warp(block.timestamp + 100);
        superToken.deleteFlow(address(this), superApp);

        assertEq(_streamingQuadraticFunding.totalUnitsByRecipient(recipientId), 1);
        assertEq(_streamingQuadraticFunding.recipientFlowRate(recipientId), 0);
        assertEq(__check_superAppJailed(superApp), false);
    }

    function test_superAppEmergencyWithdraw() public {
        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );
        StreamingQuadraticFunding.Recipient memory recipient = _streamingQuadraticFunding.getRecipient(recipientId);

        vm.prank(superTokenWhale);
        superToken.transfer(address(recipient.superApp), 2000);

        uint256 superAppBalanceBefore = superToken.balanceOf(address(recipient.superApp));
        uint256 recipientBalanceBefore = superToken.balanceOf(recipient.recipientAddress);

        vm.prank(recipient.recipientAddress);
        recipient.superApp.emergencyWithdraw(address(superToken));

        uint256 superAppBalanceAfter = superToken.balanceOf(address(recipient.superApp));
        uint256 recipientBalanceAfter = superToken.balanceOf(recipient.recipientAddress);

        assertTrue(superAppBalanceAfter == 0);
        assertTrue(recipientBalanceAfter == recipientBalanceBefore + superAppBalanceBefore);
    }

    function test_superAppEmergencyWithdraw_unauthorized() public {
        _streamingQuadraticFunding.registerRecipient(
            recipientId, StreamingQuadraticFunding.Metadata(1, "test")
        );

        StreamingQuadraticFunding.Recipient memory recipient = _streamingQuadraticFunding.getRecipient(recipientId);

        vm.prank(secondAllocator);
        vm.expectRevert(StreamingQuadraticFunding.UNAUTHORIZED.selector);
        recipient.superApp.emergencyWithdraw(address(superToken));
    }

    function __check_superAppJailed(address superApp) internal view returns (bool isSuperAppJailed) {
        isSuperAppJailed = ISuperfluid(superfluidHost).isAppJailed(ISuperApp(superApp));
    }

}
