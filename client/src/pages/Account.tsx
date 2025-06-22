"use client";

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { usePasskey } from "../../hooks/usePasskey";
import type { TokenBalance } from "../../hooks/useTokenBalances";
import { useTokenBalances } from "../../hooks/useTokenBalances";
import { ContactManager } from "../components/ContactManager";
import { TransferModal } from "../components/TransferModal";
import { WalletConnect } from "../components/WalletConnect";
import { WarpModal } from "../components/WarpModal";
import { Skeleton } from "../components/ui/skeleton";

export function Account() {
  const { address, isConnected } = useAccount();
  const { balances, loading } = useTokenBalances();
  const {
    loading: passkeyLoading,
    isPasskeySupported,
    createPasskeyAccount,
    getMnemonicFromPasskey,
    hasPasskey,
  } = usePasskey();
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
  const [privateAccountAddress, setPrivateAccountAddress] = useState<
    string | null
  >(null);

  // Load private account address if it exists
  useEffect(() => {
    if (hasPasskey()) {
      // If user has a passkey, try to derive the address from the stored mnemonic
      const encodedMnemonic = localStorage.getItem("passkey-mnemonic");
      if (encodedMnemonic) {
        try {
          const mnemonic = atob(encodedMnemonic);
          const wallet = ethers.Wallet.fromPhrase(mnemonic);
          setPrivateAccountAddress(wallet.address);
        } catch (error) {
          console.error("Failed to load private account address:", error);
        }
      }
    }
  }, [hasPasskey]);

  const handleCreatePrivateAccount = async () => {
    try {
      const address = await createPasskeyAccount();
      if (address) {
        setPrivateAccountAddress(address);
        console.log(
          `Private account created successfully!\nAddress: ${address}`,
        );
      }
    } catch (error) {
      console.error("Failed to create private account:", error);
    }
  };

  const handleGetMnemonic = async () => {
    try {
      const mnemonic = await getMnemonicFromPasskey();
      if (mnemonic) {
        console.log("Retrieved mnemonic:", mnemonic);
        console.log(
          "Mnemonic retrieved successfully! Check the console for details.",
        );
      }
    } catch (error) {
      console.error("Failed to retrieve mnemonic:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Account</h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to view your account
            </p>
          </div>
          <WalletConnect />
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
            {privateAccountAddress && (
              <p className="text-green-600 font-mono text-sm mt-1">
                Private: {privateAccountAddress.slice(0, 6)}...
                {privateAccountAddress.slice(-4)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setContactsModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Manage Contacts
            </button>
          </div>
        </div>

        {/* Passkey Section */}
        {isPasskeySupported() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Private Account
            </h2>
            <p className="text-blue-700 mb-4">
              Create a private account secured by your device's passkey for
              enhanced security.
            </p>

            <div className="flex gap-3 flex-wrap">
              {!hasPasskey() ? (
                <button
                  onClick={handleCreatePrivateAccount}
                  disabled={passkeyLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {passkeyLoading ? "Creating..." : "Create Private Account"}
                </button>
              ) : (
                <>
                  <div className="text-green-700 font-medium">
                    ✅ Private account created
                  </div>
                  <button
                    onClick={handleGetMnemonic}
                    disabled={passkeyLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {passkeyLoading
                      ? "Retrieving..."
                      : "Get Mnemonic (Console)"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {/* Skeleton loading for balance cards */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>
              </div>
            ))}
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
