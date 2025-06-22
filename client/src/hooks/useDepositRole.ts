import { useAccount, useReadContracts } from "wagmi";
import { OAPP_ADDRESS } from "../constants";

// ABI for the functions we need
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "DEPOSIT_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useDepositRole() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: OAPP_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "DEPOSIT_ROLE",
      },
      {
        address: OAPP_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "hasRole",
        args: [
          // We need the DEPOSIT_ROLE result first, so we'll handle this differently
          "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
          (address ||
            "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
        ],
      },
    ],
    query: {
      enabled: isConnected && !!address,
    },
  });

  // We need to make a second call once we have the DEPOSIT_ROLE
  const depositRole = data?.[0]?.result as `0x${string}` | undefined;

  const { data: hasRoleData, isLoading: hasRoleLoading } = useReadContracts({
    contracts: [
      {
        address: OAPP_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "hasRole",
        args: [
          depositRole ||
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          (address ||
            "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
        ],
      },
    ],
    query: {
      enabled: isConnected && !!address && !!depositRole,
    },
  });

  const hasDepositRole = hasRoleData?.[0]?.result as boolean | undefined;
  const loading = isLoading || hasRoleLoading;

  return {
    hasDepositRole: hasDepositRole ?? false,
    loading,
    error: error?.message || null,
  };
}
