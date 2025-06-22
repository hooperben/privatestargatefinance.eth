import { poseidon2Hash } from "@zkpassport/poseidon2";
import { keccak256, toUtf8Bytes } from "ethers";

// Helper to convert bigint to hex string for consistent serialization
const bigintToHex = (value: bigint): string => {
  return "0x" + value.toString(16);
};

// Helper to convert hex string back to bigint
const hexToBigint = (hex: string): bigint => {
  return BigInt(hex);
};

export class PoseidonMerkleTree {
  private levels: number;
  private hashMap: Map<string, bigint>;
  private defaultNodes: bigint[];
  private nextIndex: number;
  private currentRootIndex: number;
  public insertedLeaves: Set<number>;

  constructor(levels: number) {
    this.levels = levels;
    this.hashMap = new Map();
    this.defaultNodes = new Array(levels);
    this.nextIndex = 0;
    this.currentRootIndex = 0;
    this.insertedLeaves = new Set();
    this.initializeDefaultNodes();
  }

  private initializeDefaultNodes() {
    // Same zero value as in contracts: keccak256("TANGERINE") % FIELD_MODULUS
    const ZERO_VALUE =
      BigInt(keccak256(toUtf8Bytes("TANGERINE"))) %
      BigInt(
        "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
      );

    this.defaultNodes[0] = ZERO_VALUE;

    // Calculate default nodes for each level
    for (let i = 1; i < this.levels; i++) {
      this.defaultNodes[i] = poseidon2Hash([
        this.defaultNodes[i - 1],
        this.defaultNodes[i - 1],
      ]);
    }
  }

  private getKey(level: number, index: number): string {
    return `${level}:${index}`;
  }

  public async insert(leaf: bigint | string, index: number): Promise<void> {
    if (index < 0 || index >= 2 ** this.levels) {
      throw new Error("Leaf index out of bounds");
    }

    // Convert input to bigint
    const value = typeof leaf === "string" ? BigInt(leaf) : leaf;

    // Track this leaf as inserted
    this.insertedLeaves.add(index);
    this.nextIndex = Math.max(this.nextIndex, index + 1);

    // Insert leaf
    let currentIndex = index;
    let currentHash = value;
    this.hashMap.set(this.getKey(0, currentIndex), currentHash);

    // Calculate parent nodes
    for (let i = 0; i < this.levels - 1; i++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      const siblingKey = this.getKey(i, siblingIndex);

      let sibling = this.hashMap.get(siblingKey);
      if (!sibling) {
        sibling = this.defaultNodes[i];
      }

      // Calculate parent hash
      currentHash = poseidon2Hash(
        isLeft ? [currentHash, sibling] : [sibling, currentHash],
      );

      // Move up one level
      currentIndex = Math.floor(currentIndex / 2);
      this.hashMap.set(this.getKey(i + 1, currentIndex), currentHash);
    }
  }

  public getRoot(): bigint {
    const rootKey = this.getKey(this.levels - 1, 0);
    const root = this.hashMap.get(rootKey);
    return root || this.defaultNodes[this.levels - 1];
  }

  public getProof(index: number): { siblings: bigint[]; indices: number[] } {
    if (index < 0 || index >= 2 ** this.levels) {
      throw new Error("Leaf index out of bounds");
    }

    const siblings: bigint[] = [];
    const indices: number[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.levels - 1; i++) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      const siblingKey = this.getKey(i, siblingIndex);

      let sibling = this.hashMap.get(siblingKey);
      if (!sibling) {
        sibling = this.defaultNodes[i];
      }

      siblings.push(sibling);
      indices.push(isLeft ? 1 : 0);
      currentIndex = Math.floor(currentIndex / 2);
    }

    return { siblings, indices };
  }

  public static verifyProof(
    root: bigint,
    leaf: bigint | string,
    proof: { siblings: bigint[]; indices: number[] },
  ): boolean {
    const value = typeof leaf === "string" ? BigInt(leaf) : leaf;
    let currentHash = value;

    for (let i = 0; i < proof.siblings.length; i++) {
      currentHash = poseidon2Hash(
        proof.indices[i] === 0
          ? [proof.siblings[i], currentHash]
          : [currentHash, proof.siblings[i]],
      );
    }

    return currentHash === root;
  }

  public getLeafValue(leafIndex: number): bigint {
    if (leafIndex < 0 || leafIndex >= 2 ** this.levels) {
      throw new Error("Leaf index out of bounds");
    }

    // Get the leaf value from the hashMap at level 0
    const leafKey = this.getKey(0, leafIndex);
    const leafValue = this.hashMap.get(leafKey);

    // If the leaf doesn't exist in the hashMap, return the default value (zero)
    return leafValue || this.defaultNodes[0];
  }

  /**
   * Serialize the tree to JSON format for storage
   */
  toJSON(): string {
    // Convert hashMap to plain object for JSON serialization
    const hashMapObj: Record<string, string> = {};
    for (const [key, value] of this.hashMap.entries()) {
      hashMapObj[key] = bigintToHex(value);
    }

    // Convert defaultNodes to strings
    const defaultNodesObj = this.defaultNodes.map((node) => bigintToHex(node));

    const treeData = {
      levels: this.levels,
      nextIndex: this.nextIndex,
      currentRootIndex: this.currentRootIndex,
      hashMap: hashMapObj,
      defaultNodes: defaultNodesObj,
      insertedLeaves: Array.from(this.insertedLeaves),
      timestamp: Date.now(),
      version: "1.0",
    };

    return JSON.stringify(treeData);
  }

  /**
   * Load tree from JSON format
   */
  static fromJSON(jsonString: string): PoseidonMerkleTree {
    const data = JSON.parse(jsonString);

    const tree = new PoseidonMerkleTree(data.levels);

    // Wait for default nodes to be initialized
    tree.nextIndex = data.nextIndex;
    tree.currentRootIndex = data.currentRootIndex;

    // Restore hashMap
    for (const [key, value] of Object.entries(data.hashMap)) {
      tree.hashMap.set(key, hexToBigint(value as string));
    }

    // Restore insertedLeaves
    tree.insertedLeaves = new Set(data.insertedLeaves);

    return tree;
  }

  /**
   * Get tree statistics
   */
  getStats() {
    return {
      levels: this.levels,
      totalCapacity: 2 ** this.levels,
      insertedLeaves: this.insertedLeaves.size,
      nextIndex: this.nextIndex,
      root: bigintToHex(this.getRoot()),
    };
  }
}
