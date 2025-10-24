require('dotenv').config();
const { execSync } = require('child_process');

// Récupération des variables d'environnement
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RPC_URL || !PRIVATE_KEY) {
    console.error("🚨 Veuillez définir RPC_URL et PRIVATE_KEY dans votre .env !");
    process.exit(1);
}

// Commande forge pour déployer le contrat WrapETH
try {
    execSync(
        `forge create src/contracts/WEth.sol:WrapETH --rpc-url ${RPC_URL} --private-key ${PRIVATE_KEY} --broadcast`,
        { stdio: 'inherit' }
    );
    console.log("✅ Contrat WrapETH déployé avec succès !");
} catch (error) {
    console.error("🚨 Erreur lors du déploiement :", error);
    process.exit(1);
}
