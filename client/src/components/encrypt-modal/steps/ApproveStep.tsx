import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import type { TokenBalance } from "../../../../hooks/useTokenBalances";

interface ApproveStepProps {
  tokenBalance: TokenBalance;
  amount: string;
  approvalPending: boolean;
  approvalConfirming: boolean;
  approvalSuccess: boolean;
  localApprovalSuccess: boolean;
  approvalHash: string | undefined;
  onApproval: () => void;
  onSetLocalApprovalSuccess: () => void;
  onProceedToDeposit: () => void;
  onClose: () => void;
}

export function ApproveStep({
  tokenBalance,
  amount,
  approvalPending,
  approvalConfirming,
  approvalSuccess,
  localApprovalSuccess,
  approvalHash,
  onApproval,
  onSetLocalApprovalSuccess,
  onProceedToDeposit,
  onClose,
}: ApproveStepProps) {
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
              : approvalSuccess || localApprovalSuccess
              ? "✅ Approval successful! Ready to proceed with deposit."
              : "🔓 Click below to approve the transaction"}
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
        {approvalSuccess || localApprovalSuccess ? (
          <Button onClick={onProceedToDeposit} variant="default">
            Proceed to Deposit
          </Button>
        ) : approvalHash && (approvalConfirming || approvalPending) ? (
          <div className="flex gap-2">
            <Button
              onClick={onApproval}
              variant="outline"
              disabled={approvalPending || approvalConfirming}
            >
              {approvalPending || approvalConfirming ? "Approving..." : "Retry"}
            </Button>
            <Button
              onClick={() => {
                console.log("Manual approval override");
                onSetLocalApprovalSuccess();
              }}
              variant="default"
            >
              Transaction Sent - Continue
            </Button>
          </div>
        ) : (
          <Button
            onClick={onApproval}
            variant="default"
            disabled={approvalPending || approvalConfirming}
          >
            {approvalPending || approvalConfirming ? "Approving..." : "Approve"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
