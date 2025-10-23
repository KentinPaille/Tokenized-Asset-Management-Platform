#!/bin/bash
set -e  # stoppe tout si une commande échoue

echo "🚀 Lancement du déploiement complet..."

# 1️⃣ Aller dans le dossier des contrats
cd contracts

echo "🔧 Déploiement des smart contracts via Foundry..."
npm run deploy

echo "✅ Déploiement terminé !"

# 2️⃣ Revenir au backend
cd ../backend

echo "🔁 Mise à jour du .env et des ABI..."
npm run update:contract

echo "✅ Fichiers .env et ABI mis à jour !"

# 3️⃣ Redémarrage du backend si Node tourne déjà
if tasklist | grep node >/dev/null; then
  echo "♻️  Redémarrage du backend (si nodemon tourne)..."
  taskkill //IM node.exe //F || true
fi

# 4️⃣ Démarrage du backend si pas déjà lancé
if ! tasklist | grep node >/dev/null; then
  echo "🚀 Démarrage du backend..."
  npm run dev &
fi
