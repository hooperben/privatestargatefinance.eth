export function Readings() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Readings & Documentation
        </h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">
            Learn About Private Stargate Finance
          </h2>

          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                What is Private Stargate Finance?
              </h3>
              <p className="text-gray-600">
                Private Stargate Finance is a privacy-focused cross-chain
                protocol that enables confidential transfers and interactions
                across multiple blockchains using zero-knowledge proofs.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Key Features
              </h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Private cross-chain transfers</li>
                <li>• Zero-knowledge proof technology</li>
                <li>• Multi-chain support</li>
                <li>• Confidential transaction history</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Getting Started
              </h3>
              <p className="text-gray-600">
                Connect your wallet and start making private transactions across
                supported chains. Your transaction history and balances remain
                confidential while maintaining full blockchain security.
              </p>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 italic">
                This is a placeholder page. More detailed documentation and
                resources will be added here in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
