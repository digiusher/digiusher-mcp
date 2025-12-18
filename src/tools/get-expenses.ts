import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { API_BASE_URL } from "../utils/config";

const currencyEnum = z.enum([
  "AED",
  "AFN",
  "ALL",
  "AMD",
  "ANG",
  "AOA",
  "ARS",
  "AUD",
  "AWG",
  "AZN",
  "BAM",
  "BBD",
  "BDT",
  "BGN",
  "BHD",
  "BIF",
  "BMD",
  "BND",
  "BOB",
  "BOV",
  "BRL",
  "BSD",
  "BTN",
  "BWP",
  "BYN",
  "BZD",
  "CAD",
  "CDF",
  "CHE",
  "CHF",
  "CHW",
  "CLF",
  "CLP",
  "CNY",
  "COP",
  "COU",
  "CRC",
  "CUC",
  "CUP",
  "CVE",
  "CZK",
  "DJF",
  "DKK",
  "DOP",
  "DZD",
  "EGP",
  "ERN",
  "ETB",
  "EUR",
  "FJD",
  "FKP",
  "GBP",
  "GEL",
  "GHS",
  "GIP",
  "GMD",
  "GNF",
  "GTQ",
  "GYD",
  "HKD",
  "HNL",
  "HRK",
  "HTG",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "IQD",
  "IRR",
  "ISK",
  "JMD",
  "JOD",
  "JPY",
  "KES",
  "KGS",
  "KHR",
  "KMF",
  "KPW",
  "KRW",
  "KWD",
  "KYD",
  "KZT",
  "LAK",
  "LBP",
  "LKR",
  "LRD",
  "LSL",
  "LYD",
  "MAD",
  "MDL",
  "MGA",
  "MKD",
  "MMK",
  "MNT",
  "MOP",
  "MRU",
  "MUR",
  "MVR",
  "MWK",
  "MXN",
  "MXV",
  "MYR",
  "MZN",
  "NAD",
  "NGN",
  "NIO",
  "NOK",
  "NPR",
  "NZD",
  "OMR",
  "PAB",
  "PEN",
  "PGK",
  "PHP",
  "PKR",
  "PLN",
  "PYG",
  "QAR",
  "RON",
  "RSD",
  "RUB",
  "RWF",
  "SAR",
  "SBD",
  "SCR",
  "SDG",
  "SEK",
  "SGD",
  "SHP",
  "SLE",
  "SLL",
  "SOS",
  "SRD",
  "SSP",
  "STN",
  "SVC",
  "SYP",
  "SZL",
  "THB",
  "TJS",
  "TMT",
  "TND",
  "TOP",
  "TRY",
  "TTD",
  "TWD",
  "TZS",
  "UAH",
  "UGX",
  "USD",
  "USN",
  "UYI",
  "UYU",
  "UYW",
  "UZS",
  "VED",
  "VES",
  "VND",
  "VUV",
  "WST",
  "XAF",
  "XAG",
  "XAU",
  "XBA",
  "XBB",
  "XBC",
  "XBD",
  "XCD",
  "XDR",
  "XOF",
  "XPD",
  "XPF",
  "XPT",
  "XSU",
  "XTS",
  "XUA",
  "XXX",
  "YER",
  "ZAR",
  "ZMW",
  "ZWL"
]);

const standardDimensionEnum = z.enum([
  "service_name",
  "service_category",
  "resource_type",
  "resource_id",
  "region_id",
  "network_from",
  "network_to",
  "data_source_id",
  "provider",
  "publisher",
  "charge_category",
  "pricing_category",
  "license_model",
  "sku_name",
  "invoice_id",
  "invoice_issuer",
  "commitment_discount_type",
  "commitment_discount_category",
  "commitment_discount_id",
  "consumed_unit",
  "pool_id",
  "rule_id"
]);

const tagSpecSchema = z
  .object({
    type: z.enum(["keys", "values"]).describe("Type of tag operation for TagSpec"),
    key: z
      .union([z.string(), z.null()])
      .optional()
      .describe("Tag key name. Required when type='values', must be None when type='keys'")
  })
  .describe(
    'Specification for tag-related operations: grouping, querying values, etc.\n\nCan be used for:\n- Grouping by tag keys (type="keys") - shows which tag keys exist and their costs\n- Grouping by tag values (type="values") - shows values for a specific tag key\n- Querying available tag values'
  );

const standardFilterSchema = z
  .object({
    include: z.union([z.array(z.string()), z.null()]).optional(),
    exclude: z.union([z.array(z.string()), z.null()]).optional()
  })
  .describe("Standard filter for dimensions - consistent pattern for inclusion/exclusion");

const rangeFilterSchema = z
  .object({
    value: z.number(),
    op: z.enum(["gt", "gte", "lt", "lte"])
  })
  .describe("Range filter for numeric values with operator");

const tagFilterSchema = z
  .object({
    key: z.string(),
    include: z.union([z.array(z.string()), z.null()]).optional(),
    exclude: z.union([z.array(z.string()), z.null()]).optional(),
    exists: z.union([z.boolean(), z.null()]).optional()
  })
  .describe("Filter for tag-based dimensions - extends standard filter with existence check");

const filtersSchema = z
  .object({
    service_name: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by service names"),
    service_category: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by service categories"),
    resource_type: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by resource types"),
    resource_id: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by specific resource IDs"),
    region_id: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by cloud regions"),
    network_from: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by network traffic source location"),
    network_to: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by network traffic destination location"),
    data_source_id: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by cloud account data source IDs"),
    provider: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by cloud providers"),
    publisher: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by service publishers"),
    pool_id: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by pool IDs"),
    charge_category: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by charge categories"),
    pricing_category: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by pricing categories"),
    license_model: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by software license models"),
    sku_name: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by SKU names"),
    sku_id: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by SKU identifiers"),
    invoice_id: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by invoice identifiers"),
    invoice_issuer: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by invoice issuers"),
    commitment_discount_type: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by commitment discount types"),
    commitment_discount_category: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by commitment discount categories"),
    commitment_discount_id: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by specific commitment discount IDs"),
    consumed_unit: z
      .union([z.array(z.string()), standardFilterSchema, z.null()])
      .optional()
      .describe("Filter by consumption units"),
    billed_cost: z.union([z.array(rangeFilterSchema), z.null()]).optional(),
    effective_cost: z.union([z.array(rangeFilterSchema), z.null()]).optional(),
    list_cost: z.union([z.array(rangeFilterSchema), z.null()]).optional(),
    consumed_quantity: z.union([z.array(rangeFilterSchema), z.null()]).optional(),
    tags: z.union([z.array(tagFilterSchema), z.null()]).optional()
  })
  .describe(
    "Filter expenses by various dimensions.\n\nEach filter accepts either a simple list of values to include,\nor a StandardFilter object for advanced include/exclude logic."
  );

const orderBySchema = z
  .object({
    field: z
      .enum(["date", "billed_cost", "effective_cost", "list_cost", "consumed_quantity", "resource_count"])
      .describe("Fields that can be used for ordering expense results"),
    direction: z.enum(["asc", "desc"]).optional().describe("Sort direction for ordering results")
  })
  .describe("Specification for ordering expense results");

export const schema = {
  organization_id: z.string().uuid().describe("The organization ID to query expenses for"),
  start_date: z.string().describe("Start date for expense query (ISO 8601 format: YYYY-MM-DD)"),
  end_date: z.string().describe("End date for expense query (ISO 8601 format: YYYY-MM-DD)"),
  currency: currencyEnum.optional().describe("Currency code for expense amounts"),
  granularity: z.enum(["day", "week", "month", "year", "total"]).optional().describe("Time granularity for grouping results"),
  group_by: z
    .array(
      z.union([
        standardDimensionEnum.describe(
          "All standard dimensions for grouping and filtering\n\nThere are other possible dimensions that we can also group by, eg: tags"
        ),
        tagSpecSchema
      ])
    )
    .max(3)
    .optional()
    .describe("Dimensions to group results by (max 3)"),
  filters: z
    .union([filtersSchema, z.null()])
    .optional()
    .describe("Get exact values to filter from the get_dimension_values tools"),
  metrics: z
    .array(z.enum(["billed_cost", "effective_cost", "list_cost", "consumed_quantity"]))
    .default(["effective_cost", "billed_cost"])
    .describe("Metrics to include in results"),
  order_by: z
    .array(orderBySchema)
    .max(3)
    .default([{ field: "billed_cost", direction: "desc" }])
    .describe("Order results by specified fields (max 3). Defaults to billed_cost DESC."),
  limit: z
    .union([z.number().min(1).max(10000), z.null()])
    .optional()
    .describe("Limit number of results returned (1-10000)")
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get_expenses",
  description:
    "Query aggregated expense data from DigiUsher with flexible filtering, grouping, and metrics. Before running this tool ideally run the get_dimension_values tool to discover available dimension values for filtering.",
  annotations: {
    title: "Get Expenses",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true
  }
};

// Tool implementation
export default async function get_expenses(params: InferSchema<typeof schema>) {
  const { organization_id, ...requestBody } = params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v3/organizations/${organization_id}/expenses`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }
    throw new Error("Failed to fetch expenses: Unknown error");
  }
}
