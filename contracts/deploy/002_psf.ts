import { ethers } from "hardhat";
import { type DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async (hre) => {
  const { deployments } = hre;

  const { deploy } = deployments;

  const [Deployer] = await ethers.getSigners();

  console.log("Deployer: ", Deployer.address);

  const depositVerifier = await deployments.get("DepositVerifier");
  const withdrawVerifier = await deployments.get("WithdrawVerifier");
  const warpVerifier = await deployments.get("WarpVerifier");
  const transferVerifier = await deployments.get("TransferVerifier");

  console.log("DepositVerifier address:", depositVerifier.address);
  console.log("WithdrawVerifier address:", withdrawVerifier.address);
  console.log("WarpVerifier address:", warpVerifier.address);
  console.log("TransferVerifier address:", transferVerifier.address);

  await deploy("PrivateStargateFinance", {
    from: Deployer.address,
    log: true,
    skipIfAlreadyDeployed: true,
    args: [
      "0x1a44076050125825900e736c501f859c50fE728c", // same for arb and base
      Deployer.address,
      depositVerifier.address,
      transferVerifier.address,
      withdrawVerifier.address,
      warpVerifier.address,
    ],
  });
};

deploy.tags = ["psf"];

export default deploy;
