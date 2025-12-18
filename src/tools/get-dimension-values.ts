import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { API_BASE_URL } from "../utils/config";

// Constants for API constraints
const DIMENSION_VALUES_LIMIT_DEFAULT = 100;
const DIMENSION_VALUES_LIMIT_MAX = 1000000;
const DIMENSION_VALUES_SEARCH_MAX = 100;

// Standard dimension names enum (all 22 standard dimensions from API spec)
const standardDimensionNameEnum = z.enum([
  "service_name",
  "service_category",
  "resource_type",
  "resource_id",
  "region_id",
  "network_from",
  "network_to",
  "data_source_id",
  "provider",
  "publisher",
  "charge_category",
  "pricing_category",
  "license_model",
  "sku_name",
  "invoice_id",
  "invoice_issuer",
  "commitment_discount_type",
  "commitment_discount_category",
  "commitment_discount_id",
  "consumed_unit",
  "pool_id",
  "rule_id"
]);

// Dimension specification using discriminated union
const dimensionSpecSchema = z.discriminatedUnion("dimension_type", [
  // Standard dimension variant
  z
    .object({
      dimension_type: z.literal("standard").describe("Query a standard built-in dimension"),
      name: standardDimensionNameEnum.describe(
        "Standard dimension to query available values for. " +
          "Examples: 'service_name' for cloud services, 'region_id' for regions, " +
          "'provider' for cloud providers, 'charge_category' for charge types"
      )
    })
    .describe("Query values for a standard dimension like service_name, region_id, provider, resource_type, etc."),

  // Tag dimension variant
  z
    .object({
      dimension_type: z.literal("tag").describe("Query custom tag keys or values"),
      tag_type: z
        .enum(["keys", "values"])
        .describe(
          "Type of tag query:\n" +
            "  - 'keys': Returns all available tag keys in your organization\n" +
            "  - 'values': Returns all values for a specific tag key"
        ),
      key: z
        .string()
        .optional()
        .describe(
          "Tag key name. REQUIRED when tag_type='values' to specify which tag's values to query. " +
            "MUST BE OMITTED when tag_type='keys'. " +
            "Examples: 'Environment', 'Owner', 'Application', 'CostCenter'"
        )
    })
    .describe(
      "Query tag-related values. " +
        "Use tag_type='keys' to discover all available tag keys, " +
        "or tag_type='values' with a specific key to get all values for that tag."
    )
]);

// Main tool schema
export const schema = {
  organization_id: z.string().uuid().describe("The organization ID to query dimension values for"),

  dimension: dimensionSpecSchema.describe(
    "Dimension specification - either a standard dimension or a tag-based dimension. " +
      "Use 'standard' dimension_type for built-in dimensions like service_name, region_id, provider. " +
      "Use 'tag' dimension_type to query custom tag keys or values."
  ),

  search: z
    .string()
    .max(DIMENSION_VALUES_SEARCH_MAX)
    .optional()
    .describe(
      "Optional search term to filter returned values (max 100 characters). " +
        "Supports partial matching. " +
        "Examples: 'us-' to find US regions, 'prod' to find production-related values, 'EC2' to find EC2 services."
    ),

  limit: z
    .number()
    .min(1)
    .max(DIMENSION_VALUES_LIMIT_MAX)
    .default(DIMENSION_VALUES_LIMIT_DEFAULT)
    .describe(
      "Maximum number of values to return (1 to 1,000,000). Defaults to 100. " +
        "Use higher values to get comprehensive lists for reporting or analysis. " +
        "Response includes 'has_more' flag to indicate if more values are available."
    )
};

// Tool metadata
export const metadata: ToolMetadata = {
  name: "get_dimension_values",
  description:
    "PREREQUISITE TOOL: Call this BEFORE get_expenses when you need to filter by dimensions.\n\n" +
    "Query available values for any expense dimension (standard dimensions or custom tags). " +
    "Returns the EXACT values that exist in your data - never guess filter values.\n\n" +
    "Common workflow:\n" +
    "1. Call this tool to discover available values (e.g., service names, regions)\n" +
    "2. Use the returned values in get_expenses filters parameter\n\n" +
    "Examples:\n" +
    "- Before filtering by service: discover service_name values\n" +
    "- Before filtering by region: discover region_id values\n" +
    "- Before filtering by tags: discover tag keys first, then tag values\n\n" +
    "Supports search filtering and pagination for efficient value discovery.",
  annotations: {
    title: "Discover Valid Dimension Values (Call BEFORE get_expenses)",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Discovering available dimension values...",
        invoked: "Dimension values discovered. Use these exact values in get_expenses filters."
      }
    }
  }
};

// Tool implementation
export default async function get_dimension_values(params: InferSchema<typeof schema>) {
  const { organization_id, ...requestBody } = params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v3/organizations/${organization_id}/expenses/dimensions/query`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch dimension values: ${error.message}`);
    }
    throw new Error("Failed to fetch dimension values: Unknown error");
  }
}
