import { PrivateStargateFinance__factory } from "@/typechain-types";
import { zeroPadValue } from "ethers";
import hre, { ethers } from "hardhat";

export const BASE_EID = 30184; // 8453
export const ARB_EID = 30110; // 42161

async function main() {
  const [Deployer] = await ethers.getSigners();

  const contract = new ethers.Contract(
    "0xA91C4C647733f9a8D4e195f1353d94B7Edd63A79",
    PrivateStargateFinance__factory.abi,
    Deployer,
  );

  const remoteEID = hre.network.name !== "arbitrumOne" ? ARB_EID : BASE_EID;

  const tx = await contract.setPeer(
    remoteEID,
    zeroPadValue("0xA91C4C647733f9a8D4e195f1353d94B7Edd63A79", 32),
  );

  console.log("tx: ", tx);

  console.log("done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
