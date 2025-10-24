// src/hooks/useTransfersWithPersistence.js
import { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'transfers_history_';

export function useTransfersWithPersistence(walletAddress:any) {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const storageKey = walletAddress ? `${STORAGE_PREFIX}${walletAddress.toLowerCase()}` : "transfers_history_";

  // 📥 Charger les transferts quand le wallet change
  useEffect(() => {
    if (storageKey) {
      loadTransfers();
    } else {
      setIsLoading(false);
      setTransfers([]);
      }
  }, [storageKey]);

  // 💾 Sauvegarder automatiquement quand transfers change
  useEffect(() => {
    if (!isLoading && transfers.length > 0 && storageKey) {
      saveTransfers();
    }
  }, [transfers, isLoading, storageKey]);

  function loadTransfers() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTransfers(parsed);
        console.log(`✅ Loaded ${parsed.length} transfers for ${walletAddress?.slice(0, 6)}...`);
      } else {
        setTransfers([]);
      }
    } catch (err) {
      console.log('ℹ️ No previous transfers found or parse error:', err);
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  }

  function saveTransfers() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(transfers));
      console.log(`💾 Saved ${transfers.length} transfers for ${walletAddress?.slice(0, 6)}...`);
    } catch (err:any) {
      console.error('❌ Error saving transfers:', err);
      if (err.name === 'QuotaExceededError') {
        console.warn('⚠️ Storage quota exceeded, keeping only last 500 transfers');
        const trimmed = transfers.slice(0, 500);
        setTransfers(trimmed);
        try {
          localStorage.setItem(storageKey, JSON.stringify(trimmed));
        } catch (e) {
          console.error('❌ Still failed after trimming:', e);
        }
      }
    }
  }

  function clearTransfers() {
    try {
      if (storageKey) {
        localStorage.removeItem(storageKey);
        setTransfers([]);
        console.log(`🗑️ Transfers cleared for ${walletAddress?.slice(0, 6)}...`);
      }
    } catch (err) {
      console.error('❌ Error clearing transfers:', err);
    }
  }

  // Fonction bonus : voir tous les wallets avec historique
  function getAllWalletHistories() {
    const wallets = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const address = key.replace(STORAGE_PREFIX, '');
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        wallets.push({ address, transferCount: data.length });
      }
    }
    return wallets;
  }

  // Fonction bonus : nettoyer tous les historiques
  function clearAllHistories() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cleared histories for ${keys.length} wallets`);
  }

  return { 
    transfers, 
    setTransfers, 
    isLoading, 
    clearTransfers,
    getAllWalletHistories,
    clearAllHistories
  };
}