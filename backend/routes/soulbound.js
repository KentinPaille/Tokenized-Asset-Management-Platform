// routes/erc20.js
import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const abi = JSON.parse(fs.readFileSync("./abi/SoulboundKYCToken.json", "utf8"));
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const soulbound = new ethers.Contract(process.env.SOULBOUND_CONTRACT, abi, wallet);

// ✅ GET /api/soulbound/balance/:address
router.get("/soulbound/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await soulbound.balanceOf(address);
    const decimals = await soulbound.decimals();
    const formatted = ethers.formatUnits(balance, decimals);

    res.json({ address, balance: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération du solde" });
  }
});


// ✅ POST /api/soulbound/mint/:address/:amount — Mint des tokens Soulbound
router.post("/soulbound/mint/:address/:amount", async (req, res) => {
  try {
    const { address, amount } = req.params;
    const tx = await soulbound.mintForKyc(address);
    await tx.wait();
    res.json({ status: "success", txHash: tx.hash });
  } catch (error) {
    console.error("Erreur de mint :", error);
    res.status(500).json({ error: "Erreur lors du mint.", details: error.message });
  }
});


export default router;
