import { IndexerGrpcAccountPortfolioApi } from "@injectivelabs/sdk-ts";
import { INJECTIVE_NETWORK_ENDPOINTS } from "../lib/setup.js";

export const indexerGrpcAccountPortfolioApi =
  new IndexerGrpcAccountPortfolioApi(INJECTIVE_NETWORK_ENDPOINTS.indexer);
