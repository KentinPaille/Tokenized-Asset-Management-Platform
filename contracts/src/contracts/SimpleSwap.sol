// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IKYCRegistry.sol";

contract SimpleSwap {
    IERC20 public lazyToken;
    IERC20 public weth;
    IKYCRegistry public registry;
    
    // Prix : 1 LAZY = X WETH (ajustable)
    uint256 public pricePerLazy; // en wei de WETH
    
    constructor(address _lazy, address _weth, address _registry, uint256 _price) {
        lazyToken = IERC20(_lazy);
        weth = IERC20(_weth);
        registry = IKYCRegistry(_registry);
        pricePerLazy = _price;
    }
    
    // Acheter LAZY avec WETH
    function buyLazy(uint256 lazyAmount) external {
        require(registry.isWhitelisted(msg.sender), "Not KYC");
        
        uint256 wethNeeded = (lazyAmount * pricePerLazy) / 1e18;
        
        weth.transferFrom(msg.sender, address(this), wethNeeded);
        lazyToken.transfer(msg.sender, lazyAmount);
    }
    
    // Vendre LAZY pour WETH
    function sellLazy(uint256 lazyAmount) external {
        require(registry.isWhitelisted(msg.sender), "Not KYC");
        
        uint256 wethToSend = (lazyAmount * pricePerLazy) / 1e18;
        
        lazyToken.transferFrom(msg.sender, address(this), lazyAmount);
        weth.transfer(msg.sender, wethToSend);
    }
    
    // Owner peut ajouter de la liquidité
    function addLiquidity(uint256 lazyAmount, uint256 wethAmount) external {
        lazyToken.transferFrom(msg.sender, address(this), lazyAmount);
        weth.transferFrom(msg.sender, address(this), wethAmount);
    }

    /**
    * @notice Calculer combien de WETH nécessaire pour acheter X LAZY
    */
    function calculateBuyPrice(uint256 lazyAmount) external view returns (uint256 wethNeeded) {
        return (lazyAmount * pricePerLazy) / 1e18;
    }

    /**
    * @notice Calculer combien de WETH reçu pour vendre X LAZY
    */
    function calculateSellPrice(uint256 lazyAmount) external view returns (uint256 wethReceived) {
        return (lazyAmount * pricePerLazy) / 1e18;
    }

    /**
    * @notice Obtenir le prix actuel
    */
    function getPrice() external view returns (uint256) {
        return pricePerLazy;
    }

    /**
    * @notice Vérifier les réserves
    */
    function getReserves() external view returns (uint256 lazyReserve, uint256 wethReserve) {
        return (lazyToken.balanceOf(address(this)), weth.balanceOf(address(this)));
    }
}