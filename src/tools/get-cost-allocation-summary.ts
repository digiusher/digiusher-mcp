import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { addBranding } from "../utils/branding";
import { API_BASE_URL } from "../utils/config";

// NSM filter schema for unit economics
const nsmFilterSchema = z
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
    .describe("The organization ID to query cost allocation summary for"),
  start_date: z
    .string()
    .describe("Start date - must be first day of month (YYYY-MM-01)"),
  end_date: z
    .string()
    .describe("End date (inclusive) - must be last day of month (YYYY-MM-DD)"),
  view: z
    .enum(["showback", "chargeback"])
    .describe(
      "View type: 'showback' for cost visibility or 'chargeback' for cost allocation"
    ),
  granularity: z
    .enum(["day", "month"])
    .optional()
    .describe(
      "Time granularity for cost allocation summary ('day' or 'month')"
    ),
  include_service_breakdown: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include per-service breakdown in the response"),
  pool_id: z
    .string()
    .uuid()
    .optional()
    .describe("Filter results to a specific pool by ID"),
  include_incomplete: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Compute missing periods on-the-fly (marked with is_final=false). Generates provisional chargeback data that may change as final costs are calculated. May be slower."
    ),
  nsm_key_id: z
    .string()
    .uuid()
    .optional()
    .describe(
      "NSM key to use for unit economics calculations. When provided, triggers unit economics in response."
    ),
  group_by: z
    .string()
    .optional()
    .describe(
      "Dimension to group unit economics by (e.g., 'team_id', 'environment')"
    ),
  filters: z
    .array(nsmFilterSchema)
    .optional()
    .describe("Filter NSM values by dimension values before calculation"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get_cost_allocation_summary",
  description:
    "Get showback or chargeback summary across multiple periods.\n\n" +
    "Supports monthly or daily granularity for cost allocation summaries.\n\n" +
    "**Date Requirements:**\n" +
    "- start_date must be first day of month (YYYY-MM-01)\n" +
    "- end_date must be last day of month (YYYY-MM-DD)\n" +
    "- Supports single or multi-month ranges (e.g., 2025-01-01 to 2025-03-31)\n\n" +
    "**Provisional Data:**\n" +
    "- Chargeback data may be incomplete for recent periods\n" +
    "- include_incomplete=true computes missing periods on-the-fly (is_final=false)\n" +
    "- Provisional results are subject to change as final costs are calculated\n\n" +
    "**Response includes:**\n" +
    "- Period-level summaries with pool allocations\n" +
    "- Optional service breakdown per pool\n" +
    "- Optional unit economics with dimension breakdown\n\n" +
    "**Unit Economics (Optional):**\n" +
    "- Provide nsm_key_id to include unit economics calculations\n" +
    "- Use group_by to break down by dimension (e.g., 'team_id', 'environment')\n" +
    "- Use filters to filter NSM values by dimension values\n" +
    "- Unit economics calculated as: pool_cost / sum(nsm_values)\n\n" +
    "By default, only includes completed runs from database. Use include_incomplete=true to compute missing periods on-the-fly.",
  annotations: {
    title: "Get Cost Allocation Summary",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};

// Tool implementation
export default async function get_cost_allocation_summary(
  params: InferSchema<typeof schema>
) {
  const { organization_id, ...requestBody } = params;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v3/organizations/${organization_id}/cost-allocation/summary`,
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
      throw new Error(
        `Failed to fetch cost allocation summary: ${error.message}`
      );
    }
    throw new Error("Failed to fetch cost allocation summary: Unknown error");
  }
}
