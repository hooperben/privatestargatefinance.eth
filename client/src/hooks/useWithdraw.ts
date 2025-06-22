import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { OAPP_ADDRESS } from "../constants";
import { useMerkleTree } from "./useMerkleTree";

import withdrawCircuit from "../../../circuits/withdraw/target/withdraw.json";
import { poseidon2Hash } from "@zkpassport/poseidon2";

interface NoteData {
  leafIndex: string;
  assetId: string;
  assetAmount: string;
  owner: string;
  secret: string;
  chainId: number;
}

// This is now removed - we'll use real merkle proofs from the tree

// ABI for withdraw function
const WITHDRAW_ABI = [
  {
    inputs: [
      { name: "_proof", type: "bytes" },
      { name: "_publicInputs", type: "bytes32[]" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useWithdraw(chainId: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { getMerkleProof, getRoot, isBuilding } = useMerkleTree(chainId);

  const generateWithdrawProof = async (
    noteData: NoteData,
    withdrawToAddress: string,
    ownerSecret: string,
  ) => {
    try {
      const noir = new Noir(withdrawCircuit as CompiledCircuit);
      const backend = new UltraHonkBackend(withdrawCircuit.bytecode);

      // Get real merkle proof for this note
      const merkleProof = getMerkleProof(parseInt(noteData.leafIndex));
      if (!merkleProof) {
        throw new Error(
          "Could not get merkle proof for this note. Tree may still be building.",
        );
      }

      // Create input note from real data
      const inputNote = {
        asset_id: noteData.assetId,
        asset_amount: noteData.assetAmount,
        owner: noteData.owner,
        owner_secret: ownerSecret,
        secret: noteData.secret,
        leaf_index: noteData.leafIndex,
        path: merkleProof.path.map((item) => BigInt(item)),
        path_indices: merkleProof.pathIndices,
      };

      // Calculate nullifier for input note
      const nullifier = poseidon2Hash([
        BigInt(inputNote.leaf_index),
        BigInt(inputNote.owner),
        BigInt(inputNote.secret),
        BigInt(inputNote.asset_id),
        BigInt(inputNote.asset_amount),
      ]);

      // Calculate withdraw address hash
      const withdrawAddressHash = poseidon2Hash([BigInt(withdrawToAddress)]);

      // Mock empty notes for unused slots
      const emptyInputNote = {
        asset_id: "0",
        asset_amount: "0",
        owner: "0",
        owner_secret: "0",
        secret: "0",
        leaf_index: "0",
        siblings: Array(11).fill("0"),
        indices: Array(11).fill("0"),
      };

      // Get the real tree root
      const treeRoot = getRoot();
      if (!treeRoot) {
        throw new Error("Could not get tree root. Tree may still be building.");
      }

      console.log({
        root: BigInt(treeRoot).toString(),

        // Input notes (3 slots, first one used)
        input_notes: [
          {
            asset_id: BigInt(inputNote.asset_id).toString(),
            asset_amount: inputNote.asset_amount.toString(),
            owner: inputNote.owner.toString(),
            owner_secret: inputNote.owner_secret.toString(),
            secret: inputNote.secret.toString(),
            leaf_index: inputNote.leaf_index.toString(),
            path: inputNote.path.map((s) => s.toString()),
            path_indices: inputNote.path_indices.map((i) => i.toString()),
          },
          {
            asset_id: emptyInputNote.asset_id.toString(),
            asset_amount: emptyInputNote.asset_amount.toString(),
            owner: emptyInputNote.owner.toString(),
            owner_secret: emptyInputNote.owner_secret.toString(),
            secret: emptyInputNote.secret.toString(),
            leaf_index: emptyInputNote.leaf_index.toString(),
            path: emptyInputNote.siblings.map((s) => s.toString()),
            path_indices: emptyInputNote.indices.map((i) => i.toString()),
          },
          {
            asset_id: emptyInputNote.asset_id.toString(),
            asset_amount: emptyInputNote.asset_amount.toString(),
            owner: emptyInputNote.owner.toString(),
            owner_secret: emptyInputNote.owner_secret.toString(),
            secret: emptyInputNote.secret.toString(),
            leaf_index: emptyInputNote.leaf_index.toString(),
            path: emptyInputNote.siblings.map((s) => s.toString()),
            path_indices: emptyInputNote.indices.map((i) => i.toString()),
          },
        ],

        // Nullifiers
        nullifiers: [BigInt(nullifier.toString()).toString(), "0", "0"],

        // Exit assets (what assets to withdraw)
        exit_assets: [BigInt(noteData.assetId).toString(), "0", "0"],

        // Exit amounts
        exit_amounts: [noteData.assetAmount.toString(), "0", "0"],

        // Exit addresses (where to send the withdrawn tokens)
        exit_addresses: [BigInt(withdrawToAddress).toString(), "0", "0"],

        // Exit address hashes
        exit_address_hashes: [
          BigInt(withdrawAddressHash.toString()).toString(),
          "0",
          "0",
        ],
      });

      // Execute the circuit with withdraw inputs
      const { witness } = await noir.execute({
        root: treeRoot,

        // Input notes (3 slots, first one used)
        input_notes: [
          {
            asset_id: inputNote.asset_id.toString(),
            asset_amount: inputNote.asset_amount.toString(),
            owner: inputNote.owner.toString(),
            owner_secret: inputNote.owner_secret.toString(),
            secret: inputNote.secret.toString(),
            leaf_index: inputNote.leaf_index.toString(),
            path: inputNote.path.map((s) => s.toString()),
            path_indices: inputNote.path_indices.map((i) => i.toString()),
          },
          {
            asset_id: emptyInputNote.asset_id.toString(),
            asset_amount: emptyInputNote.asset_amount.toString(),
            owner: emptyInputNote.owner.toString(),
            owner_secret: emptyInputNote.owner_secret.toString(),
            secret: emptyInputNote.secret.toString(),
            leaf_index: emptyInputNote.leaf_index.toString(),
            path: emptyInputNote.siblings.map((s) => s.toString()),
            path_indices: emptyInputNote.indices.map((i) => i.toString()),
          },
          {
            asset_id: emptyInputNote.asset_id.toString(),
            asset_amount: emptyInputNote.asset_amount.toString(),
            owner: emptyInputNote.owner.toString(),
            owner_secret: emptyInputNote.owner_secret.toString(),
            secret: emptyInputNote.secret.toString(),
            leaf_index: emptyInputNote.leaf_index.toString(),
            path: emptyInputNote.siblings.map((s) => s.toString()),
            path_indices: emptyInputNote.indices.map((i) => i.toString()),
          },
        ],

        // Nullifiers
        nullifiers: [BigInt(nullifier.toString()).toString(), "0", "0"],

        // Exit assets (what assets to withdraw)
        exit_assets: [BigInt(noteData.assetId).toString(), "0", "0"],

        // Exit amounts
        exit_amounts: [noteData.assetAmount.toString(), "0", "0"],

        // Exit addresses (where to send the withdrawn tokens)
        exit_addresses: [BigInt(withdrawToAddress).toString(), "0", "0"],

        // Exit address hashes
        exit_address_hashes: [
          BigInt(withdrawAddressHash.toString()).toString(),
          "0",
          "0",
        ],
      });

      console.log("Withdraw witness: ", witness);

      // Generate the proof
      const proof = await backend.generateProof(witness, { keccak: true });

      console.log("Withdraw proof: ", proof);

      return { proof, witness };
    } catch (err) {
      console.log(err);
      throw new Error(`Withdraw proof generation failed: ${err}`);
    }
  };

  const withdraw = async (
    noteData: NoteData,
    withdrawToAddress?: string,
    ownerSecret?: string,
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    // Use connected address as default withdraw address
    const finalWithdrawAddress = withdrawToAddress || address;

    // For now, we'll need the user to provide their owner secret
    // In a real app, this might be derived from passkey or stored securely
    if (!ownerSecret) {
      throw new Error("Owner secret is required for withdrawal");
    }

    setIsLoading(true);
    setError(null);

    try {
      const { proof } = await generateWithdrawProof(
        noteData,
        finalWithdrawAddress,
        ownerSecret,
      );

      // Call withdraw on contract
      writeContract({
        address: OAPP_ADDRESS as `0x${string}`,
        abi: WITHDRAW_ABI,
        functionName: "withdraw",
        args: [
          `0x${Array.from(proof.proof)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")}` as `0x${string}`,
          Array.from(proof.publicInputs).map(
            (input) =>
              `0x${Array.from(input)
                .map((b) => b.toString().padStart(2, "0"))
                .join("")}` as `0x${string}`,
          ),
        ],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      setIsLoading(false);
    }
  };

  return {
    withdraw,
    isLoading: isLoading || isPending || isConfirming || isBuilding,
    isSuccess,
    error,
    hash,
  };
}
