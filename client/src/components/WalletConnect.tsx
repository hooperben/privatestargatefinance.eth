import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
        <div className="flex-1">
          <div className="text-sm text-gray-600">
            Connected to {chain?.name}
          </div>
          <div className="font-mono text-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Connect Wallet
      </h3>
      <div className="grid gap-2">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="flex items-center gap-3 p-3 text-left border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              {getConnectorIcon(connector.name)}
            </div>
            <span className="font-medium">{connector.name}</span>
            {isPending && (
              <span className="text-sm text-gray-500">Connecting...</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function getConnectorIcon(name: string) {
  switch (name.toLowerCase()) {
    case "metamask":
      return "🦊";
    case "walletconnect":
      return "🔗";
    case "coinbase wallet":
      return "🔵";
    case "injected":
      return "💳";
    default:
      return "👛";
  }
}
