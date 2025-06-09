import { z } from "zod";
import { BigNumberInWei } from "@injectivelabs/utils";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { indexerGrpcAccountPortfolioApi } from "../injective/index.js";
import { mcpWallet } from "../lib/wallet.js";
import { InjectiveAssetsClient } from "../lib/injective_assets_client.js";
import Fuse from "fuse.js";
import {
  getDefaultSubaccountId,
  GrpcOrderTypeMap,
  MsgBroadcasterWithPk,
  MsgSend,
  spotPriceToChainPriceToFixed,
  spotQuantityToChainQuantityToFixed,
} from "@injectivelabs/sdk-ts";
import { broadcaster } from "../lib/broadcaster.js";
import { BigNumberInBase } from "@injectivelabs/utils";
import { getExplorerTxUrl } from "../lib/helpers.js";
import { MsgCreateSpotMarketOrder } from "@injectivelabs/sdk-ts";
import { OrderSide } from "@injectivelabs/ts-types";
import { MsgCreateSpotLimitOrder } from "@injectivelabs/sdk-ts";

export function setupTools(
  server: McpServer,
  assetsClient: InjectiveAssetsClient
) {
  server.tool(
    "get-wallet-address",
    "Get the Injective wallet address of the user",
    {},
    async () => {
      const address = mcpWallet.getInjectiveAddress();

      if (!address) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "No wallet found, please create a wallet first",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Injective Address: ${address}`,
          },
        ],
      };
    }
  );

  server.tool(
    "create-wallet",
    "Create a new Injective wallet",
    {
      override: z.boolean().optional().describe("Override the existing wallet"),
    },
    async ({ override }) => {
      const existingAddress = mcpWallet.getInjectiveAddress();

      if (existingAddress && !override) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Wallet already exists, use the 'override' flag to override the existing wallet, \n\nExisting Injective Address: ${existingAddress}`,
            },
          ],
        };
      }

      try {
        mcpWallet.createWallet();

        const injectiveAddress = mcpWallet.getInjectiveAddress()!;

        return {
          content: [
            {
              type: "text",
              text: `Wallet created successfully, \n\nInjective Address: ${injectiveAddress}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: Failed to create wallet, ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "check-wallet-balance",
    "Check the balance of an Injective Address",
    {
      address: z.string().describe("The address to check"),
    },
    async ({ address }) => {
      const { bankBalancesList } =
        await indexerGrpcAccountPortfolioApi.fetchAccountPortfolio(address);

      const bankBalancesFormatted = bankBalancesList.map(
        ({ amount, denom }) => {
          const token = assetsClient.tokens.find(
            (token) => token.denom === denom
          );

          if (!token) {
            return "";
          }

          const amountFormatted = new BigNumberInWei(amount)
            .toBase(token.decimals)
            .toFormat();

          return `Name: ${token?.name}, Symbol: ${token.symbol},Denom: ${denom}, Amount: ${amountFormatted}`;
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `${bankBalancesFormatted.filter(Boolean).join("\n\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "search-tokens",
    "Search for a token by name or symbol, and return the token details/metadata needed to make transactions",
    {
      query: z
        .string()
        .describe(
          "The token name or symbol to search for. \nExample: INJ, Injective, USDT, USDC, ETH, Bitcoin, Solana, etc\n\n"
        ),
    },
    async ({ query }) => {
      const fuse = new Fuse(assetsClient.tokens, {
        distance: 1,
        keys: [
          { name: "name", weight: 1 },
          { name: "symbol", weight: 2 },
          { name: "denom", weight: 3 },
        ],
        threshold: 0.2,
        useExtendedSearch: true,
      });

      const tokens = fuse.search(query, { limit: 5 });

      if (!tokens.length) {
        return {
          isError: true,
          content: [{ type: "text", text: "No token found" }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tokens, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "search-spot-markets",
    "Search for a spot market by slug or symbo, and return the market details/metadata needed to make transactions or get additional data as the market chart",
    {
      query: z
        .string()
        .describe(
          "The market slug or ticker to search for. \nExample: 'inj/usdt', 'weth/usdt', etc\n\n"
        ),
    },
    async ({ query }) => {
      const fuse = new Fuse(assetsClient.spotMarkets, {
        distance: 1,
        keys: ["ticker"],
        threshold: 0.2,
      });

      const markets = fuse.search(query, { limit: 5 });

      if (!markets.length) {
        return {
          isError: true,
          content: [{ type: "text", text: "No market found" }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(markets, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "send-funds",
    "Send funds to an Injective Address, it returns the tx hash and a link to the InjScan explorer",
    {
      address: z.string().describe("The address to send funds to"),
      amount: z.string().describe("The amount of the token to send"),
      denom: z.string().describe("The denom of the token to send"),
    },
    async ({ address, amount, denom }) => {
      const injectiveAddress = mcpWallet.getInjectiveAddress();

      if (!injectiveAddress) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "No wallet found, please create a wallet first",
            },
          ],
        };
      }

      const token = assetsClient.tokens.find((token) => token.denom === denom);

      if (!token) {
        return {
          isError: true,
          content: [{ type: "text", text: "Token not found" }],
        };
      }

      const msg = MsgSend.fromJSON({
        amount: {
          amount: new BigNumberInBase(amount).toWei(token.decimals).toFixed(),
          denom,
        },
        dstInjectiveAddress: address,
        srcInjectiveAddress: injectiveAddress,
      });

      const privateKey = mcpWallet.getPrivateKeyHex();

      if (!privateKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "No private key found" }],
        };
      }

      try {
        const { txHash } = await broadcaster({
          msgs: [msg],
          privateKey,
        });

        return {
          content: [
            {
              type: "text",
              text: `Transaction sent successfully, \n\nTx Hash: ${txHash} \n\nView on InjScan: ${getExplorerTxUrl(
                txHash
              )}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error sending transaction, ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "trade-spot-market",
    "Buy and sell on a spot market. Create a market order or a limit order",
    {
      ticker: z
        .string()
        .describe("The ticker of the market to trade, example: 'inj/usdt'"),
      side: z
        .enum(["buy", "sell"])
        .describe("The side of the order, buy or sell"),
      quantity: z.string().describe("The amount of the token to trade"),
      price: z
        .string()
        .optional()
        .describe(
          "The price of the token to trade, only required for limit orders"
        ),
      type: z
        .enum(["market", "limit"])
        .describe("The type of the order, market or limit"),
    },
    async ({ quantity, side, ticker, type, price }) => {
      const injectiveAddress = mcpWallet.getInjectiveAddress();

      if (!injectiveAddress) {
        return {
          isError: true,
          content: [{ type: "text", text: "No wallet found" }],
        };
      }

      const market = assetsClient.spotMarkets.find(
        (market) => market.ticker.toLowerCase() === ticker.toLowerCase()
      );

      if (!market) {
        return {
          isError: true,
          content: [{ type: "text", text: "Market not found" }],
        };
      }

      const subaccountId = getDefaultSubaccountId(injectiveAddress);

      const priceToFixed = spotPriceToChainPriceToFixed({
        value: price ?? "0",
        baseDecimals: market.baseToken?.decimals ?? 0,
        quoteDecimals: market.quoteToken?.decimals ?? 0,
      });

      const quantityToFixed = spotQuantityToChainQuantityToFixed({
        value: quantity,
        baseDecimals: market.baseToken?.decimals ?? 0,
      });

      let orderType =
        type === "market" ? MsgCreateSpotMarketOrder : MsgCreateSpotLimitOrder;

      const msg = orderType.fromJSON({
        price: priceToFixed,
        injectiveAddress,
        marketId: market.marketId,
        subaccountId,
        quantity: quantityToFixed,
        feeRecipient: injectiveAddress,
        orderType: (side === "buy"
          ? GrpcOrderTypeMap.BUY
          : GrpcOrderTypeMap.SELL) as any,
      });

      const privateKey = mcpWallet.getPrivateKeyHex();

      if (!privateKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "No private key found" }],
        };
      }

      try {
        const { txHash } = await broadcaster({
          msgs: [msg],
          privateKey,
        });

        return {
          content: [
            {
              type: "text",
              text: `Transaction sent successfully, \n\nTx Hash: ${txHash} \n\nView on InjScan: ${getExplorerTxUrl(
                txHash
              )}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error sending transaction, ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );
}
