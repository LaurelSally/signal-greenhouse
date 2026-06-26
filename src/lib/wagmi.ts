import { coinbaseWallet } from "wagmi/connectors";
import { base } from "wagmi/chains";
import { createConfig, http, injected } from "wagmi";
import type { Address, Hex } from "viem";

export const baseAppId: string = "6a3e1ae283b1b97823e06e87";
export const attributionDataSuffix =
  "0x62635f687a30636c3071620b0080218021802180218021802180218021" as Hex;
export const signalGreenhouseAddress =
  "0x7843eab17eb896a2c497b0770247506c7680ad02" as Address;

export const isContractConfigured =
  signalGreenhouseAddress !== "0x0000000000000000000000000000000000000000";

export const isAttributionConfigured =
  baseAppId !== "REPLACE_WITH_BASE_DEV_VERIFY_TOKEN" &&
  attributionDataSuffix !== "0x";

export const config = createConfig({
  chains: [base],
  dataSuffix: attributionDataSuffix,
  connectors: [
    injected({
      shimDisconnect: true,
      unstable_shimAsyncInject: 500,
    }),
    coinbaseWallet({
      appName: "Signal Greenhouse",
      preference: "all",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
