// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IERC20Minimal.sol";

contract ERC20Oracle {
    address public token;
    uint256 public price; // prix en wei (ETH) ou en USD * 1e18
    address public owner;

    event PriceUpdated(uint256 newPrice);

    constructor(address _token) {
        token = _token;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // Mise à jour du prix par l'oracle (off-chain)
    function updatePrice(uint256 _price) external onlyOwner {
        price = _price;
        emit PriceUpdated(_price);
    }

    // Lecture du prix
    function getPrice() external view returns (uint256) {
        return price;
    }
}
