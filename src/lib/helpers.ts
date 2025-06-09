import { Network } from "@injectivelabs/networks";
import { INJECTIVE_NETWORK } from "./setup.js";

export const getExplorerTxUrl = (txHash: string) => {
  switch (INJECTIVE_NETWORK) {
    case Network.Mainnet:
      return `https://www.injscan.com/transaction/${txHash}`;
    case Network.Testnet:
      return `https://testnet.explorer.injective.network/transaction/${txHash}`;
    case Network.Devnet:
      return `https://testnet.explorer.injective.network/transaction/${txHash}`;
  }
};
