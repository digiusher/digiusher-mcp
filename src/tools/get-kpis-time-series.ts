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
    .describe("The organization ID to query KPI time series for"),
  start_date: z
    .string()
    .describe("Start date for the time series (ISO 8601 format: YYYY-MM-DD)"),
  end_date: z
    .string()
    .describe("End date for the time series (ISO 8601 format: YYYY-MM-DD)"),
  kpi_ids: z
    .union([z.array(kpiIdEnum), z.null()])
    .optional()
    .describe(
      "Filter by specific KPI IDs. Available values: 'effective_savings_rate', 'compute_commitment_coverage', 'allocation_accuracy_index'. Returns all KPIs if not specified."
    ),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get_kpis_time_series",
  description:
    "Get KPI values over a date range for trend analysis.\n\n" +
    "Returns time series data for KPIs between start_date and end_date.\n\n" +
    "Response structure:\n" +
    "- start_date / end_date: The queried date range\n" +
    "- series: Array of KPI time series, each containing:\n" +
    "  - kpi_id: Which KPI this series is for\n" +
    "  - values: Array of data points with period_date, value, and calculated_at\n\n" +
    "Use list_kpi_definitions first to understand what each KPI measures.\n" +
    "For a single date snapshot, use list_kpis instead.",
  annotations: {
    title: "Get KPI Time Series",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function get_kpis_time_series(
  params: InferSchema<typeof schema>
) {
  const { organization_id, start_date, end_date, kpi_ids } = params;

  try {
    const url = new URL(
      `${API_BASE_URL}/api/v3/organizations/${organization_id}/kpis/time-series`
    );

    // Add required query parameters
    url.searchParams.set("start_date", start_date);
    url.searchParams.set("end_date", end_date);

    // Add optional kpi_ids
    if (kpi_ids && kpi_ids.length > 0) {
      for (const kpiId of kpi_ids) {
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
      throw new Error(`Failed to fetch KPI time series: ${error.message}`);
    }
    throw new Error("Failed to fetch KPI time series: Unknown error");
  }
}
