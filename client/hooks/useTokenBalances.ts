"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http, formatUnits } from "viem";
import { arbitrum, base } from "viem/chains";
import { TOKENS, type TokenSymbol, type ChainId } from "../lib/tokens";

const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

export interface TokenBalance {
  symbol: TokenSymbol;
  chainId: ChainId;
  chainName: string;
  balance: string;
  formattedBalance: string;
  hasBalance: boolean;
}

export function useTokenBalances() {
  const { address } = useAccount();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const clients = {
    [arbitrum.id]: createPublicClient({
      chain: arbitrum,
      transport: http(),
    }),
    [base.id]: createPublicClient({
      chain: base,
      transport: http(),
    }),
  };

  useEffect(() => {
    if (!address) {
      setBalances([]);
      return;
    }

    const fetchBalances = async () => {
      setLoading(true);
      const tokenBalances: TokenBalance[] = [];

      try {
        for (const [symbol, token] of Object.entries(TOKENS)) {
          for (const [chainIdStr, tokenAddress] of Object.entries(
            token.addresses,
          )) {
            const chainId = Number.parseInt(chainIdStr) as ChainId;
            const client = clients[chainId];
            const chainName = chainId === 42161 ? "Arbitrum" : "Base";

            try {
              const balance = (await client.readContract({
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address],
              })) as bigint;

              const formattedBalance = formatUnits(balance, token.decimals);
              const hasBalance = Number.parseFloat(formattedBalance) > 0;

              tokenBalances.push({
                symbol: symbol as TokenSymbol,
                chainId,
                chainName,
                balance: balance.toString(),
                formattedBalance,
                hasBalance,
              });
            } catch (error) {
              console.error(
                `Failed to fetch ${symbol} balance on ${chainName}:`,
                error,
              );
              tokenBalances.push({
                symbol: symbol as TokenSymbol,
                chainId,
                chainName,
                balance: "0",
                formattedBalance: "0",
                hasBalance: false,
              });
            }
          }
        }

        setBalances(tokenBalances);
      } catch (error) {
        console.error("Failed to fetch token balances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address]);

  return { balances, loading, refetch: () => {} };
}
