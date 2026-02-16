# Adding New Tools to DigiUsher MCP

This guide explains how to add new tools to the DigiUsher MCP server. The project uses `xmcp` for automatic tool discovery and simplified definition.

## 📂 Tool Location

All tools are located in `src/tools/`.
*   Each tool should be a separate `.ts` file.
*   The file name should be kebab-case (e.g., `my-new-tool.ts`).
*   `xmcp` automatically discovers and registers any valid tool file in this directory.

## 🏗️ Tool Structure

A valid tool file must export three things:
1.  `schema`: A Zod schema defining the input parameters.
2.  `metadata`: A `ToolMetadata` object describing the tool.
3.  `default` function: The async function that implements the logic.

### Template

```typescript
import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { addBranding } from "../utils/branding";
import { API_BASE_URL } from "../utils/config";

// 1. Define Input Schema
export const schema = {
  organization_id: z.string().uuid().describe("The organization ID"),
  // Add other parameters here
  example_param: z.string().describe("Description of the parameter"),
};

// 2. Define Metadata
export const metadata: ToolMetadata = {
  name: "my_new_tool", // snake_case name used by LLMs to call the tool
  description:
    "A clear, concise description of what the tool does.\n\n" +
    "Include details about when valid inputs are required and what the tool returns.",
  annotations: {
    title: "My New Tool Title",
    readOnlyHint: true, // true if it doesn't modify state
    destructiveHint: false, // true if it deletes/modifies critical data
    idempotentHint: true, // true if calling multiple times has same effect
  },
};

// 3. Implement Logic
export default async function my_new_tool(params: InferSchema<typeof schema>) {
  const { organization_id, example_param } = params;

  try {
    // perform actions (e.g., fetch from API)
    const response = await fetch(`${API_BASE_URL}/some-endpoint`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Return content
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(addBranding(data)),
        },
      ],
    };
  } catch (error) {
    // Handle errors according to best practices
      if (error instanceof Error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
    throw new Error("Tool execution failed: Unknown error");
  }
}
```

## 📝 Best Practices

### Schema Definition
*   **Use `z.describe()`**: Every parameter MUST have a description. LLMs rely on this to understand what to pass.
*   **Validation**: Use Zod's validation features (e.g., `.uuid()`, `.min()`, `.max()`, `.email()`) to catch errors early.
*   **Enums**: Use `z.enum()` for parameters with a fixed set of allowed values.

### Metadata
*   **Name**: Use `snake_case` for the tool name.
*   **Description**: Be descriptive. Explain *when* to use the tool and *what* it returns.
*   **Annotations**: Set `readOnlyHint`, `destructiveHint`, etc., correctly to help clients handle the tool safely.

### Implementation
*   **Error Handling**: Wrap logic in `try-catch`. Throw clear `Error` objects with descriptive messages.
*   **Authentication**: Use `getAuthHeaders()` helper for API calls.
*   **Output**: Return JSON strings wrapped in `addBranding()` for consistent formatting.
*   **Type Safety**: Use `InferSchema<typeof schema>` to automatically infer the type of `params`.

## 🔄 Workflow

1.  **Create File**: Add `src/tools/my-new-tool.ts`.
2.  **Implement**: Copy the template and fill in your logic.
3.  **Test**: Restart the MCP server. The user (LLM) should now be able to see and use `my_new_tool`.
