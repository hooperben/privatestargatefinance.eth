"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { OAPP_ADDRESS } from "../src/constants";
import { usePasskey } from "./usePasskey";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { TOKENS } from "../lib/tokens";

// ABI for the events we need
const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leafIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "leafValue",
        type: "uint256",
      },
    ],
    name: "LeafInserted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        internalType: "bytes",
        name: "encryptedNote",
        type: "bytes",
      },
    ],
    name: "NotePayload",
    type: "event",
  },
];

// Deployment block numbers
const DEPLOYMENT_BLOCKS = {
  42161: 349766781, // Arbitrum
  8453: 31871591, // Base
};

// IndexedDB configuration
const DB_NAME = "ContractNotesDB";
const DB_VERSION = 1;
const NOTES_STORE = "notes";
const SYNC_STORE = "sync_progress";

export interface ContractNote {
  leafIndex: number;
  leafValue: string;
  blockNumber: number;
  transactionHash: string;
  chainId: number;
  timestamp: number;
  assetId?: string;
  assetAmount?: string;
  owner?: string;
  secret?: string;
  isOwned: boolean;
  payloadData?: string;
}

interface SyncProgress {
  chainId: number;
  lastSyncedBlock: number;
  updatedAt: number;
}

export function useContractNotes() {
  const [notes, setNotes] = useState<ContractNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const { getMnemonicFromPasskey, hasPasskey } = usePasskey();
  const dbRef = useRef<IDBDatabase | null>(null);

  // Initialize IndexedDB
  const initDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (dbRef.current) {
        resolve(dbRef.current);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        dbRef.current = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;

        // Create notes store
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          const notesStore = db.createObjectStore(NOTES_STORE, {
            keyPath: ["chainId", "leafIndex"],
          });
          notesStore.createIndex("chainId", "chainId", { unique: false });
          notesStore.createIndex("timestamp", "timestamp", { unique: false });
          notesStore.createIndex("isOwned", "isOwned", { unique: false });
        }

        // Create sync progress store
        if (!db.objectStoreNames.contains(SYNC_STORE)) {
          db.createObjectStore(SYNC_STORE, {
            keyPath: "chainId",
          });
        }
      };
    });
  }, []);

  // Get RPC URL for a given chain
  const getRpcUrl = (chainId: number): string => {
    switch (chainId) {
      case 42161: // Arbitrum
        return "https://arb1.arbitrum.io/rpc";
      case 8453: // Base
        return "https://mainnet.base.org";
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  };

  // Save sync progress to IndexedDB
  const saveSyncProgress = useCallback(
    async (chainId: number, blockNumber: number) => {
      try {
        const db = await initDB();
        const transaction = db.transaction([SYNC_STORE], "readwrite");
        const store = transaction.objectStore(SYNC_STORE);

        const syncData: SyncProgress = {
          chainId,
          lastSyncedBlock: blockNumber,
          updatedAt: Date.now(),
        };

        await store.put(syncData);
        setSyncProgress((prev) => ({ ...prev, [chainId]: blockNumber }));
      } catch (error) {
        console.error(
          `Failed to save sync progress for chain ${chainId}:`,
          error,
        );
      }
    },
    [initDB],
  );

  // Load sync progress from IndexedDB
  const loadSyncProgress = useCallback(async (): Promise<
    Record<number, number>
  > => {
    try {
      const db = await initDB();
      const transaction = db.transaction([SYNC_STORE], "readonly");
      const store = transaction.objectStore(SYNC_STORE);

      const progress: Record<number, number> = {};
      const supportedChains = [42161, 8453];

      await Promise.all(
        supportedChains.map(async (chainId) => {
          return new Promise<void>((resolve) => {
            const request = store.get(chainId);
            request.onsuccess = () => {
              const result = request.result;
              if (result) {
                progress[chainId] = result.lastSyncedBlock;
              } else {
                progress[chainId] =
                  DEPLOYMENT_BLOCKS[chainId as keyof typeof DEPLOYMENT_BLOCKS];
              }
              resolve();
            };
            request.onerror = () => {
              progress[chainId] =
                DEPLOYMENT_BLOCKS[chainId as keyof typeof DEPLOYMENT_BLOCKS];
              resolve();
            };
          });
        }),
      );

      setSyncProgress(progress);
      return progress;
    } catch (error) {
      console.error("Failed to load sync progress:", error);
      // Return default deployment blocks
      return {
        42161: DEPLOYMENT_BLOCKS[42161],
        8453: DEPLOYMENT_BLOCKS[8453],
      };
    }
  }, [initDB]);

  // Save notes to IndexedDB
  const saveNotesToDB = useCallback(
    async (notesToSave: ContractNote[]) => {
      try {
        const db = await initDB();
        const transaction = db.transaction([NOTES_STORE], "readwrite");
        const store = transaction.objectStore(NOTES_STORE);

        await Promise.all(notesToSave.map((note) => store.put(note)));
      } catch (error) {
        console.error("Failed to save notes to IndexedDB:", error);
      }
    },
    [initDB],
  );

  // Load notes from IndexedDB
  const loadNotesFromDB = useCallback(async (): Promise<ContractNote[]> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([NOTES_STORE], "readonly");
      const store = transaction.objectStore(NOTES_STORE);

      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const notes = request.result as ContractNote[];
          // Sort by timestamp, newest first
          notes.sort((a, b) => b.timestamp - a.timestamp);
          resolve(notes);
        };
        request.onerror = () => {
          console.error("Failed to load notes from IndexedDB");
          resolve([]);
        };
      });
    } catch (error) {
      console.error("Failed to load notes from IndexedDB:", error);
      return [];
    }
  }, [initDB]);

  // Decode encrypted note payload
  const decodeNotePayload = useCallback(
    async (
      encryptedData: string,
    ): Promise<{
      assetId?: string;
      assetAmount?: string;
      owner?: string;
      secret?: string;
    } | null> => {
      try {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["string", "string", "string", "string"],
          encryptedData,
        );

        return {
          secret: decoded[0],
          owner: decoded[1],
          assetId: decoded[2],
          assetAmount: decoded[3],
        };
      } catch (error) {
        console.error("Failed to decode note payload:", error);
        return null;
      }
    },
    [],
  );

  // Check if a note belongs to the current user
  const checkNoteOwnership = useCallback(
    async (owner: string): Promise<boolean> => {
      if (!hasPasskey()) return false;

      try {
        const mnemonic = await getMnemonicFromPasskey();
        if (!mnemonic) return false;

        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        const ownerSecret = BigInt(wallet.privateKey);
        const expectedOwner = poseidon2Hash([ownerSecret]);

        console.log(expectedOwner);

        return (
          owner.toLowerCase() ===
          `0x${expectedOwner.toString(16)}`.toLowerCase()
        );
      } catch (error) {
        console.error("Error checking note ownership:", error);
        return false;
      }
    },
    [hasPasskey, getMnemonicFromPasskey],
  );

  // Fetch events for a specific block range on a chain
  const fetchEventsForRange = useCallback(
    async (
      chainId: number,
      fromBlock: number,
      toBlock: number,
    ): Promise<ContractNote[]> => {
      try {
        const rpcUrl = getRpcUrl(chainId);
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        const contract = new ethers.Contract(
          OAPP_ADDRESS,
          CONTRACT_ABI,
          provider,
        );

        // Fetch both LeafInserted and NotePayload events
        const [leafEvents, payloadEvents] = await Promise.all([
          contract.queryFilter(
            contract.filters.LeafInserted(),
            fromBlock,
            toBlock,
          ),
          contract.queryFilter(
            contract.filters.NotePayload(),
            fromBlock,
            toBlock,
          ),
        ]);

        // Group payload events by transaction hash
        const payloadsByTx = new Map<string, any[]>();
        for (const event of payloadEvents) {
          if ("args" in event && event.args) {
            if (!payloadsByTx.has(event.transactionHash)) {
              payloadsByTx.set(event.transactionHash, []);
            }
            payloadsByTx.get(event.transactionHash)!.push(event);
          }
        }

        const processedNotes: ContractNote[] = [];

        for (const leafEvent of leafEvents) {
          // Type guard to check if it's an EventLog with args
          if ("args" in leafEvent && leafEvent.args) {
            const leafIndex = Number(leafEvent.args.leafIndex);
            const leafValue = leafEvent.args.leafValue.toString();

            // Get block timestamp
            let timestamp = 0;
            try {
              const block = await provider.getBlock(leafEvent.blockNumber);
              timestamp = block ? block.timestamp * 1000 : Date.now();
            } catch (error) {
              console.warn(
                `Failed to get block timestamp for block ${leafEvent.blockNumber}`,
              );
              timestamp = Date.now();
            }

            // Try to find corresponding payload events in the same transaction
            const txPayloads =
              payloadsByTx.get(leafEvent.transactionHash) || [];

            let decodedNote: any = null;
            let payloadData: string | undefined;

            // Try to decode the first payload event in the transaction
            if (
              txPayloads.length > 0 &&
              "args" in txPayloads[0] &&
              txPayloads[0].args
            ) {
              payloadData = txPayloads[0].args.encryptedNote;
              if (payloadData) {
                decodedNote = await decodeNotePayload(payloadData);
              }
            }

            // Check ownership if we have decoded data
            let isOwned = false;
            if (decodedNote?.owner) {
              isOwned = await checkNoteOwnership(decodedNote.owner);
            }

            processedNotes.push({
              leafIndex,
              leafValue,
              blockNumber: leafEvent.blockNumber,
              transactionHash: leafEvent.transactionHash,
              chainId,
              timestamp,
              assetId: decodedNote?.assetId,
              assetAmount: decodedNote?.assetAmount,
              owner: decodedNote?.owner,
              secret: decodedNote?.secret,
              isOwned,
              payloadData,
            });
          }
        }

        return processedNotes;
      } catch (error) {
        console.error(
          `Failed to fetch events for chain ${chainId}, blocks ${fromBlock}-${toBlock}:`,
          error,
        );
        throw error;
      }
    },
    [decodeNotePayload, checkNoteOwnership],
  );

  // Sync events for a specific chain
  const syncChainEvents = useCallback(
    async (chainId: number, progressMap: Record<number, number>) => {
      try {
        const rpcUrl = getRpcUrl(chainId);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const currentBlock = await provider.getBlockNumber();

        let fromBlock =
          progressMap[chainId] ||
          DEPLOYMENT_BLOCKS[chainId as keyof typeof DEPLOYMENT_BLOCKS];
        const BATCH_SIZE = 10000;

        console.log(
          `Syncing chain ${chainId} from block ${fromBlock} to ${currentBlock}`,
        );

        while (fromBlock < currentBlock) {
          const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, currentBlock);

          console.log(
            `Fetching events for chain ${chainId}, blocks ${fromBlock}-${toBlock}`,
          );

          try {
            const newNotes = await fetchEventsForRange(
              chainId,
              fromBlock,
              toBlock,
            );

            if (newNotes.length > 0) {
              await saveNotesToDB(newNotes);
              console.log(
                `Saved ${newNotes.length} notes for chain ${chainId}`,
              );
            }

            // Update sync progress
            await saveSyncProgress(chainId, toBlock);

            fromBlock = toBlock + 1;

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.error(
              `Error syncing blocks ${fromBlock}-${toBlock} for chain ${chainId}:`,
              error,
            );

            // If we get a rate limit error, wait longer and try again
            if (
              error instanceof Error &&
              error.message.includes("rate limit")
            ) {
              console.log(`Rate limited, waiting 5 seconds before retrying...`);
              await new Promise((resolve) => setTimeout(resolve, 5000));
              continue;
            }

            // For other errors, skip this batch and continue
            fromBlock = toBlock + 1;
          }
        }

        console.log(`Finished syncing chain ${chainId}`);
      } catch (error) {
        console.error(`Failed to sync chain ${chainId}:`, error);
        throw error;
      }
    },
    [fetchEventsForRange, saveSyncProgress, saveNotesToDB],
  );

  // Sync all chains
  const syncAllChains = useCallback(
    async (progressMap: Record<number, number>) => {
      setSyncing(true);

      try {
        const supportedChains = [42161, 8453]; // Arbitrum and Base

        // Sync chains in parallel
        await Promise.all(
          supportedChains.map((chainId) =>
            syncChainEvents(chainId, progressMap),
          ),
        );

        console.log("Finished syncing all chains");
      } catch (error) {
        console.error("Failed to sync chains:", error);
        setError("Failed to sync some chains");
      } finally {
        setSyncing(false);
      }
    },
    [syncChainEvents],
  );

  // Load and refresh notes
  const refreshNotes = useCallback(async () => {
    try {
      const savedNotes = await loadNotesFromDB();
      setNotes(savedNotes);
    } catch (error) {
      console.error("Failed to refresh notes:", error);
    }
  }, [loadNotesFromDB]);

  // Main sync function
  const performSync = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load existing sync progress
      const progressMap = await loadSyncProgress();

      // Load existing notes from DB
      await refreshNotes();

      // Sync new events
      await syncAllChains(progressMap);

      // Refresh notes after sync
      await refreshNotes();
    } catch (error) {
      console.error("Failed to perform sync:", error);
      setError("Failed to sync events from blockchain");
    } finally {
      setLoading(false);
    }
  }, [loadSyncProgress, refreshNotes, syncAllChains]);

  // Get notes filtered by chain
  const getNotesByChain = useCallback(
    (chainId: number): ContractNote[] => {
      return notes.filter((note) => note.chainId === chainId);
    },
    [notes],
  );

  // Get notes that belong to the current user
  const getUserNotes = useCallback((): ContractNote[] => {
    return notes.filter((note) => note.isOwned);
  }, [notes]);

  // Get token symbol from asset ID
  const getTokenSymbol = useCallback(
    (assetId: string, chainId: number): string => {
      for (const [symbol, token] of Object.entries(TOKENS)) {
        if (
          token.addresses[
            chainId as keyof typeof token.addresses
          ]?.toLowerCase() === assetId?.toLowerCase()
        ) {
          return symbol;
        }
      }
      return "UNKNOWN";
    },
    [],
  );

  // Initial load
  useEffect(() => {
    performSync();
  }, [performSync]);

  return {
    notes,
    loading,
    syncing,
    syncProgress,
    error,
    refetch: performSync,
    getNotesByChain,
    getUserNotes,
    getTokenSymbol,
  };
}
