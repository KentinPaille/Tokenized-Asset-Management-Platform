"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

// Replace these env vars in your Next.js .env.local
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const RPC = process.env.NEXT_PUBLIC_RPC_URL || "";

export default function HomePage() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [ethBalance, setEthBalance] = useState("0");
  const [erc20Balance, setErc20Balance] = useState("0");
  const [kycStatus, setKycStatus] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [indexerState, setIndexerState] = useState(null);
  const [oraclePrice, setOraclePrice] = useState(null);

  // helper to detect window.ethereum
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or use a wallet that injects window.ethereum");
      return;
    }
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      const s = await p.getSigner();
      setSigner(s);
      const addr = await s.getAddress();
      setAddress(addr);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (address && provider) {
      fetchEthBalance();
      fetchErc20Balance();
      fetchKycStatus();
      fetchIndexer();
      fetchOracle();
    }
    // poll indexer and balances periodically
    const t = setInterval(() => {
      if (address) {
        fetchEthBalance();
        fetchErc20Balance();
        fetchIndexer();
      }
    }, 60000);
    return () => clearInterval(t);
  }, [address]);

  async function fetchEthBalance() {
    try {
      const bal = await provider.getBalance(address);
      setEthBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchErc20Balance() {
    try {
      const res = await fetch(`${BACKEND}/erc20/balance/${address}`);
      const json = await res.json();
      setErc20Balance(json.balance ?? "0");
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchKycStatus() {
    try {
      const res = await fetch(`${BACKEND}/kyc/status/${address}`);
      const json = await res.json();
      setKycStatus(json.isKYCValid ?? json.isWhitelisted ?? false);
    } catch (e) {
      console.error(e);
    }
  }

  async function requestWhitelist() {
    if (!address) return alert("Connect wallet first");
    setTxLoading(true);
    try {
      const res = await fetch(`${BACKEND}/kyc/whitelist/${address}`, { method: "POST" });
      const j = await res.json();
      if (res.ok) alert("Whitelist tx sent: " + j.txHash);
      else alert("Error: " + JSON.stringify(j));
      // poll status
      setTimeout(fetchKycStatus, 5000);
    } catch (e) {
      console.error(e);
      alert("Request failed");
    } finally {
      setTxLoading(false);
    }
  }

  async function mintErc20(amount = "1") {
    if (!address) return alert("Connect wallet first");
    setTxLoading(true);
    try {
      // call backend mint which is owner-only; your backend wallet must be owner
      const res = await fetch(`${BACKEND}/mint/${address}/${amount}`, { method: "POST" });
      const j = await res.json();
      if (res.ok) alert("Mint tx: " + j.txHash);
      else alert("Mint error: " + JSON.stringify(j));
      setTimeout(fetchErc20Balance, 5000);
    } catch (e) {
      console.error(e);
      alert("Mint failed");
    } finally {
      setTxLoading(false);
    }
  }

  async function mintSoulbound() {
    if (!address) return alert("Connect wallet first");
    setTxLoading(true);
    try {
      const res = await fetch(`${BACKEND}/soul/mint/${address}`, { method: "POST" });
      const j = await res.json();
      if (res.ok) alert("Soul mint tx: " + j.txHash);
      else alert("Soul mint error: " + JSON.stringify(j));
    } catch (e) {
      console.error(e);
    } finally {
      setTxLoading(false);
    }
  }

  async function addLiquidity() {
    if (!address) return alert("Connect wallet first");
    setTxLoading(true);
    try {
      const res = await fetch(`${BACKEND}/add-liquidity`, { method: "POST" });
      const j = await res.json();
      if (res.ok) alert("Add liquidity tx: " + j.txHash);
      else alert("Add liquidity error: " + JSON.stringify(j));
    } catch (e) {
      console.error(e);
    } finally {
      setTxLoading(false);
    }
  }

  async function fetchIndexer() {
    try {
      const res = await fetch(`http://localhost:4001/api/state`);
      const j = await res.json();
      setIndexerState(j);
    } catch (e) {
      // indexer might not be running
    }
  }

  async function fetchOracle() {
    try {
      const res = await fetch(`${BACKEND}/oracle/price`);
      const j = await res.json();
      setOraclePrice(j.price ?? null);
    } catch (e) {
      // optional
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tokenized Asset Management — Dashboard</h1>
          <div>
            {address ? (
              <div className="text-sm text-gray-700">Connected: {address}</div>
            ) : (
              <button onClick={connectWallet} className="px-4 py-2 bg-indigo-600 text-white rounded">Connect Wallet</button>
            )}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 border rounded">
            <h2 className="font-semibold">Balances</h2>
            <p className="text-sm">ETH: <strong>{ethBalance}</strong></p>
            <p className="text-sm">ERC20 (token): <strong>{erc20Balance}</strong></p>
          </div>

          <div className="p-4 border rounded">
            <h2 className="font-semibold">KYC</h2>
            <p className="text-sm">Whitelisted: <strong>{kycStatus ? "Yes" : "No"}</strong></p>
            <div className="mt-3 space-x-2">
              <button onClick={requestWhitelist} disabled={txLoading} className="px-3 py-1 bg-green-600 text-white rounded">Request Whitelist</button>
              <button onClick={() => fetchKycStatus()} className="px-3 py-1 bg-gray-200 rounded">Refresh</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Mint ERC20</h3>
            <button onClick={() => mintErc20("1")} className="w-full py-2 bg-indigo-600 text-white rounded">Mint 1 token</button>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Soulbound (KYC Token)</h3>
            <button onClick={mintSoulbound} className="w-full py-2 bg-yellow-600 text-white rounded">Mint Soulbound</button>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">DEX / Liquidity</h3>
            <button onClick={addLiquidity} className="w-full py-2 bg-rose-600 text-white rounded">Add Liquidity</button>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">Indexer snapshot (latest)</h2>
          <div className="p-4 border rounded bg-gray-50">
            {indexerState ? (
              <div>
                <p>Latest block: {indexerState.latestBlock}</p>
                <h4 className="mt-2 font-medium">Recent Transfers</h4>
                <ul className="text-sm list-disc ml-6">
                  {indexerState.transfers.slice(0,5).map((t, i) => (
                    <li key={i}>{t.from} → {t.to} ({ethers.formatEther(t.value)})</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Indexer not running or no data yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Oracle</h2>
          <div className="p-4 border rounded">Price: <strong>{oraclePrice ?? "n/a"}</strong></div>
        </section>

        <footer className="mt-6 text-xs text-gray-400">Note: backend must be running at {BACKEND} and indexer at http://localhost:4001</footer>
      </div>
    </main>
  );
}
