"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useIndexedDB, type Contact } from "../../hooks/useIndexedDB";

interface ContactManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactManager({ isOpen, onClose }: ContactManagerProps) {
  const { addContact, getContacts, deleteContact } = useIndexedDB();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactAddress, setNewContactAddress] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    const contactList = await getContacts();
    setContacts(contactList);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactAddress.trim()) return;

    try {
      await addContact({
        name: newContactName.trim(),
        address: newContactAddress.trim(),
      });
      setNewContactName("");
      setNewContactAddress("");
      loadContacts();
    } catch (error) {
      console.error("Failed to add contact:", error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteContact(id);
      loadContacts();
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Manage Contacts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAddContact} className="mb-6 space-y-3">
          <div>
            <input
              type="text"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Contact name"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <input
              type="text"
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Contact
          </button>
        </form>

        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Saved Contacts</h3>
          {contacts.length === 0 ? (
            <p className="text-gray-500 text-sm">No contacts saved yet</p>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
