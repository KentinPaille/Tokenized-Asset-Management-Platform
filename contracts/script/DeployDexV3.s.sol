// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "@uniswap/v3-core/contracts/UniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/SwapRouter.sol";
import "@uniswap/v3-periphery/contracts/NonfungiblePositionManager.sol";

contract DeployDexV3 is Script {
    function run() external {
        vm.startBroadcast();

        // 1️⃣ Déployer la Factory
        UniswapV3Factory factory = new UniswapV3Factory();

        // 2️⃣ Déployer le SwapRouter (besoin de WETH)
        address WETH = 0x4200000000000000000000000000000000000006; // WETH sur Base Sepolia
        SwapRouter router = new SwapRouter(address(factory), WETH);

        // 3️⃣ Déployer le gestionnaire de positions
        NonfungiblePositionManager positionManager =
            new NonfungiblePositionManager(address(factory), WETH);

        vm.stopBroadcast();

        console.log("Factory: ", address(factory));
        console.log("Router: ", address(router));
        console.log("PositionManager: ", address(positionManager));
    }
}
