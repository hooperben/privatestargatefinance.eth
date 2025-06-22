export const TOKENS = {
  USDC: {
    symbol: "USDC",
    decimals: 6,
    addresses: {
      [42161]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
      [8453]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
    },
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;
export type ChainId = 42161 | 8453;
