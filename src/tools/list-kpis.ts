import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { addBranding } from "../utils/branding";
import { API_BASE_URL } from "../utils/config";

// KPI ID enum
const kpiIdEnum = z.enum([
  "effective_savings_rate",
  "compute_commitment_coverage",
  "allocation_accuracy_index",
]);

// Define tool schema
export const schema = {
  organization_id: z
    .string()
    .uuid()
    .describe("The organization ID to query KPIs for"),
  date: z
    .union([z.string(), z.null()])
    .optional()
    .describe(
      "Date to get KPI values for (ISO 8601 format: YYYY-MM-DD). Defaults to the latest available date if not specified."
    ),
  kpi_ids: z
    .union([z.array(kpiIdEnum), z.null()])
    .optional()
    .describe(
      "Filter by specific KPI IDs. Available values: 'effective_savings_rate', 'compute_commitment_coverage', 'allocation_accuracy_index'. Returns all KPIs if not specified."
    ),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "list_kpis",
  description:
    "Get KPI values for a single date.\n\n" +
    "Returns the current values of KPIs for the specified date (or the latest available date).\n\n" +
    "Each KPI value includes:\n" +
    "- kpi_id: Which KPI this value is for\n" +
    "- value: The numeric value (null if not available)\n" +
    "- calculated_at: When this value was computed\n\n" +
    "Use list_kpi_definitions first to understand what each KPI measures.\n" +
    "For historical trends, use get_kpis_time_series instead.",
  annotations: {
    title: "List KPI Values (Snapshot)",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function list_kpis(params: InferSchema<typeof schema>) {
  const { organization_id, ...queryParams } = params;

  try {
    const url = new URL(
      `${API_BASE_URL}/api/v3/organizations/${organization_id}/kpis/snapshots`
    );

    // Add query parameters
    if (queryParams.date) {
      url.searchParams.set("date", queryParams.date);
    }
    if (queryParams.kpi_ids && queryParams.kpi_ids.length > 0) {
      for (const kpiId of queryParams.kpi_ids) {
        url.searchParams.append("kpi_ids", kpiId);
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(),
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
      throw new Error(`Failed to fetch KPIs: ${error.message}`);
    }
    throw new Error("Failed to fetch KPIs: Unknown error");
  }
}
