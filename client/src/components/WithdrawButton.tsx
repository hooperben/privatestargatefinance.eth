import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";

import withdrawCircuit from "../../../circuits/withdraw/target/withdraw.json";
import { loadPoseidon } from "../utils/poseidon";

interface InputNote {
  asset_id: bigint | string;
  asset_amount: bigint | string;
  owner: bigint | string;
  owner_secret: bigint | string;
  secret: bigint | string;
  leaf_index: bigint | string;
  path: bigint[] | string[];
  path_indices: bigint[] | string[];
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
      const assetId = "1096978651789611665652906124278561787240579697095";
      const bobOwnerSecret =
        "6955001134965379637962992480442037189090898019061077075663294923529403402038";
      const bobOwner = poseidonHash([BigInt(bobOwnerSecret)]).toString();
      const bobAmount = "2";
      const bobSecret =
        "3957740128091467064337395812164919758932045173069261808814882570720300029469";

      // Create Bob's input note to withdraw
      const bobInputNote: InputNote = {
        asset_id: BigInt(assetId).toString(),
        asset_amount: bobAmount,
        owner: bobOwner,
        owner_secret: bobOwnerSecret,
        secret: bobSecret,
        leaf_index: "2",
        path: [
          "13640659629327953230197633652529006805891215582818597888084863207147219313784",
          "18380261439356865501884569257940638985761619337694138929913102368174989083576",
          "16054022188397161938956278061878851932956033792728066452148841350372709856325",
          "5088416905632566847489144423785449560596474956704206833561295200206123281740",
          "7133742548945823648162717112853949322814446130740022056636610844051076979955",
          "15996976533936258369996214630141201173712053425083354410411158951568838211277",
          "12856765864455281126306545538308148448222111081433610923407492298111988109924",
          "4407863489559565071205165471845081321675763465852502126771740970311657294198",
          "20448284296610764092326252358036828964180135505542140040145855516028834425624",
          "7022843789375185322738689530892530453984779704784378294646894048972162829679",
          "10906054357754859492130109809751867122631984061959461434096281674698176679467",
        ],
        path_indices: ["1", "0", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
      };

      // Calculate nullifier for input note
      const nullifier = poseidonHash([
        BigInt(bobInputNote.leaf_index),
        BigInt(bobInputNote.owner),
        BigInt(bobInputNote.secret),
        BigInt(bobInputNote.asset_id),
        BigInt(bobInputNote.asset_amount),
      ]);

      // Mock withdrawal address (from test: Signers[9].address)
      const withdrawAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Mock address
      const withdrawAddressHash = poseidonHash([BigInt(withdrawAddress)]);

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

      // Execute the circuit with withdraw inputs
      const { witness } = await noir.execute({
        // Mock tree root
        root: "9770762522284292133040204594656801249089743659015207279808423545223243067226",

        // Input notes (3 slots, first one used) - convert to strings
        input_notes: [
          {
            asset_id: bobInputNote.asset_id.toString(),
            asset_amount: bobInputNote.asset_amount.toString(),
            owner: bobInputNote.owner.toString(),
            owner_secret: bobInputNote.owner_secret.toString(),
            secret: bobInputNote.secret.toString(),
            leaf_index: bobInputNote.leaf_index.toString(),
            path: bobInputNote.path.map((s) => s.toString()),
            path_indices: bobInputNote.path_indices.map((i) => i.toString()),
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

        // Nullifiers - convert to strings
        nullifiers: [BigInt(nullifier.toString()).toString(), "0", "0"],

        // Exit assets (what assets to withdraw) - convert to strings
        exit_assets: [BigInt(assetId).toString(), "0", "0"],

        // Exit amounts - convert to strings
        exit_amounts: [bobAmount.toString(), "0", "0"],

        // Exit addresses (where to send the withdrawn tokens) - convert to strings
        exit_addresses: [BigInt(withdrawAddress).toString(), "0", "0"],

        // Exit address hashes - convert to strings
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
