"use client";

import { ethers } from "ethers";
import { QrCodeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { usePasskey } from "../../hooks/usePasskey";
import type { TokenBalance } from "../../hooks/useTokenBalances";
import { useTokenBalances } from "../../hooks/useTokenBalances";
import { EncryptModal } from "../components/EncryptModal";
import { ReceiveModal } from "../components/ReceiveModal";
import { UnauthorizedBanner } from "../components/UnauthorizedBanner";
import { WalletConnect } from "../components/WalletConnect";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useDepositRole } from "../hooks/useDepositRole";

export function Account() {
  const { address, isConnected } = useAccount();
  const { balances, loading } = useTokenBalances();
  const { hasDepositRole, loading: roleLoading } = useDepositRole();
  const {
    loading: passkeyLoading,
    isPasskeySupported,
    createPasskeyAccount,
    hasPasskey,
  } = usePasskey();
  const [encryptModal, setEncryptModal] = useState<{
    isOpen: boolean;
    tokenBalance?: TokenBalance;
  }>({
    isOpen: false,
  });

  const [receiveModal, setReceiveModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

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
            <h1 className="text-3xl font-bold text-gray-800">My Account</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-600 font-mono text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            {privateAccountAddress && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-green-600 font-mono text-sm">
                  Private: {privateAccountAddress.slice(0, 6)}...
                  {privateAccountAddress.slice(-4)}
                </p>
                <button
                  onClick={() => setReceiveModal({ isOpen: true })}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex flex-col justify-center items-center"
                >
                  <QrCodeIcon />
                  Receive
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Unauthorized Banner */}
        {isConnected && !roleLoading && !hasDepositRole && (
          <UnauthorizedBanner />
        )}

        {/* Passkey Section */}
        {isPasskeySupported() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Private Account
            </h2>

            <div className="flex gap-3 flex-wrap">
              {!hasPasskey() ? (
                <div className="flex flex-col">
                  <p className="text-blue-700 mb-4">
                    Create a private account secured by your device's passkey
                    for enhanced security.
                  </p>
                  <button
                    onClick={handleCreatePrivateAccount}
                    disabled={passkeyLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {passkeyLoading ? "Creating..." : "Create Private Account"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-green-700 font-medium">
                    ✅ Private account created
                  </div>
                  {/* <button
                    onClick={handleGetMnemonic}
                    disabled={passkeyLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {passkeyLoading
                      ? "Retrieving..."
                      : "Get Mnemonic (Console)"}
                  </button> */}
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                EVM Token Balances
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                View and manage your token balances across different chains
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Skeleton loading for balance rows */}
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-12" />
                      </div>
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
                EVM Token Balances
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                View and manage your token balances across different chains
              </p>
            </div>
            {balances.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No token balances found</p>
                <p className="text-sm mt-1">
                  Connect your wallet to view balances
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => (
                    <TableRow key={`${balance.symbol}-${balance.chainId}`}>
                      <TableCell className="font-semibold text-lg">
                        {balance.symbol}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {balance.chainName}
                        </span>
                      </TableCell>
                      <TableCell>
                        {balance.hasBalance ? (
                          <div className="font-mono font-bold text-gray-800">
                            {Number.parseFloat(
                              balance.formattedBalance,
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No balance
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {balance.hasBalance ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                setEncryptModal({
                                  isOpen: true,
                                  tokenBalance: balance,
                                })
                              }
                              disabled={!hasDepositRole}
                              className={`px-3 py-1 rounded font-medium text-sm ${
                                hasDepositRole
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                              title={
                                !hasDepositRole
                                  ? "You need to be whitelisted to encrypt tokens"
                                  : ""
                              }
                            >
                              Encrypt
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            No actions
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {encryptModal.tokenBalance && (
          <EncryptModal
            isOpen={encryptModal.isOpen}
            onClose={() => setEncryptModal({ isOpen: false })}
            tokenBalance={encryptModal.tokenBalance}
          />
        )}

        <ReceiveModal
          isOpen={receiveModal.isOpen}
          onClose={() => setReceiveModal({ isOpen: false })}
        />
      </div>
    </div>
  );
}
