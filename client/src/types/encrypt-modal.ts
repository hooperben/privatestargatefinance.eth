import type { TokenBalance } from "../../hooks/useTokenBalances";

export interface EncryptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenBalance: TokenBalance;
}

export type EncryptModalStep = "input" | "approve" | "deposit" | "success";

export interface EncryptModalState {
  amount: string;
  loading: boolean;
  error: string | null;
  showTechnicalDetails: boolean;
  technicalError: string | null;
  step: EncryptModalStep;
  localApprovalSuccess: boolean;
  approvalStartTime: number | null;
}
