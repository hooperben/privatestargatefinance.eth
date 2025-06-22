"use client";

import type React from "react";

import { useState, useEffect } from "react";
// import { useAccount } from "wagmi";
import { useIndexedDB, type Contact } from "../../hooks/useIndexedDB";
import type { TokenBalance } from "../../hooks/useTokenBalances";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenBalance: TokenBalance;
}

export function TransferModal({
  isOpen,
  onClose,
  tokenBalance,
}: TransferModalProps) {
  // const { address } = useAccount();
  const { getContacts } = useIndexedDB();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transferType, setTransferType] = useState<"public" | "private">(
    "public",
  );
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (isOpen) {
      getContacts().then(setContacts);
    }
  }, [isOpen, getContacts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement transfer logic
    console.log("Transfer:", {
      transferType,
      selectedContact,
      amount,
      tokenBalance,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Transfer {tokenBalance.symbol}
          </h2>
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
          <div className="text-xs text-gray-500">{tokenBalance.chainName}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Transfer Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="public"
                  checked={transferType === "public"}
                  onChange={(e) =>
                    setTransferType(e.target.value as "public" | "private")
                  }
                  className="mr-2"
                />
                Public
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  checked={transferType === "private"}
                  onChange={(e) =>
                    setTransferType(e.target.value as "public" | "private")
                  }
                  className="mr-2"
                />
                Private
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recipient</label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select contact...</option>
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
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 font-mono"
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
