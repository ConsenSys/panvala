pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


import "../Gatekeeper.sol";
import "../ParameterStore.sol";

/**
 @dev An owned gatekeeper that lets the owner change the startTime
*/
contract TimeTravelingGatekeeper is Gatekeeper {
    address owner;
    mapping(address => bool) whitelisted;
    int256 timeOffset;

    event TimeTraveled(int256 amount, uint256 startTime);
    event AddedToWhitelist(address account);
    event RemovedFromWhitelist(address account);

    constructor(uint _startTime, ParameterStore _parameters, IERC20 _token)
        Gatekeeper(_startTime, _parameters, _token) public {

        owner = msg.sender;
        whitelisted[msg.sender] = true;
    }

    /**
    * @dev Move forward or backward in the epoch by adjusting the start time. Positive numbers move
    * into the future, while negative numbers move into the past. Only whitelisted accounts can call
    * this.
    * @param amount The number of seconds to shift by
     */
    function timeTravel(int256 amount) public {
        require(whitelisted[msg.sender], "Only whitelisted");

        if (amount > 0) {
            startTime = startTime.sub(uint256(amount));
        } else {
            startTime = startTime.add(uint256(-amount));
        }
        emit TimeTraveled(amount, startTime);
    }

    function addToWhitelist(address account) public {
        require(msg.sender == owner, "Only owner");

        whitelisted[account] = true;

        emit AddedToWhitelist(account);
    }

    function removeFromWhitelist(address account) public {
        require(msg.sender == owner, "Only owner");

        whitelisted[account] = false;

        emit RemovedFromWhitelist(account);
    }

    function isWhitelisted(address account) public view returns(bool) {
        return whitelisted[account];
    }
}
