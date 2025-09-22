# 🏦 Tokenized Asset Management Platform

## 📌 Introduction
This project is a **platform for managing tokenized real-world assets (RWAs)**.  
It enables **tokenization of assets**, **ownership management**, and **secure on-chain trading**, with built-in **compliance (KYC, whitelist, blacklist)**.

👉 Deployed on: [Ethereum Sepolia Testnet]  
👉 Frontend hosted on: [Vercel Link]  

---

## ⚙️ Features

### 1. Real-World Asset Tokenization
- **ERC-20**: Fractional ownership of assets (e.g., real estate, company shares)  
- **ERC-721**: Unique assets (e.g., artworks, diamonds)  

### 2. On-Chain Compliance
- Simple KYC system to register users  
- **Whitelist**: Only approved users can hold and trade tokens  
- **Blacklist**: Admin can revoke rights even after KYC  
- ⚠️ All logic enforced **on-chain** (not just frontend)  

### 3. Decentralized Trading
- ERC-20 tokens listed in a **Uniswap v3 fork liquidity pool**  
- Trades allowed **only between whitelisted addresses**  
- Initial liquidity provided by the project team  

### 4. Real-Time Indexer
- A background service polls the blockchain every minute  
- Syncs all on-chain events to **backend and frontend**  
- Any direct DEX trades are immediately reflected in the app  

### 5. On-Chain Oracle
- Provides external data for tokenized assets  
- Example: real estate prices or NFT floor prices  

---

## 🛠️ Technical Stack

### Blockchain
- **Ethereum Sepolia Testnet (EVM-compatible)**  
  Justification:  
  - Mature development tools (Solidity, Hardhat, Ethers.js)  
  - Large DeFi ecosystem (Uniswap, oracles, indexers)  
  - Target users familiar with EVM & Metamask  

### Smart Contracts
- **Solidity**  
- Key contracts:  
  - `AssetERC20.sol`: ERC-20 fractional token  
  - `AssetERC721.sol`: Unique NFT token  
  - `ComplianceManager.sol`: KYC, whitelist, blacklist  
  - `Oracle.sol`: On-chain external data  
  - `LiquidityPool.sol`: Uniswap fork integration  

### Frontend
- **React + Next.js**  
- **Ethers.js / Viem** for blockchain interaction  
- Hosted on **Vercel**  

### Backend / Indexer
- **Node.js / Express**  
- Indexer using **Ethers.js** to poll blockchain events  
- Database: **PostgreSQL** or **MongoDB**  

---

## 🚀 Installation & Running

### 1. Clone the repository
```bash
git clone https://github.com/<user>/<repo>.git
cd <repo>
```

### 2. Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Backend / Indexer
```bash
cd backend
npm install
npm run dev
```
