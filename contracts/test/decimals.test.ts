import { getTestingAPI } from "@/helpers/get-testing-api";
import { FourDEC, OFT, PrivateStargateFinance, USDC } from "@/typechain-types";

describe("Testing deposit functionality", () => {
  let privateStargateFinance: PrivateStargateFinance;
  let usdcDeployment: USDC;
  let lzOFTDeploymentBase: OFT;
  let fourDecDeployment: FourDEC;

  beforeEach(async () => {
    ({
      usdcDeployment,
      privateStargateFinance,
      lzOFTDeploymentBase,
      fourDecDeployment,
    } = await getTestingAPI());
  });

  it.only("testing decimal change", async () => {
    const amount = 10_000_000n; // 10 with 6 decimals
    await privateStargateFinance.decimalCheck(
      amount,
      await usdcDeployment.getAddress(),
    );

    await privateStargateFinance.decimalCheck(
      amount,
      await lzOFTDeploymentBase.getAddress(),
    );

    await privateStargateFinance.decimalCheck(
      amount,
      await fourDecDeployment.getAddress(),
    );
  });
});
