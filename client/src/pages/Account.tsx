"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useTokenBalances } from "../../hooks/useTokenBalances";
import { TransferModal } from "../components/TransferModal";
import { WarpModal } from "../components/WarpModal";
import { ContactManager } from "../components/ContactManager";
import type { TokenBalance } from "../../hooks/useTokenBalances";

export function Account() {
  const { address, isConnected } = useAccount();
  const { balances, loading } = useTokenBalances();
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    tokenBalance?: TokenBalance;
  }>({
    isOpen: false,
  });
  const [warpModal, setWarpModal] = useState<{
    isOpen: boolean;
    tokenBalance?: TokenBalance;
  }>({
    isOpen: false,
  });
  const [contactsModal, setContactsModal] = useState(false);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Account</h1>
          <p className="text-gray-600">
            Please connect your wallet to view your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Account</h1>
            <p className="text-gray-600 font-mono text-sm mt-1">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button
            onClick={() => setContactsModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Manage Contacts
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading balances...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {balances.map((balance) => (
              <div
                key={`${balance.symbol}-${balance.chainId}`}
                className="bg-white rounded-lg p-6 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold">{balance.symbol}</h2>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {balance.chainName}
                      </span>
                    </div>
                    <div className="text-3xl font-mono font-bold text-gray-800">
                      {Number.parseFloat(
                        balance.formattedBalance,
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </div>
                  </div>

                  {balance.hasBalance && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setTransferModal({
                            isOpen: true,
                            tokenBalance: balance,
                          })
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() =>
                          setWarpModal({ isOpen: true, tokenBalance: balance })
                        }
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
                      >
                        Warp
                      </button>
                    </div>
                  )}
                </div>

                {!balance.hasBalance && (
                  <div className="text-gray-500 text-sm">
                    No balance available
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {transferModal.tokenBalance && (
          <TransferModal
            isOpen={transferModal.isOpen}
            onClose={() => setTransferModal({ isOpen: false })}
            tokenBalance={transferModal.tokenBalance}
          />
        )}

        {warpModal.tokenBalance && (
          <WarpModal
            isOpen={warpModal.isOpen}
            onClose={() => setWarpModal({ isOpen: false })}
            tokenBalance={warpModal.tokenBalance}
          />
        )}

        <ContactManager
          isOpen={contactsModal}
          onClose={() => setContactsModal(false)}
        />
      </div>
    </div>
  );
}
