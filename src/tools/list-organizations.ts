import { type InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";
import { getAuthHeaders } from "../utils/auth";
import { API_BASE_URL } from "../utils/config";

// Define organization schema based on API response structure
const organizationSchema = z.object({
  deleted_at: z.number().describe("Timestamp when organization was deleted (0 if not deleted)"),
  created_at: z.number().describe("Timestamp when organization was created"),
  id: z.string().uuid().describe("Unique identifier for the organization"),
  name: z.string().describe("Display name of the organization"),
  pool_id: z.string().uuid().describe("Associated pool identifier"),
  is_demo: z.boolean().describe("Whether this is a demo organization"),
  currency: z.string().describe("Currency code for the organization (e.g., USD)"),
  cleaned_at: z.number().describe("Timestamp when organization was cleaned (0 if not cleaned)")
});

// Define tool parameters schema
export const schema = {};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "list_organizations",
  description:
    "Retrieve a list of all organizations accessible by the authenticated user. Use this tool first to get the required organization IDs for other operations.",
  annotations: {
    title: "List Organizations",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true
  }
};

// Tool implementation
export default async function list_organizations(params: InferSchema<typeof schema>) {
  try {
    const response = await fetch(`${API_BASE_URL}/restapi/v2/organizations`, {
      method: "GET",
      headers: getAuthHeaders(true)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Validate response structure
    const organizationsArraySchema = z.array(organizationSchema);
    const validatedData = organizationsArraySchema.parse(data);

    return validatedData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }
    throw new Error("Failed to fetch organizations: Unknown error");
  }
}
