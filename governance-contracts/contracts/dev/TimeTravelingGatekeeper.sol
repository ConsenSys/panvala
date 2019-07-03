pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


import "../Gatekeeper.sol";
import "../ParameterStore.sol";

/**
 @dev An owned gatekeeper that lets the owner change the startTime
*/
contract TimeTravelingGatekeeper is Gatekeeper {
    address owner;
    int256 timeOffset;

    event TimeTraveled(int256 amount, uint256 startTime);

    constructor(uint _startTime, ParameterStore _parameters, IERC20 _token)
        Gatekeeper(_startTime, _parameters, _token) public {

        owner = msg.sender;
    }

    /**
    * @dev Move forward or backward in the epoch by adjusting the start time. Positive numbers move
    * into the future, while negative numbers move into the past. Only the owner can call this.
    * @param amount The number of seconds to shift by
     */
    function timeTravel(int256 amount) public {
        require(msg.sender == owner, "Only the owner");

        if (amount > 0) {
            startTime = startTime.sub(uint256(amount));
        } else {
            startTime = startTime.add(uint256(-amount));
        }
        emit TimeTraveled(amount, startTime);
    }
}
