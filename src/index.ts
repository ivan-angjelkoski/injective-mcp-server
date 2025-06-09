import { InjectiveMcpServer } from "./server.js";

async function main() {
  const server = new InjectiveMcpServer();

  await server.run();
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
