import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { getBlockExplorerUrl } from "../../../utils/encrypt-modal";
import type { TokenBalance } from "../../../../hooks/useTokenBalances";

interface SuccessStepProps {
  tokenBalance: TokenBalance;
  amount: string;
  depositHash: string | undefined;
  onClose: () => void;
}

export function SuccessStep({
  tokenBalance,
  amount,
  depositHash,
  onClose,
}: SuccessStepProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Deposit Encrypted Successfully!</DialogTitle>
        <DialogDescription>
          Your {amount} {tokenBalance.symbol} has been encrypted and deposited.
        </DialogDescription>
      </DialogHeader>

      <div className="text-center py-4">
        <div className="text-green-600 text-6xl mb-4">✅</div>
        <p className="text-sm text-gray-600 mb-4">
          Your encrypted note has been saved securely.
        </p>
        {depositHash && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-2">Transaction Hash:</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              {depositHash}
            </p>
          </div>
        )}
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        {depositHash && (
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                getBlockExplorerUrl(depositHash, tokenBalance.chainId),
                "_blank",
              )
            }
            className="w-full sm:w-auto"
          >
            View on Block Explorer
          </Button>
        )}
        <Button onClick={onClose} className="w-full sm:w-auto">
          Close
        </Button>
      </DialogFooter>
    </>
  );
}
