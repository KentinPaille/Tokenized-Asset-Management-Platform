import fs from "fs";
import path from "path";

const CONTRACTS_DIR = path.resolve("../contracts/out");
const ABI_DIR = path.resolve("./abi");

// Vérifie que les répertoires existent
if (!fs.existsSync(CONTRACTS_DIR)) {
  console.error("❌ Le dossier /contracts/out n'existe pas encore. Compile d'abord avec `forge build`.");
  process.exit(1);
}

if (!fs.existsSync(ABI_DIR)) {
  fs.mkdirSync(ABI_DIR, { recursive: true });
  console.log("📁 Dossier /abi créé.");
}

// Liste des contrats à synchroniser
const contractsToSync = [
  "KYCRegistry",
  "TokenizedERC20",
  "TokenizedERC721",
  "SoulboundKYCToken"
];

for (const name of contractsToSync) {
  const sourcePath = path.join(CONTRACTS_DIR, `${name}.sol`, `${name}.json`);
  const destPath = path.join(ABI_DIR, `${name}.json`);

  if (fs.existsSync(sourcePath)) {
    const json = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    const abi = json.abi;

    fs.writeFileSync(destPath, JSON.stringify(abi, null, 2));
    console.log(`✅ ABI mise à jour : ${name}`);
  } else {
    console.warn(`⚠️ ABI introuvable pour ${name} dans /contracts/out`);
  }
}

console.log("✨ Toutes les ABI sont synchronisées !");
