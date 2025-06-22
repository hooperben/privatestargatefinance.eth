"use client";

import { useState, useEffect } from "react";
import { ethers, parseUnits } from "ethers";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { getRandomWithField } from "../lib/crypto";
import { useNotes } from "../../hooks/useNotes";
import { usePasskey } from "../../hooks/usePasskey";
import type { TokenBalance } from "../../hooks/useTokenBalances";
import { OAPP_ADDRESS } from "../constants";
import { TOKENS } from "../../lib/tokens";

// ERC20 ABI for approval
const ERC20_ABI = [
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

interface EncryptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenBalance: TokenBalance;
}

export function EncryptModal({
  isOpen,
  onClose,
  tokenBalance,
}: EncryptModalProps) {
  const { address } = useAccount();
  const { getMnemonicFromPasskey, hasPasskey } = usePasskey();
  const { addNote } = useNotes();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "approve" | "deposit" | "success">(
    "input",
  );
  const [noteId, setNoteId] = useState<string | null>(null);

  // Helper function to get token address from tokenBalance
  const getTokenAddress = (): string => {
    return TOKENS[tokenBalance.symbol].addresses[tokenBalance.chainId];
  };

  // Helper function to get token decimals
  const getTokenDecimals = (): number => {
    return TOKENS[tokenBalance.symbol].decimals;
  };

  // Contract write hooks
  const {
    writeContract: writeApproval,
    data: approvalHash,
    isPending: approvalPending,
    error: approvalWriteError,
  } = useWriteContract();

  const {
    // writeContract: writeDeposit, // TODO: Implement for actual deposit
    data: depositHash,
    isPending: depositPending,
    error: depositWriteError,
  } = useWriteContract();

  // Transaction receipt hooks
  const { isLoading: approvalConfirming, isSuccess: approvalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    });

  const { isLoading: depositConfirming, isSuccess: depositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setError(null);
      setTechnicalError(null);
      setShowTechnicalDetails(false);
      setStep("input");
      setNoteId(null);
    }
  }, [isOpen]);

  // Handle approval success
  useEffect(() => {
    if (approvalSuccess && step === "approve") {
      setStep("deposit");
      handleDeposit();
    }
  }, [approvalSuccess, step]);

  // Auto-trigger approval when step changes to approve
  useEffect(() => {
    if (
      step === "approve" &&
      !approvalPending &&
      !approvalSuccess &&
      !approvalWriteError
    ) {
      handleApproval();
    }
  }, [step, approvalPending, approvalSuccess, approvalWriteError]);

  // Parse and display user-friendly error messages
  const parseErrorMessage = (error: Error): string => {
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

  // Handle approval write errors
  useEffect(() => {
    if (approvalWriteError) {
      console.error("Approval write error:", approvalWriteError);
      const friendlyMessage = parseErrorMessage(approvalWriteError);
      setError(friendlyMessage);
      setTechnicalError(approvalWriteError.message);
    }
  }, [approvalWriteError]);

  // Handle deposit write errors
  useEffect(() => {
    if (depositWriteError) {
      console.error("Deposit write error:", depositWriteError);
      const friendlyMessage = parseErrorMessage(depositWriteError);
      setError(friendlyMessage);
      setTechnicalError(depositWriteError.message);
    }
  }, [depositWriteError]);

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess && step === "deposit" && noteId) {
      setStep("success");
    }
  }, [depositSuccess, step, noteId]);

  const checkApprovalNeeded = async (
    amountToDeposit: string,
  ): Promise<boolean> => {
    if (!address) return false;

    try {
      // Create a provider to read from the blockchain
      const rpcUrl =
        tokenBalance.chainId === 42161
          ? "https://arb1.arbitrum.io/rpc"
          : "https://mainnet.base.org";

      console.log("Using RPC URL:", rpcUrl, "for chain:", tokenBalance.chainId);
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const tokenContract = new ethers.Contract(
        getTokenAddress(),
        ERC20_ABI,
        provider,
      );

      const decimals = await tokenContract.decimals();
      const amountInWei = parseUnits(amountToDeposit, decimals);
      const currentAllowance = await tokenContract.allowance(
        address,
        OAPP_ADDRESS,
      );

      return currentAllowance < amountInWei;
    } catch (error) {
      console.error("Error checking approval:", error);
      return true; // Assume approval is needed if we can't check
    }
  };

  const handleEncrypt = async () => {
    if (!amount || !address) return;

    setLoading(true);
    setError(null);

    try {
      // Validate passkey exists
      if (!hasPasskey()) {
        throw new Error("Please create a private account first");
      }

      // Get mnemonic from passkey
      const mnemonic = await getMnemonicFromPasskey();
      if (!mnemonic) {
        throw new Error("Failed to retrieve mnemonic from passkey");
      }

      // Generate note parameters
      const secret = getRandomWithField();
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const ownerSecret = BigInt(wallet.privateKey);
      const owner = poseidon2Hash([ownerSecret]);

      // Check if approval is needed
      const needsApproval = await checkApprovalNeeded(amount);

      // Create note in database (we'll update with txHash later)
      const noteId = await addNote({
        assetId: getTokenAddress(),
        assetAmount: amount,
        owner: `0x${owner.toString(16)}`,
        secret: `0x${secret.toString(16)}`,
        ownerSecret: `0x${ownerSecret.toString(16)}`,
        chainId: tokenBalance.chainId,
      });
      setNoteId(noteId);

      if (needsApproval) {
        setStep("approve");
        // Don't call handleApproval here - let the user see the modal first
      } else {
        setStep("deposit");
        handleDeposit();
      }
    } catch (error) {
      console.error("Encryption error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to encrypt deposit",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = () => {
    if (!amount) {
      setError("Amount is required for approval");
      return;
    }

    try {
      const decimals = getTokenDecimals();
      const amountInWei = parseUnits(amount, decimals);

      const tokenAddress = getTokenAddress();

      console.log("Requesting approval for:", {
        token: tokenAddress,
        spender: OAPP_ADDRESS,
        amount: amountInWei.toString(),
        decimals,
        chainId: tokenBalance.chainId,
      });

      // Validate addresses
      if (!tokenAddress || !OAPP_ADDRESS) {
        throw new Error("Invalid token or spender address");
      }

      writeApproval({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [OAPP_ADDRESS as `0x${string}`, amountInWei],
      });
    } catch (error) {
      console.error("Approval error:", error);
      setError("Failed to submit approval transaction");
    }
  };

  const handleDeposit = async () => {
    if (!amount || !noteId) return;

    try {
      // TODO: Implement actual deposit contract call
      // This would involve:
      // 1. Generate ZK proof using the note parameters
      // 2. Call the deposit function on the PrivateStargateFinance contract
      // 3. Include proof, publicInputs, and encrypted payload

      console.log("Deposit logic to be implemented with ZK proof generation");

      // For now, simulate success after a delay
      setTimeout(() => {
        setStep("success");
      }, 2000);
    } catch (error) {
      console.error("Deposit error:", error);
      setError("Failed to submit deposit transaction");
    }
  };

  const renderStep = () => {
    switch (step) {
      case "input":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Encrypt Deposit</DialogTitle>
              <DialogDescription>
                Enter the amount of {tokenBalance.symbol} you want to encrypt
                and deposit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`0.00 ${tokenBalance.symbol}`}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available:{" "}
                  {parseFloat(tokenBalance.formattedBalance).toLocaleString()}{" "}
                  {tokenBalance.symbol}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleEncrypt}
                disabled={!amount || loading || parseFloat(amount) <= 0}
              >
                {loading ? "Processing..." : "Encrypt & Deposit"}
              </Button>
            </DialogFooter>
          </>
        );

      case "approve":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Approve Token Spending</DialogTitle>
              <DialogDescription>
                Please approve the contract to spend your {tokenBalance.symbol}{" "}
                tokens.
              </DialogDescription>
            </DialogHeader>

            <div className="text-center py-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Amount: {amount} {tokenBalance.symbol}
                </p>
                <p className="text-sm text-gray-600">
                  {approvalPending || approvalConfirming
                    ? "⏳ Waiting for approval transaction..."
                    : "🔓 Check your wallet to approve the transaction"}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={approvalPending || approvalConfirming}
              >
                Cancel
              </Button>
              {!approvalPending && !approvalConfirming && (
                <Button onClick={handleApproval} variant="default">
                  Retry Approval
                </Button>
              )}
            </DialogFooter>
          </>
        );

      case "deposit":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Encrypting Deposit</DialogTitle>
              <DialogDescription>
                Generating zero-knowledge proof and submitting deposit...
              </DialogDescription>
            </DialogHeader>

            <div className="text-center py-4">
              <p className="text-sm text-gray-600">
                This may take a few moments...
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={depositPending || depositConfirming}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        );

      case "success":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Deposit Encrypted Successfully!</DialogTitle>
              <DialogDescription>
                Your {amount} {tokenBalance.symbol} has been encrypted and
                deposited.
              </DialogDescription>
            </DialogHeader>

            <div className="text-center py-4">
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <p className="text-sm text-gray-600">
                Your encrypted note has been saved securely.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-lg">⚠️</div>
              <div className="flex-1">
                <p className="text-red-800 font-medium text-sm mb-1">{error}</p>

                {technicalError && (
                  <div className="mt-2">
                    <button
                      onClick={() =>
                        setShowTechnicalDetails(!showTechnicalDetails)
                      }
                      className="text-xs text-red-600 hover:text-red-700 underline focus:outline-none"
                    >
                      {showTechnicalDetails ? "Hide" : "Show"} technical details
                    </button>

                    {showTechnicalDetails && (
                      <div className="mt-2 p-3 bg-red-100 rounded border border-red-300">
                        <p className="text-xs text-red-700 font-mono break-all">
                          {technicalError}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setError(null);
                  setTechnicalError(null);
                  setShowTechnicalDetails(false);
                }}
                className="text-red-400 hover:text-red-600 focus:outline-none"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
