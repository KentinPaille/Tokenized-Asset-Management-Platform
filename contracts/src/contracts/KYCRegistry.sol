// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract KYCRegistry {
    mapping(address => bool) private _whitelist;
    mapping(address => bool) private _blacklist;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addToWhitelist(address user) external onlyOwner {
        _whitelist[user] = true;
    }

    function removeFromWhitelist(address user) external onlyOwner {
        _whitelist[user] = false;
    }

    function isWhitelisted(address user) external view returns (bool) {
        return _whitelist[user];
    }

    function addToBlacklist(address user) external onlyOwner {
        _blacklist[user] = true;
    }

    function removeFromBlacklist(address user) external onlyOwner {
        _blacklist[user] = false;
    }

    function isBlacklisted(address user) external view returns (bool) {
        return _blacklist[user];
    }
}
