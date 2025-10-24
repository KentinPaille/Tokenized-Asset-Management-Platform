// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKYCRegistry {
    function isWhitelisted(address user) external view returns (bool);
    function isBlacklisted(address user) external view returns (bool);
    function addToWhitelist(address user) external;
}
