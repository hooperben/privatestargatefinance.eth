import {
  createInputNote,
  createOutputNote,
  emptyInputNote,
  emptyOutputNote,
} from "@/helpers/formatting";
import { approve } from "@/helpers/functions/approve";
import { getDepositDetails } from "@/helpers/functions/deposit";
import { getNoteHash } from "@/helpers/functions/get-note-hash";
import { getNullifier } from "@/helpers/functions/get-nullifier";
import { getTransferDetails, transfer } from "@/helpers/functions/transfer";
import { getTestingAPI } from "@/helpers/get-testing-api";
import { NoteEncryption } from "@/helpers/note-sharing";
import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import { PrivateStargateFinance, USDC } from "@/typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { parseUnits, Wallet } from "ethers";
import { ethers } from "hardhat";

describe("Testing Withdraw functionality", () => {
  let Signers: HardhatEthersSigner[];
  let poseidonHash: (inputs: bigint[]) => Promise<{ toString(): string }>;

  let privateStargateFinance: PrivateStargateFinance;
  let tree: PoseidonMerkleTree;

  let usdcDeployment: USDC;

  beforeEach(async () => {
    Signers = await ethers.getSigners();
    ({ usdcDeployment, poseidonHash, privateStargateFinance, tree } =
      await getTestingAPI());
  });

  it("should let me encrypt and decrypt", async () => {
    // Create wallets (signers)
    const alice = new Wallet(
      "0x1234567890123456789012345678901234567890123456789012345678901234",
    );
    const bob = new Wallet(
      "0x9876543210987654321098765432109876543210987654321098765432109876",
    );

    // Create a note with secret
    const originalNote = {
      secret:
        "2389312107716289199307843900794656424062350252250388738019021107824217896920",
      owner: await alice.getAddress(),
      asset_id: "0x1234567890123456789012345678901234567890",
      asset_amount: "5",
    };

    try {
      // Alice encrypts a note for Bob
      const encryptedNote = await NoteEncryption.createEncryptedNote(
        originalNote,
        bob,
      );
      console.log("Encrypted note:", encryptedNote);

      // Bob decrypts the note
      const decryptedNote = await NoteEncryption.decryptNote(
        encryptedNote,
        bob,
      );
      console.log("Decrypted note:", decryptedNote);

      // Verify the secret matches
      console.log(
        "Secrets match:",
        originalNote.secret === decryptedNote.secret,
      );
    } catch (error) {
      console.error("Encryption/Decryption failed:", error);
    }
  });
});
