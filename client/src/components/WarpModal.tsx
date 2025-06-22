"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useIndexedDB, type Contact } from "../../hooks/useIndexedDB";
import type { TokenBalance } from "../../hooks/useTokenBalances";

interface WarpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenBalance: TokenBalance;
}

export function WarpModal({ isOpen, onClose, tokenBalance }: WarpModalProps) {
  const { address } = useAccount();
  const { getContacts } = useIndexedDB();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [targetNetwork, setTargetNetwork] = useState<"base" | "arbitrum">(
    "base",
  );
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (isOpen) {
      getContacts().then(setContacts);
      // Default to user's own address
      if (address) {
        setSelectedContact(address);
      }
      // Set target network to the opposite of current
      setTargetNetwork(tokenBalance.chainId === 8453 ? "arbitrum" : "base");
    }
  }, [isOpen, getContacts, address, tokenBalance.chainId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement warp logic
    console.log("Warp:", {
      targetNetwork,
      selectedContact,
      amount,
      tokenBalance,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Warp {tokenBalance.symbol}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Available Balance</div>
          <div className="text-lg font-mono">
            {tokenBalance.formattedBalance} {tokenBalance.symbol}
          </div>
          <div className="text-xs text-gray-500">
            From {tokenBalance.chainName}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Network
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="base"
                  checked={targetNetwork === "base"}
                  onChange={(e) =>
                    setTargetNetwork(e.target.value as "base" | "arbitrum")
                  }
                  className="mr-2"
                />
                Base
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="arbitrum"
                  checked={targetNetwork === "arbitrum"}
                  onChange={(e) =>
                    setTargetNetwork(e.target.value as "base" | "arbitrum")
                  }
                  className="mr-2"
                />
                Arbitrum
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recipient</label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select contact...</option>
              {address && (
                <option value={address}>
                  My Address ({address.slice(0, 6)}...{address.slice(-4)})
                </option>
              )}
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.address}>
                  {contact.name} ({contact.address.slice(0, 6)}...
                  {contact.address.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              max={tokenBalance.formattedBalance}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 font-mono"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Warp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
