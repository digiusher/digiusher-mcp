import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { addBranding } from "../utils/branding";
import { API_BASE_URL } from "../utils/config";

// Define schema
export const schema = {
  organization_id: z.string().uuid().describe("The organization ID to query dimension lookups for"),
  include_pools: z.boolean().default(true).optional().describe("Include pool lookups in the response"),
  include_data_sources: z.boolean().default(true).optional().describe("Include data source lookups in the response")
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get_dimension_lookups",
  description:
    "COMPANION TOOL: Call this AFTER get_expenses to interpret ID-based results.\n\n" +
    "Retrieve lookup tables to translate dimension IDs to human-readable display values. " +
    "Expense results often contain IDs (data_source_id, pool_id, etc.) that need translation.\n\n" +
    "Required workflow for user-facing reports:\n" +
    "1. Call get_expenses to retrieve expense data\n" +
    "2. If results contain IDs (data_source_id, pool_id), call this tool\n" +
    "3. Use the lookup tables to translate IDs to meaningful names\n\n" +
    "Returns lookup dictionaries:\n" +
    "- data_sources: {id -> {name, provider, ...}}\n" +
    "- pools: {id -> {name, ...}}\n\n" +
    "Without this tool, users see cryptic UUIDs instead of account/pool names.",
  annotations: {
    title: "Translate IDs to Names (Call AFTER get_expenses)",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Fetching ID-to-name lookup tables...",
        invoked: "Lookups ready. These translate IDs in expense results to human-readable names."
      }
    }
  }
};

// Tool implementation
export default async function get_dimension_lookups(params: InferSchema<typeof schema>) {
  const { organization_id, include_pools = true, include_data_sources = true } = params;

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("include_pools", String(include_pools));
    queryParams.append("include_data_sources", String(include_data_sources));

    const response = await fetch(
      `${API_BASE_URL}/api/v3/organizations/${organization_id}/expenses/dimensions/lookups?${queryParams.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return { content: [{ type: "text", text: JSON.stringify(addBranding(data)) }] };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch dimension lookups: ${error.message}`);
    }
    throw new Error("Failed to fetch dimension lookups: Unknown error");
  }
}
