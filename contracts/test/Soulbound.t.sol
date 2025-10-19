// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/contracts/KYCRegistry.sol";
import "../src/contracts/SoulboundKYCToken.sol";

contract SoulboundTest is Test {
    KYCRegistry registry;
    SoulboundKYCToken token;
    address owner = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);

    function setUp() public {
        registry = new KYCRegistry();
        // set maxSupply small for test
        token = new SoulboundKYCToken("Soul", "S", address(registry), 1000);
    }

    function testMintRequiresKyc() public {
        // user1 not whitelisted -> mint should revert
        vm.expectRevert("Not KYCed");
        token.mintForKyc(user1);
    }

    function testMintAndNonTransferable() public {
        registry.addToWhitelist(user1);
        token.mintForKyc(user1);
        assertEq(token.balanceOf(user1), 1);
        // try transfer -> should revert with Soulbound message
        vm.prank(user1);
        vm.expectRevert("Soulbound: non transferable");
        token.transfer(user2, 1);
    }
}
