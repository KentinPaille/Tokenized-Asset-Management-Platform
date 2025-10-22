// backend/indexer/indexer.js
import express from "express";
import fs from "fs";
import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

const APP_PORT = process.env.INDEXER_PORT || 4001;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const TOKEN_ADDR = process.env.ERC20_CONTRACT;
const KYC_ADDR = process.env.KYC_CONTRACT;

const erc20Abi = JSON.parse(fs.readFileSync("./abi/TokenizedERC20.json")).abi;
const kycAbi = JSON.parse(fs.readFileSync("./abi/KYCRegistry.json")).abi;

const token = new ethers.Contract(TOKEN_ADDR, erc20Abi, provider);
const kyc = new ethers.Contract(KYC_ADDR, kycAbi, provider);

const DB_PATH = "./indexer_db.json";
let db = { transfers: [], kycEvents: [], lastBlock: 0 };

// load existing db
if (fs.existsSync(DB_PATH)) db = JSON.parse(fs.readFileSync(DB_PATH));

async function poll() {
  try {
    const currentBlock = await provider.getBlockNumber();
    const from = db.lastBlock ? db.lastBlock + 1 : Math.max(0, currentBlock - 5000);

    const transferFilter = token.filters.Transfer();
    const transfers = await token.queryFilter(transferFilter, from, currentBlock);
    for (const ev of transfers) {
      db.transfers.push({
        tx: ev.transactionHash,
        block: ev.blockNumber,
        from: ev.args.from,
        to: ev.args.to,
        value: ev.args.value.toString(),
      });
    }

    const filters = [
      kyc.filters.Whitelisted ? kyc.filters.Whitelisted() : null,
      kyc.filters.UnWhitelisted ? kyc.filters.UnWhitelisted() : null,
      kyc.filters.Blacklisted ? kyc.filters.Blacklisted() : null,
      kyc.filters.UnBlacklisted ? kyc.filters.UnBlacklisted() : null,
    ].filter(Boolean);

    for (const f of filters) {
      const evs = await kyc.queryFilter(f, from, currentBlock);
      for (const ev of evs) {
        db.kycEvents.push({
          tx: ev.transactionHash,
          block: ev.blockNumber,
          event: ev.event,
          who: ev.args[0],
        });
      }
    }

    db.lastBlock = currentBlock;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log("Indexer: polled up to block", currentBlock, "| transfers:", db.transfers.length, "kycEvents:", db.kycEvents.length);
  } catch (e) {
    console.error("Indexer error:", e);
  }
}

const app = express();
app.get("/api/state", (req, res) => res.json({ latestBlock: db.lastBlock, transfers: db.transfers.slice(-50).reverse(), kyc: db.kycEvents.slice(-50).reverse() }));

app.listen(APP_PORT, () => {
  console.log("Indexer API listening on", APP_PORT);
  // start polling loop
  poll();
  setInterval(poll, 60_000);
});
