import { getTestingAPI } from "@/helpers/get-testing-api";
import { FourDEC, OFT, PrivateStargateFinance, USDC } from "@/typechain-types";
import { parseEther } from "ethers";
import { expect } from "chai";

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

    await usdcDeployment.approve(
      await privateStargateFinance.getAddress(),
      amount,
    );
    await privateStargateFinance.decimalCheck(
      amount,
      await usdcDeployment.getAddress(),
    );

    await lzOFTDeploymentBase.approve(
      await privateStargateFinance.getAddress(),
      parseEther("10"),
    );
    await privateStargateFinance.decimalCheck(
      amount,
      await lzOFTDeploymentBase.getAddress(),
    );

    const balanceBefore = await fourDecDeployment.balanceOf(
      await privateStargateFinance.getAddress(),
    );

    await fourDecDeployment.approve(
      await privateStargateFinance.getAddress(),
      10_0000n,
    );
    await privateStargateFinance.decimalCheck(
      amount,
      await fourDecDeployment.getAddress(),
    );

    const balanceAfter = await fourDecDeployment.balanceOf(
      await privateStargateFinance.getAddress(),
    );

    expect(balanceBefore).eq(balanceAfter - 10_0000n);
  });
});
