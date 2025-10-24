// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "../interfaces/IKYCRegistry.sol";

contract TokenizedERC20 is ERC20, Ownable {
    IKYCRegistry public registry;

    constructor(
        string memory name_,
        string memory symbol_,
        address registry_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        registry = IKYCRegistry(registry_);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(registry.isWhitelisted(to), "Not KYCed");
        _mint(to, amount);
    }

    // OpenZeppelin v5.x utilise `_update` à la place de `_beforeTokenTransfer`
    function _update(address from, address to, uint256 amount)
        internal
        override
    {
        if (from != address(0)) {
            require(!registry.isBlacklisted(from), "Sender blacklisted");
        }
        if (to != address(0)) {
            require(registry.isWhitelisted(to), "Recipient not KYCed");
            require(!registry.isBlacklisted(to), "Recipient blacklisted");
        }
        super._update(from, to, amount);
    }
}
