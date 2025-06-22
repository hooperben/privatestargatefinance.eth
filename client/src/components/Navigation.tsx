import { Link, useLocation } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";

export function Navigation() {
  const location = useLocation();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md mb-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Home
            </Link>
            <Link
              to="/account"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/account")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Account
            </Link>
            <Link
              to="/contacts"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/contacts")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Contacts
            </Link>
            {/* <Link
              to="/notes"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/notes")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Notes
            </Link>
            <Link
              to="/tree-test"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/tree-test")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Tree Test
            </Link> */}
          </div>

          {isConnected && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <button
                onClick={() => disconnect()}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
