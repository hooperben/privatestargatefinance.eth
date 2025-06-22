import { PrivateStargateFinance__factory } from "@/typechain-types";
import hre, { ethers } from "hardhat";

async function main() {
  const [Deployer] = await ethers.getSigners();

  const browserWallet = "0x6FDEF162eA4212D173D72EA29492077FC7567821";

  const contract = new ethers.Contract(
    "0xA91C4C647733f9a8D4e195f1353d94B7Edd63A79",
    PrivateStargateFinance__factory.abi,
    Deployer,
  );

  const role = await contract.DEPOSIT_ROLE();

  console.log(role);

  const tx = await contract.grantRole(role, browserWallet);

  console.log("tx:", tx);

  console.log("done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
