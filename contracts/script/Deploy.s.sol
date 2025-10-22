// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/contracts/KYCRegistry.sol";
import "../src/contracts/TokenizedERC20.sol";
import "../src/contracts/TokenizedERC721.sol";
import "../src/contracts/SoulboundKYCToken.sol";
import "../src/contracts/SimpleOracle.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        // On charge le fichier JSON contenant les adresses
        string memory path = string.concat(vm.projectRoot(), "/addresses/addresses.json");

        // S'il existe déjà, on récupère les valeurs
        string memory json;
        try vm.readFile(path) returns (string memory content) {
            json = content;
        } catch {
            json = "{}"; // fichier vide la première fois
        }

        address registryAddr = vm.parseJsonAddress(json, ".registry_contract");
        address erc20Addr = vm.parseJsonAddress(json, ".erc20_contract");
        address erc721Addr = vm.parseJsonAddress(json, ".erc721_contract");
        address soulboundAddr = vm.parseJsonAddress(json, ".soulbound_contract");
        address oracleAddr = vm.parseJsonAddress(json, ".oracle_contract");

        // Déploiement conditionnel
        if (registryAddr == address(0)) {
            KYCRegistry registry = new KYCRegistry();
            registryAddr = address(registry);
            console.log("Deployed KYCRegistry at", registryAddr);
        } else {
            console.log("Using existing KYCRegistry:", registryAddr);
        }

        if (erc20Addr == address(0)) {
            TokenizedERC20 erc20 = new TokenizedERC20("RealEstateToken", "RET", registryAddr);
            erc20Addr = address(erc20);
            console.log("Deployed TokenizedERC20 at", erc20Addr);
        } else {
            console.log("Using existing ERC20:", erc20Addr);
        }

        if (erc721Addr == address(0)) {
            TokenizedERC721 erc721 = new TokenizedERC721("DiamondCollection", "DMD", registryAddr);
            erc721Addr = address(erc721);
            console.log("Deployed TokenizedERC721 at", erc721Addr);
        } else {
            console.log("Using existing ERC721:", erc721Addr);
        }

        if (soulboundAddr == address(0)) {
            SoulboundKYCToken soulbound = new SoulboundKYCToken(
                "KYC Soulbound Token",
                "KST",
                registryAddr,
                10000
            );
            soulboundAddr = address(soulbound);
            console.log("Deployed SoulboundKYCToken at", soulboundAddr);
        } else {
            console.log("Using existing SoulboundKYCToken:", soulboundAddr);
        }

        if (oracleAddr == address(0)) {
            SimpleOracle oracle = new SimpleOracle(0);
            oracleAddr = address(oracle);
            console.log("Deployed SimpleOracle at", oracleAddr);
        } else {
            console.log("Using existing SimpleOracle:", oracleAddr);
        }

        // Génération du JSON à jour
        string memory out = string.concat(
            '{"registry_contract":"',
            vm.toString(registryAddr),
            '","erc20_contract":"',
            vm.toString(erc20Addr),
            '","erc721_contract":"',
            vm.toString(erc721Addr),
            '","soulbound_contract":"',
            vm.toString(soulboundAddr),
            '","oracle_contract":"',
            vm.toString(oracleAddr),
            '"}'
        );

        vm.writeFile(path, out);

        vm.stopBroadcast();
    }
}
