"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DB_NAME = "PrivateNotesDB";
const DB_VERSION = 1;
const NOTES_STORE = "notes";

export interface Note {
  id: string;
  assetId: string;
  assetAmount: string; // Store as string to preserve precision
  owner: string; // poseidonHash(owner_secret) as hex string
  secret: string; // secret as hex string
  ownerSecret: string; // owner_secret as hex string for reconstruction
  chainId: number;
  createdAt: number;
  txHash?: string; // Optional transaction hash when deposited
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<IDBDatabase | null>(null);

  // Initialize IndexedDB
  const initDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (dbRef.current) {
        resolve(dbRef.current);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        dbRef.current = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          const store = db.createObjectStore(NOTES_STORE, {
            keyPath: "id",
          });
          store.createIndex("chainId", "chainId", { unique: false });
          store.createIndex("assetId", "assetId", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  }, []);

  // Load all notes
  const loadNotes = useCallback(async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction([NOTES_STORE], "readonly");
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.getAll();

      return new Promise<Note[]>((resolve) => {
        request.onsuccess = () => {
          const notes = request.result as Note[];
          // Sort by creation date, newest first
          notes.sort((a, b) => b.createdAt - a.createdAt);
          setNotes(notes);
          resolve(notes);
        };

        request.onerror = () => {
          console.error("Failed to load notes");
          resolve([]);
        };
      });
    } catch (error) {
      console.error("Failed to load notes:", error);
      setError("Failed to load notes");
      return [];
    }
  }, [initDB]);

  // Add a new note
  const addNote = useCallback(
    async (noteData: Omit<Note, "id" | "createdAt">): Promise<string> => {
      try {
        const db = await initDB();
        const transaction = db.transaction([NOTES_STORE], "readwrite");
        const store = transaction.objectStore(NOTES_STORE);

        const note: Note = {
          ...noteData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
          const request = store.add(note);

          request.onsuccess = () => {
            setNotes((prev) => [note, ...prev]);
            resolve(note.id);
          };

          request.onerror = () => {
            reject(new Error("Failed to add note"));
          };
        });
      } catch (error) {
        console.error("Failed to add note:", error);
        throw error;
      }
    },
    [initDB],
  );

  // Update a note (e.g., add transaction hash)
  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>): Promise<void> => {
      try {
        const db = await initDB();
        const transaction = db.transaction([NOTES_STORE], "readwrite");
        const store = transaction.objectStore(NOTES_STORE);

        return new Promise((resolve, reject) => {
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            const existingNote = getRequest.result;
            if (!existingNote) {
              reject(new Error("Note not found"));
              return;
            }

            const updatedNote = { ...existingNote, ...updates };
            const putRequest = store.put(updatedNote);

            putRequest.onsuccess = () => {
              setNotes((prev) =>
                prev.map((note) => (note.id === id ? updatedNote : note)),
              );
              resolve();
            };

            putRequest.onerror = () => {
              reject(new Error("Failed to update note"));
            };
          };

          getRequest.onerror = () => {
            reject(new Error("Failed to find note"));
          };
        });
      } catch (error) {
        console.error("Failed to update note:", error);
        throw error;
      }
    },
    [initDB],
  );

  // Delete a note
  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      try {
        const db = await initDB();
        const transaction = db.transaction([NOTES_STORE], "readwrite");
        const store = transaction.objectStore(NOTES_STORE);

        return new Promise((resolve, reject) => {
          const request = store.delete(id);

          request.onsuccess = () => {
            setNotes((prev) => prev.filter((note) => note.id !== id));
            resolve();
          };

          request.onerror = () => {
            reject(new Error("Failed to delete note"));
          };
        });
      } catch (error) {
        console.error("Failed to delete note:", error);
        throw error;
      }
    },
    [initDB],
  );

  // Get notes by chain ID
  const getNotesByChain = useCallback(
    (chainId: number): Note[] => {
      return notes.filter((note) => note.chainId === chainId);
    },
    [notes],
  );

  // Get notes by asset ID
  const getNotesByAsset = useCallback(
    (assetId: string): Note[] => {
      return notes.filter(
        (note) => note.assetId.toLowerCase() === assetId.toLowerCase(),
      );
    },
    [notes],
  );

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadNotes();
      } catch (error) {
        setError("Failed to initialize notes database");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadNotes]);

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    getNotesByChain,
    getNotesByAsset,
    refreshNotes: loadNotes,
  };
}
