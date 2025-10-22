// backend/scripts/addLiquidity.js
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const RPC = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS; // Uniswap/Sushi router du réseau
const WETH_ADDRESS = process.env.WETH_ADDRESS;
const TOKEN_ADDRESS = process.env.ERC20_CONTRACT;

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const erc20Abi = JSON.parse(fs.readFileSync("../abi/TokenizedERC20.json")).abi;
const token = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, wallet);

// Router ABI minimal (UniswapV2 style addLiquidityETH)
const routerAbi = [
  "function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function WETH() view returns (address)"
];

async function main() {
  if (!ROUTER_ADDRESS || !WETH_ADDRESS) {
    console.error("Veuillez définir ROUTER_ADDRESS et WETH_ADDRESS dans .env");
    process.exit(1);
  }

  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, wallet);

  const tokenAmount = ethers.parseUnits("1000", 18); // adapter si decimals != 18
  const ethAmount = ethers.parseEther("0.1"); // quantité initiale de natif

  console.log("Approving router to spend tokens...");
  const approveTx = await token.approve(ROUTER_ADDRESS, tokenAmount);
  await approveTx.wait();
  console.log("Approved.");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  console.log("Adding liquidity...");
  const tx = await router.addLiquidityETH(TOKEN_ADDRESS, tokenAmount, 0, 0, wallet.address, deadline, { value: ethAmount });
  await tx.wait();
  console.log("Liquidity added. TxHash:", tx.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
