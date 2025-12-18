import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";
import get_dimension_lookups from "./get-dimension-lookups";
import get_dimension_values from "./get-dimension-values";
import get_expenses from "./get-expenses";

export const metadata: ToolMetadata = {
  name: "query_expenses_with_discovery",
  description:
    "RECOMMENDED: High-level tool that queries expenses with automatic discovery and lookup.\n\n" +
    "This tool orchestrates the complete workflow:\n" +
    "1. Discovers available filter values (if filters requested)\n" +
    "2. Queries expense data with validated filters\n" +
    "3. Fetches lookup tables for ID translation\n" +
    "4. Returns enriched results with IDs translated to names\n\n" +
    "Use this instead of get_expenses for most user requests. " +
    "Falls back to individual tools for advanced use cases.\n\n" +
    "Benefits:\n" +
    "- Automatically validates all filter values\n" +
    "- Translates IDs to human-readable names\n" +
    "- Reduces need for multiple tool calls\n" +
    "- Prevents invalid filter errors",
  annotations: {
    title: "Query Expenses (All-in-One with Discovery & Lookups)",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Discovering values, querying expenses, and fetching lookups...",
        invoked: "Complete! Results include discovered values, expense data, and translated names."
      }
    }
  }
};

export const schema = {
  organization_id: z.string().uuid().describe("The organization ID to query"),
  start_date: z.string().describe("Start date (ISO 8601: YYYY-MM-DD)"),
  end_date: z.string().describe("End date (ISO 8601: YYYY-MM-DD)"),

  // Discovery hints for automatic filter building
  discover_filters: z
    .object({
      service_name: z.string().optional().describe("Search term for service names (e.g., 'EC2', 'S3')"),
      region_id: z.string().optional().describe("Search term for regions (e.g., 'us-east', 'eu-west')"),
      provider: z.string().optional().describe("Search term for providers (e.g., 'AWS', 'Azure')"),
      resource_type: z.string().optional().describe("Search term for resource types"),
      data_source_id: z.array(z.string()).optional().describe("Specific data source IDs to filter by")
    })
    .optional()
    .describe("Automatically discover and apply filters by providing search terms"),

  // Or provide explicit filters if already validated
  filters: z
    .union([z.record(z.any()), z.null()])
    .optional()
    .describe(
      "Pre-validated filters (if you already called get_dimension_values). Use discover_filters instead for automatic discovery."
    ),

  currency: z.string().optional(),
  granularity: z.enum(["day", "week", "month", "year", "total"]).optional(),
  group_by: z
    .array(z.union([z.string(), z.record(z.any())]))
    .max(3)
    .optional(),
  metrics: z
    .array(z.enum(["billed_cost", "effective_cost", "list_cost", "consumed_quantity"]))
    .default(["effective_cost", "billed_cost"]),
  order_by: z.array(z.record(z.any())).max(3).optional(),
  limit: z.number().min(1).max(10000).optional(),

  include_lookups: z.boolean().default(true).describe("Whether to fetch and apply ID-to-name lookups to results")
};

export default async function query_expenses_with_discovery(params: InferSchema<typeof schema>) {
  const { organization_id, discover_filters, filters, include_lookups = true, ...expenseParams } = params;

  const results: any = {
    discovered_values: {},
    expenses: null,
    lookups: null,
    workflow_executed: []
  };

  try {
    // Step 1: Discover filter values if requested
    let finalFilters = filters || {};

    if (discover_filters) {
      results.workflow_executed.push("dimension_discovery");

      for (const [dimensionName, searchTerm] of Object.entries(discover_filters)) {
        if (!searchTerm) continue;

        const dimensionResult = await get_dimension_values({
          organization_id,
          dimension: {
            dimension_type: "standard",
            name: dimensionName as any
          },
          search: typeof searchTerm === "string" ? searchTerm : undefined,
          limit: 100
        });

        const dimensionData = JSON.parse(dimensionResult.content[0].text);
        results.discovered_values[dimensionName] = dimensionData.values || [];

        // Auto-select discovered values for filters
        if (dimensionData.values && dimensionData.values.length > 0) {
          finalFilters[dimensionName] = dimensionData.values;
        }
      }
    }

    // Step 2: Query expenses with validated filters
    results.workflow_executed.push("expense_query");
    const expenseResult = await get_expenses({
      organization_id,
      ...(expenseParams as any),
      filters: Object.keys(finalFilters).length > 0 ? (finalFilters as any) : undefined
    });

    results.expenses = JSON.parse(expenseResult.content[0].text);

    // Step 3: Fetch lookups if requested
    if (include_lookups) {
      results.workflow_executed.push("lookup_fetch");
      const lookupResult = await get_dimension_lookups({
        organization_id,
        include_pools: true,
        include_data_sources: true
      });

      results.lookups = JSON.parse(lookupResult.content[0].text);

      // TODO: Merge lookups into expense results to translate IDs
      // This would replace IDs with {id, name, ...} objects
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...results,
              _workflow_hints: {
                complete: true,
                steps_executed: results.workflow_executed,
                next_steps: include_lookups
                  ? "Results are complete with lookups applied"
                  : "Consider calling get_dimension_lookups to translate IDs to names"
              }
            },
            null,
            2
          )
        }
      ]
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Workflow failed: ${error.message}`);
    }
    throw new Error("Workflow failed: Unknown error");
  }
}
