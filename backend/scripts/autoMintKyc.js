import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
dotenv.config();

const RPC = process.env.RPC_URL;
const provider = new ethers.JsonRpcProvider(RPC);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// charge les ABIs
const kycAbi = JSON.parse(fs.readFileSync("./abi/KYCRegistry.json")).abi;
const soulAbi = JSON.parse(fs.readFileSync("./abi/SoulboundKYCToken.json")).abi;

const KYC_ADDR = process.env.KYC_CONTRACT;
const SOUL_ADDR = process.env.SOUL_CONTRACT;

const kyc = new ethers.Contract(KYC_ADDR, kycAbi, provider);
const soul = new ethers.Contract(SOUL_ADDR, soulAbi, signer);

async function main() {
  console.log("👂 Listening for Whitelisted events...");
  kyc.on("Whitelisted", async (who, event) => {
    console.log(`✅ ${who} vient d'être whiteliste`);
    try {
      const already = await soul.minted(who);
      if (already) return console.log(`⚠️ Déjà minté pour ${who}`);
      const isKyc = await kyc.isWhitelisted(who);
      if (!isKyc) return console.log(`⚠️ ${who} n'est plus KYC`);

      const tx = await soul.mintForKyc(who);
      console.log(`🚀 Mint envoyé pour ${who} — tx: ${tx.hash}`);
      await tx.wait();
      console.log(`🎉 Mint validé pour ${who}`);
    } catch (err) {
      console.error(`❌ Erreur mint pour ${who}:`, err.message);
    }
  });
}

main().catch(console.error);
