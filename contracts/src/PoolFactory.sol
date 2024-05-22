pragma solidity 0.8.23;

import {OwnableUpgradeable} from
    "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from
    "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from
    "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {StreamingQuadraticFunding} from "./StreamingQuadraticFunding.sol";

contract PoolFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // @notice The pool structure
    struct Pool {
        address poolAddress;
        StreamingQuadraticFunding.Metadata metadata;
    }

    /// @notice Emitted when the pool is created
    /// @param poolId The ID of the pool
    /// @param poolAddress The address of the pool
    /// @param token The address of the matching pool token
    /// @param metadata The metadata of the pool
    event PoolCreated(
        uint256 indexed poolId,
        address poolAddress,
        address token,
        StreamingQuadraticFunding.Metadata metadata
    );

    // @notice The pool counter to assign the pool ID
    uint256 public poolCounter;

    /// @notice Maps the `poolId` to a `poolAddress`
    /// @dev 'poolId' -> 'poolAddress'
    mapping(uint256 => Pool) private pools;

    constructor() {
        _disableInitializers();
    }

     function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // @notice Deploys and initializes a new pool
    // @param _initData The initialization data encoded as StreamingQuadraticFunding.InitializeParams
    function createPool(
        StreamingQuadraticFunding.Metadata memory metadata,
        bytes memory _initData
    ) external returns (StreamingQuadraticFunding poolAddress) {
        (StreamingQuadraticFunding.InitializeParams memory params) =
            abi.decode(_initData, (StreamingQuadraticFunding.InitializeParams));

        poolCounter++;

        poolAddress = new StreamingQuadraticFunding();

        StreamingQuadraticFunding(poolAddress).initialize(_initData);

        pools[poolCounter] = Pool(address(poolAddress), metadata);

        emit PoolCreated(
            poolCounter, address(poolAddress), params.poolSuperToken, metadata
        );
    }

    function getPool(uint256 _poolId) public view returns (Pool memory pool) {
        pool = pools[_poolId];
    }
}
