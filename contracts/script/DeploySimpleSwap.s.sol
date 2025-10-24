// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "./../src/contracts/SimpleSwap.sol";
import "./../src/interfaces/IERC20Minimal.sol";
import "./../src/interfaces/IKYCRegistry.sol";
import "forge-std/console.sol";

contract DeploySimpleSwap is Script {
    address public TOKEN;
    address public KYC_REGISTRY;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    
    // Prix initial : 1 LAZY = 0.000009 WETH (environ le prix actuel de votre pool)
    uint256 constant INITIAL_PRICE = 9e12; // 0.000009 * 1e18 = 9000000000000
    
    function run() external {
        vm.startBroadcast();

        // Charger les adresses
        string memory path = string.concat(vm.projectRoot(), "/addresses/addresses.json");
        string memory json;
        try vm.readFile(path) returns (string memory content) {
            json = content;
        } catch {
            json = "{}";
        }
        TOKEN = vm.parseJsonAddress(json, ".erc20_contract");
        KYC_REGISTRY = vm.parseJsonAddress(json, ".registry_contract");

        console.log("Deploying SimpleSwap...");
        console.log("LAZY Token:", TOKEN);
        console.log("WETH:", WETH);
        console.log("KYC Registry:", KYC_REGISTRY);
        console.log("Initial Price:", INITIAL_PRICE);

        // Déployer SimpleSwap
        SimpleSwap swap = SimpleSwap(0x6FCD1B1e7acdc3feCa08ef5CD9055bc67a9ff518);

        console.log("SimpleSwap deployed at:", address(swap));
        
        IKYCRegistry kycRegistry = IKYCRegistry(KYC_REGISTRY);
        kycRegistry.addToWhitelist(address(swap));
        console.log("SwapRouter whitelisted");

        // Approuver le swap pour transférer les tokens
        IERC20Minimal(TOKEN).approve(address(swap), type(uint256).max);
        IERC20Minimal(WETH).approve(address(swap), type(uint256).max);

        // Ajouter liquidité initiale
        // 50 LAZY + 0.01 WETH
        uint256 lazyLiquidity = 50 * 1e18;
        uint256 wethLiquidity = 1e16; // 0.01 WETH
        
        swap.addLiquidity(lazyLiquidity, wethLiquidity);
        
        console.log("Initial liquidity added:");
        console.log("- LAZY:", lazyLiquidity / 1e18, "tokens");
        console.log("- WETH:", wethLiquidity);

        uint256 lazyReserve = IERC20Minimal(TOKEN).balanceOf(address(swap));
        uint256 wethReserve = IERC20Minimal(WETH).balanceOf(address(swap));
        console.log("Current reserves:");
        console.log("- LAZY reserve:", lazyReserve / 1e18);
        console.log("- WETH reserve:", wethReserve);

        // Sauvegarder l'adresse
        json = vm.serializeAddress("addresses", "simple_swap", address(swap));
        json = vm.serializeAddress("addresses", "erc20_contract", TOKEN);
        json = vm.serializeAddress("addresses", "registry_contract", KYC_REGISTRY);
        vm.writeJson(json, path);

        console.log("SimpleSwap address saved to addresses.json");

        vm.stopBroadcast();
    }
}