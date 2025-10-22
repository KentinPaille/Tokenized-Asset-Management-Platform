// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "@uniswap/v3-core/contracts/UniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Script pour créer un pool Uniswap V3 et y ajouter de la liquidité initiale
contract AddLiquidityV3 is Script {
    // ⚙️ Adresse de ton token ERC20 déployé
    address constant TOKEN = 0x0077a8005D7B0f9412ECF88E21f7c5018bd61c94; // <-- Remplace par ton TokenizedERC20
    address constant WETH = 0x4200000000000000000000000000000000000006; // WETH sur Base Sepolia

    // ⚙️ Adresse des contrats déployés via DeployDexV3
    address constant FACTORY = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;
    address constant POSITION_MANAGER = 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2;

    // Fee tiers Uniswap (0.3% = 3000)
    uint24 public constant FEE = 3000;

    function run() external {
        vm.startBroadcast();

        UniswapV3Factory factory = UniswapV3Factory(FACTORY);
        INonfungiblePositionManager positionManager =
            INonfungiblePositionManager(POSITION_MANAGER);

        // 1️⃣ Créer le pool si inexistant
        address pool = factory.createPool(TOKEN, WETH, FEE);
        console.log("Pool built:", pool);

        // 2️⃣ Initialiser le prix du pool (1 token = 0.01 WETH ici)
        uint160 sqrtPriceX96 = 79228162514264337593543950336 / 10; // sqrt(1/100) * 2^96
        IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        console.log("Pool initialized with price 1:100");

        // 3️⃣ Autoriser le PositionManager à dépenser les tokens
        IERC20(TOKEN).approve(POSITION_MANAGER, type(uint256).max);
        IERC20(WETH).approve(POSITION_MANAGER, type(uint256).max);

        // 4️⃣ Ajouter de la liquidité initiale
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: TOKEN,
            token1: WETH,
            fee: FEE,
            tickLower: -887220, // plage entière
            tickUpper: 887220,
            amount0Desired: 1_000 * 1e18, // 1000 TokenizedERC20
            amount1Desired: 0.01 * 1e18,    // 0.01 WETH
            amount0Min: 0,
            amount1Min: 0,
            recipient: msg.sender,
            deadline: block.timestamp + 600
        });

        (uint256 tokenId,, uint256 amount0, uint256 amount1) =
            positionManager.mint(params);

        console.log("Liquidity added to the pool!");
        console.log("Token ID :", tokenId);
        console.log("Amount0 (TokenizedERC20) :", amount0);
        console.log("Amount1 (WETH) :", amount1);

        vm.stopBroadcast();
    }
}
