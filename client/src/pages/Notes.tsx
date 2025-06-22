"use client";

import { useState, useEffect } from "react";
import { useContractNotes } from "../../hooks/useContractNotes";
import { usePasskey } from "../../hooks/usePasskey";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { WithdrawModal } from "../components/WithdrawModal";
import { CHAIN_NAMES, OAPP_ADDRESS } from "../constants";

export function Notes() {
  const {
    notes,
    loading,
    syncing,
    syncProgress,
    error,
    refetch,
    getUserNotes,
    getTokenSymbol,
  } = useContractNotes();
  const { getUserHashPub } = usePasskey();
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [showOnlyOwned, setShowOnlyOwned] = useState(true);
  const [userNotes, setUserNotes] = useState<typeof notes>([]);
  const [userHashPub, setUserHashPub] = useState<string | null>(null);
  const [withdrawModal, setWithdrawModal] = useState<{
    isOpen: boolean;
    note: (typeof notes)[0] | null;
  }>({
    isOpen: false,
    note: null,
  });

  // Get user's hash pub and user notes when component mounts or notes change
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const hashPub = await getUserHashPub();
        setUserHashPub(hashPub);

        if (showOnlyOwned) {
          const userNotesData = await getUserNotes();
          setUserNotes(userNotesData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [notes, showOnlyOwned, getUserHashPub, getUserNotes]);

  // Filter notes based on selected chain and ownership
  let filteredNotes = showOnlyOwned ? userNotes : notes;

  if (selectedChain) {
    filteredNotes = filteredNotes.filter(
      (note) => note.chainId === selectedChain,
    );
  }

  // Check if a note is owned by the current user
  const isNoteOwned = (note: (typeof notes)[0]) => {
    return (
      userHashPub && note.owner?.toString() === BigInt(userHashPub).toString()
    );
  };

  const formatAmount = (amount?: string, symbol?: string) => {
    if (!amount || !symbol) return "Unknown";
    const numericAmount = parseFloat(amount);
    return numericAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatAddress = (address?: string) => {
    if (!address) return "Unknown";
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
              Notes from Leaf Inserted events on-chain
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {/* Ownership filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowOnlyOwned(false)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  !showOnlyOwned
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All Notes
              </button>
              <button
                onClick={() => setShowOnlyOwned(true)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  showOnlyOwned
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                My Notes Only
              </button>
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

            {/* Refresh button */}
            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              disabled={loading || syncing}
            >
              {loading ? "Loading..." : syncing ? "Syncing..." : "Refresh"}
            </Button>
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
                  <TableHead>Leaf Index</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
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
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16" />
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
                {showOnlyOwned ? "Your" : "All"} Encrypted Notes (
                {filteredNotes.length})
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Notes from LeafInserted events on the blockchain
              </p>

              {/* Sync Progress */}
              {syncing && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-blue-800 font-medium text-sm">
                      Syncing blockchain events...
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {Object.entries(syncProgress).map(
                      ([chainId, blockNumber]) => (
                        <div
                          key={chainId}
                          className="flex justify-between text-blue-700"
                        >
                          <span>
                            {
                              CHAIN_NAMES[
                                Number(chainId) as keyof typeof CHAIN_NAMES
                              ]
                            }
                            :
                          </span>
                          <span className="font-mono">
                            Block {blockNumber.toLocaleString()}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No encrypted notes found</p>
                <p className="text-sm mt-1">
                  {selectedChain
                    ? `No notes found for ${
                        CHAIN_NAMES[selectedChain as keyof typeof CHAIN_NAMES]
                      }`
                    : showOnlyOwned
                    ? "No notes found that belong to you. Try creating an encrypted deposit or toggle to 'All Notes'."
                    : "No Leaf Inserted events found on the blockchain yet."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leaf Index</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Secret</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Tx Hash</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note) => {
                    const tokenSymbol = getTokenSymbol(
                      note.assetId || "",
                      note.chainId,
                    );
                    const noteIsOwned = isNoteOwned(note);
                    return (
                      <TableRow
                        key={`${note.chainId}-${note.leafIndex}`}
                        className={noteIsOwned ? "bg-green-50" : ""}
                      >
                        <TableCell className="font-mono text-sm">
                          {note.leafIndex}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {tokenSymbol}
                          {noteIsOwned && (
                            <span className="ml-2 text-xs text-green-600">
                              👤
                            </span>
                          )}
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
                          {formatDate(note.timestamp)}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`https://${
                              note.chainId === 42161
                                ? "arbiscan.io"
                                : "basescan.org"
                            }/tx/${note.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-mono"
                          >
                            {formatAddress(note.transactionHash)}
                          </a>
                        </TableCell>
                        <TableCell>
                          {noteIsOwned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setWithdrawModal({
                                  isOpen: true,
                                  note: note,
                                })
                              }
                              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                            >
                              Withdraw
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              Not owned
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
          <h3 className="font-semibold text-blue-900 mb-2">
            🔗 On-Chain Notes
          </h3>
          <p className="text-blue-800 text-sm">
            These notes are fetched directly from LeafInserted events on the
            blockchain contracts. Notes marked with 👤 belong to you (based on
            your passkey). The leaf index shows the position in the Merkle tree,
            and the transaction hash links to the block explorer.
          </p>
          <p className="text-blue-800 text-sm mt-2">
            <strong>Contract Address:</strong>{" "}
            <span className="font-mono text-xs">{OAPP_ADDRESS}</span>
          </p>

          {/* Sync Status */}
          {!syncing && Object.keys(syncProgress).length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <h4 className="font-medium text-blue-900 text-sm mb-2">
                Sync Status:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(syncProgress).map(([chainId, blockNumber]) => (
                  <div key={chainId} className="bg-blue-100 rounded px-2 py-1">
                    <div className="font-medium text-blue-900">
                      {CHAIN_NAMES[Number(chainId) as keyof typeof CHAIN_NAMES]}
                    </div>
                    <div className="text-blue-700 font-mono">
                      Block {blockNumber.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Withdraw Modal */}
        <WithdrawModal
          isOpen={withdrawModal.isOpen}
          onClose={() => setWithdrawModal({ isOpen: false, note: null })}
          note={
            withdrawModal.note
              ? {
                  leafIndex: withdrawModal.note.leafIndex?.toString() || "",
                  assetId: withdrawModal.note.assetId || "",
                  assetAmount: withdrawModal.note.assetAmount || "",
                  owner: withdrawModal.note.owner || "",
                  secret: withdrawModal.note.secret || "",
                  chainId: withdrawModal.note.chainId,
                }
              : null
          }
          tokenSymbol={
            withdrawModal.note
              ? getTokenSymbol(
                  withdrawModal.note.assetId || "",
                  withdrawModal.note.chainId,
                )
              : ""
          }
        />
      </div>
    </div>
  );
}
