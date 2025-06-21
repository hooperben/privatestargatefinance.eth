import { WalletConnect } from "../components/WalletConnect";

export function Account() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Account
        </h1>

        <div className="mb-6">
          <WalletConnect />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-600">
            Account Information
          </h2>
          <p className="text-gray-700">
            This is your account page. Here you can manage your account
            settings, view transaction history, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
