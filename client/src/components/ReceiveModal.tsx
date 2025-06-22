"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { ethers } from "ethers";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { usePasskey } from "../../hooks/usePasskey";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Copy, Check } from "lucide-react";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { getMnemonicFromPasskey, hasPasskey } = usePasskey();
  const [receiveAddress, setReceiveAddress] = useState<string>("");
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate the receive address when modal opens
  useEffect(() => {
    if (isOpen && hasPasskey()) {
      generateReceiveAddress();
    }
  }, [isOpen, hasPasskey]);

  const generateReceiveAddress = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get mnemonic from passkey
      const mnemonic = await getMnemonicFromPasskey();
      if (!mnemonic) {
        throw new Error("Failed to retrieve mnemonic from passkey");
      }

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      // Generate owner hash (poseidon2Hash of private key)
      const ownerSecret = BigInt(wallet.privateKey);
      const ownerHash = poseidon2Hash([ownerSecret]);

      // Get recipient public key (same way as NoteEncryption.getPublicKeyFromAddress)
      const signingKey = new ethers.SigningKey(wallet.privateKey);
      const recipientPublicKey = signingKey.publicKey;

      // Create the receive address format: <ownerHash>:<recipientPublicKey>
      const address = `${ownerHash.toString()}:${recipientPublicKey}`;

      setReceiveAddress(address);

      // Generate QR code
      const qrCode = await QRCode.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeData(qrCode);
    } catch (error) {
      console.error("Failed to generate receive address:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate receive address",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!receiveAddress) return;

    try {
      await navigator.clipboard.writeText(receiveAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = receiveAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    const [hash, publicKey] = address.split(":");
    if (!hash || !publicKey) return address;

    return (
      <div className="space-y-2">
        <div>
          <span className="text-xs text-gray-500 block">Owner Hash:</span>
          <span className="font-mono text-sm break-all">{hash}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block">Public Key:</span>
          <span className="font-mono text-sm break-all">{publicKey}</span>
        </div>
      </div>
    );
  };

  if (!hasPasskey()) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Payments</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <p className="text-gray-600">
              Please create a private account first to generate a receive
              address.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Payments</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-600 text-sm">{error}</p>
              <Button
                onClick={generateReceiveAddress}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* QR Code */}
              {qrCodeData && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <img
                      src={qrCodeData}
                      alt="Receive Address QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Address Display */}
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Receive Address
                    </span>
                    <Button
                      onClick={copyToClipboard}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {formatAddress(receiveAddress)}
                </div>
              </div>

              {/* Instructions */}
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  Share this address with someone who wants to send you private
                  payments.
                </p>
                <p>
                  The address consists of your owner hash and public key for
                  encrypted note delivery.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
