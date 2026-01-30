import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { addBranding } from "../utils/branding";
import { API_BASE_URL } from "../utils/config";

// Scenario tags enum
const scenarioTagsEnum = z.enum([
  "delete",
  "resize",
  "migrate",
  "upgrade",
  "quick_win",
  "requires_planning",
  "orphaned",
  "idle",
  "oversized",
  "outdated"
]);

// Recommendation status enum
const recommendationStatusEnum = z.enum(["open", "applied", "dismissed", "snoozed", "auto_resolved", "stale"]);

// Severity enum
const severityEnum = z.enum(["low", "medium", "high", "critical"]);

// Sort by enum
const sortByEnum = z.enum(["annual_savings", "monthly_savings", "severity", "created_at", "last_seen_at", "status"]);

// Sort direction enum
const sortDirectionEnum = z.enum(["asc", "desc"]);

// Resource tag filter schema
const resourceTagFilterSchema = z
  .object({
    key: z.string().describe("Tag key to filter by"),
    include: z
      .union([z.array(z.string()), z.null()])
      .optional()
      .describe("Values to include for this tag key"),
    exclude: z
      .union([z.array(z.string()), z.null()])
      .optional()
      .describe("Values to exclude for this tag key"),
    exists: z.union([z.boolean(), z.null()]).optional().describe("Filter by tag key existence")
  })
  .describe("Filter by resource tags - follows billing TagFilter pattern.");

// Define tool schema
export const schema = {
  organization_id: z.string().uuid().describe("The organization ID to query recommendations for"),
  scenario_id: z
    .union([z.array(z.string()), z.null()])
    .optional()
    .describe("Filter by specific scenario IDs"),
  scenario_tags: z
    .union([z.array(scenarioTagsEnum), z.null()])
    .optional()
    .describe("Filter by scenario tags (e.g., 'quick_win', 'idle', 'orphaned')"),
  status: z
    .union([z.array(recommendationStatusEnum), z.null()])
    .optional()
    .describe("Filter by recommendation status (e.g., 'open', 'applied', 'dismissed')"),
  severity: z
    .union([z.array(severityEnum), z.null()])
    .optional()
    .describe("Filter by severity level (e.g., 'low', 'medium', 'high', 'critical')"),
  data_source_id: z
    .union([z.array(z.string().uuid()), z.null()])
    .optional()
    .describe("Filter by cloud account data source IDs"),
  assignee_id: z
    .union([z.array(z.string().uuid()), z.null()])
    .optional()
    .describe("Filter by assignee user IDs"),
  resource_type: z
    .union([z.array(z.string()), z.null()])
    .optional()
    .describe("Filter by resource types (e.g., 'EC2', 'RDS')"),
  region: z
    .union([z.array(z.string()), z.null()])
    .optional()
    .describe("Filter by cloud regions"),
  service: z
    .union([z.array(z.string()), z.null()])
    .optional()
    .describe("Filter by cloud services"),
  resource_tags: z
    .union([z.array(resourceTagFilterSchema), z.null()])
    .optional()
    .describe("Filter by resource tags with include/exclude/exists logic"),
  offset: z.number().min(0).optional().default(0).describe("Offset for pagination (default: 0)"),
  limit: z.number().min(1).max(500).optional().default(50).describe("Number of results to return (1-500, default: 50)"),
  sort_by: z.union([sortByEnum, z.null()]).optional().describe("Field to sort results by (default: annual_savings)"),
  sort_direction: z.union([sortDirectionEnum, z.null()]).optional().describe("Sort direction: 'asc' or 'desc' (default: desc)")
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "list_recommendations",
  description:
    "List cost optimization recommendations with filtering, pagination, and sorting.\n\n" +
    "This endpoint retrieves recommendations for cost savings opportunities identified by DigiUsher, " +
    "such as idle resources, oversized instances, or orphaned volumes.\n\n" +
    "Key features:\n" +
    "- Filter by scenario type, status, severity, and resource attributes\n" +
    "- Sort by potential savings, severity, or other fields\n" +
    "- Paginate through large result sets\n" +
    "- Get detailed information including current/target costs and evidence\n\n" +
    "Common workflows:\n" +
    "1. List all open recommendations: status=['open']\n" +
    "2. Find quick wins: scenario_tags=['quick_win'], status=['open']\n" +
    "3. High-value opportunities: sort_by='annual_savings', sort_direction='desc'\n" +
    "4. Critical issues: severity=['critical'], status=['open']",
  annotations: {
    title: "List Cost Optimization Recommendations",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  }
};

// Tool implementation
export default async function list_recommendations(params: InferSchema<typeof schema>) {
  const { organization_id, ...requestBody } = params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v3/organizations/${organization_id}/recommendations`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return { content: [{ type: "text", text: JSON.stringify(addBranding(data)) }] };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch recommendations: ${error.message}`);
    }
    throw new Error("Failed to fetch recommendations: Unknown error");
  }
}
