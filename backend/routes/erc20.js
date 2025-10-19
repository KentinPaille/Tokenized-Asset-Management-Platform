// routes/erc20.js
import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const abi = JSON.parse(fs.readFileSync("./abi/TokenizedERC20.json", "utf8"));
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const erc20 = new ethers.Contract(process.env.ERC20_CONTRACT, abi, wallet);

// ✅ GET /api/erc20/balance/:address
router.get("/erc20/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await erc20.balanceOf(address);
    const decimals = await erc20.decimals();
    const formatted = ethers.formatUnits(balance, decimals);

    res.json({ address, balance: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération du solde" });
  }
});

// ✅ POST /api/erc20/transfer
router.post("/transfer", async (req, res) => {
  try {
    const { to, amount } = req.body;
    const tx = await erc20.transfer(to, ethers.parseEther(amount.toString()));
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transfert ERC20 échoué" });
  }
});

// ✅ POST /api/erc20/mint/:address/:amount — Mint des tokens ERC20
router.post("/mint/:address/:amount", async (req, res) => {
  try {
    const { address, amount } = req.params;
    const tx = await erc20.mint(address, ethers.parseUnits(amount, 18));
    await tx.wait();
    res.json({ status: "success", txHash: tx.hash });
  } catch (error) {
    console.error("Erreur de mint :", error);
    res.status(500).json({ error: "Erreur lors du mint.", details: error.message });
  }
});


export default router;
