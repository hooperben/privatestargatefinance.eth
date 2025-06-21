import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";

import warpCircuit from "../../../circuits/warp/target/warp.json";
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

interface OutputNote {
  owner: bigint;
  secret: bigint;
  asset_id: bigint;
  asset_amount: bigint;
}

export function WarpButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [proofResult, setProofResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateWarpProof = async () => {
    try {
      const noir = new Noir(warpCircuit as CompiledCircuit);
      const backend = new UltraHonkBackend(warpCircuit.bytecode);

      // Load the real poseidon hash function
      const poseidonHash = await loadPoseidon();

      // Mock data similar to warp test
      const assetId = "0x1234567890123456789012345678901234567890";
      const bobOwnerSecret =
        6955001134965379637962992480442037189090898019061077075663294923529403402038n;
      const bobOwner = BigInt(
        (await poseidonHash([bobOwnerSecret])).toString(),
      );
      const bobAmount = 2n;
      const bobSecret =
        3957740128091467064337395812164919758932045173069261808814882570720300029469n;

      // Create Bob's input note (2 tokens to warp)
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

      // Create Bob's first output note (1 token stays local)
      const bobOutputNote1: OutputNote = {
        owner: bobOwner,
        secret:
          20692543145395281049201570311039088439241217488240697505239066711129161561961n,
        asset_id: BigInt(assetId),
        asset_amount: 1n,
      };

      // Create Bob's second output note (1 token to be warped)
      const bobOutputNote2: OutputNote = {
        owner: bobOwner,
        secret:
          19367321191663727441411635172708374860517590059336496178869629509133908474360n,
        asset_id: BigInt(assetId),
        asset_amount: 1n,
      };

      // Calculate nullifier for input note
      const nullifier = await poseidonHash([
        bobInputNote.leaf_index,
        bobInputNote.owner,
        bobInputNote.secret,
        bobInputNote.asset_id,
        bobInputNote.asset_amount,
      ]);

      // Calculate output hashes
      const bobOutputNote1Hash = await poseidonHash([
        BigInt(bobOutputNote1.asset_id),
        bobOutputNote1.asset_amount,
        bobOutputNote1.owner,
        bobOutputNote1.secret,
      ]);

      const bobOutputNote2Hash = await poseidonHash([
        BigInt(bobOutputNote2.asset_id),
        bobOutputNote2.asset_amount,
        bobOutputNote2.owner,
        bobOutputNote2.secret,
      ]);

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

      const emptyOutputNote = {
        owner: 0n,
        secret: 0n,
        asset_id: 0n,
        asset_amount: 0n,
      };

      // Execute the circuit with warp inputs
      const { witness } = await noir.execute({
        // Mock tree root
        root: "0x1234567890123456789012345678901234567890123456789012345678901234",

        // Input notes (3 slots, first one used)
        input_notes: [bobInputNote, emptyInputNote, emptyInputNote],

        // Output notes (2 used, 1 empty)
        output_notes: [bobOutputNote1, bobOutputNote2, emptyOutputNote],

        // Nullifiers
        nullifiers: [BigInt(nullifier.toString()), 0n, 0n],

        // Output hashes
        output_hashes: [
          BigInt(bobOutputNote1Hash.toString()),
          BigInt(bobOutputNote2Hash.toString()),
          0n,
        ],

        // Warp-specific fields (which outputs are warped)
        warp_asset_ids: [0n, BigInt(assetId), 0n],
        warp_asset_amounts: [0n, 1n, 0n],
      });

      console.log("Warp witness: ", witness);

      // Generate the proof
      const proof = await backend.generateProof(witness, { keccak: true });

      console.log("Warp proof: ", proof);

      return { proof };
    } catch (err) {
      throw new Error(`Warp proof generation failed: ${err}`);
    }
  };

  const handleWarp = async () => {
    setIsLoading(true);
    setError(null);
    setProofResult(null);

    try {
      const { proof } = await generateWarpProof();

      setProofResult(
        `Warp proof generated successfully! Proof length: ${proof.proof.length} bytes`,
      );

      // In a real app, you would now call the warp function on the contract
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
        onClick={handleWarp}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 
                   text-white font-semibold py-3 px-4 rounded-lg 
                   transition-colors duration-200"
      >
        {isLoading ? "Generating Warp Proof..." : "Generate Warp Proof"}
      </button>

      {proofResult && (
        <div className="mt-4 p-4 bg-purple-100 border border-purple-400 rounded-lg">
          <p className="text-purple-700 text-sm">{proofResult}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p className="font-semibold">Warp Test Values:</p>
        <p>Input: 2 tokens → 1 local + 1 warped cross-chain</p>
        <p>Cross-chain transfer using LayerZero</p>
      </div>
    </>
  );
}
