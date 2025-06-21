// Type definitions for Noir circuit
export interface NoirCircuit {
  bytecode: string;
  abi: {
    parameters: Array<{
      name: string;
      type: any;
      visibility: string;
    }>;
    return_type: any;
  };
  debug_symbols: any;
  file_map: any;
}

// Input parameters for the deposit circuit
export interface DepositCircuitInputs {
  hash: string;
  asset_id: string;
  asset_amount: string;
  owner: string;
  secret: string;
}
