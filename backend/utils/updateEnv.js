import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const rootDir = path.resolve("../contracts/addresses");
const addressesPath = path.join(rootDir, "addresses.json");
const envPath = path.join(process.cwd(), ".env");

if (!fs.existsSync(addressesPath)) {

  console.error(`❌ addresses.json non trouvé dans ${addressesPath}`);
  process.exit(1);
}

// lire les adresses et le .env existant
const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
let envContent = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf8")
  : "";

// iterate over each key in addresses and set or replace corresponding ENV var
for (const [key, value] of Object.entries(addresses)) {
    // convert json key to SNAKE_UPPER env var name (fooBar -> FOO_BAR, non-alnum -> _)
    const envKey = key
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toUpperCase();

    const lineRegex = new RegExp(`^${envKey}=.*$`, "m");
    if (lineRegex.test(envContent)) {
        envContent = envContent.replace(lineRegex, `${envKey}=${value}`);
    } else {
        if (envContent && !envContent.endsWith("\n")) envContent += "\n";
        envContent += `${envKey}=${value}\n`;
    }
}

fs.writeFileSync(envPath, envContent);
console.log("✅ .env mis à jour avec les nouvelles adresses !");
