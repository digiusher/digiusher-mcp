import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { API_BASE_URL } from "../utils/config";

// Cloud provider enum
const cloudProviderEnum = z.enum([
  "aws_cnr",
  "alibaba_cnr",
  "azure_cnr",
  "azure_tenant",
  "kubernetes_cnr",
  "environment",
  "gcp_cnr",
  "nebius",
  "databricks",
  "oci_cnr",
  "gcp_tenant"
]);

// Define tool schema
export const schema = {
  organization_id: z.string().uuid().describe("The organization ID to query scenarios for"),
  cloud_provider: z
    .union([cloudProviderEnum, z.null()])
    .optional()
    .describe(
      "Filter scenarios by cloud provider (e.g., 'aws_cnr', 'azure_cnr', 'gcp_cnr'). " +
        "If not specified, returns scenarios for all cloud providers."
    )
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "list_scenarios",
  description:
    "List all available cost optimization scenarios with their configurable thresholds.\n\n" +
    "Scenarios are global definitions that determine what optimization opportunities are detected. " +
    "Each scenario includes:\n" +
    "- Scenario ID and description\n" +
    "- Severity level (low, medium, high, critical)\n" +
    "- Resource type it applies to\n" +
    "- Tags for categorization (quick_win, idle, orphaned, etc.)\n" +
    "- Configurable thresholds with default values\n" +
    "- Documentation URL for more details\n\n" +
    "Use the threshold_id values from scenarios when creating threshold overrides to customize " +
    "detection sensitivity for your organization.\n\n" +
    "Common use cases:\n" +
    "- Discover all available optimization scenarios\n" +
    "- Filter scenarios by cloud provider (AWS, Azure, GCP)\n" +
    "- Understand default thresholds before creating overrides\n" +
    "- Find scenarios by tags (quick_win, requires_planning, etc.)",
  annotations: {
    title: "List Cost Optimization Scenarios",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  }
};

// Tool implementation
export default async function list_scenarios(params: InferSchema<typeof schema>) {
  const { organization_id, cloud_provider } = params;

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (cloud_provider) {
      queryParams.append("cloud_provider", cloud_provider);
    }

    const url = `${API_BASE_URL}/api/v3/organizations/${organization_id}/recommendations/scenarios${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(true)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch scenarios: ${error.message}`);
    }
    throw new Error("Failed to fetch scenarios: Unknown error");
  }
}
