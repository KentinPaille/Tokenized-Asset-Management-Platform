// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// import "forge-std/Script.sol";
// import "./../src/interfaces/IUniswapV3Factory.sol";
// import "./../src/interfaces/IUniswapV3Pool.sol";
// import "./../src/interfaces/INonfungiblePositionManager.sol";
// import "./../src/interfaces/IERC20Minimal.sol";

// contract DeployDexV3 is Script {
//     function run() external {
//         vm.startBroadcast();

//         // 1️⃣ Déployer la Factory
//         IUniswapV3Factory factory = new IUniswapV3Factory();

//         // 2️⃣ Déployer le SwapRouter (besoin de WETH)
//         address WETH = 0x4200000000000000000000000000000000000006; // WETH sur Base Sepolia
//         ISwapRouter router = new ISwapRouter(address(factory), WETH);

//         // 3️⃣ Déployer le gestionnaire de positions
//         INonfungiblePositionManager positionManager =
//             new INonfungiblePositionManager(address(factory), WETH);

//         vm.stopBroadcast();

//         console.log("Factory: ", address(factory));
//         console.log("Router: ", address(router));
//         console.log("PositionManager: ", address(positionManager));
//     }
// }
