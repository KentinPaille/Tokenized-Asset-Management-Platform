// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "./../src/interfaces/IUniswapV3Factory.sol";
import "./../src/interfaces/IUniswapV3Pool.sol";
import "./../src/interfaces/INonfungiblePositionManager.sol";
import "./../src/interfaces/IERC20Minimal.sol";
import "./../src/interfaces/IKYCRegistry.sol";
import "forge-std/console.sol";

contract AddLiquidityV3 is Script {
    address public TOKEN;
    address public KYC_REGISTRY;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant FACTORY = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;
    address constant POSITION_MANAGER = 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2;
    uint24 public constant FEE = 3000;

    function run() external {
        vm.startBroadcast();

        // Charger les adresses depuis le JSON
        string memory path = string.concat(vm.projectRoot(), "/addresses/addresses.json");
        string memory json;
        try vm.readFile(path) returns (string memory content) {
            json = content;
        } catch {
            json = "{}";
        }
        TOKEN = vm.parseJsonAddress(json, ".erc20_contract");
        KYC_REGISTRY = vm.parseJsonAddress(json, ".registry_contract");

        IUniswapV3Factory factory = IUniswapV3Factory(FACTORY);
        INonfungiblePositionManager positionManager = INonfungiblePositionManager(POSITION_MANAGER);
        IKYCRegistry kycRegistry = IKYCRegistry(KYC_REGISTRY);

        // Créer ou récupérer le pool
        address pool = factory.getPool(TOKEN, WETH, FEE);
        if (pool == address(0)) {
            pool = factory.createPool(TOKEN, WETH, FEE);
            uint160 sqrtPriceX96 = 250426189813841424972441600;
            IUniswapV3Pool(pool).initialize(sqrtPriceX96);
            console.log("Pool initialized");
        } else {
            console.log("Pool already exists:", pool);
        }

        // ✅ WHITELIST LE POOL ET LE POSITION MANAGER (sans staticcall)
        kycRegistry.addToWhitelist(pool);
        console.log("Pool whitelisted:", pool);

        kycRegistry.addToWhitelist(0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4);
        console.log("SwapRouter whitelisted");
        
        kycRegistry.addToWhitelist(POSITION_MANAGER);
        console.log("Position Manager whitelisted:", POSITION_MANAGER);

        // Approuver les tokens
        IERC20Minimal(TOKEN).approve(POSITION_MANAGER, type(uint256).max);
        IERC20Minimal(WETH).approve(POSITION_MANAGER, type(uint256).max);

        // Ajouter la liquidité
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: TOKEN,
            token1: WETH,
            fee: FEE,
            tickLower: -120000,
            tickUpper: -110040,
            amount0Desired: 100 * 1e18,
            amount1Desired: 1e16,
            amount0Min: 0,
            amount1Min: 0,
            recipient: msg.sender,
            deadline: block.timestamp + 600
        });

        (uint256 tokenId, , uint256 amount0, uint256 amount1) = positionManager.mint(params);

        console.log("Liquidity added!");
        console.log("Token ID:", tokenId);
        console.log("Amount0:", amount0);
        console.log("Amount1:", amount1);

        vm.stopBroadcast();
    }
}
