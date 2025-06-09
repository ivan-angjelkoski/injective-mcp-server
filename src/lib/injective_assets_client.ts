import { Network } from "@injectivelabs/networks";
import {
  DerivativeMarket,
  SpotMarket,
  TokenStatic,
} from "@injectivelabs/sdk-ts";

export class InjectiveAssetsClient {
  endpoint: string;
  network: Network;

  tokens: TokenStatic[] = [];
  spotMarkets: SpotMarket[] = [];
  derivativeMarkets: DerivativeMarket[] = [];

  constructor(endpoint: string, network: Network = Network.Mainnet) {
    this.endpoint = endpoint;
    this.network = network;

    this.tokens = [];
    this.spotMarkets = [];
    this.derivativeMarkets = [];
  }

  async fetchTokens() {
    const response = await fetch(
      `${this.endpoint}/json/tokens/verified/${this.network}.json`
    );

    const tokens = (await response.json()) as TokenStatic[];

    this.tokens = tokens;

    return tokens;
  }

  async fetchSpotMarkets() {
    const response = await fetch(
      `${this.endpoint}/json/market/spot/${this.network}.json`
    );

    const spotMarkets = (await response.json()) as SpotMarket[];

    this.spotMarkets = spotMarkets;

    return spotMarkets;
  }

  async fetchDerivativeMarkets() {
    const response = await fetch(
      `${this.endpoint}/json/market/derivative/${this.network}.json`
    );

    const derivativeMarkets = (await response.json()) as DerivativeMarket[];

    this.derivativeMarkets = derivativeMarkets;

    return derivativeMarkets;
  }
}
