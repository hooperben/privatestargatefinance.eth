import { useState } from "react";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";

import warpCircuit from "../../../circuits/warp/target/warp.json";
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
      const assetId = "1096978651789611665652906124278561787240579697095";
      const bobOwnerSecret =
        "10036677144260647934022413515521823129584317400947571241312859176539726523915";
      const bobOwner = poseidonHash([BigInt(bobOwnerSecret)]).toString();
      const bobAmount = "5";
      const bobSecret =
        "2389312107716289199307843900794656424062350252250388738019021107824217896920";

      // Create Bob's input note (2 tokens to warp)
      const bobInputNote: InputNote = {
        asset_id: assetId,
        asset_amount: bobAmount,
        owner: bobOwner,
        owner_secret: bobOwnerSecret,
        secret: bobSecret,
        leaf_index: "0",
        path: [
          "13640659629327953230197633652529006805891215582818597888084863207147219313784",
          "19984673905358619496530873554532699316557532969285237470013525856790495658245",
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
        path_indices: ["1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
      };

      // Create Bob's first output note (1 token stays local)
      const bobOutputNote1: OutputNote = {
        owner:
          "10812186542955647827474372651967207045861174805371180171801345448553285386806",
        secret:
          "19536471094918068928039225564664574556680178861106125446000998678966251111926",
        asset_id: "1096978651789611665652906124278561787240579697095",
        asset_amount: "3",
      };

      // Create Bob's second output note (1 token to be warped)
      const bobOutputNote2: OutputNote = {
        owner:
          "6868973719921785236727144517868768664734231208097695530688003960085654392226",
        secret:
          "3957740128091467064337395812164919758932045173069261808814882570720300029469",
        asset_id: "1096978651789611665652906124278561787240579697095",
        asset_amount: "2",
      };

      // Calculate nullifier for input note
      const nullifier = await poseidonHash([
        BigInt(bobInputNote.leaf_index),
        BigInt(bobInputNote.owner),
        BigInt(bobInputNote.secret),
        BigInt(bobInputNote.asset_id),
        BigInt(bobInputNote.asset_amount),
      ]);

      // Calculate output hashes
      const bobOutputNote1Hash = await poseidonHash([
        BigInt(bobOutputNote1.asset_id),
        BigInt(bobOutputNote1.asset_amount),
        BigInt(bobOutputNote1.owner),
        BigInt(bobOutputNote1.secret),
      ]);

      const bobOutputNote2Hash = await poseidonHash([
        BigInt(bobOutputNote2.asset_id),
        BigInt(bobOutputNote2.asset_amount),
        BigInt(bobOutputNote2.owner),
        BigInt(bobOutputNote2.secret),
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

      console.log(
        3889730504789135603011318287331683111639714777739573239289638917879152395137n,
      );
      console.log("nullifier", nullifier);

      console.log({
        // Mock tree root
        root: "4221110344891604176205088962198904729260430126413313722462390172704999703195",

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
            path: emptyInputNote.path.map((s) => s.toString()),
            path_indices: emptyInputNote.path_indices.map((i) => i.toString()),
          },
          {
            asset_id: emptyInputNote.asset_id.toString(),
            asset_amount: emptyInputNote.asset_amount.toString(),
            owner: emptyInputNote.owner.toString(),
            owner_secret: emptyInputNote.owner_secret.toString(),
            secret: emptyInputNote.secret.toString(),
            leaf_index: emptyInputNote.leaf_index.toString(),
            path: emptyInputNote.path.map((s) => s.toString()),
            path_indices: emptyInputNote.path_indices.map((i) => i.toString()),
          },
        ],

        // Output notes (2 used, 1 empty) - convert to strings
        output_notes: [
          {
            owner: bobOutputNote1.owner.toString(),
            secret: bobOutputNote1.secret.toString(),
            asset_id: bobOutputNote1.asset_id.toString(),
            asset_amount: bobOutputNote1.asset_amount.toString(),
          },
          {
            owner: bobOutputNote2.owner.toString(),
            secret: bobOutputNote2.secret.toString(),
            asset_id: bobOutputNote2.asset_id.toString(),
            asset_amount: bobOutputNote2.asset_amount.toString(),
          },
          {
            owner: emptyOutputNote.owner.toString(),
            secret: emptyOutputNote.secret.toString(),
            asset_id: emptyOutputNote.asset_id.toString(),
            asset_amount: emptyOutputNote.asset_amount.toString(),
          },
        ],

        // Nullifiers - convert to strings
        nullifiers: [BigInt(nullifier.toString()).toString(), "0", "0"],

        // Output hashes - convert to strings
        output_hashes: [
          "8576856452718270547402366094981334736141859948414539161051536617849336979212",
          "4033300113401483633011546954450009404136112133461230452107665732116532508739",
          "0",
        ],

        // Warp-specific fields (which outputs are warped) - convert to strings
        stargate_assets: ["0", BigInt(bobOutputNote2.asset_id).toString(), "0"],
        stargate_amounts: ["0", "2", "0"],
      });

      // Execute the circuit with warp inputs
      const { witness } = await noir.execute({
        // Mock tree root
        root: "4221110344891604176205088962198904729260430126413313722462390172704999703195",

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
            path: emptyInputNote.path.map((s) => s.toString()),
            path_indices: emptyInputNote.path_indices.map((i) => i.toString()),
          },
          {
            asset_id: emptyInputNote.asset_id.toString(),
            asset_amount: emptyInputNote.asset_amount.toString(),
            owner: emptyInputNote.owner.toString(),
            owner_secret: emptyInputNote.owner_secret.toString(),
            secret: emptyInputNote.secret.toString(),
            leaf_index: emptyInputNote.leaf_index.toString(),
            path: emptyInputNote.path.map((s) => s.toString()),
            path_indices: emptyInputNote.path_indices.map((i) => i.toString()),
          },
        ],

        // Output notes (2 used, 1 empty) - convert to strings
        output_notes: [
          {
            owner: bobOutputNote1.owner.toString(),
            secret: bobOutputNote1.secret.toString(),
            asset_id: bobOutputNote1.asset_id.toString(),
            asset_amount: bobOutputNote1.asset_amount.toString(),
          },
          {
            owner: bobOutputNote2.owner.toString(),
            secret: bobOutputNote2.secret.toString(),
            asset_id: bobOutputNote2.asset_id.toString(),
            asset_amount: bobOutputNote2.asset_amount.toString(),
          },
          {
            owner: emptyOutputNote.owner.toString(),
            secret: emptyOutputNote.secret.toString(),
            asset_id: emptyOutputNote.asset_id.toString(),
            asset_amount: emptyOutputNote.asset_amount.toString(),
          },
        ],

        // Nullifiers - convert to strings
        nullifiers: [BigInt(nullifier.toString()).toString(), "0", "0"],

        // Output hashes - convert to strings
        output_hashes: [
          "8576856452718270547402366094981334736141859948414539161051536617849336979212",
          "4033300113401483633011546954450009404136112133461230452107665732116532508739",
          "0",
        ],

        // Warp-specific fields (which outputs are warped) - convert to strings
        stargate_assets: ["0", BigInt(bobOutputNote2.asset_id).toString(), "0"],
        stargate_amounts: ["0", "2", "0"],
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
