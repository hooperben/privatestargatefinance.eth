export const OAPP_ADDRESS = "0xA91C4C647733f9a8D4e195f1353d94B7Edd63A79";

// eid / chain id
export const BASE_EID = 30184; // 8453
export const ARB_EID = 30110; // 42161

// Chain IDs for Merkle Trees
export const ARBITRUM_CHAIN_ID = 42161;
export const BASE_CHAIN_ID = 8453;

// Merkle Tree Configuration
export const MERKLE_TREE_LEVELS = 12;
export const MERKLE_TREE_CAPACITY = 2 ** MERKLE_TREE_LEVELS; // 4096 leaves

// Supported chains for merkle trees
export const SUPPORTED_CHAINS = [ARBITRUM_CHAIN_ID, BASE_CHAIN_ID] as const;

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number];

// Chain names mapping
export const CHAIN_NAMES: Record<number, string> = {
  [ARBITRUM_CHAIN_ID]: "Arbitrum",
  [BASE_CHAIN_ID]: "Base",
};
