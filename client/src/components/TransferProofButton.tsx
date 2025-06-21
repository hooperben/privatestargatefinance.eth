import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";

import transferCircuit from "../../../circuits/transfer/target/transfer.json";
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

interface OutputNote {
  owner: bigint | string;
  secret: bigint | string;
  asset_id: bigint | string;
  asset_amount: bigint | string;
}

export function TransferProofButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [proofResult, setProofResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateTransferProof = async () => {
    try {
      const noir = new Noir(transferCircuit as CompiledCircuit);
      const backend = new UltraHonkBackend(transferCircuit.bytecode);

      console.log("hello");

      // Load the real poseidon hash function
      const poseidonHash = await loadPoseidon();

      // Mock data similar to transfer test
      const assetId = 1096978651789611665652906124278561787240579697095n;
      const inputAmount = 5n;
      const ownerSecret =
        10036677144260647934022413515521823129584317400947571241312859176539726523915n;
      const owner = BigInt(poseidonHash([ownerSecret]).toString());

      console.log("owner: ", owner);
      const inputSecret =
        2389312107716289199307843900794656424062350252250388738019021107824217896920n;

      // Create mock input note (from deposit)
      const inputNote: InputNote = {
        asset_id: assetId.toString(),
        asset_amount: inputAmount.toString(),
        owner: owner.toString(),
        owner_secret: ownerSecret.toString(),
        secret: inputSecret.toString(),
        leaf_index: "0",
        path: [
          13640659629327953230197633652529006805891215582818597888084863207147219313784n,
          19984673905358619496530873554532699316557532969285237470013525856790495658245n,
          16054022188397161938956278061878851932956033792728066452148841350372709856325n,
          5088416905632566847489144423785449560596474956704206833561295200206123281740n,
          7133742548945823648162717112853949322814446130740022056636610844051076979955n,
          15996976533936258369996214630141201173712053425083354410411158951568838211277n,
          12856765864455281126306545538308148448222111081433610923407492298111988109924n,
          4407863489559565071205165471845081321675763465852502126771740970311657294198n,
          20448284296610764092326252358036828964180135505542140040145855516028834425624n,
          7022843789375185322738689530892530453984779704784378294646894048972162829679n,
          10906054357754859492130109809751867122631984061959461434096281674698176679467n,
        ].map((item) => item.toString()),
        path_indices: [1n, 1n, 1n, 1n, 1n, 1n, 1n, 1n, 1n, 1n, 1n].map((item) =>
          item.toString(),
        ),
      };

      console.log(inputNote);

      // Create Alice's change note (3 tokens)
      const aliceChangeNote: OutputNote = {
        owner:
          "10812186542955647827474372651967207045861174805371180171801345448553285386806",
        secret:
          "19536471094918068928039225564664574556680178861106125446000998678966251111926",
        asset_id: assetId.toString(),
        asset_amount: "3",
      };

      const bobNote: OutputNote = {
        owner:
          "6868973719921785236727144517868768664734231208097695530688003960085654392226",
        secret:
          "3957740128091467064337395812164919758932045173069261808814882570720300029469",
        asset_id: assetId.toString(),
        asset_amount: "2",
      };

      console.log("pre poseidon");

      // Calculate nullifier for input note
      const nullifier = poseidonHash([
        BigInt(inputNote.leaf_index),
        BigInt(inputNote.owner),
        BigInt(inputNote.secret),
        BigInt(inputNote.asset_id),
        BigInt(inputNote.asset_amount),
      ]);

      // Calculate output hashes
      const aliceOutputHash = poseidonHash([
        BigInt(aliceChangeNote.asset_id),
        BigInt(aliceChangeNote.asset_amount),
        BigInt(aliceChangeNote.owner),
        BigInt(aliceChangeNote.secret),
      ]);

      const bobOutputHash = poseidonHash([
        BigInt(bobNote.asset_id),
        BigInt(bobNote.asset_amount),
        BigInt(bobNote.owner),
        BigInt(bobNote.secret),
      ]);

      // Mock empty notes for unused slots
      const emptyInputNote = {
        asset_id: "0",
        asset_amount: "0",
        owner: "0",
        owner_secret: "0",
        secret: "0",
        leaf_index: "0",
        path: Array(11).fill("0"),
        path_indices: Array(11).fill("0"),
      };

      const emptyOutputNote = {
        owner: "0",
        secret: "0",
        asset_id: "0",
        asset_amount: "0",
      };

      // Execute the circuit with transfer inputs
      const { witness } = await noir.execute({
        // Mock tree root
        root: "4221110344891604176205088962198904729260430126413313722462390172704999703195",

        // Input notes (3 slots, first one used)
        input_notes: [inputNote, emptyInputNote, emptyInputNote],

        // Nullifiers
        nullifiers: [nullifier.toString(), "0", "0"],

        // Output notes
        output_notes: [aliceChangeNote, bobNote, emptyOutputNote],

        // Output hashes
        output_hashes: [
          aliceOutputHash.toString(),
          bobOutputHash.toString(),
          "0",
        ],
      });

      console.log("Transfer witness: ", witness);

      // Generate the proof
      const proof = await backend.generateProof(witness, { keccak: true });

      console.log("Transfer proof: ", proof);

      return { proof };
    } catch (err) {
      console.error(err);
      throw new Error(`Transfer proof generation failed: ${err}`);
    }
  };

  const handleTransfer = async () => {
    setIsLoading(true);
    setError(null);
    setProofResult(null);

    try {
      const { proof } = await generateTransferProof();

      setProofResult(
        `Transfer proof generated successfully! Proof length: ${proof.proof.length} bytes`,
      );

      // In a real app, you would now call the transfer function on the contract
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
        onClick={handleTransfer}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 
                   text-white font-semibold py-3 px-4 rounded-lg 
                   transition-colors duration-200"
      >
        {isLoading ? "Generating Transfer Proof..." : "Generate Transfer Proof"}
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
        <p className="font-semibold">Transfer Test Values:</p>
        <p>Alice keeps: 3 tokens, Bob receives: 2 tokens</p>
        <p>From input: 5 tokens</p>
      </div>
    </>
  );
}
