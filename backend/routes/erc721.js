// routes/erc721.js
import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const abi = JSON.parse(fs.readFileSync("./abi/TokenizedERC721.json", "utf8"));
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const nft = new ethers.Contract(process.env.ERC721_CONTRACT, abi, wallet);

// ✅ GET /api/erc721/owner/:tokenId
router.get("/owner/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;
    const owner = await nft.ownerOf(tokenId);
    res.json({ tokenId, owner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération du propriétaire" });
  }
});

// ✅ POST /api/erc721/mint
router.post("/mint", async (req, res) => {
  try {
    const { to, tokenId } = req.body;
    const tx = await nft.safeMint(to, tokenId);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du mint ERC721" });
  }
});

export default router;
