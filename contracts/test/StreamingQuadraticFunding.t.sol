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

contract StreamingQuadraticFundingTesD is Test {
    using SuperTokenV1Library for ISuperToken;

    StreamingQuadraticFunding _strategy;

    address superfluidHost;
    address allocationSuperToken;
    address poolSuperToken;
    address recipientSuperAppFactory;
    uint256 initialSuperAppBalance;

    address recipientId = makeAddr("recipient");
    address secondAllocator = makeAddr("second");

    ISuperToken superToken = ISuperToken(0x0043d7c85C8b96a49A72A92C0B48CdC4720437d7);
    address superTokenWhale = 0x1a8b3554089d97Ad8656eb91F34225bf97055C68;

    function setUp() public {
        vm.createSelectFork({blockNumber: 10863728, urlOrAlias: "opsepolia"});

        _strategy = new StreamingQuadraticFunding();

        vm.startPrank(superTokenWhale);
        superToken.transfer(address(this), 1e17);
        superToken.transfer(address(_strategy), 1e16);
        superToken.transfer(secondAllocator, 1e16);

        vm.stopPrank();

        superfluidHost = address(0xd399e2Fb5f4cf3722a11F65b88FAB6B2B8621005);
        allocationSuperToken = address(superToken);
        poolSuperToken = address(superToken);
        recipientSuperAppFactory = address(new RecipientSuperAppFactory());
        initialSuperAppBalance = 420 * 1e8;

        _strategy.initialize(
            abi.encode(
                superfluidHost, allocationSuperToken, poolSuperToken, recipientSuperAppFactory, initialSuperAppBalance
            )
        );
    }

    function test_registerRecipient() public {
        _strategy.registerRecipient(recipientId, StreamingQuadraticFunding.Metadata(1, "test"));

        StreamingQuadraticFunding.Recipient memory recipient = _strategy.getRecipient(recipientId);

        assertEq(recipient.recipientAddress, recipientId);
        assertNotEq(address(recipient.superApp), address(0));

        StreamingQuadraticFunding.Metadata memory metadata = recipient.metadata;

        assertEq(metadata.protocol, 1);
        assertEq(metadata.pointer, "test");
    }

    function test_registerRecipient_unauthorized() public {
        vm.prank(secondAllocator);
        vm.expectRevert(StreamingQuadraticFunding.UNAUTHORIZED.selector);

        _strategy.registerRecipient(recipientId, StreamingQuadraticFunding.Metadata(1, "test"));
    }

    function test_createFlow() public {
        _strategy.registerRecipient(recipientId, StreamingQuadraticFunding.Metadata(1, "test"));
        superToken.distributeFlow(address(this), _strategy.gdaPool(), 1e9);
        address superApp = address(_strategy.getSuperApp(recipientId));

        superToken.createFlow(superApp, 420 * 1e8);
        assertEq(_strategy.totalUnitsByRecipient(recipientId), 2);
        assertEq(_strategy.recipientFlowRate(recipientId), 420 * 1e8);

        SuperfluidPool gdaPool = SuperfluidPool(address(_strategy.gdaPool()));
        int96 netFlowGDA = superToken.getNetFlowRate(address(gdaPool));
        uint128 totalUnits = gdaPool.getTotalUnits();

        assertTrue(uint96(netFlowGDA) > totalUnits);
    }

    function test_updateFlow() public {
        _strategy.registerRecipient(recipientId, StreamingQuadraticFunding.Metadata(1, "test"));
        address superApp = address(_strategy.getSuperApp(recipientId));

        superToken.createFlow(superApp, 420 * 1e8);

        vm.warp(block.timestamp + 100);

        assertEq(_strategy.totalUnitsByRecipient(recipientId), 2);
        assertEq(_strategy.recipientFlowRate(recipientId), 420 * 1e8);

        superToken.updateFlow(superApp, 1000 * 1e8);

        assertEq(_strategy.totalUnitsByRecipient(recipientId), 3);
        assertEq(_strategy.recipientFlowRate(recipientId), 1000 * 1e8);
    }

    function test_deleteFlow() public {
        _strategy.registerRecipient(recipientId, StreamingQuadraticFunding.Metadata(1, "test"));
        address superApp = address(_strategy.getSuperApp(recipientId));

        superToken.createFlow(superApp, 420 * 1e8);

        assertEq(_strategy.totalUnitsByRecipient(recipientId), 2);
        assertEq(_strategy.recipientFlowRate(recipientId), 420 * 1e8);

        vm.warp(block.timestamp + 100);
        superToken.deleteFlow(address(this), superApp);

        assertEq(_strategy.totalUnitsByRecipient(recipientId), 1);
        assertEq(_strategy.recipientFlowRate(recipientId), 0);
        assertEq(__check_superAppJailed(superApp), false);
    }

    function test_deleteFlow_multiple_times() public {
        _strategy.registerRecipient(recipientId, StreamingQuadraticFunding.Metadata(1, "test"));
        address superApp = address(_strategy.getSuperApp(recipientId));

        superToken.createFlow(superApp, 420 * 1e8);

        assertEq(_strategy.totalUnitsByRecipient(recipientId), 2);
        assertEq(_strategy.recipientFlowRate(recipientId), 420 * 1e8);

        vm.warp(block.timestamp + 100);
        superToken.deleteFlow(address(this), superApp);

        assertEq(_strategy.totalUnitsByRecipient(recipientId), 1);
        assertEq(_strategy.recipientFlowRate(recipientId), 0);
        assertEq(__check_superAppJailed(superApp), false);

        vm.warp(block.timestamp + 100);

        superToken.createFlow(superApp, 420 * 1e8);

        assertEq(_strategy.totalUnitsByRecipient(recipientId), 2);
        assertEq(_strategy.recipientFlowRate(recipientId), 420 * 1e8);

        vm.warp(block.timestamp + 100);
        superToken.deleteFlow(address(this), superApp);

        assertEq(_strategy.totalUnitsByRecipient(recipientId), 1);
        assertEq(_strategy.recipientFlowRate(recipientId), 0);
        assertEq(__check_superAppJailed(superApp), false);
    }

    function test_superAppEmergencyWithdraw() public {
        _strategy.registerRecipient(recipientId, StreamingQuadraticFunding.Metadata(1, "test"));
        StreamingQuadraticFunding.Recipient memory recipient = _strategy.getRecipient(recipientId);

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
        _strategy.registerRecipient(recipientId, StreamingQuadraticFunding.Metadata(1, "test"));

        StreamingQuadraticFunding.Recipient memory recipient = _strategy.getRecipient(recipientId);

        vm.prank(secondAllocator);
        vm.expectRevert(StreamingQuadraticFunding.UNAUTHORIZED.selector);
        recipient.superApp.emergencyWithdraw(address(superToken));
    }

    function __check_superAppJailed(address superApp) internal view returns (bool isSuperAppJailed) {
        isSuperAppJailed = ISuperfluid(superfluidHost).isAppJailed(ISuperApp(superApp));
    }
}
