# Projet Blockchain Fullstack : Dex, KYC & Tokens

## Description

Ce projet est une application blockchain fullstack combinant un backend Node.js, des contrats intelligents Solidity et un frontend Next.js.
Il permet de gérer :

- Des **tokens ERC20 et ERC721 tokenisés**.
- Un **token KYC soulbound** pour la vérification des utilisateurs.
- Un **DEX simplifié** avec ajout de liquidité.
- Des **interactions décentralisées** via une interface web.

Le projet est structuré pour supporter le développement, le déploiement et l’indexation des données blockchain.

---

## Arborescence du projet

- **backend/** : Serveur Node.js et routes API pour interagir avec les smart contracts.
  - **abi/** : Contient les ABI des contrats (KYCRegistry, SoulboundKYCToken, TokenizedERC20, TokenizedERC721).
  - **indexer/** : Script indexer.js pour l’indexation des événements blockchain.
  - **routes/** : Endpoints REST pour interagir avec ERC20, ERC721, KYC et tokens soulbound.
  - **scripts/** : Scripts utilitaires (addLiquidity.js, autoMintKyc.js) pour automatiser des interactions avec la blockchain.
  - **utils/** : Scripts d’aide pour mettre à jour les ABI et variables d’environnement.

- **contracts/** : Smart contracts Solidity et scripts de déploiement.
  - **addresses/** : JSON listant les adresses déployées.
  - **broadcast/** : Historique des déploiements Foundry.
  - **script/** : Scripts de déploiement Solidity (Deploy.s.sol, AddLiquidityV3.s.sol, etc.).
  - **src/contracts/** : Contrats intelligents Solidity (KYCRegistry, SoulboundKYCToken, TokenizedERC20/ERC721, SimpleSwap, WEth).
  - **src/interfaces/** : Interfaces Solidity pour interagir avec d’autres protocoles (ERC20 minimal, Uniswap V3, etc.).
  - **test/** : Tests Foundry pour KYCRegistry et SoulboundKYCToken.

- **frontend/** : Application web Next.js pour interagir avec le backend et la blockchain.
  - **src/app/** : Pages et composants principaux.
  - **src/hooks/** : Hooks React, comme useTransfersWithPersistence.ts.
  - **public/** : Ressources statiques (SVG, images).
  - **next.config.ts** et **tsconfig.json** : Configuration Next.js et TypeScript.

- **deployAll.sh** : Script pour déployer l’ensemble des smart contracts et initialiser le backend.

- **README.md**: Documentation.

---

## Fonctionnalités principales

1. **Gestion KYC décentralisée**
   - Attribution de tokens soulbound pour certifier les utilisateurs.
   - Vérification KYC directement sur la blockchain.

2. **Tokens ERC20 et ERC721 tokenisés**
   - Création et gestion de tokens fongibles et non-fongibles.
   - Possibilité d’ajouter de la liquidité via le DEX intégré.

3. **DEX simplifié**
   - Ajout et retrait de liquidité.
   - Swap de tokens avec un script de déploiement Foundry.

4. **Backend Express.js**
   - API REST pour interagir avec les smart contracts.
   - Indexation des événements blockchain pour suivi en temps réel.

5. **Frontend Next.js**
   - Interface utilisateur pour consulter et interagir avec les tokens et la DEX.
   - Hooks React pour la persistance des transferts.

---

## Prérequis

- Node.js >= 18
- npm >= 9
- Foundry pour Solidity (foundry.toml présent) https://getfoundry.sh/
- Accès à un RPC Ethereum (ex: Base, Goerli)
- Yarn ou npm pour gérer les dépendances frontend et backend

---

## Installation

### Backend

cd backend
npm install

### Frontend

cd frontend
npm install

### Contracts

cd contracts
forge install

---

## Déploiement

1. Déployer tous les contrats via le script principal :

./deployAll.sh

2. Mettre à jour les adresses et ABI dans le backend :

node backend/utils/updateAbi.js
node backend/utils/updateEnv.js

3. Lancer le backend :

cd backend
node index.js

4. Lancer le frontend :

cd frontend
npm run dev

---

## Tests

Les tests Foundry pour les smart contracts se trouvent dans contracts/test/ :

cd contracts
forge test

---

## Contribution

1. Fork le projet.
2. Crée une branche feature : git checkout -b feature/nom-de-la-feature.
3. Commit tes changements : git commit -m "Ajout d'une nouvelle feature".
4. Push et crée une Pull Request.

---

## License

Ce projet est sous licence MIT.