// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.23;

import {
    ISuperfluid,
    ISuperToken,
    SuperAppDefinitions
} from "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import "./RecipientSuperApp.sol";

contract RecipientSuperAppFactory {
    function createRecipientSuperApp(
        address _recipient,
        address _streamingQuadraticFunding,
        address _host,
        ISuperToken _acceptedToken,
        bool _activateOnCreated,
        bool _activateOnUpdated,
        bool _activateOnDeleted,
        address _checker
    ) public returns (RecipientSuperApp recipientSuperApp) {
        ISuperfluid host = ISuperfluid(_host);

        uint256 callBackDefinitions =
            SuperAppDefinitions.APP_LEVEL_FINAL | SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP;

        if (!_activateOnCreated) {
            callBackDefinitions |= SuperAppDefinitions.AFTER_AGREEMENT_CREATED_NOOP;
        }

        if (!_activateOnUpdated) {
            callBackDefinitions |=
                SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP | SuperAppDefinitions.AFTER_AGREEMENT_UPDATED_NOOP;
        }

        if (!_activateOnDeleted) {
            callBackDefinitions |= SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP
                | SuperAppDefinitions.AFTER_AGREEMENT_TERMINATED_NOOP;
        }

        recipientSuperApp = new RecipientSuperApp(_recipient, _streamingQuadraticFunding, _host, _acceptedToken, _checker);

        host.registerApp(recipientSuperApp, callBackDefinitions);
    }
}
