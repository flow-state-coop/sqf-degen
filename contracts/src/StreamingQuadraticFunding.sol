// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.23;

// External Libraries
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import {
    ISuperToken,
    ISuperfluidPool
} from "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from
    "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {PoolConfig} from
    "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {SuperTokenV1Library} from
    "../lib/superfluid-protocol-monorepo/packages/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";

// Internal Libraries
import {RecipientSuperApp} from "./RecipientSuperApp.sol";
import {RecipientSuperAppFactory} from "./RecipientSuperAppFactory.sol";

contract StreamingQuadraticFunding is ReentrancyGuard {
    using SuperTokenV1Library for ISuperToken;
    using FixedPointMathLib for uint256;

    /// ================================
    /// ========== Struct ==============
    /// ================================

    /// @notice Metadata is used to define the metadata for the protocol that is used throughout the system.
    struct Metadata {
        /// @notice Protocol ID corresponding to a specific protocol (currently using IPFS = 1)
        uint256 protocol;
        /// @notice Pointer (hash) to fetch metadata for the specified protocol
        string pointer;
    }

    /// @notice Stores the details of the recipients.
    struct Recipient {
        address recipientAddress;
        Metadata metadata;
        RecipientSuperApp superApp;
    }

    /// @notice Stores the details needed for initializing contract
    struct InitializeParams {
        address superfluidHost;
        address allocationSuperToken;
        address poolSuperToken;
        address recipientSuperAppFactory;
        uint256 initialSuperAppBalance;
    }

    /// ==========================
    /// ======== Errors ==========
    /// ==========================

    /// @notice Throws when the caller is not the owner
    error UNAUTHORIZED();

    /// @notice Thrown as a general error when input / data is invalid
    error INVALID();

    /// @notice Thrown when the metadata is invalid.
    error INVALID_METADATA();

    /// @notice Thrown when there is an error in recipient.
    error RECIPIENT_ERROR(address recipientId);

    /// ======================
    /// ======= Events =======
    /// ======================

    /// @notice Emitted when the total units are updated
    /// @param recipientId ID of the recipient
    /// @param totalUnits The total units
    event TotalUnitsUpdated(address indexed recipientId, uint256 totalUnits);

    /// ================================
    /// ========== Storage =============
    /// ================================

    address public owner;
    uint256 public initialSuperAppBalance;
    /// @dev Available at https://console.superfluid.finance/
    /// @notice The host contract for the superfluid protocol
    address public superfluidHost;

    /// @notice The pool super token
    ISuperToken public allocationSuperToken;
    ISuperToken public poolSuperToken;

    /// @notice The recipient SuperApp factory
    RecipientSuperAppFactory public recipientSuperAppFactory;

    /// @notice The GDA pool which streams pool tokens to recipients
    ISuperfluidPool public gdaPool;

    /// @notice The details of the recipient are returned using their ID
    /// @dev recipientId => Recipient
    mapping(address => Recipient) public recipients;

    /// @notice stores the recipienId of each superApp
    /// @dev superApp => recipientId
    mapping(address => address) public superApps;

    /// @notice stores the total units for each recipient
    /// @dev recipientId => units
    mapping(address => uint256) public totalUnitsByRecipient;

    /// @notice stores the flow rate for each recipient
    /// @dev recipientId => flowRate
    mapping(address => uint256) public recipientFlowRate;

    /// ================================
    /// ========== Modifier ============
    /// ================================

    /// @notice Modifier to check if the caller is authorized
    /// @dev This will revert if the caller is not authorized.
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UNAUTHORIZED();
        }
        _;
    }

    /// ===============================
    /// ======== Constructor ==========
    /// ===============================

    /// @notice Constructor
    constructor() {
        owner = msg.sender;
    }

    /// ===============================
    /// ========= Initialize ==========
    /// ===============================

    // @notice Initialize the contract
    /// @dev This will revert if the contract is already initialized
    /// @param _data The data to be decoded
    function initialize(bytes memory _data) external onlyOwner {
        (InitializeParams memory params) = abi.decode(_data, (InitializeParams));

        if (
            params.superfluidHost == address(0) || params.allocationSuperToken == address(0)
                || params.initialSuperAppBalance == 0 || address(gdaPool) != address(0)
        ) revert INVALID();

        superfluidHost = params.superfluidHost;
        recipientSuperAppFactory = RecipientSuperAppFactory(params.recipientSuperAppFactory);
        allocationSuperToken = ISuperToken(params.allocationSuperToken);
        poolSuperToken = ISuperToken(params.poolSuperToken);
        initialSuperAppBalance = params.initialSuperAppBalance;
        gdaPool = SuperTokenV1Library.createPool(
            poolSuperToken,
            address(this), // pool admin
            PoolConfig(
                /// @dev if true, the pool members can transfer their owned units
                /// else, only the pool admin can manipulate the units for pool members
                false,
                /// @dev if true, anyone can execute distributions via the pool
                /// else, only the pool admin can execute distributions via the pool
                true
            )
        );
    }

    /// ====================================
    /// ============== Main ================
    /// ====================================

    /// @notice Register Recipient to the pool
    /// @param _recipientAddress The data to be decoded
    /// @param _metadata The metadata of the recipient
    function registerRecipient(address _recipientAddress, Metadata memory _metadata, address _checker) external onlyOwner {
        if ((bytes(_metadata.pointer).length == 0 || _metadata.protocol == 0)) {
            revert INVALID_METADATA();
        }

        if (_recipientAddress == address(0)) {
            revert RECIPIENT_ERROR(_recipientAddress);
        }

        Recipient storage recipient = recipients[_recipientAddress];

        recipient.recipientAddress = _recipientAddress;
        recipient.metadata = _metadata;

        if (superApps[_recipientAddress] == address(0)) {
            RecipientSuperApp superApp = recipientSuperAppFactory.createRecipientSuperApp(
                recipient.recipientAddress, address(this), superfluidHost, allocationSuperToken, true, true, true, _checker
            );

            allocationSuperToken.transfer(address(superApp), initialSuperAppBalance);

            // Add recipientAddress as member of the GDA with 1 unit
            _updateMemberUnits(_recipientAddress, recipient.recipientAddress, 1);

            superApps[address(superApp)] = _recipientAddress;
            recipient.superApp = superApp;
        }
    }

    /// @notice Adjust the weightings of the recipients
    /// @dev This can only be called by the super app callback onFlowUpdated
    /// @param _previousFlowRate The previous flow rate
    /// @param _newFlowRate The new flow rate
    function adjustWeightings(uint256 _previousFlowRate, uint256 _newFlowRate) external {
        address recipientId = superApps[msg.sender];

        if (recipientId == address(0)) revert UNAUTHORIZED();

        uint256 recipientTotalUnits = totalUnitsByRecipient[recipientId] * 1e5;

        if (_previousFlowRate == 0) {
            // created a new flow
            uint256 scaledFlowRate = _newFlowRate / 1e6;

            if (scaledFlowRate > 0) {
                recipientTotalUnits = (recipientTotalUnits.sqrt() + scaledFlowRate.sqrt()) ** 2;
            }
        } else if (_newFlowRate == 0) {
            // canceled a flow
            uint256 scaledFlowRate = _previousFlowRate / 1e6;

            if (scaledFlowRate > 0) {
                recipientTotalUnits =
                    recipientTotalUnits + scaledFlowRate - 2 * uint256(recipientTotalUnits * scaledFlowRate).sqrt();
            }
        } else {
            // updated a flow
            uint256 scaledNewFlowRate = _newFlowRate / 1e6;
            uint256 scaledPreviousFlowRate = _previousFlowRate / 1e6;

            if (scaledNewFlowRate != scaledPreviousFlowRate) {
                if (scaledNewFlowRate > 0) {
                    recipientTotalUnits =
                        (recipientTotalUnits.sqrt() + scaledNewFlowRate.sqrt() - scaledPreviousFlowRate.sqrt()) ** 2;
                } else if (scaledPreviousFlowRate > 0) {
                    recipientTotalUnits = recipientTotalUnits + scaledPreviousFlowRate
                        - 2 * uint256(recipientTotalUnits * scaledPreviousFlowRate).sqrt();
                }
            }
        }

        recipientTotalUnits = recipientTotalUnits > 1e5 ? recipientTotalUnits / 1e5 : 1;

        Recipient storage recipient = recipients[recipientId];

        _updateMemberUnits(recipientId, recipient.recipientAddress, uint128(recipientTotalUnits));

        uint256 currentFlowRate = recipientFlowRate[recipientId];

        recipientFlowRate[recipientId] = currentFlowRate + _newFlowRate - _previousFlowRate;

        emit TotalUnitsUpdated(recipientId, recipientTotalUnits);
    }

    /// =========================
    /// ==== View Functions =====
    /// =========================

    /// @notice Get the recipient
    /// @param _recipientId ID of the recipient
    /// @return The recipient
    function getRecipient(address _recipientId) external view returns (Recipient memory) {
        return _getRecipient(_recipientId);
    }

    /// @notice Get the recipientId of a super app
    /// @param _superApp The super app
    /// @return The recipientId
    function getRecipientId(address _superApp) external view returns (address) {
        return superApps[_superApp];
    }

    /// @notice Get the super app of a recipient
    /// @param _recipientId The ID of the recipient
    /// @return The super app
    function getSuperApp(address _recipientId) external view returns (RecipientSuperApp) {
        return recipients[_recipientId].superApp;
    }

    /// ====================================
    /// ============ Internal ==============
    /// ====================================

    /// @notice Getter for a recipient using the ID
    /// @param _recipientId ID of the recipient
    /// @return The recipient
    function _getRecipient(address _recipientId) internal view returns (Recipient memory) {
        return recipients[_recipientId];
    }

    /// @notice Update the total units for a recipient
    /// @param _recipientId ID of the recipient
    /// @param _recipientAddress Address of the recipient
    /// @param _units The units
    function _updateMemberUnits(address _recipientId, address _recipientAddress, uint128 _units) internal {
        gdaPool.updateMemberUnits(_recipientAddress, _units);
        totalUnitsByRecipient[_recipientId] = _units;
        emit TotalUnitsUpdated(_recipientId, _units);
    }
}
