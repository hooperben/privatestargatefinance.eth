"use client";

import { Dialog, DialogContent } from "./ui/dialog";
import { useEncryptModal } from "../hooks/useEncryptModal";
import { InputStep } from "./encrypt-modal/steps/InputStep";
import { ApproveStep } from "./encrypt-modal/steps/ApproveStep";
import { DepositStep } from "./encrypt-modal/steps/DepositStep";
import { SuccessStep } from "./encrypt-modal/steps/SuccessStep";
import { ErrorDisplay } from "./encrypt-modal/ErrorDisplay";
import type { EncryptModalProps } from "../types/encrypt-modal";

export function EncryptModal({
  isOpen,
  onClose,
  tokenBalance,
}: EncryptModalProps) {
  const modalState = useEncryptModal(tokenBalance, isOpen);

  const renderStep = () => {
    switch (modalState.step) {
      case "input":
        return (
          <InputStep
            tokenBalance={tokenBalance}
            amount={modalState.amount}
            setAmount={modalState.setAmount}
            loading={modalState.loading}
            onEncrypt={modalState.handleEncrypt}
            onClose={onClose}
          />
        );

      case "approve":
        return (
          <ApproveStep
            tokenBalance={tokenBalance}
            amount={modalState.amount}
            approvalPending={modalState.approvalPending}
            approvalConfirming={modalState.approvalConfirming}
            approvalSuccess={modalState.approvalSuccess}
            localApprovalSuccess={modalState.localApprovalSuccess}
            approvalHash={modalState.approvalHash}
            onApproval={modalState.handleApproval}
            onSetLocalApprovalSuccess={modalState.setLocalApprovalSuccess}
            onProceedToDeposit={() => modalState.setStep("deposit")}
            onClose={onClose}
          />
        );

      case "deposit":
        return (
          <DepositStep
            tokenBalance={tokenBalance}
            amount={modalState.amount}
            loading={modalState.loading}
            depositPending={modalState.depositPending}
            depositConfirming={modalState.depositConfirming}
            onDeposit={modalState.handleDeposit}
            onClose={onClose}
          />
        );

      case "success":
        return (
          <SuccessStep
            tokenBalance={tokenBalance}
            amount={modalState.amount}
            depositHash={modalState.depositHash}
            onClose={onClose}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {modalState.error && (
          <ErrorDisplay
            error={modalState.error}
            technicalError={modalState.technicalError}
            showTechnicalDetails={modalState.showTechnicalDetails}
            onToggleTechnicalDetails={modalState.toggleTechnicalDetails}
            onClearError={modalState.clearError}
          />
        )}

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
