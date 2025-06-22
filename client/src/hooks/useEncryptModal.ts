import { useState, useEffect } from "react";
import { ethers, parseUnits } from "ethers";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";
import { getRandomWithField } from "../lib/crypto";
import { useNotes } from "../../hooks/useNotes";
import { usePasskey } from "../../hooks/usePasskey";
import { OAPP_ADDRESS } from "../constants";
import { loadPoseidon } from "../utils/poseidon";
import depositCircuit from "../../../circuits/deposit/target/deposit.json";
import { PSF_ADDRESSES, ERC20_ABI, PSF_ABI } from "../constants/encrypt-modal";
import {
  getTokenAddress,
  getTokenDecimals,
  parseErrorMessage,
} from "../utils/encrypt-modal";
import type { TokenBalance } from "../../hooks/useTokenBalances";
import type {
  EncryptModalStep,
  EncryptModalState,
} from "../types/encrypt-modal";

export function useEncryptModal(tokenBalance: TokenBalance, isOpen: boolean) {
  const { address } = useAccount();
  const { getMnemonicFromPasskey, hasPasskey } = usePasskey();
  const { addNote } = useNotes();

  const [state, setState] = useState<EncryptModalState>({
    amount: "",
    loading: false,
    error: null,
    showTechnicalDetails: false,
    technicalError: null,
    step: "input",
    localApprovalSuccess: false,
    approvalStartTime: null,
  });

  // Contract write hooks
  const {
    writeContract: writeApproval,
    data: approvalHash,
    isPending: approvalPending,
    error: approvalWriteError,
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
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
      setState({
        amount: "",
        loading: false,
        error: null,
        showTechnicalDetails: false,
        technicalError: null,
        step: "input",
        localApprovalSuccess: false,
        approvalStartTime: null,
      });
    }
  }, [isOpen]);

  // Handle approval write errors
  useEffect(() => {
    if (approvalWriteError) {
      console.error("Approval write error:", approvalWriteError);
      const friendlyMessage = parseErrorMessage(approvalWriteError, state.step);
      setState((prev) => ({
        ...prev,
        error: friendlyMessage,
        technicalError: approvalWriteError.message,
      }));
    }
  }, [approvalWriteError, state.step]);

  // Handle deposit write errors
  useEffect(() => {
    if (depositWriteError) {
      console.error("Deposit write error:", depositWriteError);
      const friendlyMessage = parseErrorMessage(depositWriteError, state.step);
      setState((prev) => ({
        ...prev,
        error: friendlyMessage,
        technicalError: depositWriteError.message,
      }));
    }
  }, [depositWriteError, state.step]);

  // Handle deposit success
  useEffect(() => {
    console.log("Deposit success useEffect:", {
      depositSuccess,
      step: state.step,
      depositHash,
    });
    if (depositSuccess && state.step === "deposit") {
      console.log("Deposit transaction successful:", depositHash);
      setState((prev) => ({
        ...prev,
        loading: false,
        step: "success",
      }));
    }
  }, [depositSuccess, state.step, depositHash]);

  // Handle approval success
  useEffect(() => {
    console.log("Approval success useEffect:", {
      approvalSuccess,
      step: state.step,
      approvalHash,
    });
    if (approvalSuccess && state.step === "approve") {
      console.log("Approval transaction successful:", approvalHash);
      setState((prev) => ({
        ...prev,
        localApprovalSuccess: true,
      }));
    }
  }, [approvalSuccess, state.step, approvalHash]);

  // Fallback for approval success detection
  useEffect(() => {
    if (
      state.step === "approve" &&
      approvalHash &&
      !approvalConfirming &&
      !approvalPending &&
      !state.localApprovalSuccess
    ) {
      console.log("Approval fallback success detection:", approvalHash);
      setState((prev) => ({
        ...prev,
        localApprovalSuccess: true,
      }));
    }
  }, [
    state.step,
    approvalHash,
    approvalConfirming,
    approvalPending,
    state.localApprovalSuccess,
  ]);

  // Aggressive fallback for stuck approval transactions
  useEffect(() => {
    if (
      state.step === "approve" &&
      approvalHash &&
      state.approvalStartTime &&
      !state.localApprovalSuccess &&
      Date.now() - state.approvalStartTime > 30000 // 30 seconds
    ) {
      console.log(
        "Approval timeout fallback - assuming success after 30s:",
        approvalHash,
      );
      setState((prev) => ({
        ...prev,
        localApprovalSuccess: true,
      }));
    }
  }, [
    state.step,
    approvalHash,
    state.approvalStartTime,
    state.localApprovalSuccess,
  ]);

  // Fallback for deposit success detection
  useEffect(() => {
    if (
      state.step === "deposit" &&
      depositHash &&
      !depositConfirming &&
      !depositPending
    ) {
      console.log("Deposit fallback success detection:", depositHash);
      setState((prev) => ({
        ...prev,
        loading: false,
        step: "success",
      }));
    }
  }, [state.step, depositHash, depositConfirming, depositPending]);

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
        getTokenAddress(tokenBalance),
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
    if (!state.amount || !address) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

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
      const needsApproval = await checkApprovalNeeded(state.amount);

      // Create note in database (we'll update with txHash later)
      await addNote({
        assetId: getTokenAddress(tokenBalance),
        assetAmount: state.amount,
        owner: `0x${owner.toString(16)}`,
        secret: `0x${secret.toString(16)}`,
        ownerSecret: `0x${ownerSecret.toString(16)}`,
        chainId: tokenBalance.chainId,
      });

      setState((prev) => ({
        ...prev,
        step: needsApproval ? "approve" : "deposit",
      }));
    } catch (error) {
      console.error("Encryption error:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to encrypt deposit",
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleApproval = () => {
    if (!state.amount) {
      setState((prev) => ({
        ...prev,
        error: "Amount is required for approval",
      }));
      return;
    }

    try {
      const decimals = getTokenDecimals(tokenBalance);
      const amountInWei = parseUnits(state.amount, decimals);
      const tokenAddress = getTokenAddress(tokenBalance);

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

      setState((prev) => ({ ...prev, approvalStartTime: Date.now() }));

      writeApproval({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [OAPP_ADDRESS as `0x${string}`, amountInWei],
      });
    } catch (error) {
      console.error("Approval error:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to submit approval transaction",
      }));
    }
  };

  const handleDeposit = async () => {
    if (!state.amount || !address || !hasPasskey) return;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      technicalError: null,
    }));

    try {
      // 1. Generate crypto values
      const secret = getRandomWithField();
      const mnemonic = await getMnemonicFromPasskey();

      if (!mnemonic) {
        throw new Error("Failed to get mnemonic from passkey");
      }

      // Create wallet from mnemonic to get private key as owner_secret
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const ownerSecret = BigInt(wallet.privateKey);

      // Generate owner address using poseidon hash
      const poseidonHash = await loadPoseidon();
      const owner = poseidon2Hash([ownerSecret]);

      // 2. Prepare deposit data
      const tokenAddress = getTokenAddress(tokenBalance);
      const decimals = getTokenDecimals(tokenBalance);

      // 3. Generate ZK proof
      const noir = new Noir(depositCircuit as CompiledCircuit);
      const backend = new UltraHonkBackend(depositCircuit.bytecode);

      // Generate note hash using poseidon
      const noteHash = await poseidonHash([
        BigInt(tokenAddress),
        BigInt(state.amount),
        owner,
        secret,
      ]);
      const noteHashBigInt = BigInt(noteHash.toString());

      console.log("Generating ZK proof with:", {
        noteHash: noteHashBigInt.toString(),
        assetId: tokenAddress,
        assetAmount: state.amount.toString(),
        owner: owner.toString(),
        secret: secret.toString(),
      });

      // Execute the circuit
      const { witness } = await noir.execute({
        hash: noteHashBigInt.toString(),
        asset_id: tokenAddress.toString(),
        asset_amount: state.amount.toString(),
        owner: owner.toString(),
        secret: secret.toString(),
      });

      // Generate the proof
      const proof = await backend.generateProof(witness, { keccak: true });

      // 4. Create encrypted payload (simplified version for frontend)
      const outputNote = {
        secret: secret.toString(),
        owner: owner.toString(),
        asset_id: tokenAddress,
        asset_amount: state.amount.toString(),
      };

      // For now, create a simple payload (in production, this should be properly encrypted)
      const encodedNote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "string", "string"],
        [
          outputNote.secret,
          outputNote.owner,
          outputNote.asset_id,
          outputNote.asset_amount,
        ],
      );
      const payload = [encodedNote, "0x", "0x"];

      // 5. Save note to IndexedDB before contract call
      const tempNoteId = crypto.randomUUID();
      const newNote = {
        id: tempNoteId,
        secret: secret.toString(),
        owner: owner.toString(),
        ownerSecret: ownerSecret.toString(),
        assetId: tokenAddress,
        assetAmount: state.amount.toString(),
        chainId: tokenBalance.chainId,
        symbol: tokenBalance.symbol,
        decimals,
        txHash: undefined,
        blockNumber: undefined,
        status: "pending" as const,
      };

      await addNote(newNote);

      // 6. Call the deposit contract
      const psfAddress =
        PSF_ADDRESSES[tokenBalance.chainId as keyof typeof PSF_ADDRESSES];
      if (!psfAddress) {
        throw new Error(
          `PSF contract not deployed on chain ${tokenBalance.chainId}`,
        );
      }

      console.log("Calling deposit on PSF contract:", psfAddress);
      console.log("Deposit params:", {
        tokenAddress,
        amount: state.amount.toString(),
        proofLength: proof.proof.length,
        publicInputsLength: proof.publicInputs.length,
        payloadLength: payload.length,
      });

      console.log("proof: ", proof.proof);

      writeDeposit({
        address: psfAddress as `0x${string}`,
        abi: PSF_ABI,
        functionName: "deposit",
        args: [
          tokenAddress as `0x${string}`,
          BigInt(state.amount),
          `0x${Array.from(proof.proof)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")}` as `0x${string}`,
          proof.publicInputs as `0x${string}`[],
          payload as `0x${string}`[],
        ],
      });
    } catch (error) {
      console.error("Deposit failed:", error);
      const friendlyMessage = parseErrorMessage(error as Error, state.step);
      setState((prev) => ({
        ...prev,
        error: friendlyMessage,
        technicalError: (error as Error).message,
        loading: false,
      }));
    }
  };

  // Helper functions for updating state
  const setAmount = (amount: string) => {
    setState((prev) => ({ ...prev, amount }));
  };

  const setStep = (step: EncryptModalStep) => {
    setState((prev) => ({ ...prev, step }));
  };

  const setLocalApprovalSuccess = () => {
    setState((prev) => ({ ...prev, localApprovalSuccess: true }));
  };

  const clearError = () => {
    setState((prev) => ({
      ...prev,
      error: null,
      technicalError: null,
      showTechnicalDetails: false,
    }));
  };

  const toggleTechnicalDetails = () => {
    setState((prev) => ({
      ...prev,
      showTechnicalDetails: !prev.showTechnicalDetails,
    }));
  };

  return {
    // State
    ...state,
    approvalHash,
    depositHash,
    approvalPending,
    depositPending,
    approvalConfirming,
    depositConfirming,
    approvalSuccess,
    depositSuccess,

    // Actions
    handleEncrypt,
    handleApproval,
    handleDeposit,
    setAmount,
    setStep,
    setLocalApprovalSuccess,
    clearError,
    toggleTechnicalDetails,
  };
}
