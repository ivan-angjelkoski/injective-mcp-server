# Injective MCP Server

## Instalation

1. Make sure you have Node installed
2. npm install
3. npm run build
4. Add the MCP Server to your client. Example for Claude below.

## Claude Instalation

code ~/Library/Application\ Support/Claude/claude_desktop_config.json

```
{
    "mcpServers": {
        "injective-mcp-server": {
            "command": "node",
            "args": [
                "/ABSOLUTE/PATH/TO/PARENT/FOLDER/injective-mcp-server/build/index.js"
            ]
        }
    }
}
```
