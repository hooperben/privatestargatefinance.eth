import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import type { TokenBalance } from "../../../../hooks/useTokenBalances";

interface InputStepProps {
  tokenBalance: TokenBalance;
  amount: string;
  setAmount: (amount: string) => void;
  loading: boolean;
  onEncrypt: () => void;
  onClose: () => void;
}

export function InputStep({
  tokenBalance,
  amount,
  setAmount,
  loading,
  onEncrypt,
  onClose,
}: InputStepProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Encrypt Deposit</DialogTitle>
        <DialogDescription>
          Enter the amount of {tokenBalance.symbol} you want to encrypt and
          deposit.
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
          onClick={onEncrypt}
          disabled={!amount || loading || parseFloat(amount) <= 0}
        >
          {loading ? "Processing..." : "Encrypt & Deposit"}
        </Button>
      </DialogFooter>
    </>
  );
}
