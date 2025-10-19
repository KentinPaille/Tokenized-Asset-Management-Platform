import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();
app.use(express.json());

// Charger les variables du .env
const PORT = process.env.PORT || 3001;

// Charger dynamiquement toutes les routes du dossier "routes"
const routesPath = path.join(__dirname, "routes");
fs.readdirSync(routesPath).forEach(async (file) => {
  if (file.endsWith(".js")) {
    const { default: router } = await import(`./routes/${file}`);
    app.use("/", router);
    console.log(`✅ Route chargée : ${file}`);
  }
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

