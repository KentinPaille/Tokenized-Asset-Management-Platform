interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on?: (event: string, handler: (...args: any[]) => void) => void;
    removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  };
}

// 📦 Récupérer l'état de l'indexer
interface Transfer {
txHash: string;
[key: string]: any; // ajoute d'autres propriétés si nécessaire
}

interface IndexerState {
latestBlock: number;
transfers?: Transfer[];
}