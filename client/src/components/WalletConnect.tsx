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
      <div className="flex items-center gap-4 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="flex-1">
          <div className="text-sm text-gray-400">
            Connected to {chain?.name}
          </div>
          <div className="font-mono text-sm text-white">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm font-medium text-red-400 bg-red-900/20 rounded-md hover:bg-red-900/30 transition-colors border border-red-800/50"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Connect Wallet Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Connect Wallet
        </h2>
      </div>

      {/* Wallet Options */}
      <div className="space-y-3">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="w-full flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                {getConnectorIcon(connector.name)}
              </div>
              <span className="font-medium text-white">{connector.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {isPending ? (
                <span className="text-sm text-gray-400">Connecting...</span>
              ) : (
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                  Connect
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function getConnectorIcon(name: string) {
  const iconClass = "w-6 h-6";

  switch (name.toLowerCase()) {
    case "metamask":
      return (
        <div
          className={`${iconClass} bg-orange-500 rounded flex items-center justify-center`}
        >
          🦊
        </div>
      );
    case "walletconnect":
      return (
        <div
          className={`${iconClass} bg-blue-500 rounded flex items-center justify-center`}
        >
          🔗
        </div>
      );
    case "coinbase wallet":
    case "coinbase smart wallet":
      return (
        <div
          className={`${iconClass} bg-blue-600 rounded flex items-center justify-center text-white`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <circle cx="12" cy="12" r="12" fill="currentColor" />
          </svg>
        </div>
      );
    case "phantom":
      return (
        <div
          className={`${iconClass} bg-purple-500 rounded flex items-center justify-center`}
        >
          👻
        </div>
      );
    case "subwallet":
      return (
        <div
          className={`${iconClass} bg-teal-500 rounded flex items-center justify-center text-white`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      );
    case "taho":
      return (
        <div
          className={`${iconClass} bg-orange-600 rounded flex items-center justify-center`}
        >
          🌮
        </div>
      );
    case "abstract global wallet":
      return (
        <div
          className={`${iconClass} bg-green-500 rounded flex items-center justify-center`}
        >
          🌐
        </div>
      );
    case "safewallet":
      return (
        <div
          className={`${iconClass} bg-gray-600 rounded flex items-center justify-center`}
        >
          🔒
        </div>
      );
    case "injected":
      return (
        <div
          className={`${iconClass} bg-yellow-600 rounded flex items-center justify-center`}
        >
          💳
        </div>
      );
    default:
      return (
        <div
          className={`${iconClass} bg-gray-600 rounded flex items-center justify-center`}
        >
          👛
        </div>
      );
  }
}
