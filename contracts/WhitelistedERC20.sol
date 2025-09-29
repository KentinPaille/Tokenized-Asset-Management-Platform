// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./KYCRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract WhitelistedERC20 is ERC20, Ownable {
    KYCRegistry public registry;


    constructor(string memory name_, string memory symbol_, address registry_) ERC20(name_, symbol_) {
        registry = KYCRegistry(registry_);
    }


    function setRegistry(address reg) external onlyOwner {
        registry = KYCRegistry(reg);
    }


    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }


    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }


    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        if (from == address(0) || to == address(0)) return;
        require(registry.allowed(from), "sender not allowed");
        require(registry.allowed(to), "recipient not allowed");
    }
}