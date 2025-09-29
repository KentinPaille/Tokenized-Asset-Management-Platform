// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/access/Ownable.sol";


contract KYCRegistry is Ownable {
    mapping(address => bool) public whitelisted;
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public admins;


    event Whitelisted(address indexed user);
    event Delisted(address indexed user);
    event Blacklisted(address indexed user);
    event UnBlacklisted(address indexed user);
    event AdminUpdated(address indexed admin, bool enabled);


    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "not admin");
        _;
    }


    function setAdmin(address admin, bool enabled) external onlyOwner {
        admins[admin] = enabled;
        emit AdminUpdated(admin, enabled);
    }


    function setWhitelisted(address user, bool ok) external onlyAdmin {
        whitelisted[user] = ok;
        if (ok) emit Whitelisted(user);
        else emit Delisted(user);
    }


    function setBlacklisted(address user, bool bad) external onlyAdmin {
        blacklisted[user] = bad;
        if (bad) emit Blacklisted(user);
        else emit UnBlacklisted(user);
    }


    function allowed(address user) external view returns (bool) {
        if (blacklisted[user]) return false;
        return whitelisted[user];
    }
}