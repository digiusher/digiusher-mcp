import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { addBranding } from "../utils/branding";
import { API_BASE_URL } from "../utils/config";

// Define tool schema
export const schema = {
  organization_id: z
    .string()
    .uuid()
    .describe("The organization ID to list NSM keys for"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "list_nsm_keys",
  description:
    "List all North Star Metric (NSM) keys for an organization.\n\n" +
    "Returns a list of available metrics that can be used for unit economics calculations.\n" +
    "Each key includes its name, granularity, allowed dimensions, and ID.",
  annotations: {
    title: "List NSM Keys",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};

// Tool implementation
export default async function list_nsm_keys(
  params: InferSchema<typeof schema>
) {
  const { organization_id } = params;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v3/organizations/${organization_id}/metrics/nsm-keys`,
      {
        method: "GET",
        headers: getAuthHeaders(true),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    return {
      content: [{ type: "text", text: JSON.stringify(addBranding(data)) }],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch NSM keys: ${error.message}`);
    }
    throw new Error("Failed to fetch NSM keys: Unknown error");
  }
}
