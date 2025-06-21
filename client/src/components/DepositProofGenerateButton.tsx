import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";

import depositCircuit from "../../../circuits/deposit/target/deposit.json";
import { loadPoseidon } from "../utils/poseidon";

interface DepositNote {
  assetId: string;
  assetAmount: bigint;
  secret: bigint;
  owner: bigint;
}

export function DepositProofGenerateButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [proofResult, setProofResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateDepositProof = async (depositNote: DepositNote) => {
    const { assetId, assetAmount, secret, owner } = depositNote;

    try {
      const noir = new Noir(depositCircuit as CompiledCircuit);
      const backend = new UltraHonkBackend(depositCircuit.bytecode);

      // Load the real poseidon hash function
      const poseidonHash = await loadPoseidon();

      // Generate note hash using real poseidon
      const noteHash = await poseidonHash([
        BigInt(assetId),
        assetAmount,
        owner,
        secret,
      ]);

      const noteHashN = BigInt(noteHash.toString());

      console.log(noteHashN);

      // Execute the circuit
      const { witness } = await noir.execute({
        hash: noteHashN.toString(),
        asset_id: assetId.toString(),
        asset_amount: assetAmount.toString(),
        owner: owner.toString(),
        secret: secret.toString(),
      });

      console.log("witness: ", witness);

      // Generate the proof
      const proof = await backend.generateProof(witness, { keccak: true });

      console.log("proof: ", proof);

      return { proof };
    } catch (err) {
      throw new Error(`Proof generation failed: ${err}`);
    }
  };

  const handleDeposit = async () => {
    setIsLoading(true);
    setError(null);
    setProofResult(null);

    try {
      // Hardcoded values similar to the test case
      const assetId = "0x1234567890123456789012345678901234567890"; // Mock USDC address
      const assetAmount = 5n;
      const secret =
        2389312107716289199307843900794656424062350252250388738019021107824217896920n;
      const ownerSecret =
        10036677144260647934022413515521823129584317400947571241312859176539726523915n;

      // Load the real poseidon hash function and generate owner from owner secret
      const poseidonHash = await loadPoseidon();
      const ownerHash = await poseidonHash([ownerSecret]);
      const owner = BigInt(ownerHash.toString());

      // Create the deposit note
      const depositNote: DepositNote = {
        assetId,
        assetAmount,
        secret,
        owner,
      };

      // Generate the ZK proof
      const { proof } = await generateDepositProof(depositNote);

      setProofResult(
        `Proof generated successfully! Proof length: ${proof.proof.length} bytes`,
      );

      // In a real app, you would now:
      // 1. Call approve() on the ERC20 token contract
      // 2. Call deposit() on the PrivateStargateFinance contract
      // 3. Handle the transaction response
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
        onClick={handleDeposit}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                   text-white font-semibold py-3 px-4 rounded-lg 
                   transition-colors duration-200"
      >
        {isLoading ? "Generating Proof..." : "Generate Deposit Proof"}
      </button>

      {proofResult && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg">
          <p className="text-green-700 text-sm">{proofResult}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p className="font-semibold">Test Values:</p>
        <p>Asset Amount: 5 tokens</p>
        <p>Mock Asset ID: 0x1234...7890</p>
        <p>Secret: 238931...896920</p>
      </div>
    </>
  );
}
