import { useState, useEffect, useCallback } from "react";
import { useContractNotes } from "../../hooks/useContractNotes";
import { poseidon2Hash } from "@zkpassport/poseidon2";

interface MerkleProof {
  path: string[];
  pathIndices: string[];
}

export class PoseidonMerkleTree {
  private levels: number;
  private hashMap: Map<string, string> = new Map();
  private defaultNodes: string[] = [];
  private poseidonHash: any; // sorry
  private MAX_LEAF_INDEX: number;

  constructor(levels: number) {
    this.levels = levels;
    this.MAX_LEAF_INDEX = 2 ** levels;
  }

  async initialize() {
    this.poseidonHash = poseidon2Hash;
    await this.calculateDefaultNodes();
  }

  private async calculateDefaultNodes() {
    // Use the exact same zero values as the contract's zeros() function
    this.defaultNodes = [
      "0x1e2856f9f722631c878a92dc1d84283d04b76df3e1831492bdf7098c1e65e478", // zeros(0)
      "0x2c2eecb1b14035bfd9765e84195684b401a84fdb58c3c03f1bcea86dcf0c8105", // zeros(1)
      "0x237e412a71db31e5769f63d92346a09dd0f30b9c335e9d9aa96b6625eb537445", // zeros(2)
      "0x0b3ff120d61a7de2da3d80ff99d393796805c74be5c39e8a4c7436d1c65dad4c", // zeros(3)
      "0x0fc58e21665302678bef68714d9e5889583071f7bd3cf018b64fafc51b0a9cf3", // zeros(4)
      "0x235df7c585524ed8a26aea20a0fb168038f10df71d84720c9a8c1b3e78e3b6cd", // zeros(5)
      "0x1c6cabee394ea24dc09eab1788f7f62b367e95789f883e33690d94215d819264", // zeros(6)
      "0x09bec327ab2c8dda5d2d435cd267cb21e71f21371a01739885817eb1625d8976", // zeros(7)
      "0x2d35519ad7061578be50cbbfe040327843f6b4cdf1458e01b5f9737dbaf82b18", // zeros(8)
      "0x0f86c9e9c9e689394a4944bb87291a3f55cc930b21432fccf41b8267f1a98d6f", // zeros(9)
      "0x181c9ba70900093b180c96f55cc2b1d73d60b8ab613344cbba83b33cbcc94e2b", // zeros(10)
      "0x124005ad54174bbcb8c2dd053ea318daa80106cdcc518731504b771d6006123f", // zeros(11) - initial root
    ];
  }

  private getKey(level: number, index: number): string {
    return `${level}-${index}`;
  }

  async insertLeaf(leafIndex: number, leafValue: string) {
    if (!this.poseidonHash) throw new Error("Poseidon not initialized");
    if (leafIndex < 0 || leafIndex >= this.MAX_LEAF_INDEX) {
      throw new Error("Leaf index out of bounds");
    }

    let currentIndex = leafIndex;
    let currentHash = leafValue;

    // Store the leaf at level 0
    this.hashMap.set(this.getKey(0, currentIndex), currentHash);

    // Calculate parent nodes up to the root
    for (let level = 0; level < this.levels - 1; level++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      const siblingKey = this.getKey(level, siblingIndex);

      // Get sibling value
      let sibling = this.hashMap.get(siblingKey);
      if (!sibling) {
        sibling = this.defaultNodes[level];
      }

      // Calculate parent hash based on position
      if (isLeft) {
        currentHash = this.poseidonHash([BigInt(currentHash), BigInt(sibling)]);
      } else {
        currentHash = this.poseidonHash([BigInt(sibling), BigInt(currentHash)]);
      }

      // Move to parent level
      currentIndex = Math.floor(currentIndex / 2);
      this.hashMap.set(this.getKey(level + 1, currentIndex), currentHash);
    }
  }

  getProof(leafIndex: number): MerkleProof {
    const path: string[] = [];
    const pathIndices: string[] = [];

    let currentIndex = leafIndex;

    for (let level = 0; level < this.levels - 1; level++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      const siblingKey = this.getKey(level, siblingIndex);

      // Get sibling value
      let sibling = this.hashMap.get(siblingKey);
      if (!sibling) {
        sibling = this.defaultNodes[level];
      }

      path.push(sibling);
      pathIndices.push(isLeft ? "1" : "0"); // 1 if sibling is on the right, 0 if on the left

      currentIndex = Math.floor(currentIndex / 2);
    }

    return { path, pathIndices };
  }

  getRoot(): string {
    // The root is at the top level (level = levels - 1) and index 0
    return (
      this.hashMap.get(this.getKey(this.levels - 1, 0)) ||
      this.defaultNodes[this.levels - 1]
    );
  }
}

export function useMerkleTree(chainId: number) {
  const [tree, setTree] = useState<PoseidonMerkleTree | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notes, loading } = useContractNotes();

  const buildTree = useCallback(async () => {
    setIsBuilding(true);
    setError(null);

    try {
      // Filter notes for this chain and sort by leaf index
      const chainNotes = notes
        .filter((note) => note.chainId === chainId)
        .sort((a, b) => a.leafIndex - b.leafIndex);

      if (chainNotes.length === 0) {
        setTree(null);
        return;
      }

      // Create and initialize tree
      const newTree = new PoseidonMerkleTree(12); // 12 levels as per contract
      await newTree.initialize();

      // Insert all leaves in order
      for (const note of chainNotes) {
        await newTree.insertLeaf(note.leafIndex, note.leafValue);
      }

      setTree(newTree);
    } catch (err) {
      console.error("Failed to build merkle tree:", err);
      setError(err instanceof Error ? err.message : "Failed to build tree");
    } finally {
      setIsBuilding(false);
    }
  }, [notes, chainId]);

  // Rebuild tree when notes change
  useEffect(() => {
    if (!loading && notes.length > 0) {
      buildTree();
    }
  }, [loading, notes, buildTree]);

  const getMerkleProof = useCallback(
    (leafIndex: number): MerkleProof | null => {
      if (!tree) return null;
      try {
        return tree.getProof(leafIndex);
      } catch (err) {
        console.error("Failed to get merkle proof:", err);
        return null;
      }
    },
    [tree],
  );

  const getRoot = useCallback((): string | null => {
    return tree ? tree.getRoot() : null;
  }, [tree]);

  return {
    tree,
    isBuilding,
    error,
    getMerkleProof,
    getRoot,
    buildTree,
  };
}
