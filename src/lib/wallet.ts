import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrivateKey } from "@injectivelabs/sdk-ts";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type IMcpWallet = {
  injectiveAddress: string;
  privateKey: string;
};

class McpWallet {
  private _wallet?: IMcpWallet;

  private getWalletPath() {
    // Goes up from src/lib/ to project root
    return path.join(__dirname, "..", "..", "wallet.json");
  }

  readWallets() {
    if (!this._wallet) {
      try {
        const data = fs.readFileSync(this.getWalletPath(), "utf8");
        this._wallet = JSON.parse(data);
      } catch (error) {
        console.error("Error reading wallet file:", error);
        this._wallet = undefined;
      }
    }

    return this._wallet;
  }

  createWallet() {
    const privateKey = PrivateKey.generate();

    const wallet: IMcpWallet = {
      injectiveAddress: privateKey.privateKey.toBech32(),
      privateKey: privateKey.privateKey.toPrivateKeyHex(),
    };

    fs.writeFileSync(this.getWalletPath(), JSON.stringify(wallet), {
      encoding: "utf-8",
    });

    this._wallet = wallet;

    return wallet;
  }

  getInjectiveAddress() {
    this.readWallets();

    return this._wallet?.injectiveAddress;
  }

  getPrivateKeyHex() {
    this.readWallets();

    return this._wallet?.privateKey;
  }
}

export const mcpWallet = new McpWallet();
