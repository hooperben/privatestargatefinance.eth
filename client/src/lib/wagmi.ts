import { http, createConfig } from "wagmi";
import { mainnet, sepolia, arbitrum, optimism, polygon } from "wagmi/chains";
import {
  walletConnect,
  injected,
  coinbaseWallet,
  metaMask,
} from "wagmi/connectors";

// Get projectId from https://cloud.walletconnect.com
const projectId = "YOUR_PROJECT_ID";

export const config = createConfig({
  chains: [mainnet, sepolia, arbitrum, optimism, polygon],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: "Private Stargate Finance",
        description:
          "Private cross-chain transfers using zero-knowledge proofs",
        url: "https://privatestargatefinance.eth.limo",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
    }),
    coinbaseWallet({
      appName: "Private Stargate Finance",
      appLogoUrl: "https://avatars.githubusercontent.com/u/37784886",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
