// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "./IKYCRegistry.sol";

contract TokenizedERC721 is ERC721, Ownable {
    IKYCRegistry public registry;
    uint256 private _nextId;

    constructor(
        string memory name_,
        string memory symbol_,
        address registry_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        registry = IKYCRegistry(registry_);
    }

    function mint(address to) external onlyOwner {
        require(registry.isWhitelisted(to), "Not KYCed");
        _mint(to, _nextId++);
    }

    // OpenZeppelin v5.x : utiliser `_update` au lieu de `_beforeTokenTransfer`
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        if (to != address(0)) {
            require(registry.isWhitelisted(to), "Recipient not KYCed");
            require(!registry.isBlacklisted(to), "Recipient blacklisted");
        }
        return super._update(to, tokenId, auth);
    }
}
