// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "./IKYCRegistry.sol";

/// @title SoulboundKYCToken
/// @notice ERC20-like token where:
///  - decimals() == 0 (indivisible)
///  - non-transferrable: transfer/transferFrom/approve revert
///  - only one token can be minted per whitelisted address
///  - owner (or authorized service) mints 1 token to KYC'ed addresses
contract SoulboundKYCToken is ERC20, Ownable {
    IKYCRegistry public registry;
    uint256 public immutable MAX_SUPPLY;
    uint256 public totalSupplyCounter;
    mapping(address => bool) public minted;

    event MintedForKYC(address indexed to, uint256 indexed tokenId);

    constructor(
        string memory name_,
        string memory symbol_,
        address registry_,
        uint256 maxSupply_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        registry = IKYCRegistry(registry_);
        MAX_SUPPLY = maxSupply_;
        totalSupplyCounter = 0;
    }

    /// @notice decimals = 0 (one token = one person)
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// @notice Mint exactly 1 token to `to` if KYCed and not minted yet.
    /// Only owner (or delegated service) can call this.
    function mintForKyc(address to) external onlyOwner {
        require(to != address(0), "zero address");
        require(!minted[to], "already minted");
        require(totalSupplyCounter < MAX_SUPPLY, "max supply reached");
        require(registry.isWhitelisted(to), "Not KYCed");
        require(!registry.isBlacklisted(to), "Blacklisted");

        minted[to] = true;
        totalSupplyCounter += 1;
        _mint(to, 1);
        emit MintedForKYC(to, totalSupplyCounter);
    }

    /// @notice optionally allow owner to burn (e.g., revoke) one token from an address
    function revoke(address from) external onlyOwner {
        require(minted[from], "not minted");
        minted[from] = false;
        totalSupplyCounter -= 1;
        _burn(from, 1);
    }

    // -------- Disable transfer/approval functionality to make tokens non-transferable --------
    function transfer(address, uint256) public virtual override returns (bool) {
        revert("Soulbound: non transferable");
    }

    function transferFrom(address, address, uint256) public virtual override returns (bool) {
        revert("Soulbound: non transferable");
    }

    function approve(address, uint256) public virtual override returns (bool) {
        revert("Soulbound: non transferable");
    }
}
