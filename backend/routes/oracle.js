// backend/routes/oracle.js
import express from "express";
import { ethers, parseUnits, formatEther } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const abi = JSON.parse(fs.readFileSync("./abi/ERC20Oracle.json", "utf8"));

// Configure ton provider et wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const GECKO_API_KEY = process.env.COINGECKO_API_KEY;
// Adresse de l'oracle déployé pour LAZY
const ORACLE_ADDRESS = process.env.ERC20_ORACLE_ADDRESS;
const oracleContract = new ethers.Contract(ORACLE_ADDRESS, abi, signer);

// Adresse du token LAZY (uniquement pour info)
const LAZY_IN_ETH = 0.000009; // 1 LAZY = 0.000009 ETH

/**
 * GET /oracle/update-price
 * Met à jour le prix du LAZY dans le smart contract oracle
 */
router.get("/oracle/update-price", async (req, res) => {
  try {
    // Récupérer le prix actuel de l'ETH en USD depuis CoinGecko
    const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    {
        headers: {
        "X-CoinGecko-API-Key": GECKO_API_KEY,
        }
    }
    ).then(res => res.json());
    if (!response.ethereum || !response.ethereum.usd) {
        res.json({ success: true, newPriceUsd: "0" });
        return;
    }
    console.log("Réponse CoinGecko:", response);
    const ethPriceUsd = response.ethereum.usd;
    console.log(`Prix actuel de l'ETH: $${ethPriceUsd} USD`);
    const lazyPriceUsd = LAZY_IN_ETH * ethPriceUsd;
    console.log(`Mise à jour du prix du LAZY: $${lazyPriceUsd} USD`);
    // Convertir le prix en format compatible avec le smart contract (18 décimales)
    const priceForContract = parseUnits(lazyPriceUsd.toFixed(18), 18);

    // Mettre à jour le prix dans le smart contract oracle
    const tx = await oracleContract.updatePrice(priceForContract);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash, newPriceUsd: lazyPriceUsd });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Post /oracle/get-price
 * Récupère le prix actuel du LAZY depuis le smart contract oracle
 */
router.post("/oracle/get-price", async (req, res) => {
    try {
        const price = await oracleContract.getPrice();
        const formattedPrice = formatEther(price);
        console.log(`Prix actuel du LAZY depuis l'oracle: $${formattedPrice}`);
        res.json({ token: "LAZY", priceUsd: formattedPrice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;