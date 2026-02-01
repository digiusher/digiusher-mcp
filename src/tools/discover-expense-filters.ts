import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";
import { addBranding } from "../utils/branding";
import get_dimension_values from "./get-dimension-values";

export const metadata: ToolMetadata = {
  name: "discover_expense_filters",
  description:
    "Interactive tool to discover and build valid expense filters.\n\n" +
    "Helps you explore available dimension values and construct filter objects " +
    "that are guaranteed to work with get_expenses.\n\n" +
    "Returns:\n" +
    "- Available values for each requested dimension\n" +
    "- A ready-to-use filter object for get_expenses\n" +
    "- Suggestions for related dimensions to explore\n\n" +
    "Example workflow:\n" +
    "1. Call this tool to discover values for dimensions like service_name, region_id\n" +
    "2. Review the discovered values and suggested filter\n" +
    "3. Use the suggested_filter directly in get_expenses",
  annotations: {
    title: "Discover & Build Expense Filters",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Discovering dimension values...",
        invoked: "Filter values discovered. Use suggested_filter in get_expenses."
      }
    }
  }
};

export const schema = {
  organization_id: z.string().uuid().describe("The organization ID"),
  dimensions: z
    .array(
      z.object({
        dimension_type: z.enum(["standard", "tag"]).describe("Type of dimension"),
        name: z.string().describe("Dimension name (e.g., 'service_name', 'region_id') or tag key"),
        search: z.string().optional().describe("Optional search term to filter values"),
        limit: z.number().default(100).describe("Max values to return per dimension")
      })
    )
    .describe("List of dimensions to discover values for"),

  auto_select: z.boolean().default(true).describe("Whether to auto-select discovered values in suggested_filter")
};

export default async function discover_expense_filters(params: InferSchema<typeof schema>) {
  const { organization_id, dimensions, auto_select = true } = params;

  const discovered: any = {};
  const suggested_filter: any = {};

  try {
    for (const dim of dimensions) {
      const dimensionParam =
        dim.dimension_type === "standard"
          ? { dimension_type: "standard" as const, name: dim.name as any }
          : { dimension_type: "tag" as const, tag_type: "values" as const, key: dim.name };

      const result = await get_dimension_values({
        organization_id,
        dimension: dimensionParam,
        search: dim.search,
        limit: dim.limit
      });

      const data = JSON.parse(result.content[0].text);
      discovered[dim.name] = {
        values: data.values || [],
        count: data.count || 0,
        has_more: data.has_more || false
      };

      // Auto-select values if requested
      if (auto_select && data.values && data.values.length > 0) {
        suggested_filter[dim.name] = data.values;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            addBranding({
              discovered_values: discovered,
              suggested_filter,
              usage_example: {
                tool: "get_expenses",
                parameters: {
                  organization_id,
                  start_date: "2024-01-01",
                  end_date: "2024-01-31",
                  filters: suggested_filter
                }
              },
              next_steps: auto_select
                ? "Use suggested_filter in get_expenses, or refine by calling discover_expense_filters again with different search terms"
                : "Review discovered_values and manually construct your filter object for get_expenses"
            }),
            null,
            2
          )
        }
      ]
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to discover filters: ${error.message}`);
    }
    throw new Error("Failed to discover filters: Unknown error");
  }
}
