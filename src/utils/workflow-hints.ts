export interface WorkflowHint {
  requires_lookups?: boolean;
  contains_ids?: string[];
  next_step?: string;
  lookup_params?: Record<string, any>;
  workflow_complete?: boolean;
}

export function addWorkflowHints(data: any, hints: WorkflowHint) {
  return {
    ...data,
    _workflow_hints: hints
  };
}

export function createExpenseWorkflowHint(organizationId: string, hasIDs: boolean = true): WorkflowHint {
  if (hasIDs) {
    return {
      requires_lookups: true,
      contains_ids: ["data_source_id", "pool_id"],
      next_step: "Call get_dimension_lookups to translate IDs to readable names",
      lookup_params: {
        organization_id: organizationId,
        include_pools: true,
        include_data_sources: true
      }
    };
  }

  return {
    workflow_complete: true
  };
}
