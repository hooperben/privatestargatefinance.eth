"use client";

import { useState } from "react";
import { useNotes } from "../../hooks/useNotes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { TOKENS } from "../../lib/tokens";
import { CHAIN_NAMES } from "../constants";

export function Notes() {
  const { notes, loading, error } = useNotes();
  const [selectedChain, setSelectedChain] = useState<number | null>(null);

  const filteredNotes = selectedChain
    ? notes.filter((note) => note.chainId === selectedChain)
    : notes;

  const formatAmount = (amount: string, symbol: string) => {
    const decimals = TOKENS[symbol as keyof typeof TOKENS]?.decimals || 6;
    const numericAmount = parseFloat(amount);
    return numericAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(decimals, 6),
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTokenSymbol = (assetId: string, chainId: number): string => {
    for (const [symbol, token] of Object.entries(TOKENS)) {
      if (
        token.addresses[
          chainId as keyof typeof token.addresses
        ]?.toLowerCase() === assetId.toLowerCase()
      ) {
        return symbol;
      }
    }
    return "UNKNOWN";
  };

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error Loading Notes
            </h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Encrypted Notes
            </h1>
            <p className="text-gray-600 mt-1">
              Your private encrypted deposit notes
            </p>
          </div>

          {/* Chain filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedChain(null)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                selectedChain === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Chains
            </button>
            <button
              onClick={() => setSelectedChain(42161)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                selectedChain === 42161
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Arbitrum
            </button>
            <button
              onClick={() => setSelectedChain(8453)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                selectedChain === 8453
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Base
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <Skeleton className="h-6 w-48" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Your Encrypted Notes ({filteredNotes.length})
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Private notes stored locally in your browser
              </p>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No encrypted notes found</p>
                <p className="text-sm mt-1">
                  {selectedChain
                    ? `No notes found for ${
                        CHAIN_NAMES[selectedChain as keyof typeof CHAIN_NAMES]
                      }`
                    : "Create your first encrypted deposit to see notes here"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Secret</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note) => {
                    const tokenSymbol = getTokenSymbol(
                      note.assetId,
                      note.chainId,
                    );
                    return (
                      <TableRow key={note.id}>
                        <TableCell className="font-semibold">
                          {tokenSymbol}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {
                              CHAIN_NAMES[
                                note.chainId as keyof typeof CHAIN_NAMES
                              ]
                            }
                          </span>
                        </TableCell>
                        <TableCell className="font-mono font-bold">
                          {formatAmount(note.assetAmount, tokenSymbol)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatAddress(note.owner)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatAddress(note.secret)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(note.createdAt)}
                        </TableCell>
                        <TableCell>
                          {note.txHash ? (
                            <span className="text-green-600 text-sm font-medium">
                              ✅ Deposited
                            </span>
                          ) : (
                            <span className="text-yellow-600 text-sm font-medium">
                              ⏳ Pending
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🔒 Privacy Note</h3>
          <p className="text-blue-800 text-sm">
            Your encrypted notes are stored locally in your browser's IndexedDB.
            They contain the secret information needed to spend your private
            deposits. Keep your passkey safe as it's required to access these
            notes.
          </p>
        </div>
      </div>
    </div>
  );
}
