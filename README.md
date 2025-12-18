# Digiusher MCP Server

This project was created with [create-xmcp-app](https://github.com/basementstudio/xmcp) and provides MCP (Model Context Protocol) tools for interacting with the Digiusher expense management platform.

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Then run the development server:

```bash
pnpm dev
```

This will start the MCP server with hot reloading enabled.

## Building for Production

To build your project for production:

```bash
pnpm build
```

This will compile your TypeScript code and output it to the `dist` directory.

## Connecting to MCP Clients

After building the project, you can connect it to various MCP clients. The server uses STDIO transport for communication with MCP clients.

### Finding Your Node Executable Path

Most MCP clients require the absolute path to your Node.js executable. You can find it using:

**macOS/Linux:**

```bash
which node
```

**Windows (Command Prompt):**

```cmd
where node
```

**Windows (PowerShell):**

```powershell
Get-Command node | Select-Object -ExpandProperty Source
```

### Claude Desktop Configuration

Add this to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "digiusher": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/digiusher-mcp/dist/stdio.js"],
      "env": {
        "DIGIUSHER_TOKEN": "your_digiusher_api_token"
      }
    }
  }
}
```

### VS Code / Cline Configuration

Add this to your Cline MCP settings in VS Code:

**Settings path:** `.vscode/cline_mcp_settings.json` or Cline extension settings

```json
{
  "mcpServers": {
    "digiusher": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/digiusher-mcp/dist/stdio.js"],
      "env": {
        "DIGIUSHER_TOKEN": "your_digiusher_api_token"
      }
    }
  }
}
```

### Other MCP Clients

For other MCP clients, use this general configuration format:

```json
{
  "command": "/absolute/path/to/node",
  "args": ["/absolute/path/to/digiusher-mcp/dist/stdio.js"],
  "env": {
    "DIGIUSHER_TOKEN": "your_digiusher_api_token"
  }
}
```

### Configuration Notes

- Replace `/absolute/path/to/node` with the output from the `which node` (or `where node`) command
- Replace `/absolute/path/to/digiusher-mcp` with the actual path to this project directory
- Replace `your_digiusher_api_token` with your actual Digiusher API token
- **Security:** Never commit your API token to version control
- You can obtain your Digiusher API token from the Digiusher platform settings

## Project Structure

This project uses the structured approach where tools are automatically discovered from the tools directory:

- `src/tools` - Tool definitions for MCP

### Tools

Each tool is defined in its own file with the following structure:

```typescript
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The name of the user to greet")
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true
  }
};

export default function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
```

### Adding New Tools

To add a new tool:

1. Create a new `.ts` file in the `src/tools` directory
2. Export a `schema` object defining the tool parameters using Zod
3. Export a `metadata` object with tool information
4. Export a default function that implements the tool logic

The tool will be automatically discovered and registered by the xmcp framework.

## Development

Run the development server with hot reloading:

```bash
pnpm dev
```

## Running in Production

After building, you can start the STDIO server:

```bash
pnpm start-stdio
```

Or run it directly:

```bash
node dist/stdio.js
```

Note: For MCP client integration, you typically don't need to run this manually - the MCP client will start the server automatically using the configuration above.

## Learn More

- [xmcp Documentation](https://xmcp.dev/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)
