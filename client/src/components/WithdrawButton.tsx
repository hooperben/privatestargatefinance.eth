import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";

import withdrawCircuit from "../../../circuits/withdraw/target/withdraw.json";
import { loadPoseidon } from "../utils/poseidon";

interface InputNote {
  asset_id: bigint;
  asset_amount: bigint;
  owner: bigint;
  owner_secret: bigint;
  secret: bigint;
  leaf_index: bigint;
  siblings: bigint[];
  indices: bigint[];
}

export function WithdrawButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [proofResult, setProofResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateWithdrawProof = async () => {
    try {
      const noir = new Noir(withdrawCircuit as CompiledCircuit);
      const backend = new UltraHonkBackend(withdrawCircuit.bytecode);

      // Load the real poseidon hash function
      const poseidonHash = await loadPoseidon();

      // Mock data similar to withdraw test
      const assetId = "0x1234567890123456789012345678901234567890";
      const bobOwnerSecret =
        6955001134965379637962992480442037189090898019061077075663294923529403402038n;
      const bobOwner = BigInt(
        (await poseidonHash([bobOwnerSecret])).toString(),
      );
      const bobAmount = 2n;
      const bobSecret =
        3957740128091467064337395812164919758932045173069261808814882570720300029469n;

      // Create Bob's input note to withdraw
      const bobInputNote: InputNote = {
        asset_id: BigInt(assetId),
        asset_amount: bobAmount,
        owner: bobOwner,
        owner_secret: bobOwnerSecret,
        secret: bobSecret,
        leaf_index: 2n,
        siblings: [
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
        ],
        indices: [
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
          0n,
        ],
      };

      // Calculate nullifier for input note
      const nullifier = await poseidonHash([
        bobInputNote.leaf_index,
        bobInputNote.owner,
        bobInputNote.secret,
        bobInputNote.asset_id,
        bobInputNote.asset_amount,
      ]);

      // Mock withdrawal address (from test: Signers[9].address)
      const withdrawAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Mock address
      const withdrawAddressHash = await poseidonHash([BigInt(withdrawAddress)]);

      // Mock empty notes for unused slots
      const emptyInputNote = {
        asset_id: 0n,
        asset_amount: 0n,
        owner: 0n,
        owner_secret: 0n,
        secret: 0n,
        leaf_index: 0n,
        siblings: Array(20).fill(0n),
        indices: Array(20).fill(0n),
      };

      // Execute the circuit with withdraw inputs
      const { witness } = await noir.execute({
        // Mock tree root
        root: "0x1234567890123456789012345678901234567890123456789012345678901234",

        // Input notes (3 slots, first one used)
        input_notes: [bobInputNote, emptyInputNote, emptyInputNote],

        // Nullifiers
        nullifiers: [BigInt(nullifier.toString()), 0n, 0n],

        // Exit assets (what assets to withdraw)
        exit_assets: [BigInt(assetId), 0n, 0n],

        // Exit amounts
        exit_amounts: [bobAmount, 0n, 0n],

        // Exit addresses (where to send the withdrawn tokens)
        exit_addresses: [BigInt(withdrawAddress), 0n, 0n],

        // Exit address hashes
        exit_address_hashes: [BigInt(withdrawAddressHash.toString()), 0n, 0n],
      });

      console.log("Withdraw witness: ", witness);

      // Generate the proof
      const proof = await backend.generateProof(witness, { keccak: true });

      console.log("Withdraw proof: ", proof);

      return { proof };
    } catch (err) {
      throw new Error(`Withdraw proof generation failed: ${err}`);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    setError(null);
    setProofResult(null);

    try {
      const { proof } = await generateWithdrawProof();

      setProofResult(
        `Withdraw proof generated successfully! Proof length: ${proof.proof.length} bytes`,
      );

      // In a real app, you would now call the withdraw function on the contract
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleWithdraw}
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 
                   text-white font-semibold py-3 px-4 rounded-lg 
                   transition-colors duration-200"
      >
        {isLoading ? "Generating Withdraw Proof..." : "Generate Withdraw Proof"}
      </button>

      {proofResult && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700 text-sm">{proofResult}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p className="font-semibold">Withdraw Test Values:</p>
        <p>Withdrawing: 2 tokens to public address</p>
        <p>Address: 0x70997...79C8</p>
      </div>
    </>
  );
}
