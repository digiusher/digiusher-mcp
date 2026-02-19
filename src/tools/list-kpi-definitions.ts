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
    .describe("The organization ID to list KPI definitions for"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "list_kpi_definitions",
  description:
    "List all available KPI definitions for an organization.\n\n" +
    "Returns metadata about each KPI including:\n" +
    "- kpi_id: Unique identifier (e.g., 'effective_savings_rate', 'compute_commitment_coverage', 'allocation_accuracy_index')\n" +
    "- name: Human-readable name\n" +
    "- description: What the KPI measures\n" +
    "- unit: Unit of measurement ('percent' or 'currency')\n" +
    "- category: KPI category ('commitment', 'efficiency', 'allocation')\n" +
    "- favorable_direction: Whether 'up' or 'down' is better\n\n" +
    "- formula: The formula used to calculate the KPI\n\n" +
    "Use this tool first to discover available KPIs before querying their values with list_kpis or get_kpis_time_series.",
  annotations: {
    title: "List KPI Definitions",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function list_kpi_definitions(
  params: InferSchema<typeof schema>
) {
  const { organization_id } = params;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v3/organizations/${organization_id}/kpis/definitions`,
      {
        method: "GET",
        headers: getAuthHeaders(),
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
      throw new Error(`Failed to fetch KPI definitions: ${error.message}`);
    }
    throw new Error("Failed to fetch KPI definitions: Unknown error");
  }
}
