import { Link, useLocation } from "react-router-dom";

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md mb-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center space-x-8 py-4">
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
        </div>
      </div>
    </nav>
  );
}
