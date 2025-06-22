"use client";

import { useState } from "react";
import { useTree } from "../../hooks/useTree";
import {
  ARBITRUM_CHAIN_ID,
  BASE_CHAIN_ID,
  type SupportedChainId,
} from "../constants";

export function TreeTest() {
  const [selectedChain, setSelectedChain] =
    useState<SupportedChainId>(ARBITRUM_CHAIN_ID);
  const [testLeaf, setTestLeaf] = useState("");
  const [testIndex, setTestIndex] = useState("");
  const [proofResult, setProofResult] = useState<any>(null);

  const {
    tree,
    loading,
    error,
    insertLeaf,
    getProof,
    getRoot,
    verifyProof,
    getStats,
    clearCache,
    refreshTree,
  } = useTree(selectedChain);

  const stats = getStats();

  const handleInsertLeaf = async () => {
    if (!testLeaf) return;

    try {
      const leafValue = BigInt(testLeaf);
      const index = testIndex ? parseInt(testIndex) : undefined;
      const resultIndex = await insertLeaf(leafValue, index);
      alert(`Leaf inserted at index: ${resultIndex}`);
      setTestLeaf("");
      setTestIndex("");
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleGetProof = async () => {
    if (!testIndex) return;

    try {
      const index = parseInt(testIndex);
      const proof = getProof(index);
      const root = getRoot();
      const leafValue = tree?.getLeafValue(index);

      setProofResult({
        index,
        leafValue: leafValue?.toString(),
        root: root.toString(),
        proof: {
          siblings: proof.siblings.map((s) => s.toString()),
          indices: proof.indices,
        },
      });
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleVerifyProof = () => {
    if (!proofResult) return;

    try {
      const isValid = verifyProof(
        BigInt(proofResult.root),
        BigInt(proofResult.leafValue),
        {
          siblings: proofResult.proof.siblings.map((s: string) => BigInt(s)),
          indices: proofResult.proof.indices,
        },
      );

      alert(`Proof verification: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Merkle Tree Test Interface
          </h1>
          <p className="text-gray-600">
            Test the Poseidon Merkle Tree functionality for different chains
          </p>
        </div>

        {/* Chain Selection */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Chain Selection</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedChain(ARBITRUM_CHAIN_ID)}
              className={`px-4 py-2 rounded ${
                selectedChain === ARBITRUM_CHAIN_ID
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Arbitrum ({ARBITRUM_CHAIN_ID})
            </button>
            <button
              onClick={() => setSelectedChain(BASE_CHAIN_ID)}
              className={`px-4 py-2 rounded ${
                selectedChain === BASE_CHAIN_ID
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Base ({BASE_CHAIN_ID})
            </button>
          </div>
        </div>

        {/* Tree Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Tree Status</h2>

          {loading && (
            <div className="text-blue-600">
              🔄 Loading tree for chain {selectedChain}...
            </div>
          )}

          {error && <div className="text-red-600">❌ Error: {error}</div>}

          {stats && (
            <div className="space-y-2 text-sm font-mono">
              <div>
                <strong>Levels:</strong> {stats.levels}
              </div>
              <div>
                <strong>Total Capacity:</strong>{" "}
                {stats.totalCapacity.toLocaleString()}
              </div>
              <div>
                <strong>Inserted Leaves:</strong> {stats.insertedLeaves}
              </div>
              <div>
                <strong>Next Index:</strong> {stats.nextIndex}
              </div>
              <div>
                <strong>Root:</strong> {stats.root}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={refreshTree}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Refresh Tree
            </button>
            <button
              onClick={clearCache}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {/* Tree Operations */}
        {tree && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Tree Operations</h2>

            {/* Insert Leaf */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Insert Leaf</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={testLeaf}
                  onChange={(e) => setTestLeaf(e.target.value)}
                  placeholder="Leaf value (bigint)"
                  className="flex-1 p-2 border rounded font-mono text-sm"
                />
                <input
                  type="text"
                  value={testIndex}
                  onChange={(e) => setTestIndex(e.target.value)}
                  placeholder="Index (optional)"
                  className="w-32 p-2 border rounded font-mono text-sm"
                />
                <button
                  onClick={handleInsertLeaf}
                  disabled={!testLeaf}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Insert
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Leave index empty to auto-assign to next available position
              </p>
            </div>

            {/* Get Proof */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Generate Proof</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testIndex}
                  onChange={(e) => setTestIndex(e.target.value)}
                  placeholder="Leaf index"
                  className="w-32 p-2 border rounded font-mono text-sm"
                />
                <button
                  onClick={handleGetProof}
                  disabled={!testIndex}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Get Proof
                </button>
              </div>
            </div>

            {/* Proof Result */}
            {proofResult && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Proof Result</h3>
                <div className="bg-gray-50 p-4 rounded font-mono text-xs overflow-auto">
                  <pre>{JSON.stringify(proofResult, null, 2)}</pre>
                </div>
                <button
                  onClick={handleVerifyProof}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Verify Proof
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
