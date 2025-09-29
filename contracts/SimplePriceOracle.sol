// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/access/Ownable.sol";


contract SimplePriceOracle is Ownable {
    mapping(address => uint256) public priceFor;
    event PriceUpdated(address indexed token, uint256 price);


    function setPrice(address token, uint256 price18) external onlyOwner {
        priceFor[token] = price18;
        emit PriceUpdated(token, price18);
    }


    function getPrice(address token) external view returns (uint256) {
        return priceFor[token];
    }
}