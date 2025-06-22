import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import type { TokenBalance } from "../../../../hooks/useTokenBalances";

interface DepositStepProps {
  tokenBalance: TokenBalance;
  amount: string;
  loading: boolean;
  depositPending: boolean;
  depositConfirming: boolean;
  onDeposit: () => void;
  onClose: () => void;
}

export function DepositStep({
  tokenBalance,
  amount,
  loading,
  depositPending,
  depositConfirming,
  onDeposit,
  onClose,
}: DepositStepProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Encrypted Deposit</DialogTitle>
        <DialogDescription>
          {loading || depositPending || depositConfirming
            ? "Generating zero-knowledge proof and submitting deposit..."
            : "Ready to create your encrypted deposit."}
        </DialogDescription>
      </DialogHeader>

      <div className="text-center py-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Amount: {amount} {tokenBalance.symbol}
          </p>
          <p className="text-sm text-gray-600">
            {loading
              ? "🔄 Generating zero-knowledge proof..."
              : depositPending || depositConfirming
              ? "⏳ Waiting for transaction confirmation..."
              : "🔐 Click below to create your encrypted deposit"}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading || depositPending || depositConfirming}
        >
          Cancel
        </Button>
        {!loading && !depositPending && !depositConfirming && (
          <Button onClick={onDeposit} variant="default">
            Create Encrypted Deposit
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
