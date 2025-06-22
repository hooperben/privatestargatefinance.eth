"use client";

import { useState, useEffect, useCallback } from "react";

export interface Contact {
  id: string;
  name: string;
  address: string;
  createdAt: number;
}

const DB_NAME = "PrivateStargateDB";
const DB_VERSION = 1;
const CONTACTS_STORE = "contacts";

export function useIndexedDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const openDB = () => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
      };

      request.onsuccess = () => {
        setDb(request.result);
      };

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(CONTACTS_STORE)) {
          const store = database.createObjectStore(CONTACTS_STORE, {
            keyPath: "id",
          });
          store.createIndex("address", "address", { unique: false });
        }
      };
    };

    openDB();
  }, []);

  const addContact = useCallback(
    async (contact: Omit<Contact, "id" | "createdAt">) => {
      if (!db) return;

      const newContact: Contact = {
        ...contact,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };

      const transaction = db.transaction([CONTACTS_STORE], "readwrite");
      const store = transaction.objectStore(CONTACTS_STORE);
      await store.add(newContact);

      return newContact;
    },
    [db],
  );

  const getContacts = useCallback(async (): Promise<Contact[]> => {
    if (!db) return [];

    const transaction = db.transaction([CONTACTS_STORE], "readonly");
    const store = transaction.objectStore(CONTACTS_STORE);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }, [db]);

  const deleteContact = useCallback(
    async (id: string) => {
      if (!db) return;

      const transaction = db.transaction([CONTACTS_STORE], "readwrite");
      const store = transaction.objectStore(CONTACTS_STORE);
      await store.delete(id);
    },
    [db],
  );

  return { addContact, getContacts, deleteContact };
}
