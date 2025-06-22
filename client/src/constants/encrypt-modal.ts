// PrivateStargateFinance contract addresses
export const PSF_ADDRESSES = {
  42161: "0xA91C4C647733f9a8D4e195f1353d94B7Edd63A79", // Arbitrum
  8453: "0xA91C4C647733f9a8D4e195f1353d94B7Edd63A79", // Base
} as const;

// ERC20 ABI for approval
export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// PrivateStargateFinance ABI for deposit function
export const PSF_ABI = [
  {
    inputs: [
      { name: "_erc20", type: "address" },
      { name: "_amount", type: "uint64" },
      { name: "_proof", type: "bytes" },
      { name: "_publicInputs", type: "bytes32[]" },
      { name: "_payload", type: "bytes[]" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
