"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";

export interface PasskeyAccount {
  address: string;
  hasPasskey: boolean;
}

export function usePasskey() {
  const [loading, setLoading] = useState(false);

  // Check if passkeys are supported
  const isPasskeySupported = useCallback(() => {
    return (
      typeof window !== "undefined" &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable === "function" &&
      typeof navigator.credentials !== "undefined"
    );
  }, []);

  // Create a new passkey with a random mnemonic
  const createPasskeyAccount = useCallback(async (): Promise<string | null> => {
    if (!isPasskeySupported()) {
      throw new Error("Passkeys are not supported on this device");
    }

    setLoading(true);
    try {
      // Generate a random mnemonic
      const wallet = ethers.Wallet.createRandom();
      const mnemonic = wallet.mnemonic?.phrase;

      if (!mnemonic) {
        throw new Error("Failed to generate mnemonic");
      }

      // Create the passkey credential
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: new TextEncoder().encode("create-private-account"),
          rp: {
            name: "Private Stargate Finance",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(`private-account-${Date.now()}`),
            name: "Private Account",
            displayName: "Private Account",
          },
          pubKeyCredParams: [
            {
              type: "public-key",
              alg: -7, // ES256
            },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          // Note: We'll store the mnemonic encrypted in localStorage
          // and use the passkey for authentication
        },
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create passkey");
      }

      // Store the credential ID and encrypted mnemonic for later retrieval
      const credentialId = btoa(
        String.fromCharCode(...new Uint8Array(credential.rawId)),
      );
      localStorage.setItem("passkey-credential-id", credentialId);

      // For simplicity, we'll store the mnemonic base64 encoded
      // In a production app, you'd want to encrypt this with a key derived from the passkey
      localStorage.setItem("passkey-mnemonic", btoa(mnemonic));

      return wallet.address;
    } catch (error) {
      console.error("Error creating passkey account:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isPasskeySupported]);

  // Retrieve the mnemonic from the passkey
  const getMnemonicFromPasskey = useCallback(async (): Promise<
    string | null
  > => {
    if (!isPasskeySupported()) {
      throw new Error("Passkeys are not supported on this device");
    }

    setLoading(true);
    try {
      const credentialId = localStorage.getItem("passkey-credential-id");
      if (!credentialId) {
        throw new Error("No passkey credential found");
      }

      // Convert base64 credential ID back to Uint8Array
      const credentialIdBytes = new Uint8Array(
        atob(credentialId)
          .split("")
          .map((c) => c.charCodeAt(0)),
      );

      // Retrieve the credential for authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode("get-private-account"),
          allowCredentials: [
            {
              type: "public-key",
              id: credentialIdBytes,
            },
          ],
          userVerification: "required",
        },
      });

      if (!credential) {
        throw new Error("Failed to authenticate with passkey");
      }

      // If authentication successful, retrieve the mnemonic from localStorage
      const encodedMnemonic = localStorage.getItem("passkey-mnemonic");
      if (!encodedMnemonic) {
        throw new Error("No mnemonic found in storage");
      }

      const mnemonic = atob(encodedMnemonic);
      return mnemonic;
    } catch (error) {
      console.error("Error retrieving mnemonic from passkey:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isPasskeySupported]);

  // Check if user has a passkey registered
  const hasPasskey = useCallback(() => {
    return !!localStorage.getItem("passkey-credential-id");
  }, []);

  return {
    loading,
    isPasskeySupported,
    createPasskeyAccount,
    getMnemonicFromPasskey,
    hasPasskey,
  };
}
