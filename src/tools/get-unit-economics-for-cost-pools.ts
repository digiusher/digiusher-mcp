import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { addBranding } from "../utils/branding";
import { API_BASE_URL } from "../utils/config";

// Dimension filter schema
const dimensionFilterSchema = z
  .object({
    dimension: z
      .string()
      .describe("Dimension key to filter by (e.g., 'team_id', 'environment')"),
    values: z.array(z.string()).min(1).describe("Dimension values to include"),
  })
  .describe("Filter NSM values by a specific dimension");

// Define tool schema
export const schema = {
  organization_id: z
    .string()
    .uuid()
    .describe("The organization ID to query unit economics for"),
  start_date: z
    .string()
    .describe("Start date - must be first day of month (YYYY-MM-01)"),
  end_date: z
    .string()
    .describe("End date (inclusive) - must be last day of month (YYYY-MM-DD)"),
  nsm_key_id: z
    .string()
    .uuid()
    .describe("NSM key to use for unit economics calculation"),
  view: z
    .enum(["showback", "chargeback"])
    .optional()
    .default("showback")
    .describe(
      "Cost allocation view. 'showback' uses initial pool allocations, 'chargeback' includes cross-pool reallocations."
    ),
  pool_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .describe(
      "Filter to a specific pool. Recommended when the NSM is pool-specific."
    ),
  group_by: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Dimension to break down cost attribution by. Without group_by: you get cost_per_unit per pool. With group_by='team_id': each pool additionally includes a dimension_breakdown showing each team's share and allocated cost. Must be in the NSM key's allowed_dimensions."
    ),
  filters: z
    .array(dimensionFilterSchema)
    .optional()
    .nullable()
    .describe(
      "Filter NSM values by dimension values before calculation. Filtering to 2 of 3 teams reduces the NSM denominator, which increases cost_per_unit. Pool costs are unaffected."
    ),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get_unit_economics_for_cost_pools",
  description:
    "Calculate cost per unit of business value by combining pool costs with NSM (North Star Metric) values.\n\n" +
    "**Key Features:**\n" +
    "- Combines cost data with metric data to derive unit cost (e.g., Cost per API Request)\n" +
    "- Supports both showback (direct) and chargeback (allocations included) views\n" +
    "- Optional dimension breakdown using `group_by`\n" +
    "- Filtering capabilities on metric dimensions\n\n" +
    "**Usage Tips:**\n" +
    "- Use `pool_id` when the NSM is specific to a single pool (e.g., 'api_requests' for a specific compute pool)\n" +
    "- Use `group_by` to see how costs are attributed across a dimension (e.g., 'team_id')" +
    "- Valid `group_by` values must be in the NSM key's `allowed_dimensions`",
  annotations: {
    title: "Get Unit Economics for Cost Pools",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true, // Requires knowledge of NSM keys and Pool IDs
  },
};

// Tool implementation
export default async function get_unit_economics_for_cost_pools(
  params: InferSchema<typeof schema>
) {
  const { organization_id, ...requestBody } = params;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v3/organizations/${organization_id}/kpis/unit-economics`,
      {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(requestBody),
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
      throw new Error(`Failed to fetch unit economics: ${error.message}`);
    }
    throw new Error("Failed to fetch unit economics: Unknown error");
  }
}
