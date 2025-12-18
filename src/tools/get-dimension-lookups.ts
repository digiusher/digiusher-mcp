import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";

// Define schema
export const schema = {
  organization_id: z.string().uuid().describe("The organization ID to query dimension lookups for"),
  bearer_token: z.string().describe("Bearer token for API authentication"),
  include_pools: z.boolean().default(true).optional().describe("Include pool lookups in the response"),
  include_data_sources: z.boolean().default(true).optional().describe("Include data source lookups in the response")
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get_dimension_lookups",
  description: "Retrieve lookup tables to translate dimension IDs to display values for expenses data",
  annotations: {
    title: "Get Dimension Lookups",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true
  }
};

// Tool implementation
export default async function get_dimension_lookups(params: InferSchema<typeof schema>) {
  const { organization_id, bearer_token, include_pools = true, include_data_sources = true } = params;

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("include_pools", String(include_pools));
    queryParams.append("include_data_sources", String(include_data_sources));

    const response = await fetch(
      `https://app.digiusher.com/api/v3/organizations/${organization_id}/expenses/dimensions/lookups?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${bearer_token}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch dimension lookups: ${error.message}`);
    }
    throw new Error("Failed to fetch dimension lookups: Unknown error");
  }
}
