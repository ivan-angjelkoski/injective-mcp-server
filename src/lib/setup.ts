import {
  getNetworkChainInfo,
  getNetworkEndpoints,
  Network,
} from "@injectivelabs/networks";

const argv = (() => {
  const args = process.argv.slice(2);

  const networkIndex = args.indexOf("--network");

  let network = Network.Mainnet;

  if (networkIndex !== -1 && args[networkIndex + 1]) {
    const value = args[networkIndex + 1];

    if (
      [Network.Mainnet, Network.Testnet, Network.Devnet].includes(
        value as Network
      )
    ) {
      network = value as Network;
    }
  }

  return { network };
})();

export const INJECTIVE_NETWORK = argv.network;

const ethereumChainIdMap: Partial<Record<Network, number>> = {
  [Network.Mainnet]: 1,
  [Network.Testnet]: 11155111,
  [Network.Devnet]: 11155111,
};

export const INJECTIVE_CHAIN_ID =
  getNetworkChainInfo(INJECTIVE_NETWORK).chainId;

export const ETHEREUM_CHAIN_ID = ethereumChainIdMap[INJECTIVE_NETWORK];

export const CLOUD_FRONT_URL = "https://d36789lqgasyke.cloudfront.net";

export const INJECTIVE_NETWORK_ENDPOINTS =
  getNetworkEndpoints(INJECTIVE_NETWORK);
