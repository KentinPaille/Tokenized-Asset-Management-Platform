// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleOracle {
    address public owner;
    mapping(address => bool) public updaters;
    int256 public latestPrice;
    uint256 public lastUpdated;

    event PriceUpdated(int256 price, uint256 timestamp);
    event UpdaterAdded(address who);
    event UpdaterRemoved(address who);

    modifier onlyOwner() { require(msg.sender == owner, "only owner"); _; }
    modifier onlyUpdater() { require(msg.sender == owner || updaters[msg.sender], "not updater"); _; }

    constructor(int256 initialPrice) {
        owner = msg.sender;
        latestPrice = initialPrice;
        lastUpdated = block.timestamp;
    }

    function addUpdater(address u) external onlyOwner { updaters[u] = true; emit UpdaterAdded(u); }
    function removeUpdater(address u) external onlyOwner { updaters[u] = false; emit UpdaterRemoved(u); }

    function updatePrice(int256 price) external onlyUpdater {
        latestPrice = price;
        lastUpdated = block.timestamp;
        emit PriceUpdated(price, block.timestamp);
    }

    function getLatestPrice() external view returns (int256, uint256) { return (latestPrice, lastUpdated); }
}
