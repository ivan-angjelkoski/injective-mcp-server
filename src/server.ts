import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupTools } from "./tools/index.js";
import { CLOUD_FRONT_URL, INJECTIVE_NETWORK } from "./lib/setup.js";
import { InjectiveAssetsClient } from "./lib/injective_assets_client.js";

export class InjectiveMcpServer {
  private readonly server: McpServer;
  private readonly assetsClient: InjectiveAssetsClient;

  constructor() {
    this.server = new McpServer({
      name: "injective-mcp-server",
      version: "1.0.0",
    });

    this.assetsClient = new InjectiveAssetsClient(
      CLOUD_FRONT_URL,
      INJECTIVE_NETWORK
    );

    setupTools(this.server, this.assetsClient);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    await Promise.all([
      this.assetsClient.fetchTokens(),
      this.assetsClient.fetchSpotMarkets(),
      this.assetsClient.fetchDerivativeMarkets(),
    ]);
  }
}
