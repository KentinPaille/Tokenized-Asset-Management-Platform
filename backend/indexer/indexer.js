// indexer.js
import express from "express";
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import cors from "cors";
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const PORT = 4001;

// --- Configuration ---
const RPC_URL = process.env.RPC_URL;
const ERC20_CONTRACT = process.env.ERC20_CONTRACT;

// --- Setup provider + contract ---
const provider = new ethers.JsonRpcProvider(RPC_URL);
const abi = JSON.parse(fs.readFileSync("./abi/TokenizedERC20.json", "utf8"));
const contract = new ethers.Contract(ERC20_CONTRACT, abi, provider);

// --- Indexer State ---
let state = {
  latestBlock: 0,
  transfers: [],
  listening: false,
};

// Garder une référence aux listeners pour pouvoir les nettoyer
let activeListeners = new Map();

// --- Parse event helper ---
function parseTransferEvent(evt) {
  return {
    from: evt.args[0],
    to: evt.args[1],
    value: evt.args[2].toString(),
    blockNumber: evt.blockNumber,
    txHash: evt.transactionHash,
    timestamp: Date.now(),
  };
}

// --- Sync function (historique) ---
async function syncTransfers() {
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(currentBlock - 9, 0);
    const events = await contract.queryFilter("Transfer", fromBlock, currentBlock);

    // Parse events
    const parsedTransfers = events.map(parseTransferEvent);

    // Update in-memory state
    state.latestBlock = currentBlock;
    state.transfers = [...parsedTransfers.reverse()];

    console.log(`✅ Synced ${parsedTransfers.length} transfers (up to block ${currentBlock})`);
  } catch (err) {
    console.error("❌ Error syncing transfers:", err);
  }
}

// --- Start listening for a specific address ---
function startListening(address) {
  if (!ethers.isAddress(address)) {
    console.error(`❌ Invalid address: ${address}`);
    return false;
  }

  // Si déjà en écoute pour cette adresse, on ne fait rien
  if (activeListeners.has(address)) {
    console.log(`⚠️ Already listening for ${address}`);
    return true;
  }

  try {
    // Filtre pour les transferts REÇUS (to = address)
    const filterReceived = contract.filters.Transfer(null, address);
    
    // Filtre pour les transferts ENVOYÉS (from = address)
    const filterSent = contract.filters.Transfer(address, null);

    // Listener pour les transferts reçus
    const onReceived = (from, to, value, event) => {
      console.log(`📥 RECEIVED: ${ethers.formatEther(value)} tokens from ${from}`);
      const parsed = parseTransferEvent(event);
      
      // Ajouter au début de la liste (éviter doublons)
      const exists = state.transfers.some(t => t.txHash === parsed.txHash);
      if (!exists) {
        state.transfers = [parsed, ...state.transfers].slice(0, 100);
      }
    };

    // Listener pour les transferts envoyés
    const onSent = (from, to, value, event) => {
      console.log(`📤 SENT: ${ethers.formatEther(value)} tokens to ${to}`);
      const parsed = parseTransferEvent(event);
      
      // Ajouter au début de la liste (éviter doublons)
      const exists = state.transfers.some(t => t.txHash === parsed.txHash);
      if (!exists) {
        state.transfers = [parsed, ...state.transfers].slice(0, 100);
      }
    };

    // Attacher les listeners
    contract.on(filterReceived, onReceived);
    contract.on(filterSent, onSent);

    // Sauvegarder les listeners pour pouvoir les arrêter
    activeListeners.set(address, {
      filterReceived,
      filterSent,
      onReceived,
      onSent,
    });

    state.listening = true;
    console.log(`👂 Started listening for transfers involving ${address}`);
    return true;
  } catch (err) {
    console.error("❌ Error starting listener:", err);
    return false;
  }
}

// --- Stop listening for a specific address ---
function stopListening(address) {
  const listener = activeListeners.get(address);
  if (!listener) {
    console.log(`⚠️ Not listening for ${address}`);
    return false;
  }

  try {
    contract.off(listener.filterReceived, listener.onReceived);
    contract.off(listener.filterSent, listener.onSent);
    activeListeners.delete(address);

    if (activeListeners.size === 0) {
      state.listening = false;
    }

    console.log(`🔇 Stopped listening for ${address}`);
    return true;
  } catch (err) {
    console.error("❌ Error stopping listener:", err);
    return false;
  }
}

// --- Run periodic sync every 2s ---
setInterval(syncTransfers, 2_000);
syncTransfers(); // run immediately on start

// --- API endpoints ---

// GET /api/state - Retourne l'état complet
app.get("/api/state", (req, res) => {
  res.json({
    ...state,
    activeAddresses: Array.from(activeListeners.keys()),
  });
});

// POST /api/listen - Démarre l'écoute pour une adresse
app.post("/api/listen", (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  const success = startListening(address);
  
  if (success) {
    res.json({ 
      success: true, 
      message: `Listening for transfers involving ${address}`,
      activeAddresses: Array.from(activeListeners.keys()),
    });
  } else {
    res.status(500).json({ error: "Failed to start listening" });
  }
});

// POST /api/unlisten - Arrête l'écoute pour une adresse
app.post("/api/unlisten", (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  const success = stopListening(address);
  
  if (success) {
    res.json({ 
      success: true, 
      message: `Stopped listening for ${address}`,
      activeAddresses: Array.from(activeListeners.keys()),
    });
  } else {
    res.status(404).json({ error: "Not listening for this address" });
  }
});

// GET /api/listeners - Liste toutes les adresses en écoute
app.get("/api/listeners", (req, res) => {
  res.json({
    activeAddresses: Array.from(activeListeners.keys()),
    count: activeListeners.size,
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`📡 Indexer server running on http://localhost:${PORT}`);
  console.log(`👂 Use POST /api/listen with {"address": "0x..."} to start listening`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  activeListeners.forEach((_, address) => stopListening(address));
  process.exit(0);
});