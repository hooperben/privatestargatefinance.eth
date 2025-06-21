import { poseidon2Hash } from "@zkpassport/poseidon2";

// Type for the poseidon2Hash function
type Poseidon2Hash = (inputs: bigint[]) => { toString(): string };

export const loadPoseidon = async (): Promise<Poseidon2Hash> => {
  try {
    // Return a wrapper that matches the expected interface
    return (inputs: bigint[]) => {
      const result = poseidon2Hash(inputs);
      return result.toString();
    };
  } catch (error) {
    console.error("Failed to load poseidon hash:", error);
    throw new Error("Could not load poseidon hash function");
  }
};
