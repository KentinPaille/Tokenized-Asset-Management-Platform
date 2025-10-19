// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/contracts/KYCRegistry.sol";
import "../src/contracts/TokenizedERC20.sol";

contract KYCRegistryTest is Test {
    KYCRegistry registry;
    TokenizedERC20 token;
    address user1 = address(0x1);
    address user2 = address(0x2);

    function setUp() public {
        registry = new KYCRegistry();
        token = new TokenizedERC20("TestToken", "TTK", address(registry));

        registry.addToWhitelist(user1);
        token.mint(user1, 1000 ether);
    }

    function testTransferWithoutKYCShouldFail() public {
        vm.expectRevert();
        vm.prank(user1);
        token.transfer(user2, 100 ether);
    }

    function testTransferWithKYCShouldSucceed() public {
        registry.addToWhitelist(user2);
        vm.prank(user1);
        token.transfer(user2, 100 ether);
        assertEq(token.balanceOf(user2), 100 ether);
    }

    function testBlacklistPreventsTransfer() public {
        registry.addToWhitelist(user2);
        registry.addToBlacklist(user2);
        vm.expectRevert();
        vm.prank(user1);
        token.transfer(user2, 100 ether);
    }
}
