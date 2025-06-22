import { DepositProofGenerateButton } from "../components/DepositProofButton";
import { TransferProofButton } from "../components/TransferProofButton";
import { WarpButton } from "../components/WarpButton";
import { WithdrawButton } from "../components/WithdrawButton";

export function Proving() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Proving Noir Circuits
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">
              Deposit
            </h2>
            <DepositProofGenerateButton />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">
              Transfer
            </h2>
            <TransferProofButton />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">Warp</h2>
            <WarpButton />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">
              Withdraw
            </h2>
            <WithdrawButton />
          </div>
        </div>
      </div>
    </div>
  );
}
