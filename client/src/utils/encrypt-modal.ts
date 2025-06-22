import { TOKENS } from "../../lib/tokens";
import type { TokenBalance } from "../../hooks/useTokenBalances";

// Helper function to get token address from tokenBalance
export const getTokenAddress = (tokenBalance: TokenBalance): string => {
  return TOKENS[tokenBalance.symbol].addresses[tokenBalance.chainId];
};

// Helper function to get token decimals
export const getTokenDecimals = (tokenBalance: TokenBalance): number => {
  return TOKENS[tokenBalance.symbol].decimals;
};

// Helper function to get block explorer URL
export const getBlockExplorerUrl = (
  txHash: string,
  chainId: number,
): string => {
  if (chainId === 42161) {
    return `https://arbiscan.io/tx/${txHash}`;
  } else if (chainId === 8453) {
    return `https://basescan.org/tx/${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
};

// Parse and display user-friendly error messages
export const parseErrorMessage = (error: Error, step: string): string => {
  const message = error.message.toLowerCase();

  if (message.includes("user rejected") || message.includes("user denied")) {
    if (step === "approve") {
      return "Approval was cancelled. The transaction needs approval to proceed.";
    }
    return "Transaction was cancelled. Please try again when ready.";
  }

  if (message.includes("insufficient funds")) {
    return "Insufficient funds to complete this transaction.";
  }

  if (message.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  if (message.includes("nonce")) {
    return "Transaction nonce error. Please try again.";
  }

  if (message.includes("gas")) {
    return "Gas estimation failed. Please try again or adjust gas settings.";
  }

  if (message.includes("execution reverted")) {
    return "Transaction failed. Please check token balance and allowance.";
  }

  // For other errors, show a generic message but log the full error
  console.error("Full error details:", error);
  return "Transaction failed. Please try again or contact support if the issue persists.";
};
