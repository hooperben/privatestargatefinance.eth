import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useWithdraw } from "../hooks/useWithdraw";
import { useAccount } from "wagmi";

interface NoteData {
  leafIndex: string;
  assetId: string;
  assetAmount: string;
  owner: string;
  secret: string;
  chainId: number;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteData | null;
  tokenSymbol: string;
}

export function WithdrawModal({
  isOpen,
  onClose,
  note,
  tokenSymbol,
}: WithdrawModalProps) {
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const { address } = useAccount();
  const { withdraw, isLoading, isSuccess, error, hash } = useWithdraw(
    note?.chainId || 42161,
  );

  // Reset form when modal opens/closes
  const handleClose = () => {
    setWithdrawAddress("");
    onClose();
  };

  const handleWithdraw = async () => {
    if (!note) return;

    try {
      await withdraw(note, withdrawAddress || address, note.secret);
    } catch (err) {
      console.error("Withdraw failed:", err);
    }
  };

  if (!note) return null;

  const formatAmount = (amount: string) => {
    const numericAmount = parseFloat(amount);
    return numericAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Note</DialogTitle>
        </DialogHeader>

        {!isSuccess ? (
          <div className="space-y-4">
            {/* Note details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Withdrawing:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-mono font-bold">
                    {formatAmount(note.assetAmount)} {tokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Leaf Index:</span>
                  <span className="font-mono">{note.leafIndex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chain:</span>
                  <span>{note.chainId === 42161 ? "Arbitrum" : "Base"}</span>
                </div>
              </div>
            </div>

            {/* Withdraw address input */}
            <div>
              <label
                htmlFor="withdrawAddress"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Withdraw to Address (optional)
              </label>
              <input
                type="text"
                id="withdrawAddress"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder={address || "Enter withdrawal address..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to withdraw to your connected wallet address.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Processing..." : "Withdraw"}
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
              <p className="font-semibold">ℹ️ Info:</p>
              <p>
                This uses real merkle proofs generated from the current tree
                state built from LeafInserted events on the blockchain.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-green-600 text-4xl">✅</div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Withdrawal Submitted!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your withdrawal has been submitted to the blockchain.
              </p>
              {hash && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">
                    Transaction Hash:
                  </p>
                  <a
                    href={`https://${
                      note.chainId === 42161 ? "arbiscan.io" : "basescan.org"
                    }/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-mono break-all"
                  >
                    {hash}
                  </a>
                </div>
              )}
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
