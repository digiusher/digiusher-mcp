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
    .describe("The organization ID to query chargeback data for"),
  month: z
    .string()
    .describe(
      "Month to retrieve chargeback data for (YYYY-MM-DD format, any day in the month)"
    ),
  aggregate_flows: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Return aggregated flows (summed across services and dates) for Sankey visualization. " +
        "When true, flow_details will have service_name=None and date=None. " +
        "When false (default), returns detailed breakdown by service and date."
    ),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get_chargeback_for_month",
  description:
    "Get chargeback data for a specific month.\n\n" +
    "Returns persisted data if a completed run exists, otherwise computes on-the-fly. " +
    "Check is_final to distinguish: true for stored runs, false for computed runs.\n\n" +
    "Response includes:\n" +
    "- Chargeback run metadata (id, period, status, timestamps)\n" +
    "- Stages with allocation steps (data_source_to_rule, rule_to_pool, pool_to_pool)\n" +
    "- Flow details showing cost allocations between entities\n" +
    "- Pool snapshots for audit trail\n\n" +
    "Use aggregate_flows=true to get aggregated cost flows suitable for Sankey diagrams " +
    "(summed across service_name and date dimensions).",
  annotations: {
    title: "Get Chargeback for Month",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};

// Tool implementation
export default async function get_chargeback_for_month(
  params: InferSchema<typeof schema>
) {
  const { organization_id, month, aggregate_flows } = params;

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("month", month);
    if (aggregate_flows) {
      queryParams.append("aggregate_flows", "true");
    }

    const url = `${API_BASE_URL}/api/v3/organizations/${organization_id}/cost-allocation/month?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(true),
    });

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
      throw new Error(`Failed to fetch chargeback data: ${error.message}`);
    }
    throw new Error("Failed to fetch chargeback data: Unknown error");
  }
}
