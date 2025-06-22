"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PoseidonMerkleTree } from "../src/lib/PoseidonMerkleTree";
import {
  MERKLE_TREE_LEVELS,
  ARBITRUM_CHAIN_ID,
  BASE_CHAIN_ID,
  type SupportedChainId,
} from "../src/constants";

const DB_NAME = "MerkleTreeDB";
const DB_VERSION = 1;
const TREES_STORE = "trees";

interface TreeCache {
  chainId: number;
  treeData: string;
  timestamp: number;
  version: string;
}

export function useTree(chainId: SupportedChainId) {
  const [tree, setTree] = useState<PoseidonMerkleTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        if (!db.objectStoreNames.contains(TREES_STORE)) {
          const store = db.createObjectStore(TREES_STORE, {
            keyPath: "chainId",
          });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }, []);

  // Save tree to IndexedDB
  const saveTreeToCache = useCallback(
    async (tree: PoseidonMerkleTree, chainId: number) => {
      try {
        const db = await initDB();
        const transaction = db.transaction([TREES_STORE], "readwrite");
        const store = transaction.objectStore(TREES_STORE);

        const treeCache: TreeCache = {
          chainId,
          treeData: tree.toJSON(),
          timestamp: Date.now(),
          version: "1.0",
        };

        await store.put(treeCache);
        console.log(`✅ Tree cached for chain ${chainId}`);
      } catch (error) {
        console.error("Failed to save tree to cache:", error);
      }
    },
    [initDB],
  );

  // Load tree from IndexedDB
  const loadTreeFromCache = useCallback(
    async (chainId: number): Promise<PoseidonMerkleTree | null> => {
      try {
        const db = await initDB();
        const transaction = db.transaction([TREES_STORE], "readonly");
        const store = transaction.objectStore(TREES_STORE);
        const request = store.get(chainId);

        return new Promise((resolve) => {
          request.onsuccess = () => {
            const result = request.result as TreeCache | undefined;
            if (result) {
              try {
                const tree = PoseidonMerkleTree.fromJSON(result.treeData);
                console.log(`✅ Tree loaded from cache for chain ${chainId}`);
                resolve(tree);
              } catch (error) {
                console.error("Failed to parse cached tree:", error);
                resolve(null);
              }
            } else {
              resolve(null);
            }
          };

          request.onerror = () => resolve(null);
        });
      } catch (error) {
        console.error("Failed to load tree from cache:", error);
        return null;
      }
    },
    [initDB],
  );

  // Build full tree with zero values
  const buildFullTree = useCallback(async (): Promise<PoseidonMerkleTree> => {
    console.log(`🌳 Building full tree for chain ${chainId}...`);
    const tree = new PoseidonMerkleTree(MERKLE_TREE_LEVELS);

    const totalLeaves = 2 ** MERKLE_TREE_LEVELS;
    const ZERO_VALUE = tree.getLeafValue(0); // Get the default zero value

    // Insert zero values to all positions to build a complete tree
    const batchSize = 1000; // Process in batches to avoid blocking UI
    for (let i = 0; i < totalLeaves; i += batchSize) {
      const batch = Math.min(batchSize, totalLeaves - i);
      const insertPromises = [];

      for (let j = 0; j < batch; j++) {
        const index = i + j;
        insertPromises.push(tree.insert(ZERO_VALUE, index));
      }

      await Promise.all(insertPromises);

      // Optional: Show progress for large trees
      if (i % 10000 === 0) {
        console.log(`Progress: ${((i / totalLeaves) * 100).toFixed(1)}%`);
      }
    }

    console.log(`✅ Full tree built for chain ${chainId}`);
    return tree;
  }, [chainId]);

  // Initialize tree for the given chain
  const initializeTree = useCallback(async () => {
    if (
      !chainId ||
      (chainId !== ARBITRUM_CHAIN_ID && chainId !== BASE_CHAIN_ID)
    ) {
      setError(`Unsupported chain ID: ${chainId}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      let tree = await loadTreeFromCache(chainId);

      if (!tree) {
        // Build new tree if not cached
        console.log(
          `❌ No cached tree found for chain ${chainId}, building new one...`,
        );
        tree = await buildFullTree();
        await saveTreeToCache(tree, chainId);
      }

      setTree(tree);
      console.log(`🎯 Tree ready for chain ${chainId}:`, tree.getStats());
    } catch (error) {
      console.error("Failed to initialize tree:", error);
      setError(
        error instanceof Error ? error.message : "Failed to initialize tree",
      );
    } finally {
      setLoading(false);
    }
  }, [chainId, loadTreeFromCache, buildFullTree, saveTreeToCache]);

  // Initialize tree when chainId changes
  useEffect(() => {
    initializeTree();
  }, [initializeTree]);

  // Insert a new leaf into the tree
  const insertLeaf = useCallback(
    async (leaf: bigint | string, index?: number): Promise<number> => {
      if (!tree) {
        throw new Error("Tree not initialized");
      }

      const leafIndex = index ?? tree.insertedLeaves.size;
      await tree.insert(leaf, leafIndex);

      // Save updated tree to cache
      await saveTreeToCache(tree, chainId);

      return leafIndex;
    },
    [tree, chainId, saveTreeToCache],
  );

  // Get merkle proof for a leaf
  const getProof = useCallback(
    (index: number) => {
      if (!tree) {
        throw new Error("Tree not initialized");
      }
      return tree.getProof(index);
    },
    [tree],
  );

  // Get tree root
  const getRoot = useCallback(() => {
    if (!tree) {
      throw new Error("Tree not initialized");
    }
    return tree.getRoot();
  }, [tree]);

  // Verify a merkle proof
  const verifyProof = useCallback(
    (
      root: bigint,
      leaf: bigint | string,
      proof: { siblings: bigint[]; indices: number[] },
    ) => {
      return PoseidonMerkleTree.verifyProof(root, leaf, proof);
    },
    [],
  );

  // Get tree statistics
  const getStats = useCallback(() => {
    return tree?.getStats() || null;
  }, [tree]);

  // Clear cache for this chain
  const clearCache = useCallback(async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction([TREES_STORE], "readwrite");
      const store = transaction.objectStore(TREES_STORE);
      await store.delete(chainId);
      console.log(`🗑️ Cache cleared for chain ${chainId}`);
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, [chainId, initDB]);

  return {
    tree,
    loading,
    error,
    insertLeaf,
    getProof,
    getRoot,
    verifyProof,
    getStats,
    clearCache,
    refreshTree: initializeTree,
  };
}
