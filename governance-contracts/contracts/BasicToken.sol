pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract BasicToken is ERC20, ERC20Detailed {
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint _initialSupply)
        public
        ERC20Detailed(_name, _symbol, _decimals)
    {
        // Creator gets the initial supply
        _mint(msg.sender, _initialSupply);
    }
}
