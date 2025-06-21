import { ethers } from "hardhat";
import { type DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async (hre) => {
  const { deployments } = hre;

  const { deploy } = deployments;

  const [Deployer] = await ethers.getSigners();

  console.log("Deployer: ", Deployer.address);

  // Deploy DepositVerifier
  const depositVerifier = await deploy("DepositVerifier", {
    from: Deployer.address,
    log: true,
  });
  console.log("DepositVerifier deployed to:", depositVerifier.address);

  // Deploy TransferVerifier
  const transferVerifier = await deploy("TransferVerifier", {
    from: Deployer.address,
    log: true,
  });
  console.log("TransferVerifier deployed to:", transferVerifier.address);

  // Deploy WithdrawVerifier
  const withdrawVerifier = await deploy("WithdrawVerifier", {
    from: Deployer.address,
    log: true,
  });
  console.log("WithdrawVerifier deployed to:", withdrawVerifier.address);

  // Deploy WarpVerifier
  const warpVerifier = await deploy("WarpVerifier", {
    from: Deployer.address,
    log: true,
  });
  console.log("WarpVerifier deployed to:", warpVerifier.address);
};

deploy.tags = ["verifiers"];

export default deploy;
