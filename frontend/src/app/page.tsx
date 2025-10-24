"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useTransfersWithPersistence } from '../hooks/useTransfersWithPersistence';

const BACKEND = "http://localhost:3001";
const RPC = process.env.NEXT_PUBLIC_RPC;
const SWAP_ROUTER = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4";
const UNISWAP_FACTORY = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
const WETH = "0x4200000000000000000000000000000000000006";
const KYC_REGISTRY_ADDRESS = "0xe98F9dA208A83332a35Dc823DD0C637756B9AFf7";
const SIMPLE_SWAP = "0x6FCD1B1e7acdc3feCa08ef5CD9055bc67a9ff518";

// SwapRouter ABI (minimal)
const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export default function HomePage() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [ethBalance, setEthBalance] = useState("0");
  const [wethBalance, setWethBalance] = useState("0");
  const [erc20Balance, setErc20Balance] = useState("0");
  const [soulboundBalance, setSoulboundBalance] = useState("0");
  const [kycStatus, setKycStatus] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [indexerState, setIndexerState] = useState(null);
  const [oraclePrice, setOraclePrice] = useState(null);
  const [lazyTokenAddress, setLazyTokenAddress] = useState("0x0077a8005D7B0f9412ECF88E21f7c5018bd61c94");
  const [estimatedOutput, setEstimatedOutput] = useState("0.0");
    const { 
    transfers, 
    setTransfers, 
    isLoading, 
    clearTransfers 
  } = useTransfersWithPersistence(address);
  const [lastSyncBlock, setLastSyncBlock] = useState(0);
  const [isListening, setIsListening] = useState(false);
  // Swap states
  const [swapDirection, setSwapDirection] = useState("ETH_TO_LAZY"); // ETH_TO_LAZY or LAZY_TO_ETH
  const [swapAmount, setSwapAmount] = useState("0.0");
  const [swapLoading, setSwapLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");
    try {
      // Force Base Sepolia network
      const chainId = 84532; // Base Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (switchError) {
        // Network not added, try to add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: 'Base Sepolia',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org']
            }]
          });
        }
      }

      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      const s = await p.getSigner();
      setSigner(s);
      const addr = await s.getAddress();
      setAddress(addr);
    } catch (e) {
      console.error(e);
      alert("Failed to connect to Base Sepolia");
    }
  };
  useEffect(() => {
    if (address) {
      startListening();
      return () => stopListening();
    }
  }, [address]);

  useEffect(() => {
    if (address && provider) {
      fetchEthBalance();
      fetchWEthBalanceWithProvider();
      fetchErc20Balance();
      fetchSoulboundBalance();
      fetchKycStatus();
      fetchIndexer();
      fetchOracle();
      fetchLazyTokenAddress();
      updateEstimatedOutput();
      fetchIndexerState();

      const interval = setInterval(fetchIndexerState, 2000);
      return () => clearInterval(interval);
    }
  }, [address, provider, swapAmount, swapDirection]);

  async function fetchLazyTokenAddress() {
    try {
      setLazyTokenAddress("0x0077a8005D7B0f9412ECF88E21f7c5018bd61c94");
    } catch (e) {
      console.error(e);
    }
  }
    // 👂 Démarrer l'écoute temps réel
  async function startListening() {
    try {
      const res = await fetch('http://localhost:4001/api/listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsListening(true);
        console.log('✅ Started listening for', address);
      }
    } catch (err) {
      console.error('❌ Error starting listener:', err);
    }
  }

  // 🔇 Arrêter l'écoute
  async function stopListening() {
    try {
      await fetch('http://localhost:4001/api/unlisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      setIsListening(false);
      console.log('🔇 Stopped listening for', address);
    } catch (err) {
      console.error('❌ Error stopping listener:', err);
    }
  }

  async function fetchEthBalance() {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(RPC);
      const bal = await rpcProvider.getBalance(address);
      setEthBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error(e);
    }
  }

  // 📦 Récupérer l'état de l'indexer
  async function fetchIndexerState() {
    try {
      const res = await fetch("http://localhost:4001/api/state");
      const json = await res.json();
      console.log("📦 Indexer state:", json);
      
      setLastSyncBlock(json.latestBlock);
      
      setTransfers(prev => {
        const existingHashes = new Set(prev.map(t => t.txHash));
        const newOnes = (json.transfers ?? []).filter(t => !existingHashes.has(t.txHash));
        return [...newOnes, ...prev].slice(0, 1000);
      });
    } catch (err) {
      console.error("❌ Error fetching indexer state:", err);
    }
  }

  async function fetchWEthBalanceWithProvider() {
    try {
      const provider = new ethers.JsonRpcProvider(RPC);
      const wethContract = new ethers.Contract(WETH, ERC20_ABI, provider);
      const balance = await wethContract.balanceOf(address);
      setWethBalance(ethers.formatEther(balance));
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

  async function mintErc20() {
    if (!signer) return alert("Connect wallet first");
    try {
      const res = await fetch(`${BACKEND}/erc20/mint/${address}/1000`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) alert("Mint tx sent: " + json.txHash);
      else alert("Error: " + JSON.stringify(json));
      setTimeout(fetchErc20Balance, 2000);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendErc20() {
    if (!signer) return alert("Connect wallet first");

    const to = document.querySelector('input[placeholder="Recipient Address"]').value;
    const amount = parseFloat(document.querySelector('input[placeholder="Amount"]').value);
    if (!to || !amount || amount <= 0) return alert("Enter valid recipient and amount");

    try {
      // Adresse du token ERC20
      const tokenAddress = "0x0077a8005D7B0f9412ECF88E21f7c5018bd61c94"; // 🔹 mets ici l’adresse de ton contrat ERC20

      // ABI minimale pour un ERC20
      const ERC20_ABI = [
        "function transfer(address to, uint256 amount) public returns (bool)",
        "function decimals() public view returns (uint8)",
      ];

      // Connexion au contrat avec le wallet
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      // Récupérer le nombre de décimales du token
      const decimals = await token.decimals();
      const amountInUnits = ethers.parseUnits(amount.toString(), decimals);

      // Envoyer la transaction depuis le wallet connecté
      const tx = await token.transfer(to, amountInUnits);
      alert(`Transaction envoyée !\nHash: ${tx.hash}`);

      // Attendre la confirmation (optionnel)
      await tx.wait();
      alert("✅ Transfert confirmé !");

      setTimeout(fetchErc20Balance, 2000);
      setTimeout(fetchEthBalance, 2000);
    } catch (e) {
      console.error(e);
      alert("Erreur lors du transfert : " + (e.message || "Unknown error"));
    }
  }

  async function fetchSoulboundBalance() {
    try {
      const res = await fetch(`${BACKEND}/soulbound/balance/${address}`);
      const json = await res.json();
      setSoulboundBalance(json.balance ?? "0");
    } catch (e) {
      console.error(e);
    }
  }

  async function mintSoulbound() {
    if (!signer) return alert("Connect wallet first");
    try {
      const res = await fetch(`${BACKEND}/soulbound/mint/${address}/1`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) alert("Soulbound mint tx sent: " + json.txHash);
      else alert("Error: " + JSON.stringify(json));
      setTimeout(fetchSoulboundBalance, 2000);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchKycStatus() {
    try {
      const res = await fetch(`${BACKEND}/kyc/status/${address}`);
      const json = await res.json();
      setKycStatus(json.isKycValid ?? false);
    } catch (e) {
      console.error(e);
    }
  }

  async function updateEstimatedOutput() {
    if (!provider || !swapAmount || parseFloat(swapAmount) <= 0) {
      setEstimatedOutput("0.0");
      return;
    }

    try {
      const rpcProvider = new ethers.JsonRpcProvider(RPC);
      const simpleSwap = new ethers.Contract(SIMPLE_SWAP, [
        "function calculateBuyPrice(uint256) view returns (uint256)",
        "function calculateSellPrice(uint256) view returns (uint256)",
        "function getPrice() view returns (uint256)"
      ], rpcProvider);

      const amount = ethers.parseEther(swapAmount);
      const price = await simpleSwap.getPrice(); // Prix en wei
      
      let result;
      if (swapDirection === "ETH_TO_LAZY") {
        // L'utilisateur entre combien de WETH il veut PAYER
        // On calcule combien de LAZY il va RECEVOIR
        // Formule inverse : lazyAmount = (wethAmount * 1e18) / price
        result = (amount * ethers.parseEther("1")) / price;
        console.log(`Avec ${swapAmount} WETH, vous recevez ${ethers.formatEther(result)} LAZY`);
      } else {
        // L'utilisateur entre combien de LAZY il veut VENDRE
        // On calcule combien de WETH il va RECEVOIR
        result = await simpleSwap.calculateSellPrice(amount);
        console.log(`En vendant ${swapAmount} LAZY, vous recevez ${ethers.formatEther(result)} WETH`);
      }
      setEstimatedOutput(ethers.formatEther(result));
    } catch (error) {
      console.error("Error calculating output:", error);
      setEstimatedOutput("0.0");
    }
  }
  async function requestWhitelist() {
    if (!address) return alert("Connect wallet first");
    setTxLoading(true);
    try {
      const res = await fetch(`${BACKEND}/kyc/add-to-whitelist/${address}`);
      const json = await res.json();
      if (res.ok) alert("Whitelist tx sent: " + json.txHash);
      else alert("Error: " + JSON.stringify(json));
      setTimeout(fetchKycStatus, 5000);
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
    } catch (e) {}
  }

  async function fetchOracle() {
    try {
      const res = await fetch(`${BACKEND}/oracle/price`);
      const j = await res.json();
      setOraclePrice(j.price ?? null);
    } catch (e) {}
  }

  async function handleSwap() {
    if (!signer) return alert("Connect wallet first");
    if (!swapAmount || parseFloat(swapAmount) <= 0) return alert("Enter valid amount");

    setSwapLoading(true);
    try {
      const simpleSwap = new ethers.Contract(SIMPLE_SWAP, [
        "function buyLazy(uint256) external",
        "function sellLazy(uint256) external",
        "function calculateBuyPrice(uint256) view returns (uint256)",
        "function calculateSellPrice(uint256) view returns (uint256)",
        "function getReserves() view returns (uint256, uint256)",
        "function getPrice() view returns (uint256)"
      ], signer);

      const [lazyReserve, wethReserve] = await simpleSwap.getReserves();
      console.log("LAZY Reserve:", ethers.formatEther(lazyReserve));
      console.log("WETH Reserve:", ethers.formatEther(wethReserve));

      if (swapDirection === "ETH_TO_LAZY") {
        // L'utilisateur paie X WETH, calcule combien de LAZY il reçoit
        const wethAmount = ethers.parseEther(swapAmount);
        const price = await simpleSwap.getPrice();
        const lazyToReceive = (wethAmount * ethers.parseEther("1")) / price;
        
        console.log(`Paiement: ${swapAmount} WETH pour recevoir ${ethers.formatEther(lazyToReceive)} LAZY`);
        
        // Vérifier les réserves
        if (lazyReserve < lazyToReceive) {
          alert(`❌ Pas assez de LAZY!\nDisponible: ${ethers.formatEther(lazyReserve)}\nNécessaire: ${ethers.formatEther(lazyToReceive)}`);
          setSwapLoading(false);
          return;
        }
        
        const userWethBalance = ethers.parseEther(wethBalance);
        if (userWethBalance < wethAmount) {
          alert(`❌ Pas assez de WETH!\nVous avez: ${wethBalance}\nNécessaire: ${swapAmount}`);
          setSwapLoading(false);
          return;
        }

        // Approuver et acheter
        const wethContract = new ethers.Contract(WETH, [
          "function approve(address, uint256) returns (bool)"
        ], signer);
        
        await (await wethContract.approve(SIMPLE_SWAP, wethAmount)).wait();
        await (await simpleSwap.buyLazy(lazyToReceive)).wait();
        
        alert(`✅ Payé ${swapAmount} WETH pour ${ethers.formatEther(lazyToReceive)} LAZY`);
        
      } else {
        // L'utilisateur vend X LAZY
        const lazyAmount = ethers.parseEther(swapAmount);
        const wethToReceive = await simpleSwap.calculateSellPrice(lazyAmount);
        
        console.log(`Vente: ${swapAmount} LAZY pour recevoir ${ethers.formatEther(wethToReceive)} WETH`);
        
        const userLazyBalance = ethers.parseEther(erc20Balance);
        if (userLazyBalance < lazyAmount) {
          alert(`❌ Pas assez de LAZY!\nVous avez: ${erc20Balance}\nNécessaire: ${swapAmount}`);
          setSwapLoading(false);
          return;
        }
        
        if (wethReserve < wethToReceive) {
          alert(`❌ Pas assez de WETH dans le pool!\nDisponible: ${ethers.formatEther(wethReserve)}`);
          setSwapLoading(false);
          return;
        }

        const lazyContract = new ethers.Contract(lazyTokenAddress, [
          "function approve(address, uint256) returns (bool)"
        ], signer);
        
        await (await lazyContract.approve(SIMPLE_SWAP, lazyAmount)).wait();
        await (await simpleSwap.sellLazy(lazyAmount)).wait();
        
        alert(`✅ Vendu ${swapAmount} LAZY pour ${ethers.formatEther(wethToReceive)} WETH`);
      }

      await fetchErc20Balance();
      await fetchWEthBalanceWithProvider();
      await fetchEthBalance();
      setSwapLoading(false);
      
    } catch (error) {
      console.error(error);
      alert("Erreur: " + (error.message || "Unknown error"));
      setSwapLoading(false);
    }
  }
  // 🔄 Loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading wallet history...</div>
      </div>
    );
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">🚀 LAZY Asset Platform</h1>
              <p className="text-purple-100 text-sm">Tokenized Asset Management & DeFi</p>
            </div>
            {address ? (
              <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <p className="text-xs text-purple-100 mb-1">Connected Wallet</p>
                <p className="text-white font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</p>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="mt-4 md:mt-0 px-6 py-3 bg-white text-purple-600 font-bold rounded-xl shadow-lg hover:bg-purple-50 transform hover:scale-105 transition-all"
              >
                🔐 Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* Balances Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-xl">
            <p className="text-blue-100 text-sm mb-2">ETH Balance</p>
            <p className="text-3xl font-bold text-white">{parseFloat(ethBalance).toFixed(8)}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 shadow-xl">
            <p className="text-cyan-100 text-sm mb-2">WETH Balance</p>
            <p className="text-3xl font-bold text-white">{parseFloat(wethBalance).toFixed(8)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-xl">
            <p className="text-purple-100 text-sm mb-2">LAZY Balance</p>
            <p className="text-3xl font-bold text-white">{parseFloat(erc20Balance).toFixed(6)}</p>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 shadow-xl">
            <p className="text-pink-100 text-sm mb-2">Oracle Price</p>
            <p className="text-3xl font-bold text-white">${oraclePrice || "N/A"}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Status Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">✨</span> Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-purple-200">Whitelisted</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${kycStatus ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                  {kycStatus ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-purple-200">Early Bird</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${soulboundBalance === "1" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                  {soulboundBalance === "1" ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <button
                onClick={requestWhitelist}
                disabled={txLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all disabled:opacity-50"
              >
                🎫 Request Whitelist
              </button>
              <button
                onClick={mintSoulbound}
                className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition-all"
              >
                🦅 Mint Early Bird
              </button>
            </div>
          </div>

          {/* LAZY Token Actions */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">💰</span> LAZY Tokens
            </h2>
            <div className="space-y-4">
              <button
                onClick={mintErc20}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all"
              >
                🪙 Mint 1 LAZY
              </button>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Recipient Address"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <button
                onClick={sendErc20}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-teal-600 transform hover:scale-105 transition-all"
              >
                📤 Send LAZY
              </button>
            </div>
          </div>

          {/* Swap Interface */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🔄</span> Swap
            </h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSwapDirection("ETH_TO_LAZY")}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                    swapDirection === "ETH_TO_LAZY"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/10 text-purple-200 hover:bg-white/20"
                  }`}
                >
                  ETH → LAZY
                </button>
                <button
                  onClick={() => setSwapDirection("LAZY_TO_ETH")}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                    swapDirection === "LAZY_TO_ETH"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/10 text-purple-200 hover:bg-white/20"
                  }`}
                >
                  LAZY → ETH
                </button>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-purple-200 text-sm mb-2">You Pay</p>
                <div className="relative">
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="0.0"
                    className="no-spinner w-full bg-transparent text-2xl font-bold text-white outline-none pr-16" // <-- espace à droite pour le badge
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/10 rounded-lg text-white font-bold">
                    {swapDirection === "ETH_TO_LAZY" ? "ETH" : "LAZY"}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  ↓
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-purple-200 text-sm mb-2">You Receive</p>
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-2xl font-bold text-white">{estimatedOutput.slice(0, 10)}</span>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-white font-bold">
                    {swapDirection === "ETH_TO_LAZY" ? "LAZY" : "ETH"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSwap}
                disabled={swapLoading}
                className="w-full px-4 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {swapLoading ? "⏳ Swapping..." : "🚀 Swap Now"}
              </button>
              
              <p className="text-xs text-purple-300 text-center">
                Pool Fee: 0.3% • Slippage: Auto
              </p>
            </div>
          </div>
        </div>

        {/* Indexer Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-2">📊</span> Real-Time LAZY Indexer
          </h2>
          
          {/* Indicateur d'écoute temps réel */}
          {isListening && (
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm">Live</span>
            </div>
          )}
        </div>

        {transfers && address ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-purple-200">
                Latest Synced Block:{" "}
                <span className="font-bold text-white">
                  {transfers.length > 0 ? lastSyncBlock : "—"}
                </span>
              </p>
              
              {/* Nombre total de transferts sauvegardés */}
              <p className="text-purple-200">
                Total Saved:{" "}
                <span className="font-bold text-white">{transfers.length}</span>
              </p>
            </div>

            {transfers.length > 0 ? (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-purple-200 text-sm">
                    Recent Transfers (showing {Math.min(5, transfers.length)} of {transfers.length}):
                  </p>
                  
                  {/* Bouton pour effacer l'historique */}
                  <button
                    onClick={clearTransfers}
                    className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded-lg transition-colors"
                  >
                    Clear History
                  </button>
                </div>
                
                <div className="space-y-2">
                  {transfers.slice(0, 5).map((t, i) => {
                    const isReceived = t.to.toLowerCase() === address.toLowerCase();
                    const isSent = t.from.toLowerCase() === address.toLowerCase();
                    
                    return (
                      <div
                        key={`${t.txHash}-${i}`}
                        className={`text-white text-sm font-mono p-3 rounded-lg flex justify-between items-center transition-colors ${
                          isReceived 
                            ? 'bg-green-500/10 border border-green-500/20' 
                            : isSent 
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-white/5'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {isReceived && <span className="text-green-400">📥</span>}
                            {isSent && <span className="text-red-400">📤</span>}
                            <span>
                              {t.from.slice(0, 6)}...{t.from.slice(-4)} →{" "}
                              {t.to.slice(0, 6)}...{t.to.slice(-4)}
                            </span>
                          </div>
                          <a
                            href={`https://etherscan.io/tx/${t.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-300 hover:text-purple-200"
                          >
                            {t.txHash.slice(0, 10)}...
                          </a>
                        </div>
                        
                        <span className={`ml-2 font-bold ${
                          isReceived ? 'text-green-300' : isSent ? 'text-red-300' : 'text-purple-300'
                        }`}>
                          {isReceived ? '+' : isSent ? '-' : ''}
                          {ethers.formatEther(t.value)} LAZY
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {transfers.length > 5 && (
                  <p className="text-center text-purple-300 text-xs mt-3">
                    + {transfers.length - 5} more transfers saved
                  </p>
                )}
              </div>
            ) : (
              <p className="text-purple-300">No transfers detected yet.</p>
            )}
          </div>
        ) : (
          <p className="text-purple-300">Indexer not running or no data yet.</p>
        )}
      </div>

        {/* Footer */}
        <footer className="text-center text-purple-300 text-sm bg-white/10 backdrop-blur-md rounded-2xl p-4">
          <p className="font-bold text-white mb-2">⚠️ BASE SEPOLIA TESTNET ONLY</p>
          <p>Backend: {BACKEND} • Indexer: http://localhost:4001</p>
          <p className="text-xs mt-2">Chain ID: 84532 • RPC: https://sepolia.base.org</p>
        </footer>
      </div>
    </main>
  );
}