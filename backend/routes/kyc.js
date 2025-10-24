// routes/kyc.js
import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Charger l'ABI
const abi = JSON.parse(fs.readFileSync("./abi/KYCRegistry.json", "utf8"));

// Initialiser le contrat
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const kycContract = new ethers.Contract(process.env.REGISTRY_CONTRACT, abi, wallet);

// ✅ GET /api/kyc/status/:address — Vérifie si une adresse est KYC-validée
router.get("/kyc/status/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const isKycValid = await kycContract.isWhitelisted(address);
    const isBlacklisted = await kycContract.isBlacklisted(address);
    res.json({ address, isKycValid, isBlacklisted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la vérification KYC" });
  }
});

// ✅ get /api/kyc/whitelist/:address — Ajoute une adresse à la whitelist
router.get("/kyc/add-to-whitelist/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const isKycValid = await kycContract.isWhitelisted(address);
    const isBlacklisted = await kycContract.isBlacklisted(address);
    if (isBlacklisted) {
      return res.status(400).json({ error: "L'adresse est dans la blacklist" });
    }
    if (isKycValid) {
      return res.status(400).json({ error: "L'adresse est déjà whitelisted" });
    }
    const tx = await kycContract.addToWhitelist(address);
    await tx.wait();
    res.json({ status: "success", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la whitelist.", details: error.message });
  }
});

// ✅ get /api/kyc/remove-from-whitelist/:address — Retire une adresse de la whitelist
router.get("/kyc/remove-from-whitelist/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const tx = await kycContract.removeFromWhitelist(address);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de retirer cet utilisateur de la whitelist" });
  }
});

// ✅ get /api/kyc/add-to-blacklist/:address — Ajoute une adresse à la blacklist
router.get("/kyc/add-to-blacklist/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const isBlacklisted = await kycContract.isBlacklisted(address);
    if (isBlacklisted) {
      return res.status(400).json({ error: "L'adresse est déjà dans la blacklist" });
    }
    const tx = await kycContract.addToBlacklist(address);
    await tx.wait();
    res.json({ status: "success", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'ajout à la blacklist.", details: error.message });
  }
});

// ✅ get /api/kyc/remove-from-blacklist/:address — Retire une adresse de la blacklist
router.get("/kyc/remove-from-blacklist/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const tx = await kycContract.removeFromBlacklist(address);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de retirer cet utilisateur de la blacklist" });
  }
});

export default router;
